'use client';

// One-page revision sheet: read mode (also what prints) and an edit mode that
// autosaves to /api/student/notes/[id].
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Check, CloudOff, Eye, EyeOff, Layers, Loader2, NotebookText, Pencil, Plus, Printer, Trash2, X,
} from 'lucide-react';
import { EMPTY, type MindBranch, type NotesContent } from '@/lib/notes';
import MindMapView from './mind-map';
import PageHero from '@/components/ui/page-hero';
import { api, ErrorNote, inputCls, labelCls, panelCls, Spinner, TeacherPage, textareaCls } from '@/components/teacher/ui';

interface NotesDoc { id: string; title: string; topic: string; grade: string; language: string; content: NotesContent }
type SaveState = 'saved' | 'saving' | 'unsaved' | 'error';

const Section = ({ title, emoji, children }: { title: string; emoji: string; children: React.ReactNode }) => (
  <section className="break-inside-avoid">
    <h2 className="mb-3 flex items-center gap-2.5 font-heading text-lg font-extrabold text-navy dark:text-dark-text print:text-black">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-saffron/10 text-lg print:bg-transparent">{emoji}</span>{title}
      <span aria-hidden className="ml-1 h-px flex-1 bg-gradient-to-r from-saffron/40 to-transparent print:hidden" />
    </h2>
    {children}
  </section>
);

export default function NotesSheet({ id }: { id: string }) {
  const [doc, setDoc] = useState<NotesDoc | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [save, setSave] = useState<SaveState>('saved');
  const [shown, setShown] = useState<Set<number>>(new Set());
  const pending = useRef<{ title?: string; content?: NotesContent }>({});
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    api<{ doc: NotesDoc }>(`/api/student/notes/${id}`).then(d => setDoc(d.doc)).catch(e => setLoadError(e.message));
  }, [id]);

  const flush = useCallback(async () => {
    const body = pending.current;
    pending.current = {};
    if (body.title === undefined && body.content === undefined) return;
    setSave('saving');
    try {
      await api(`/api/student/notes/${id}`, { method: 'PATCH', json: body });
      setSave(s => (s === 'saving' ? 'saved' : s));
    } catch {
      setSave('error');
    }
  }, [id]);
  useEffect(() => () => { clearTimeout(timer.current); void flush(); }, [flush]);

  const schedule = () => { setSave('unsaved'); clearTimeout(timer.current); timer.current = setTimeout(flush, 800); };
  const edit = (fn: (c: NotesContent) => NotesContent) => {
    setDoc(d => {
      if (!d) return d;
      const content = fn(d.content);
      pending.current.content = content;
      return { ...d, content };
    });
    schedule();
  };
  const setTitle = (title: string) => {
    setDoc(d => (d ? { ...d, title } : d));
    if (title.trim()) { pending.current.title = title; schedule(); }
  };

  if (loadError) return <TeacherPage><ErrorNote>{loadError}</ErrorNote></TeacherPage>;
  if (!doc) return <TeacherPage><Spinner label="Loading your revision sheet…" /></TeacherPage>;
  const n = doc.content;

  return (
    <TeacherPage>
      {/* Toolbar */}
      <div className="mb-6 overflow-hidden rounded-3xl shadow-card print:hidden">
        <PageHero icon={<NotebookText />} glyphs={['📌', '🧠', '∑', '💡', '✓', '📖', 'π', '⭐']} title={doc.title}
          eyebrow={<Link href="/notes" className="inline-flex items-center gap-1.5 hover:text-white"><ArrowLeft className="h-3.5 w-3.5" /> Revision notes</Link>}
          titleNode={editing
            ? <input value={doc.title} onChange={e => setTitle(e.target.value)} aria-label="Title" maxLength={200}
                className="w-full border-b-2 border-saffron/60 bg-transparent font-heading text-2xl font-extrabold tracking-tight text-white outline-none sm:text-3xl" />
            : <h1 className="ph-grad-text font-heading text-2xl font-extrabold tracking-tight sm:text-4xl" dir="auto">{doc.title}</h1>}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-auto flex items-center gap-1.5 text-sm text-white/70">
              Class {doc.grade} · {doc.language}
              {editing && <> · {save === 'saving' ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</>
                : save === 'saved' ? <><Check className="h-3.5 w-3.5 text-emerald-400" /> Saved</>
                : save === 'error' ? <span className="flex items-center gap-1 text-red-300"><CloudOff className="h-3.5 w-3.5" /> Couldn&apos;t save</span>
                : 'Unsaved changes'}</>}
            </span>
            <button onClick={() => setEditing(e => !e)} className="inline-flex items-center gap-2 rounded-full border border-white/25 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
              {editing ? <><Eye className="h-4 w-4" /> Done editing</> : <><Pencil className="h-4 w-4" /> Edit</>}
            </button>
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full border border-white/25 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"><Printer className="h-4 w-4" /> Print / PDF</button>
            <Link href={`/flashcards?notes=${doc.id}`} className="btn-saffron !px-4 !py-2 text-sm"><Layers className="h-4 w-4" /> Make flashcards</Link>
          </div>
        </PageHero>
      </div>

      {editing ? <NotesEditor n={n} edit={edit} /> : (
        <article className="space-y-7 print:space-y-5 print:text-black">
          <div className="hidden print:block border-b-2 border-black pb-2">
            <h1 className="text-2xl font-bold" dir="auto">{doc.title}</h1>
            <p className="text-sm">Class {doc.grade} · {doc.language} · VidyaAI revision sheet</p>
          </div>

          {n.oneLine && (
            <div className="ph-rise relative overflow-hidden rounded-2xl border border-saffron/30 bg-gradient-to-r from-saffron/15 via-rose-400/10 to-indigo-brand/10 p-6 print:border-black">
              <span aria-hidden className="absolute -top-4 right-4 font-heading text-[7rem] leading-none text-saffron/15 print:hidden">”</span>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-saffron print:text-black">In one line</p>
              <p className="relative text-xl font-heading font-bold text-navy dark:text-dark-text print:text-black" dir="auto">{n.oneLine}</p>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            {n.keyPoints.length > 0 && (
              <Section title="Key points" emoji="📌">
                <ol className={`${panelCls} ph-stagger space-y-2.5 p-4 print:shadow-none`}>
                  {n.keyPoints.map((p, i) => (
                    <li key={i} className="flex gap-2.5 text-sm text-navy/90 dark:text-dark-text/90 print:text-black" dir="auto">
                      <span className="w-5 h-5 shrink-0 rounded-full bg-saffron text-white text-[11px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>{p}
                    </li>
                  ))}
                </ol>
              </Section>
            )}
            {n.terms.length > 0 && (
              <Section title="Important terms" emoji="📖">
                <dl className={`${panelCls} p-4 divide-y divide-card-border dark:divide-dark-border print:shadow-none`}>
                  {n.terms.map((t, i) => (
                    <div key={i} className="py-2 first:pt-0 last:pb-0 text-sm" dir="auto">
                      <dt className="font-semibold text-indigo-brand print:text-black">{t.term}</dt>
                      <dd className="text-navy/80 dark:text-dark-text/80 print:text-black">{t.meaning}</dd>
                    </div>
                  ))}
                </dl>
              </Section>
            )}
          </div>

          {n.formulas.length > 0 && (
            <Section title="Formulas" emoji="🧮">
              <div className="ph-stagger grid gap-3 sm:grid-cols-2">
                {n.formulas.map((f, i) => (
                  <div key={i} className="ph-shine rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-[#2b1d3f] p-4 text-white shadow-card print:bg-none print:text-black print:shadow-none print:border print:border-black" dir="auto">
                    <p className="text-xs font-semibold uppercase tracking-wider text-saffron print:text-black">{f.name}</p>
                    <p className="mt-1 font-heading text-xl font-bold tracking-wide">{f.formula}</p>
                    {f.note && <p className="mt-1 text-xs text-white/60 print:text-black">{f.note}</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {n.mindMap.children.length > 0 && (
            <Section title="Mind map" emoji="🧠">
              <div className={`${panelCls} p-4 print:shadow-none`}><MindMapView map={n.mindMap} /></div>
            </Section>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            {n.mnemonics.length > 0 && (
              <Section title="Remember this" emoji="💡">
                <div className="space-y-3">
                  {n.mnemonics.map((m, i) => (
                    <div key={i} className="rounded-2xl border-2 border-dashed border-amber-400/60 bg-amber-400/5 p-4" dir="auto">
                      {m.title && <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 print:text-black">{m.title}</p>}
                      <p className="text-sm text-navy dark:text-dark-text print:text-black mt-0.5">{m.text}</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}
            {n.mistakes.length > 0 && (
              <Section title="Common mistakes" emoji="⚠️">
                <ul className="space-y-2.5">
                  {n.mistakes.map((m, i) => (
                    <li key={i} className={`${panelCls} p-3 text-sm print:shadow-none`} dir="auto">
                      <p className="text-red-500 print:text-black flex gap-1.5"><X className="w-4 h-4 shrink-0 mt-0.5" />{m.wrong}</p>
                      {m.right && <p className="text-teal print:text-black flex gap-1.5 mt-1"><Check className="w-4 h-4 shrink-0 mt-0.5" />{m.right}</p>}
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </div>

          {n.selfCheck.length > 0 && (
            <Section title="Quick self-check" emoji="✅">
              <ol className="ph-stagger grid gap-3 sm:grid-cols-2">
                {n.selfCheck.map((q, i) => {
                  const open = shown.has(i);
                  return (
                    <li key={i} className={`${panelCls} ph-shine p-4 text-sm print:shadow-none ${open ? '!border-teal/50' : ''}`} dir="auto">
                      <p className="font-medium text-navy dark:text-dark-text print:text-black">Q{i + 1}. {q.q}</p>
                      <button onClick={() => setShown(s => { const x = new Set(s); if (x.has(i)) x.delete(i); else x.add(i); return x; })}
                        className="mt-2 text-xs font-semibold text-saffron flex items-center gap-1 print:hidden">
                        {open ? <><EyeOff className="w-3.5 h-3.5" /> Hide answer</> : <><Eye className="w-3.5 h-3.5" /> Show answer</>}
                      </button>
                      <p className={`mt-1.5 rounded-lg bg-teal/10 px-3 py-2 text-teal print:bg-transparent print:text-black print:block ${open ? 'ph-pop' : 'hidden'}`}>{q.a}</p>
                    </li>
                  );
                })}
              </ol>
            </Section>
          )}
        </article>
      )}
    </TeacherPage>
  );
}

// ── Editor ──────────────────────────────────────────────────────────

function Rows<T extends object>({ label, items, fields, onChange, empty, max }: {
  label: string; items: T[]; fields: { key: Extract<keyof T, string>; placeholder: string; wide?: boolean }[];
  onChange: (items: T[]) => void; empty: () => T; max: number;
}) {
  return (
    <div className={`${panelCls} p-4`}>
      <p className={labelCls}>{label}</p>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex gap-2 items-start">
            {fields.map(f => (
              <input key={f.key} className={`${inputCls} !h-10 ${f.wide ? 'flex-[2]' : 'flex-1'}`} value={String(it[f.key] ?? '')} placeholder={f.placeholder} dir="auto"
                onChange={e => onChange(items.map((x, j) => (j === i ? { ...x, [f.key]: e.target.value } : x)))} />
            ))}
            <button onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Remove" className="w-10 h-10 shrink-0 flex items-center justify-center text-muted hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
      {items.length < max && (
        <button onClick={() => onChange([...items, empty()])} className="mt-2 text-sm text-saffron font-medium flex items-center gap-1"><Plus className="w-4 h-4" /> Add</button>
      )}
    </div>
  );
}

function NotesEditor({ n, edit }: { n: NotesContent; edit: (fn: (c: NotesContent) => NotesContent) => void }) {
  const setBranch = (i: number, b: MindBranch) => edit(c => ({ ...c, mindMap: { ...c.mindMap, children: c.mindMap.children.map((x, j) => (j === i ? b : x)) } }));
  return (
    <div className="space-y-4">
      <div className={`${panelCls} p-4`}>
        <label className={labelCls}>In one line</label>
        <textarea className={textareaCls} value={n.oneLine} dir="auto" onChange={e => edit(c => ({ ...c, oneLine: e.target.value }))} />
      </div>
      <div className={`${panelCls} p-4`}>
        <label className={labelCls}>Key points <span className="normal-case font-normal">(one per line)</span></label>
        <textarea className={`${textareaCls} min-h-[160px]`} value={n.keyPoints.join('\n')} dir="auto"
          onChange={e => edit(c => ({ ...c, keyPoints: e.target.value.split('\n') }))} />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Rows label="Important terms" items={n.terms} max={12} empty={EMPTY.term} onChange={terms => edit(c => ({ ...c, terms }))}
          fields={[{ key: 'term', placeholder: 'Term' }, { key: 'meaning', placeholder: 'Meaning', wide: true }]} />
        <Rows label="Formulas" items={n.formulas} max={8} empty={EMPTY.formula} onChange={formulas => edit(c => ({ ...c, formulas }))}
          fields={[{ key: 'name', placeholder: 'Name' }, { key: 'formula', placeholder: 'Formula', wide: true }, { key: 'note', placeholder: 'Note' }]} />
        <Rows label="Remember this (memory tricks)" items={n.mnemonics} max={4} empty={EMPTY.mnemonic} onChange={mnemonics => edit(c => ({ ...c, mnemonics }))}
          fields={[{ key: 'title', placeholder: 'For…' }, { key: 'text', placeholder: 'Trick', wide: true }]} />
        <Rows label="Common mistakes" items={n.mistakes} max={6} empty={EMPTY.mistake} onChange={mistakes => edit(c => ({ ...c, mistakes }))}
          fields={[{ key: 'wrong', placeholder: 'Mistake', wide: true }, { key: 'right', placeholder: 'Correct idea', wide: true }]} />
      </div>
      <Rows label="Quick self-check" items={n.selfCheck} max={5} empty={EMPTY.question} onChange={selfCheck => edit(c => ({ ...c, selfCheck }))}
        fields={[{ key: 'q', placeholder: 'Question', wide: true }, { key: 'a', placeholder: 'Answer', wide: true }]} />

      <div className={`${panelCls} p-4 space-y-3`}>
        <p className={labelCls}>Mind map</p>
        <div className="flex gap-2">
          <input className={`${inputCls} !w-16 text-center text-lg`} value={n.mindMap.emoji} maxLength={8} aria-label="Topic emoji"
            onChange={e => edit(c => ({ ...c, mindMap: { ...c.mindMap, emoji: e.target.value } }))} />
          <input className={inputCls} value={n.mindMap.label} placeholder="Topic" dir="auto"
            onChange={e => edit(c => ({ ...c, mindMap: { ...c.mindMap, label: e.target.value } }))} />
        </div>
        {n.mindMap.children.map((b, i) => (
          <div key={i} className="flex gap-2 items-start">
            <input className={`${inputCls} !w-14 !h-10 text-center`} value={b.emoji} maxLength={8} aria-label="Branch emoji" onChange={e => setBranch(i, { ...b, emoji: e.target.value })} />
            <input className={`${inputCls} !h-10 flex-1`} value={b.label} placeholder="Branch" dir="auto" onChange={e => setBranch(i, { ...b, label: e.target.value })} />
            <input className={`${inputCls} !h-10 flex-[2]`} value={b.children.map(l => l.label).join(', ')} placeholder="Leaves, comma separated" dir="auto"
              onChange={e => setBranch(i, { ...b, children: e.target.value.split(',').slice(0, 4).map(label => ({ label: label.trimStart() })) })} />
            <button aria-label="Remove branch" className="w-10 h-10 shrink-0 flex items-center justify-center text-muted hover:text-red-500"
              onClick={() => edit(c => ({ ...c, mindMap: { ...c.mindMap, children: c.mindMap.children.filter((_, j) => j !== i) } }))}><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        {n.mindMap.children.length < 6 && (
          <button onClick={() => edit(c => ({ ...c, mindMap: { ...c.mindMap, children: [...c.mindMap.children, EMPTY.branch()] } }))}
            className="text-sm text-saffron font-medium flex items-center gap-1"><Plus className="w-4 h-4" /> Add branch</button>
        )}
      </div>
    </div>
  );
}
