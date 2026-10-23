'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowDown, ArrowRight, ArrowUp, Copy, Download, ExternalLink, ImagePlus, LayoutGrid, Loader2, Play, Plus,
  RefreshCw, Search, Trash2, X,
} from 'lucide-react';
import {
  DIAGRAM_KINDS, emptySlide, SLIDE_LAYOUTS, SLIDE_THEMES,
  type DiagramItem, type DiagramKind, type Slide, type SlideDiagram, type SlideImage, type SlideLayout, type SlideTheme, type SlidesContent,
} from '@/lib/teacher-docs';
import { useDoc } from '@/components/teacher/use-doc';
import EditorBar from '@/components/teacher/editor-bar';
import SlideView from '@/components/teacher/slide-view';
import PresentMode from '@/components/teacher/present-mode';
import { exportPptx } from '@/components/teacher/export-pptx';
import { api, ErrorNote, inputCls, labelCls, panelCls, Spinner, TeacherPage, textareaCls } from '@/components/teacher/ui';

const LAYOUT_LABEL: Record<SlideLayout, string> = {
  title: 'Title', bullets: 'Bullets', image: 'Picture', diagram: 'Diagram',
  'two-column': 'Two columns', quote: 'Key definition', summary: 'Summary',
};
/** Where visuals show for each layout (mirrors the visual contract in teacher-docs.ts). */
const LAYOUT_HINT: Record<SlideLayout, string> = {
  title: 'Emoji + title, with the picture beside it.',
  bullets: 'Points with the picture beside them — or the emoji if there is no picture.',
  image: 'The picture is the star; points become short captions beside it.',
  diagram: 'The diagram fills the slide under the title, with up to 2 caption lines.',
  'two-column': 'Two columns: text only — no picture or diagram.',
  quote: 'Definition with the picture beside it — or the emoji if there is no picture.',
  summary: 'Recap points with the picture beside them — or the emoji if there is no picture.',
};
/** Layouts that draw `slide.image`. */
const PICTURE_LAYOUTS: SlideLayout[] = ['title', 'image', 'bullets', 'summary', 'quote'];

const QUICK_EMOJI = ['📚', '🔬', '🧪', '🌱', '🌍', '☀️', '💧', '⚡', '🧮', '📐', '🦁', '🏛️'];

const DIAGRAM_INFO: Record<DiagramKind, { label: string; hint: string; icon: React.ReactNode }> = {
  flow:  { label: 'Flow',  hint: 'Steps in order',       icon: <ArrowRight className="w-4 h-4" /> },
  cycle: { label: 'Cycle', hint: 'Goes round in a loop', icon: <RefreshCw className="w-4 h-4" /> },
  cards: { label: 'Cards', hint: 'Separate ideas',       icon: <LayoutGrid className="w-4 h-4" /> },
};
const MAX_ITEMS = 6;
const emptyItem = (): DiagramItem => ({ emoji: '', label: '', detail: '' });

/** Commons serves fixed thumbnail steps; the 330px one is ~10× lighter than the slide-size image. */
const smallThumb = (url: string) => url.replace(/\/thumb\/(.+)\/\d+px-([^/?]+)(\?.*)?$/, '/thumb/$1/330px-$2');
/** If a small thumbnail can't be made (tiny original), fall back to the full image; hide it if that fails too. */
const thumbFallback = (full: string) => (e: React.SyntheticEvent<HTMLImageElement>) => {
  if (e.currentTarget.src !== full) e.currentTarget.src = full;
  else e.currentTarget.style.visibility = 'hidden';
};

const lines = (v: string) => v.split('\n');
const words = (v: string) => v.trim().split(/\s+/).filter(Boolean).length;
/** Older decks were saved before the visual fields existed. */
const withDefaults = (s: Slide): Slide => ({ ...emptySlide(s.layout), ...s });
/** Deep copy, so editing a duplicate never touches the original. */
const cloneSlide = (s: Slide): Slide => ({
  ...s,
  bullets: [...s.bullets],
  right: [...s.right],
  image: s.image ? { ...s.image } : null,
  diagram: s.diagram ? { ...s.diagram, items: s.diagram.items.map(i => ({ ...i })) } : null,
});

export default function SlidesEditor({ params }: { params: { id: string } }) {
  const { doc, loadError, saveState, setContent, setTitle } = useDoc<SlidesContent>(params.id);
  const [sel, setSel] = useState(0);
  const [presenting, setPresenting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [picking, setPicking] = useState(false);

  // The picture picker belongs to one slide; close it when the selection changes.
  useEffect(() => setPicking(false), [sel]);

  if (loadError) return <TeacherPage><ErrorNote>{loadError}</ErrorNote></TeacherPage>;
  if (!doc) return <TeacherPage><Spinner label="Loading deck…" /></TeacherPage>;

  const { theme } = doc.content;
  const slides = doc.content.slides.map(withDefaults);
  const at = Math.min(sel, slides.length - 1);
  const current = slides[at];
  const showsPicture = PICTURE_LAYOUTS.includes(current.layout);

  const patchSlide = (p: Partial<Slide>) =>
    setContent(c => ({ ...c, slides: c.slides.map((s, i) => (i === at ? { ...withDefaults(s), ...p } : s)) }));
  const move = (dir: -1 | 1) => {
    const j = at + dir;
    if (j < 0 || j >= slides.length) return;
    setContent(c => {
      const next = [...c.slides];
      [next[at], next[j]] = [next[j], next[at]];
      return { ...c, slides: next };
    });
    setSel(j);
  };
  const insert = (slide: Slide) => {
    setContent(c => ({ ...c, slides: [...c.slides.slice(0, at + 1), slide, ...c.slides.slice(at + 1)] }));
    setSel(at + 1);
  };
  const remove = () => {
    if (slides.length <= 1) return;
    setContent(c => ({ ...c, slides: c.slides.filter((_, i) => i !== at) }));
    setSel(Math.max(0, at - 1));
  };
  const changeLayout = (layout: SlideLayout) => {
    const p: Partial<Slide> = { layout };
    // Give a fresh diagram three blank items so the teacher sees what to fill.
    if (layout === 'diagram' && !current.diagram?.items.length)
      p.diagram = { kind: current.diagram?.kind ?? 'flow', items: [emptyItem(), emptyItem(), emptyItem()] };
    patchSlide(p);
    if (layout === 'image' && !current.image) setPicking(true);
  };
  const download = async () => {
    setExporting(true);
    try { await exportPptx(doc.title, doc.content); } finally { setExporting(false); }
  };

  return (
    <TeacherPage>
      <EditorBar back="/teacher/slides" title={doc.title} onTitle={setTitle} saveState={saveState}
        meta={`${slides.length} slides · ${doc.grade === 'College' ? 'College' : `Class ${doc.grade}`} · ${doc.language}`}
        actions={<>
          <div className="flex items-center gap-1 mr-1" role="radiogroup" aria-label="Theme">
            {(Object.keys(SLIDE_THEMES) as SlideTheme[]).map(t => (
              <button key={t} role="radio" aria-checked={theme === t} aria-label={`${t} theme`} title={t}
                onClick={() => setContent(c => ({ ...c, theme: t }))}
                className={`w-7 h-7 rounded-full border-2 ${theme === t ? 'border-saffron scale-110' : 'border-card-border dark:border-dark-border'}`}
                style={{ background: `linear-gradient(135deg, #${SLIDE_THEMES[t].bg} 50%, #${SLIDE_THEMES[t].accent} 50%)` }} />
            ))}
          </div>
          <button onClick={() => setPresenting(true)} className="btn-outline !py-2 !px-4 text-sm"><Play className="w-4 h-4" /> Present</button>
          <button onClick={download} disabled={exporting} className="btn-saffron !py-2 !px-4 text-sm">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Download .pptx
          </button>
        </>} />

      <div className="grid lg:grid-cols-[200px_1fr] gap-5">
        {/* Slide strip */}
        <ol className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto lg:max-h-[calc(100vh-180px)] pb-2 lg:pr-1">
          {slides.map((s, i) => (
            <li key={i} className="shrink-0 w-40 lg:w-auto">
              <button onClick={() => setSel(i)} aria-label={`Slide ${i + 1}: ${s.title}`} aria-current={i === at}
                className={`w-full text-left rounded-xl p-1.5 border-2 transition ${i === at ? 'border-saffron' : 'border-transparent hover:border-card-border dark:hover:border-dark-border'}`}>
                <div className="pointer-events-none"><SlideView slide={s} theme={theme} /></div>
                <p className="text-[11px] text-muted mt-1 truncate">{i + 1}. {s.emoji && `${s.emoji} `}{s.title}</p>
              </button>
            </li>
          ))}
          <li className="shrink-0 w-40 lg:w-auto">
            <button onClick={() => insert(emptySlide())} className="w-full aspect-video rounded-xl border-2 border-dashed border-card-border dark:border-dark-border text-muted hover:border-saffron hover:text-saffron flex flex-col items-center justify-center text-xs gap-1">
              <Plus className="w-5 h-5" /> Add slide
            </button>
          </li>
        </ol>

        <div className="space-y-5 min-w-0">
          <SlideView slide={current} theme={theme} index={at} total={slides.length} />

          <div className={`${panelCls} p-5 space-y-4`}>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <select aria-label="Layout" className={`${inputCls} !w-auto !h-9`} value={current.layout}
                onChange={e => changeLayout(e.target.value as SlideLayout)}>
                {SLIDE_LAYOUTS.map(l => <option key={l} value={l}>{LAYOUT_LABEL[l]}</option>)}
              </select>
              <p className="text-xs text-muted flex-1 min-w-[180px]">
                {LAYOUT_HINT[current.layout]}
                {current.image && !showsPicture && ' This slide’s picture is kept but not shown.'}
              </p>
              <div className="ml-auto flex gap-1">
                <IconBtn label="Move up" onClick={() => move(-1)} disabled={at === 0}><ArrowUp className="w-4 h-4" /></IconBtn>
                <IconBtn label="Move down" onClick={() => move(1)} disabled={at === slides.length - 1}><ArrowDown className="w-4 h-4" /></IconBtn>
                <IconBtn label="Duplicate" onClick={() => insert(cloneSlide(current))}><Copy className="w-4 h-4" /></IconBtn>
                <IconBtn label="Delete slide" onClick={remove} disabled={slides.length <= 1} danger><Trash2 className="w-4 h-4" /></IconBtn>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Title</label>
                <input className={inputCls} value={current.title} onChange={e => patchSlide({ title: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>{current.layout === 'quote' ? 'Definition / quote' : 'Subtitle'}</label>
                <input className={inputCls} value={current.subtitle} onChange={e => patchSlide({ subtitle: e.target.value })} />
              </div>
            </div>

            <div className={`grid gap-4 ${showsPicture ? 'md:grid-cols-[minmax(0,17rem)_1fr]' : ''}`}>
              <EmojiField value={current.emoji} onChange={emoji => patchSlide({ emoji })} />
              {showsPicture && (
                <PicturePanel image={current.image} required={current.layout === 'image'} picking={picking}
                  onOpen={() => setPicking(true)} onRemove={() => patchSlide({ image: null })} />
              )}
            </div>
            {showsPicture && picking && (
              <ImagePicker key={at} initialQuery={current.imageQuery || current.title} selected={current.image?.url}
                onClose={() => setPicking(false)}
                onSelect={(image, imageQuery) => { patchSlide({ image, imageQuery }); setPicking(false); }} />
            )}

            {current.layout === 'diagram' && (
              <DiagramPanel diagram={current.diagram ?? { kind: 'flow', items: [] }} onChange={diagram => patchSlide({ diagram })} />
            )}

            {current.layout !== 'title' && (
              <div className={current.layout === 'two-column' ? 'grid md:grid-cols-2 gap-4' : ''}>
                <div>
                  <label className={labelCls}>
                    {current.layout === 'two-column' ? 'Left column' : current.layout === 'image' ? 'Short captions'
                      : current.layout === 'diagram' ? 'Caption' : 'Bullet points'}{' '}
                    <span className="normal-case font-normal">({current.layout === 'diagram' ? 'up to 2 lines' : 'one per line'})</span>
                  </label>
                  <textarea className={`${textareaCls} ${current.layout === 'diagram' ? '' : 'min-h-[140px]'}`} value={current.bullets.join('\n')}
                    onChange={e => patchSlide({ bullets: lines(e.target.value) })} />
                </div>
                {current.layout === 'two-column' && (
                  <div>
                    <label className={labelCls}>Right column <span className="normal-case font-normal">(one per line)</span></label>
                    <textarea className={`${textareaCls} min-h-[140px]`} value={current.right.join('\n')}
                      onChange={e => patchSlide({ right: lines(e.target.value) })} />
                  </div>
                )}
              </div>
            )}

            <div>
              <label className={labelCls}>Visual / diagram idea</label>
              <input className={inputCls} value={current.visual} onChange={e => patchSlide({ visual: e.target.value })}
                placeholder="e.g. Labelled diagram of a leaf cross-section" />
            </div>
            <div>
              <label className={labelCls}>Speaker notes</label>
              <textarea className={textareaCls} value={current.notes} onChange={e => patchSlide({ notes: e.target.value })}
                placeholder="What to say while this slide is up" />
            </div>
          </div>
        </div>
      </div>

      {presenting && <PresentMode content={doc.content} start={at} onClose={() => setPresenting(false)} />}
    </TeacherPage>
  );
}

function IconBtn({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled} aria-label={label} title={label}
      className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center border border-card-border dark:border-dark-border text-navy dark:text-dark-text disabled:opacity-30 ${danger ? 'hover:text-red-500 hover:border-red-300' : 'hover:text-saffron hover:border-saffron'}`}>
      {children}
    </button>
  );
}

const subPanelCls = 'rounded-xl border border-card-border dark:border-dark-border bg-off-white/60 dark:bg-dark-bg/40 p-4';

function EmojiField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className={subPanelCls}>
      <label htmlFor="slide-emoji" className={labelCls}>Emoji</label>
      <div className="flex items-start gap-3">
        <input id="slide-emoji" className={`${inputCls} !w-16 !h-14 !px-1 text-center !text-3xl leading-none`} value={value} maxLength={16}
          placeholder="🙂" onChange={e => onChange(e.target.value.trim())} />
        <div className="flex flex-wrap gap-1" role="group" aria-label="Quick-pick emoji">
          {QUICK_EMOJI.map(e => (
            <button key={e} type="button" onClick={() => onChange(value === e ? '' : e)} aria-label={`Use ${e}`} aria-pressed={value === e}
              className={`w-8 h-8 rounded-lg text-lg leading-none flex items-center justify-center transition ${value === e ? 'bg-saffron/15 ring-2 ring-saffron' : 'hover:bg-saffron/10'}`}>
              {e}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PicturePanel({ image, required, picking, onOpen, onRemove }: {
  image: SlideImage | null; required: boolean; picking: boolean; onOpen: () => void; onRemove: () => void;
}) {
  return (
    <div className={subPanelCls}>
      <p className={labelCls}>Picture</p>
      {image ? (
        <div className="flex flex-col sm:flex-row gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.url} alt={image.title} className="w-full sm:w-44 aspect-[4/3] object-cover rounded-lg bg-card-border dark:bg-dark-border shrink-0" />
          <div className="min-w-0 flex flex-col gap-2">
            <p className="text-sm font-medium text-navy dark:text-dark-text line-clamp-2 break-words">{image.title}</p>
            <p className="text-xs text-muted break-words">
              {image.credit || 'Unknown author'}{image.license && ` · ${image.license}`}
              {image.page && (
                <> · <a href={image.page} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-saffron hover:underline">
                  Wikimedia Commons <ExternalLink className="w-3 h-3" />
                </a></>
              )}
            </p>
            <div className="flex flex-wrap gap-2 mt-auto">
              <button type="button" onClick={onOpen} disabled={picking} className="btn-outline !py-1.5 !px-3.5 text-sm disabled:opacity-50">
                <RefreshCw className="w-4 h-4" /> Change picture
              </button>
              <button type="button" onClick={onRemove} className="btn-outline !py-1.5 !px-3.5 text-sm hover:!text-red-500 hover:!border-red-300">
                <Trash2 className="w-4 h-4" /> Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-4">
          <button type="button" onClick={onOpen} disabled={picking}
            className="w-full sm:w-44 aspect-[4/3] shrink-0 rounded-lg border-2 border-dashed border-card-border dark:border-dark-border text-muted hover:border-saffron hover:text-saffron disabled:opacity-50 disabled:pointer-events-none flex flex-col items-center justify-center gap-1.5 text-sm font-medium transition">
            <ImagePlus className="w-6 h-6" /> Add picture
          </button>
          <div className="text-sm text-muted self-center space-y-1">
            {required && <p className="font-medium text-saffron">This layout needs a picture.</p>}
            <p>A real photo helps children recognise the topic. Free pictures from Wikimedia Commons, with the author credit saved.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ImagePicker({ initialQuery, selected, onSelect, onClose }: {
  initialQuery: string; selected?: string; onSelect: (image: SlideImage, query: string) => void; onClose: () => void;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [searched, setSearched] = useState('');
  const [results, setResults] = useState<SlideImage[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reqId = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const search = async (raw: string) => {
    const q = raw.trim();
    if (!q) { setResults(null); setError('Type what the picture should show, e.g. “plant cell”.'); return; }
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    try {
      const { images } = await api<{ images: SlideImage[] }>(`/api/teacher/images?q=${encodeURIComponent(q)}`);
      if (id !== reqId.current) return;
      setResults(images);
      setSearched(q);
    } catch (e) {
      if (id !== reqId.current) return;
      setResults(null);
      setError(e instanceof Error ? e.message : 'Could not search pictures.');
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  };

  // Search straight away with the slide's suggested query (unless the teacher already searched).
  useEffect(() => {
    inputRef.current?.focus();
    if (initialQuery.trim() && reqId.current === 0) void search(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section aria-label="Choose a picture" className="rounded-xl border-2 border-saffron/40 bg-saffron-50/40 dark:bg-saffron/5 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-heading font-semibold text-navy dark:text-dark-text text-sm">Choose a picture</p>
        <button type="button" onClick={onClose} aria-label="Close picture search" title="Close"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-saffron hover:bg-saffron/10">
          <X className="w-4 h-4" />
        </button>
      </div>
      <form className="flex gap-2" onSubmit={e => { e.preventDefault(); void search(query); }}>
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input ref={inputRef} aria-label="Search pictures" className={`${inputCls} !h-10 !pl-9`} value={query}
            onChange={e => setQuery(e.target.value)} placeholder="Search in English, e.g. water cycle, honey bee" />
        </div>
        {/* Never disabled: a disabled default button blocks Enter, and stale responses are dropped anyway. */}
        <button type="submit" className="btn-saffron !py-2 !px-4 text-sm">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Search
        </button>
      </form>

      {error && <ErrorNote>{error}</ErrorNote>}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2" aria-busy="true" aria-label="Loading pictures">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="aspect-[4/3] rounded-lg bg-card-border/70 dark:bg-dark-border animate-pulse" />
          ))}
        </div>
      ) : results && results.length === 0 ? (
        <p className="text-sm text-muted py-4 text-center">
          No pictures found for “{searched}”.{' '}
          {/[^\x00-\x7F]/.test(searched)
            ? 'Picture search works best in English — try e.g. “day and night” or “honey bee”.'
            : 'Try fewer, simpler words — e.g. “volcano” instead of a full sentence.'}
        </p>
      ) : results && (
        <>
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {results.map(img => (
              <li key={img.url}>
                <button type="button" onClick={() => onSelect(img, searched)} title={`${img.title}\n${img.credit} · ${img.license}`}
                  aria-label={`Use picture: ${img.title}`}
                  className={`group relative block w-full aspect-[4/3] overflow-hidden rounded-lg bg-card-border dark:bg-dark-border border-2 transition ${selected === img.url ? 'border-saffron' : 'border-transparent hover:border-saffron'}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={smallThumb(img.url)} onError={thumbFallback(img.url)} alt={img.title} loading="lazy" className="w-full h-full object-cover transition group-hover:scale-105" />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent text-white text-[10px] text-left px-1.5 pt-4 pb-1 truncate">
                    {img.license || img.title}
                  </span>
                  {selected === img.url && (
                    <span className="absolute top-1 right-1 bg-saffron text-white text-[10px] font-semibold rounded-full px-2 py-0.5">In use</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-muted">Free-licensed pictures from Wikimedia Commons. The author credit is saved with the slide.</p>
        </>
      )}
    </section>
  );
}

function DiagramPanel({ diagram, onChange }: { diagram: SlideDiagram; onChange: (d: SlideDiagram) => void }) {
  const { kind, items } = diagram;
  const setItems = (next: DiagramItem[]) => onChange({ kind, items: next });
  const patchItem = (i: number, p: Partial<DiagramItem>) => setItems(items.map((it, j) => (j === i ? { ...it, ...p } : it)));
  const moveItem = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
  };

  return (
    <div className={`${subPanelCls} space-y-4`}>
      <div>
        <p className={labelCls}>Diagram type</p>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Diagram type">
          {DIAGRAM_KINDS.map(k => (
            <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => onChange({ kind: k, items })}
              className={`rounded-xl border-2 px-3 py-2 text-left transition ${kind === k
                ? 'border-saffron bg-saffron/10 text-saffron'
                : 'border-card-border dark:border-dark-border text-navy dark:text-dark-text hover:border-saffron/60'}`}>
              <span className="flex items-center gap-1.5 font-heading font-semibold text-sm">{DIAGRAM_INFO[k].icon} {DIAGRAM_INFO[k].label}</span>
              <span className="block text-[11px] text-muted mt-0.5">{DIAGRAM_INFO[k].hint}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className={labelCls}>Items <span className="normal-case font-normal">({items.length} / {MAX_ITEMS})</span></p>
        {items.length === 0 && <p className="text-sm text-muted mb-2">No items yet — add 2 to 6.</p>}
        <ol className="space-y-2">
          {items.map((it, i) => {
            const long = words(it.label) > 4;
            return (
              <li key={i} className="grid grid-cols-[1.5rem_3rem_minmax(0,1fr)_auto] sm:grid-cols-[1.5rem_3rem_minmax(0,12rem)_minmax(0,1fr)_auto] items-center gap-2">
                <span className="text-center text-xs font-heading font-bold text-saffron">{i + 1}</span>
                <input aria-label={`Item ${i + 1} emoji`} className={`${inputCls} !h-10 !px-1 text-center !text-xl leading-none`}
                  value={it.emoji} maxLength={16} placeholder="🙂" onChange={e => patchItem(i, { emoji: e.target.value.trim() })} />
                <input aria-label={`Item ${i + 1} label`} className={`${inputCls} !h-10 col-span-2 sm:col-span-1 ${long ? '!border-amber-400' : ''}`}
                  value={it.label} maxLength={80} placeholder="Label (max 4 words)" title={long ? 'Keep labels to 4 words or fewer' : undefined}
                  onChange={e => patchItem(i, { label: e.target.value })} />
                <input aria-label={`Item ${i + 1} detail`} className={`${inputCls} !h-10 col-start-2 col-span-2 sm:col-start-auto sm:col-span-1`}
                  value={it.detail} maxLength={160} placeholder="Detail (optional, one short line)"
                  onChange={e => patchItem(i, { detail: e.target.value })} />
                <div className="flex gap-1">
                  <IconBtn label={`Move item ${i + 1} up`} onClick={() => moveItem(i, -1)} disabled={i === 0}><ArrowUp className="w-4 h-4" /></IconBtn>
                  <IconBtn label={`Move item ${i + 1} down`} onClick={() => moveItem(i, 1)} disabled={i === items.length - 1}><ArrowDown className="w-4 h-4" /></IconBtn>
                  <IconBtn label={`Delete item ${i + 1}`} onClick={() => setItems(items.filter((_, j) => j !== i))} danger><Trash2 className="w-4 h-4" /></IconBtn>
                </div>
              </li>
            );
          })}
        </ol>
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <button type="button" onClick={() => setItems([...items, emptyItem()])} disabled={items.length >= MAX_ITEMS}
            className="btn-outline !py-1.5 !px-3.5 text-sm disabled:opacity-40 disabled:pointer-events-none">
            <Plus className="w-4 h-4" /> Add item
          </button>
          <p className="text-xs text-muted flex-1 min-w-[200px]">
            {items.length >= MAX_ITEMS ? 'That’s the maximum of 6 — keep it simple for young learners. ' : ''}
            When you present, items appear one by one with each click.
          </p>
        </div>
      </div>
    </div>
  );
}
