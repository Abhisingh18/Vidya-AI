'use client';

import { useState } from 'react';
import { ArrowRight, BookMarked, Check, Copy, FileText, Languages, ListChecks, Loader2, MessageCircleHeart, Save, Sparkles, Wrench, type LucideIcon } from 'lucide-react';
import { TOOLS, type ToolDef, type ToolId, type ToolOutput } from '@/lib/toolkit';
import { GRADES, LANGUAGES } from '@/lib/teacher-docs';
import type { SourceFile } from '@/lib/source';
import { api, bareFieldCls, ComposerBox, ErrorNote, inputCls, labelCls, textareaCls } from '@/components/teacher/ui';
import PageHero from '@/components/ui/page-hero';
import SourceUpload from '@/components/teacher/source-upload';

const TOOL_ICON: Record<ToolId, LucideIcon> = { rubric: ListChecks, ncert: BookMarked, translate: Languages, parent: MessageCircleHeart };
const STEPS = ['Reading your input', 'Drafting', 'Polishing the wording'];

function outputText(o: ToolOutput) {
  return [o.title, ...o.sections.map(s => [s.heading, s.text, ...s.items.map(i => `• ${i}`)].filter(Boolean).join('\n'))].join('\n\n');
}

export default function ToolkitPage() {
  const [tool, setTool] = useState<ToolDef>(TOOLS[0]);
  const [input, setInput] = useState<Record<string, string>>({});
  // Uploads are kept per tool: a handout uploaded to translate never leaks into a parent message.
  const [uploads, setUploads] = useState<Partial<Record<ToolId, SourceFile[]>>>({});
  const sources = uploads[tool.id] ?? [];
  const setSources = (files: SourceFile[]) => setUploads(u => ({ ...u, [tool.id]: files }));
  // The text the upload is trimmed around when it is very long (translate/parent keep the start).
  const focus = tool.id === 'ncert' ? input.topic ?? '' : tool.id === 'rubric' ? input.assignment ?? '' : undefined;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<ToolOutput | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const pick = (t: ToolDef) => { setTool(t); setOutput(null); setError(null); setSaved(false); };
  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null); setSaved(false);
    try {
      const r = await api<{ output: ToolOutput }>('/api/teacher/toolkit', { method: 'POST', json: { tool: tool.id, input, sources } });
      setOutput(r.output);
    } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  };
  const save = async () => {
    if (!output) return;
    setBusy(true);
    try {
      await api('/api/teacher/toolkit', { method: 'POST', json: { tool: tool.id, input, sources, output, save: true } });
      setSaved(true);
    } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  };
  const copy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(outputText(output));
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  return (
    <main className="min-h-screen bg-off-white px-3 pb-3 pt-20 sm:px-5 lg:pt-5 dark:bg-dark-bg">
      <div className="mx-auto min-h-[calc(100vh-1.5rem)] max-w-6xl overflow-hidden rounded-3xl border border-card-border bg-white shadow-card lg:min-h-[calc(100vh-2.5rem)] dark:border-dark-border dark:bg-dark-surface dark:shadow-card-dark">
        {/* hero: slow aurora over a fine grid, the four tools as cards that lift into the page */}
        <PageHero icon={<Wrench />} eyebrow="For teachers" title="Teacher Toolkit" glyphs={['A+', 'अ', '✉️', 'NCERT', '📚', '✓', 'அ', 'বা']} className="!pb-24"
          subtitle="Rubrics, NCERT mapping, translations and parent messages in seconds, ready to use in class." />

        <div className="relative -mt-14 px-4 sm:px-8">
          <div className="ph-stagger grid gap-3 sm:grid-cols-2 xl:grid-cols-4" role="tablist">
            {TOOLS.map((t, i) => {
              const Icon = TOOL_ICON[t.id];
              const on = tool.id === t.id;
              return (
                <button key={t.id} role="tab" aria-selected={on} onClick={() => pick(t)}
                  className={`ph-shine group relative overflow-hidden rounded-2xl border p-4 text-left shadow-card backdrop-blur transition-all duration-300 hover:-translate-y-1 ${on
                    ? 'border-saffron bg-white ring-4 ring-saffron/15 dark:bg-dark-surface'
                    : 'border-card-border bg-white/95 hover:border-saffron/50 dark:border-dark-border dark:bg-dark-surface/95'}`}>
                  <span aria-hidden className={`absolute -right-3 -top-5 font-heading text-7xl font-extrabold transition-colors ${on ? 'text-saffron/15' : 'text-navy/[0.05] dark:text-white/[0.06]'}`}>{i + 1}</span>
                  <span className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 ${on ? 'bg-gradient-to-br from-saffron to-orange-600 text-white shadow-saffron' : 'bg-saffron/10 text-saffron group-hover:scale-110'}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="relative mt-3 font-heading text-[15px] font-bold text-navy dark:text-dark-text">{t.title}</p>
                  <p className="relative mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{t.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid items-start gap-6 px-4 pb-8 pt-8 sm:px-8 lg:grid-cols-[400px_1fr]">
          {/* input */}
          <form onSubmit={run} className="space-y-5 lg:sticky lg:top-5">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-saffron text-xs font-bold text-white">1</span>
              <h2 className="font-heading text-lg font-bold text-navy dark:text-dark-text">{tool.title}</h2>
            </div>
            {tool.fields.map((f, i) => (
              <div key={`${tool.id}-${f.name}`} className="space-y-5">
                <div>
                  <label className={labelCls}>
                    {f.label}
                    {f.required && sources.length > 0 && <span className="normal-case font-normal tracking-normal"> (optional with an upload)</span>}
                  </label>
                  {i === 0 && (f.kind === 'textarea' || f.kind === 'text') ? (
                    <ComposerBox footer={<SourceUpload key={tool.id} compact files={sources} onChange={setSources} topic={focus} disabled={busy} />}>
                      {f.kind === 'textarea' ? (
                        <textarea className={`${bareFieldCls} ${sources.length ? 'min-h-[72px]' : 'min-h-[110px]'}`} required={f.required && !sources.length} placeholder={f.placeholder}
                          value={input[f.name] ?? ''} onChange={e => setInput(v => ({ ...v, [f.name]: e.target.value }))} />
                      ) : (
                        <input className={`${bareFieldCls} h-11`} required={f.required && !sources.length} placeholder={f.placeholder}
                          value={input[f.name] ?? ''} onChange={e => setInput(v => ({ ...v, [f.name]: e.target.value }))} />
                      )}
                    </ComposerBox>
                  ) : f.kind === 'textarea' ? (
                    <textarea className={`${textareaCls} ${sources.length ? 'min-h-[88px]' : 'min-h-[120px]'}`} required={f.required && !sources.length} placeholder={f.placeholder}
                      value={input[f.name] ?? ''} onChange={e => setInput(v => ({ ...v, [f.name]: e.target.value }))} />
                  ) : f.kind === 'text' ? (
                    <input className={inputCls} required={f.required && !sources.length} placeholder={f.placeholder}
                      value={input[f.name] ?? ''} onChange={e => setInput(v => ({ ...v, [f.name]: e.target.value }))} />
                  ) : (
                    <select className={inputCls} value={input[f.name] ?? ''} onChange={e => setInput(v => ({ ...v, [f.name]: e.target.value }))}>
                      {f.kind === 'grade' && <><option value="">Any class</option>{GRADES.map(g => <option key={g} value={g}>{g === 'College' ? 'College' : `Class ${g}`}</option>)}</>}
                      {f.kind === 'language' && LANGUAGES.map(l => <option key={l} value={l === 'English' ? '' : l}>{l}</option>)}
                      {f.kind === 'select' && f.options?.map(o => <option key={o} value={o === f.options?.[0] ? '' : o}>{o}</option>)}
                    </select>
                  )}
                </div>
              </div>
            ))}
            {error && <ErrorNote>{error}</ErrorNote>}
            <button type="submit" disabled={busy} className="btn-saffron group w-full disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} {busy ? 'Working…' : 'Generate'}
              {!busy && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
            </button>
          </form>

          {/* result: a paper sheet */}
          <div className="min-h-[420px] rounded-2xl border border-card-border bg-off-white/60 p-3 sm:p-4 dark:border-dark-border dark:bg-dark-bg/50">
            <div className="mb-3 flex items-center gap-2 px-1">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${output ? 'bg-saffron text-white' : 'bg-saffron/15 text-saffron'}`}>2</span>
              <h2 className="font-heading text-lg font-bold text-navy dark:text-dark-text">Result</h2>
              {output && (
                <div className="ml-auto flex gap-2">
                  <button onClick={copy} className="btn-outline !py-1.5 !px-3 text-sm">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? 'Copied' : 'Copy'}</button>
                  <button onClick={save} disabled={busy || saved} className="btn-outline !py-1.5 !px-3 text-sm disabled:opacity-60"><Save className="h-4 w-4" /> {saved ? 'Saved' : 'Save'}</button>
                </div>
              )}
            </div>
            <div className="min-h-[360px] rounded-xl border border-card-border bg-white p-5 shadow-card sm:p-7 dark:border-dark-border dark:bg-dark-surface">
              {busy && !output ? (
                <div aria-live="polite">
                  <div className="mb-6 flex flex-wrap gap-2">
                    {STEPS.map((st, i) => (
                      <span key={st} className="inline-flex animate-pulse items-center gap-1.5 rounded-full bg-saffron/10 px-3 py-1 text-xs font-semibold text-saffron" style={{ animationDelay: `${i * 0.4}s` }}>
                        <span className="h-1.5 w-1.5 rounded-full bg-saffron" />{st}
                      </span>
                    ))}
                  </div>
                  <Skeleton />
                </div>
              ) : !output ? (
                <div className="relative [--tk-bg:#fff] dark:[--tk-bg:#1c1c30]">
                  <div className="select-none opacity-60 [mask-image:linear-gradient(black,transparent_92%)]"><Skeleton still /></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center [background:radial-gradient(ellipse_at_center,var(--tk-bg)_30%,transparent_70%)]">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-saffron/10 text-saffron"><FileText className="h-7 w-7" /></span>
                    <p className="mt-3 font-heading font-bold text-navy dark:text-dark-text">Your result appears here</p>
                    <p className="mt-1 text-sm text-muted">Fill in the left, press Generate, then edit freely.</p>
                  </div>
                </div>
              ) : (
                <div className="animate-fade-in">
                  <input aria-label="Title" className="mb-1 w-full bg-transparent font-heading text-2xl font-extrabold text-navy outline-none dark:text-dark-text"
                    value={output.title} onChange={e => setOutput({ ...output, title: e.target.value })} />
                  <div className="mb-5 h-1 w-14 rounded-full bg-gradient-to-r from-saffron to-orange-600" />
                  <div className="space-y-5">
                    {output.sections.map((s, i) => (
                      <section key={i}>
                        {s.heading && <h3 className="mb-1.5 font-heading text-sm font-bold uppercase tracking-wider text-saffron">{s.heading}</h3>}
                        {s.text && (
                          <textarea className={`${textareaCls} min-h-[80px] !border-transparent bg-off-white/70 dark:!bg-dark-bg/60`} value={s.text}
                            onChange={e => setOutput({ ...output, sections: output.sections.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })} />
                        )}
                        {s.items.length > 0 && (
                          <textarea className={`${textareaCls} mt-1 min-h-[100px] !border-transparent bg-off-white/70 dark:!bg-dark-bg/60`} value={s.items.join('\n')}
                            onChange={e => setOutput({ ...output, sections: output.sections.map((x, j) => (j === i ? { ...x, items: e.target.value.split('\n') } : x)) })} />
                        )}
                      </section>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

/** Grey lines shaped like a document; shimmers while the AI is working. */
function Skeleton({ still = false }: { still?: boolean }) {
  const bar = (w: string, h = 'h-3') => <div className={`${h} ${w} rounded-full bg-navy/10 dark:bg-white/10 ${still ? '' : 'animate-pulse'}`} />;
  return (
    <div className="space-y-6">
      <div className="space-y-2">{bar('w-2/3', 'h-5')}<div className="h-1 w-14 rounded-full bg-saffron/40" /></div>
      {[0, 1, 2].map(i => (
        <div key={i} className="space-y-2">
          <div className="h-2.5 w-24 rounded-full bg-saffron/25" />
          {bar('w-full')}{bar('w-11/12')}{bar(i === 1 ? 'w-1/2' : 'w-3/4')}
        </div>
      ))}
    </div>
  );
}
