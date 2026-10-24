'use client';

import { useState } from 'react';
import { Check, Copy, Loader2, Save, Sparkles, Wrench } from 'lucide-react';
import { TOOLS, type ToolDef, type ToolId, type ToolOutput } from '@/lib/toolkit';
import { GRADES, LANGUAGES } from '@/lib/teacher-docs';
import type { SourceFile } from '@/lib/source';
import { api, ErrorNote, inputCls, labelCls, textareaCls } from '@/components/teacher/ui';
import StudyShell from '@/components/student/study-shell';
import SourceUpload from '@/components/teacher/source-upload';

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
    <StudyShell theme="plan" icon={<Wrench />} title="Teacher Toolkit" subtitle="Quick AI helpers for everyday teaching work.">
      <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex flex-wrap justify-center gap-2" role="tablist">
        {TOOLS.map(t => (
          <button key={t.id} role="tab" aria-selected={tool.id === t.id} onClick={() => pick(t)} title={t.description}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${tool.id === t.id
              ? 'border-saffron bg-saffron text-white shadow-saffron'
              : 'border-card-border text-navy hover:border-saffron/50 hover:bg-saffron/5 dark:border-dark-border dark:text-dark-text'}`}>
            {t.title}
          </button>
        ))}
      </div>
      <p className="mb-6 text-center text-sm text-muted">{tool.description}</p>

      <div className="space-y-8">
        <form onSubmit={run} className="space-y-5">
          {tool.fields.map((f, i) => (
            <div key={`${tool.id}-${f.name}`} className="space-y-4">
              <div>
                <label className={labelCls}>
                  {f.label}
                  {f.required && sources.length > 0 && <span className="normal-case font-normal tracking-normal"> (optional with an upload)</span>}
                </label>
                {f.kind === 'textarea' ? (
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
              {/* The upload sits right under the tool's main input: type it, upload it, or both. */}
              {i === 0 && (
                <SourceUpload key={tool.id} files={sources} onChange={setSources} hint={tool.sourceHint} topic={focus} disabled={busy} />
              )}
            </div>
          ))}
          {error && <ErrorNote>{error}</ErrorNote>}
          <button type="submit" disabled={busy} className="btn-saffron mx-auto flex w-full sm:w-auto sm:min-w-[16rem] disabled:opacity-60">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} {busy ? 'Working…' : 'Generate'}
          </button>
        </form>

        {output && (
        <div className="rounded-2xl border border-card-border p-5 dark:border-dark-border">
            <>
              <div className="flex items-center gap-2 mb-4">
                <input aria-label="Title" className="flex-1 bg-transparent font-heading font-bold text-lg text-navy dark:text-dark-text outline-none"
                  value={output.title} onChange={e => setOutput({ ...output, title: e.target.value })} />
                <button onClick={copy} className="btn-outline !py-2 !px-3 text-sm">{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? 'Copied' : 'Copy'}</button>
                <button onClick={save} disabled={busy || saved} className="btn-outline !py-2 !px-3 text-sm disabled:opacity-60"><Save className="w-4 h-4" /> {saved ? 'Saved' : 'Save'}</button>
              </div>
              <div className="space-y-4">
                {output.sections.map((s, i) => (
                  <section key={i}>
                    {s.heading && <h3 className="font-heading font-semibold text-navy dark:text-dark-text mb-1">{s.heading}</h3>}
                    {s.text && (
                      <textarea className={`${textareaCls} min-h-[80px]`} value={s.text}
                        onChange={e => setOutput({ ...output, sections: output.sections.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })} />
                    )}
                    {s.items.length > 0 && (
                      <textarea className={`${textareaCls} min-h-[100px] mt-1`} value={s.items.join('\n')}
                        onChange={e => setOutput({ ...output, sections: output.sections.map((x, j) => (j === i ? { ...x, items: e.target.value.split('\n') } : x)) })} />
                    )}
                  </section>
                ))}
              </div>
            </>
        </div>
        )}
      </div>
      </div>
    </StudyShell>
  );
}
