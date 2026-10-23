'use client';

// Drag-and-drop uploader for source material (syllabus, notes, PPT, textbook
// chapter). Files are converted to plain text IN THE BROWSER — PDF with pdf.js
// (loaded only when a PDF is chosen), PPTX/DOCX by reading their XML with JSZip,
// TXT/MD as is — so nothing but text is ever sent to the server.
import { useEffect, useRef, useState } from 'react';
import { ClipboardPaste, FileText, Loader2, Presentation, TriangleAlert, Type, Upload, X } from 'lucide-react';
import {
  cleanText, fitSources, MAX_SOURCE_BYTES, MAX_SOURCE_CHARS, MAX_SOURCE_FILES,
  type SourceFile, type SourceKind,
} from '@/lib/source';
import { labelCls, textareaCls } from './ui';

export interface SourceUploadProps {
  files: SourceFile[];
  onChange: (files: SourceFile[]) => void;
  /** Short helper line under the title, e.g. "Upload your syllabus or notes". */
  hint?: string;
  disabled?: boolean;
  /** When the upload is longer than MAX_SOURCE_CHARS, keep the parts most relevant to this. */
  topic?: string;
  /** Title above the drop zone. */
  label?: string;
}

/** Text kept per file before trimming to MAX_SOURCE_CHARS (re-trimmed when the topic changes). */
const MAX_FULL_CHARS = 400_000;
const MAX_PDF_PAGES = 500;
const ACCEPT = '.pdf,.pptx,.docx,.txt,.md,.markdown,.ppt,.doc,application/pdf,text/plain,text/markdown';

interface Meta {
  /** The untrimmed file. */
  source: SourceFile;
  units?: { count: number; label: 'page' | 'slide' };
  warning?: string;
}

// Keyed by the SourceFile objects handed to onChange (full or trimmed), so a
// parent that stores them as-is gets page counts, warnings and re-trimming.
const META = new WeakMap<SourceFile, Meta>();

class UploadError extends Error {}

type Progress = (status: string) => void;
interface Extracted { kind: SourceKind; text: string; units?: Meta['units']; warning?: string }

const fmt = (n: number) => n.toLocaleString('en-IN');
const plural = (n: number, word: string) => `${fmt(n)} ${word}${n === 1 ? '' : 's'}`;

// ── Extraction ───────────────────────────────────────────────────────

function kindOf(file: File): SourceKind | { error: string } {
  const ext = /\.([a-z0-9]+)$/i.exec(file.name)?.[1]?.toLowerCase() ?? '';
  if (ext === 'pdf' || (!ext && file.type === 'application/pdf')) return 'pdf';
  if (ext === 'pptx') return 'pptx';
  if (ext === 'docx') return 'docx';
  if (['txt', 'md', 'markdown', 'text'].includes(ext) || (!ext && file.type.startsWith('text/'))) return 'text';
  if (ext === 'ppt' || ext === 'pps') return { error: `“${file.name}” is an old PowerPoint file. Please save as PPTX or PDF and upload that.` };
  if (ext === 'doc') return { error: `“${file.name}” is an old Word file. Please save as DOCX or PDF and upload that.` };
  if (file.type.startsWith('image/')) return { error: `“${file.name}” is a picture — upload a text PDF, or paste the text instead.` };
  return { error: `“${file.name}” can’t be read. Upload a PDF, PPTX, DOCX, TXT or MD file.` };
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const decodeXml = (s: string) =>
  s.replace(/&(?:#(\d+)|#x([0-9a-f]+)|(amp|lt|gt|quot|apos));/gi, (m, dec, hex, name) => {
    if (name) return ENTITIES[name.toLowerCase()];
    const code = dec ? Number(dec) : parseInt(hex, 16);
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : m;
  });

/** Lines of a PDF page from pdf.js text items: new line when the baseline moves, blank line on a big gap. */
function pageText(items: unknown[]): string {
  let out = '';
  let lastY: number | null = null;
  let lastEnd = 0;
  let lastH = 0;
  for (const raw of items) {
    const it = raw as { str?: string; transform?: number[]; width?: number; height?: number; hasEOL?: boolean };
    if (typeof it.str !== 'string') continue; // marked-content markers
    const x = it.transform?.[4] ?? 0;
    const y = it.transform?.[5] ?? 0;
    const h = Math.abs(it.height || it.transform?.[3] || 10);
    if (it.str && lastY !== null) {
      const dy = Math.abs(y - lastY);
      const lineH = Math.max(lastH, h);
      if (dy > lineH * 0.6) {
        if (!out.endsWith('\n')) out += '\n';
        if (dy > lineH * 1.9 && !out.endsWith('\n\n')) out += '\n';
      } else if (x - lastEnd > h * 0.15 && !/\s$/.test(out) && !/^\s/.test(it.str)) {
        out += ' ';
      }
    }
    out += it.str;
    if (it.hasEOL && !out.endsWith('\n')) out += '\n';
    if (it.str) { lastY = y; lastEnd = x + (it.width ?? 0); lastH = h; }
  }
  return out;
}

/**
 * Many Hindi/Marathi PDFs map their shaped glyphs badly, so extracted text loses
 * matras ("गति" → "गत", "अध्याय" → "अाय"). Normal Devanagari has plenty of "ि" and
 * never puts a vowel sign right after an independent vowel.
 */
function brokenDevanagari(text: string) {
  const letters = (text.match(/[\u0900-\u097F]/g) ?? []).length;
  if (letters < 60) return false;
  const iSign = (text.match(/\u093F/g) ?? []).length;
  const vowelThenSign = (text.match(/[\u0904-\u0914][\u093E-\u094C]/g) ?? []).length;
  return iSign < letters * 0.004 || vowelThenSign >= 2;
}

async function extractPdf(data: ArrayBuffer, progress: Progress): Promise<Extracted> {
  progress('Loading PDF reader…');
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  if (!pdfjs.GlobalWorkerOptions.workerPort) {
    // A real worker entry, so webpack bundles pdf.js's ESM worker into a normal script
    // chunk (a raw .mjs asset would break the production minifier). Shared by all PDFs.
    pdfjs.GlobalWorkerOptions.workerPort = new Worker(
      new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url), { type: 'module' });
  }
  const task = pdfjs.getDocument({ data: new Uint8Array(data), isEvalSupported: false, disableFontFace: true, stopAtErrors: false });
  const doc = await task.promise.catch(async (err: unknown) => {
    await task.destroy().catch(() => {});
    throw new UploadError((err as { name?: string }).name === 'PasswordException'
      ? 'is password-protected. Remove the password (or print it to a new PDF) and upload again.'
      : 'could not be opened — is it a valid PDF?');
  });
  try {
    const total = doc.numPages;
    const pages = Math.min(total, MAX_PDF_PAGES);
    const out: string[] = [];
    let length = 0;
    let textPages = 0;
    let read = 0;
    for (let p = 1; p <= pages && length < MAX_FULL_CHARS; p++) {
      progress(`Reading page ${p} of ${total}…`);
      const page = await doc.getPage(p);
      const text = cleanText(pageText((await page.getTextContent()).items));
      page.cleanup();
      read = p;
      if (text.replace(/\s/g, '').length >= 20) textPages++;
      if (text) { out.push(`[Page ${p}]\n${text}`); length += text.length; }
    }
    const text = out.join('\n\n');
    const letters = text.replace(/\s|\[Page \d+\]/g, '');
    if (!textPages || letters.length < 40) {
      throw new UploadError('has no selectable text — it looks like a scan or photos. Try a text PDF or paste the syllabus.');
    }
    const odd = (letters.match(/[\uE000-\uF8FF]/g) ?? []).length;
    const warning = odd > letters.length * 0.1
      ? 'Uses a special font — some letters may not have been read correctly.'
      : brokenDevanagari(text)
        ? 'Some Hindi letters (matras) look missing — this PDF’s font hides them. Check the preview; if it looks wrong, paste the text instead.'
      : textPages < read * 0.5
        ? `Only ${textPages} of ${read} pages have selectable text (the rest look scanned).`
        : read < total
          ? `Long PDF — read the first ${fmt(read)} of ${fmt(total)} pages.`
          : undefined;
    return { kind: 'pdf', text, units: { count: total, label: 'page' }, warning };
  } finally {
    await task.destroy().catch(() => {});
  }
}

async function openZip(data: ArrayBuffer, what: string) {
  const JSZip = (await import('jszip')).default;
  try {
    return await JSZip.loadAsync(data);
  } catch {
    throw new UploadError(`could not be opened — is it a valid ${what} file?`);
  }
}

/** Resolves a relationship target ("slides/slide1.xml", "../notesSlides/x.xml", "/ppt/x.xml") against a folder. */
function resolvePath(base: string, target: string) {
  if (target.startsWith('/')) return target.slice(1);
  const parts = base.split('/').filter(Boolean);
  for (const seg of target.split('/')) {
    if (seg === '..') parts.pop();
    else if (seg && seg !== '.') parts.push(seg);
  }
  return parts.join('/');
}

/** Relationship id → target, from a .rels file. */
function relationships(xml: string): { id: string; type: string; target: string }[] {
  return Array.from(xml.matchAll(/<Relationship\b[^>]*>/g), ([tag]) => ({
    id: /\bId="([^"]+)"/.exec(tag)?.[1] ?? '',
    type: /\bType="([^"]+)"/.exec(tag)?.[1] ?? '',
    target: decodeXml(/\bTarget="([^"]+)"/.exec(tag)?.[1] ?? ''),
  }));
}

/** Text of DrawingML paragraphs (<a:p>/<a:t>), one line per paragraph; slide-number and date fields skipped. */
function drawingText(xml: string): string {
  const lines: string[] = [];
  const body = xml.replace(/<a:fld\b[\s\S]*?<\/a:fld>/g, '');
  for (const [, para] of Array.from(body.matchAll(/<a:p(?:\s[^>]*[^/>])?>([\s\S]*?)<\/a:p>/g))) {
    let line = '';
    for (const m of Array.from(para.matchAll(/<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>|<a:br\b[^>]*\/>/g))) line += m[1] !== undefined ? decodeXml(m[1]) : '\n';
    if (line.trim()) lines.push(line.trim());
  }
  return lines.join('\n');
}

async function extractPptx(data: ArrayBuffer, progress: Progress): Promise<Extracted> {
  const zip = await openZip(data, 'PowerPoint (PPTX)');
  const read = (path: string) => zip.file(path)?.async('string') ?? Promise.resolve('');

  // Slide order comes from presentation.xml (file numbers change when slides are moved).
  const [presentation, presRels] = await Promise.all([read('ppt/presentation.xml'), read('ppt/_rels/presentation.xml.rels')]);
  const targets = new Map(relationships(presRels).map(r => [r.id, resolvePath('ppt', r.target)]));
  let slides = Array.from(presentation.matchAll(/<p:sldId\b[^>]*\br:id="([^"]+)"/g), m => targets.get(m[1]))
    .filter((p): p is string => !!p && !!zip.file(p));
  if (!slides.length) {
    slides = Object.keys(zip.files)
      .filter(p => /^ppt\/slides\/slide\d+\.xml$/.test(p))
      .sort((a, b) => Number(/(\d+)\.xml$/.exec(a)?.[1]) - Number(/(\d+)\.xml$/.exec(b)?.[1]));
  }
  if (!slides.length) throw new UploadError('has no slides.');

  const out: string[] = [];
  for (let i = 0; i < slides.length; i++) {
    progress(`Reading slide ${i + 1} of ${slides.length}…`);
    const path = slides[i];
    const folder = path.slice(0, path.lastIndexOf('/'));
    const rels = await read(`${folder}/_rels/${path.slice(folder.length + 1)}.rels`);
    const notesRel = relationships(rels).find(r => r.type.endsWith('/notesSlide'));
    const [slideXml, notesXml] = await Promise.all([read(path), notesRel ? read(resolvePath(folder, notesRel.target)) : '']);
    const text = drawingText(slideXml);
    const notes = notesXml ? drawingText(notesXml).replace(/\n+/g, ' ') : '';
    if (text || notes) out.push(`[Slide ${i + 1}]\n${text}${notes ? `\nNotes: ${notes}` : ''}`);
  }
  const text = cleanText(out.join('\n\n'));
  if (!text) throw new UploadError('has no text on its slides (only pictures?). Paste the text instead.');
  return { kind: 'pptx', text, units: { count: slides.length, label: 'slide' } };
}

async function extractDocx(data: ArrayBuffer, progress: Progress): Promise<Extracted> {
  const zip = await openZip(data, 'Word (DOCX)');
  progress('Reading document…');
  const xml = await zip.file('word/document.xml')?.async('string');
  if (!xml) throw new UploadError('has no document text — is it a valid DOCX file?');
  const lines: string[] = [];
  // Text boxes are stored twice (modern + VML fallback): read them once.
  const body = xml.replace(/<mc:Fallback>[\s\S]*?<\/mc:Fallback>/g, '');
  for (const [, para] of Array.from(body.matchAll(/<w:p(?:\s[^>]*[^/>])?>([\s\S]*?)<\/w:p>/g))) {
    let line = '';
    for (const m of Array.from(para.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:tab\/>|<w:br\b[^>]*\/>|<w:cr\/>/g))) {
      line += m[1] !== undefined ? decodeXml(m[1]) : m[0].startsWith('<w:tab') ? ' ' : '\n';
    }
    line = line.trim();
    if (!line) { lines.push(''); continue; }
    const style = /<w:pStyle w:val="([^"]+)"/.exec(para)?.[1] ?? '';
    if (/^title$/i.test(style)) line = `# ${line}`;
    else if (/^(heading|berschrift|titre)\s?\d/i.test(style)) line = `## ${line}`;
    else if (/<w:numPr>/.test(para)) line = `• ${line}`;
    lines.push(line);
  }
  const text = cleanText(lines.join('\n'));
  if (!text) throw new UploadError('has no text in it.');
  const app = await zip.file('docProps/app.xml')?.async('string');
  const pages = Number(/<Pages>(\d+)<\/Pages>/.exec(app ?? '')?.[1] ?? 0);
  return { kind: 'docx', text, units: pages > 0 ? { count: pages, label: 'page' } : undefined };
}

async function extractPlain(data: ArrayBuffer): Promise<Extracted> {
  const bytes = new Uint8Array(data);
  const encoding = bytes[0] === 0xff && bytes[1] === 0xfe ? 'utf-16le' : bytes[0] === 0xfe && bytes[1] === 0xff ? 'utf-16be' : 'utf-8';
  const text = cleanText(new TextDecoder(encoding).decode(bytes));
  if (!text) throw new UploadError('is empty.');
  return { kind: 'text', text };
}

async function extract(file: File, kind: SourceKind, progress: Progress): Promise<Extracted> {
  const data = await file.arrayBuffer();
  if (kind === 'pdf') return extractPdf(data, progress);
  if (kind === 'pptx') return extractPptx(data, progress);
  if (kind === 'docx') return extractDocx(data, progress);
  return extractPlain(data);
}

// ── Component ────────────────────────────────────────────────────────

const KIND_ICON = { pdf: FileText, pptx: Presentation, docx: FileText, text: Type } as const;
const KIND_TINT: Record<SourceKind, string> = {
  pdf: 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400',
  pptx: 'bg-saffron/10 text-saffron',
  docx: 'bg-indigo-brand/10 text-indigo-brand dark:text-indigo-brand-300',
  text: 'bg-teal/10 text-teal dark:text-teal-400',
};

interface Pending { id: number; name: string; status: string }
interface Notice { id: number; text: string; paste?: boolean }

export default function SourceUpload({ files, onChange, hint, disabled, topic, label = 'Your material' }: SourceUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [drag, setDrag] = useState(false);
  const [pasting, setPasting] = useState(false);
  const [pasted, setPasted] = useState('');
  /** Index of the file whose extracted text is shown. */
  const [preview, setPreview] = useState<number | null>(null);
  const seq = useRef(0);

  // Async extraction adds files one by one: always build on the latest list.
  const latest = useRef({ files, onChange, topic });
  latest.current = { files, onChange, topic };

  const full = (f: SourceFile) => META.get(f)?.source ?? f;

  /** Hands the (trimmed-to-fit) files to the parent, remembering the untrimmed text. */
  const emit = (next: SourceFile[], extraMeta?: Map<SourceFile, Omit<Meta, 'source'>>) => {
    for (const f of next) {
      if (!META.has(f)) META.set(f, { source: f, ...extraMeta?.get(f) });
    }
    const fitted = fitSources(next, MAX_SOURCE_CHARS, latest.current.topic ?? '');
    fitted.forEach((f, i) => { if (f !== next[i]) META.set(f, META.get(next[i]) as Meta); });
    latest.current.files = fitted;
    latest.current.onChange(fitted);
  };

  // A long upload is re-trimmed around the topic once the user stops typing.
  useEffect(() => {
    const originals = () => latest.current.files.map(full);
    if (originals().reduce((n, f) => n + f.text.length, 0) <= MAX_SOURCE_CHARS) return;
    const t = setTimeout(() => emit(originals()), 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic]);

  const notify = (text: string, paste = false) => setNotices(n => [...n.slice(-(MAX_SOURCE_FILES + 1)), { id: ++seq.current, text, paste }]);

  const addFiles = async (list: FileList | File[]) => {
    const chosen = Array.from(list);
    if (!chosen.length || disabled) return;
    setNotices([]);
    const queue: { id: number; file: File; kind: SourceKind }[] = [];
    let slots = MAX_SOURCE_FILES - latest.current.files.length - pending.length;
    for (const file of chosen) {
      const kind = kindOf(file);
      if (typeof kind !== 'string') { notify(kind.error); continue; }
      if (file.size > MAX_SOURCE_BYTES) { notify(`“${file.name}” is larger than 15 MB. Upload just the chapter you need, or paste the text.`); continue; }
      if (latest.current.files.some(f => f.name === file.name) || queue.some(q => q.file.name === file.name)) {
        notify(`“${file.name}” is already added.`); continue;
      }
      if (slots <= 0) { notify(`You can add up to ${MAX_SOURCE_FILES} files — “${file.name}” was skipped.`); continue; }
      slots--;
      queue.push({ id: ++seq.current, file, kind });
    }
    if (!queue.length) return;
    setPending(p => [...p, ...queue.map(q => ({ id: q.id, name: q.file.name, status: 'Waiting…' }))]);

    for (const { id, file, kind } of queue) {
      const progress = (status: string) => setPending(p => p.map(x => (x.id === id ? { ...x, status } : x)));
      progress('Reading…');
      try {
        const got = await extract(file, kind, progress);
        const source: SourceFile = { name: file.name.slice(0, 120), kind: got.kind, text: got.text.slice(0, MAX_FULL_CHARS) };
        emit([...latest.current.files.map(full), source], new Map([[source, { units: got.units, warning: got.warning }]]));
      } catch (err) {
        const scanned = err instanceof UploadError && /no selectable text/.test(err.message);
        notify(err instanceof UploadError ? `“${file.name}” ${err.message}` : `“${file.name}” could not be read. Try saving it again, or paste the text.`, scanned);
        if (!(err instanceof UploadError)) console.error('[source-upload]', err);
      } finally {
        setPending(p => p.filter(x => x.id !== id));
      }
    }
  };

  const remove = (i: number) => {
    setPreview(null);
    emit(latest.current.files.map(full).filter((_, k) => k !== i));
  };

  const addPasted = () => {
    const text = cleanText(pasted).slice(0, MAX_FULL_CHARS);
    if (!text) return;
    const taken = new Set(latest.current.files.map(f => f.name));
    let name = 'Pasted text';
    for (let n = 2; taken.has(name); n++) name = `Pasted text ${n}`;
    emit([...latest.current.files.map(full), { name, kind: 'text', text }]);
    setPasted('');
    setPasting(false);
  };

  const originals = files.map(full);
  const totalChars = originals.reduce((n, f) => n + f.text.length, 0);
  const trimmed = totalChars > MAX_SOURCE_CHARS;
  const atLimit = files.length + pending.length >= MAX_SOURCE_FILES;
  const locked = disabled || atLimit;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className={`${labelCls} !mb-0`}>
          {label} <span className="normal-case font-normal tracking-normal">(optional{files.length ? ` · ${files.length}/${MAX_SOURCE_FILES}` : ''})</span>
        </p>
        <button type="button" onClick={() => setPasting(v => !v)} disabled={disabled || (atLimit && !pasting)} aria-expanded={pasting}
          className="inline-flex items-center gap-1 text-xs font-medium text-saffron hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed">
          <ClipboardPaste className="w-3.5 h-3.5" /> {pasting ? 'Close paste box' : 'Paste text instead'}
        </button>
      </div>
      {hint && <p className="text-xs text-muted">{hint}</p>}

      {pasting && (
        <div className="space-y-2">
          <textarea aria-label="Paste your syllabus or notes" className={`${textareaCls} min-h-[120px]`} value={pasted} autoFocus
            onChange={e => setPasted(e.target.value)} placeholder="Paste your syllabus, notes or a chapter here…" disabled={disabled} />
          <div className="flex items-center gap-2">
            <button type="button" onClick={addPasted} disabled={disabled || !pasted.trim()}
              className="btn-saffron !px-4 !py-1.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed">Add text</button>
            <button type="button" onClick={() => { setPasting(false); setPasted(''); }} className="text-xs text-muted hover:text-navy dark:hover:text-dark-text">Cancel</button>
            {pasted.trim() && <span className="text-xs text-muted ml-auto">{plural(cleanText(pasted).length, 'char')}</span>}
          </div>
        </div>
      )}

      {!pasting && (
        <button type="button" disabled={locked}
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); if (!locked) setDrag(true); }}
          onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDrag(false); }}
          onDrop={e => { e.preventDefault(); setDrag(false); if (!locked) void addFiles(e.dataTransfer.files); }}
          aria-label="Upload files: drop them here or press to browse"
          className={`w-full flex items-center gap-3 rounded-xl border-2 border-dashed px-3.5 py-3 text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-saffron/30 disabled:cursor-not-allowed disabled:opacity-60 ${
            drag ? 'border-saffron bg-saffron/5' : 'border-card-border dark:border-dark-border bg-off-white dark:bg-dark-bg hover:border-saffron/50 focus-visible:border-saffron'}`}>
          <span className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center transition-colors ${drag ? 'bg-saffron text-white' : 'bg-saffron/10 text-saffron'}`}>
            <Upload className="w-4 h-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium text-navy dark:text-dark-text">
              {atLimit ? `${MAX_SOURCE_FILES} files added — remove one to add another` : drag ? 'Drop to add' : <>Drop files here or <span className="text-saffron underline underline-offset-2">browse</span></>}
            </span>
            <span className="block text-xs text-muted mt-0.5">Syllabus, notes, PPT or chapter · PDF, PPTX, DOCX, TXT · up to {MAX_SOURCE_FILES} files, 15 MB each</span>
          </span>
        </button>
      )}
      <input ref={inputRef} type="file" multiple accept={ACCEPT} className="hidden" tabIndex={-1}
        onChange={e => { const list = e.target.files ? Array.from(e.target.files) : []; e.target.value = ''; void addFiles(list); }} />

      {(files.length > 0 || pending.length > 0) && (
        <ul className="space-y-1.5" aria-label="Uploaded material">
          {files.map((f, i) => {
            const meta = META.get(f);
            const Icon = KIND_ICON[f.kind];
            const units = meta?.units ? plural(meta.units.count, meta.units.label) : f.kind === 'text' ? plural(full(f).text.split(/\s+/).filter(Boolean).length, 'word') : '';
            return (
              <li key={`${f.name}-${i}`} className="rounded-xl border border-card-border dark:border-dark-border bg-white dark:bg-dark-surface px-2.5 py-2">
                <div className="flex items-center gap-2.5">
                  <span className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center ${KIND_TINT[f.kind]}`}><Icon className="w-4 h-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-navy dark:text-dark-text truncate" title={f.name}>{f.name}</span>
                    <span className="block text-[11px] text-muted">
                      {[units, `${fmt(full(f).text.length)} chars`].filter(Boolean).join(' · ')}
                      {f.text.length < full(f).text.length && <span className="text-saffron"> · trimmed</span>}
                      {' · '}
                      <button type="button" onClick={() => setPreview(v => (v === i ? null : i))} aria-expanded={preview === i}
                        className="font-medium text-saffron hover:underline">{preview === i ? 'Hide text' : 'Preview'}</button>
                    </span>
                    {meta?.warning && (
                      <span className="flex items-start gap-1 text-[11px] text-amber-600 dark:text-amber-400 mt-0.5"><TriangleAlert className="w-3 h-3 mt-px shrink-0" />{meta.warning}</span>
                    )}
                  </span>
                  <button type="button" onClick={() => remove(i)} disabled={disabled} aria-label={`Remove ${f.name}`}
                    className="w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-40 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {preview === i && (
                  <p className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-card-border dark:border-dark-border bg-off-white dark:bg-dark-bg p-2.5 text-[11px] leading-relaxed text-navy/80 dark:text-dark-text/80">
                    {f.text.slice(0, 3000)}{f.text.length > 3000 ? '…' : ''}
                  </p>
                )}
              </li>
            );
          })}
          {pending.map(p => (
            <li key={p.id} className="flex items-center gap-2.5 rounded-xl border border-dashed border-saffron/40 bg-saffron/5 px-2.5 py-2" role="status">
              <span className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center bg-saffron/10 text-saffron"><Loader2 className="w-4 h-4 animate-spin" /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-navy dark:text-dark-text truncate">{p.name}</span>
                <span className="block text-[11px] text-muted">{p.status}</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      {notices.length > 0 && (
        <ul className="space-y-1.5" aria-live="polite">
          {notices.map(n => (
            <li key={n.id} className="flex items-start gap-2 rounded-xl px-3 py-2 text-xs bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300">
              <TriangleAlert className="w-3.5 h-3.5 mt-px shrink-0" />
              <span className="flex-1">
                {n.text}
                {n.paste && !pasting && (
                  <button type="button" onClick={() => setPasting(true)} className="ml-1 font-semibold underline underline-offset-2">Paste text</button>
                )}
              </span>
              <button type="button" onClick={() => setNotices(x => x.filter(y => y.id !== n.id))} aria-label="Dismiss" className="shrink-0 opacity-60 hover:opacity-100">
                <X className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {trimmed && (
        <p className="flex items-start gap-1.5 text-[11px] text-muted">
          <TriangleAlert className="w-3 h-3 mt-px shrink-0 text-saffron" />
          <span>
            Trimmed to fit: {fmt(totalChars)} characters uploaded; the AI reads about {fmt(MAX_SOURCE_CHARS)} —{' '}
            {topic === undefined
              ? 'from the start of each file. Upload just the chapter you need for best results.'
              : topic.trim()
                ? 'the parts that best match your topic.'
                : 'add a topic to pick the right part, or upload just the chapter you need.'}
          </span>
        </p>
      )}
    </div>
  );
}
