'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowUp, Check, ChevronDown, CloudOff, GraduationCap, Loader2, NotebookPen, Plus, Printer, Target, Trash2, Users } from 'lucide-react';
import PageHero from '@/components/ui/page-hero';
import type { LessonContent, LessonSection } from '@/lib/teacher-docs';
import { useDoc } from '@/components/teacher/use-doc';
import { LessonView } from '@/components/teacher/doc-views';
import { ErrorNote, inputCls, labelCls, panelCls, Spinner, TeacherPage, textareaCls } from '@/components/teacher/ui';
import FeedbackBar from '@/components/feedback-bar';

type ListKey = 'objectives' | 'prerequisites' | 'materials' | 'assessment' | 'homework';
const LISTS: { key: ListKey; label: string; emoji: string }[] = [
  { key: 'objectives', label: 'Learning objectives', emoji: '🎯' },
  { key: 'prerequisites', label: 'Prerequisites', emoji: '🔑' },
  { key: 'materials', label: 'Materials', emoji: '🧰' },
  { key: 'assessment', label: 'Assessment', emoji: '✅' },
  { key: 'homework', label: 'Homework', emoji: '📝' },
];
const SEG = ['bg-saffron', 'bg-orange-400', 'bg-rose-400', 'bg-amber-400', 'bg-orange-600', 'bg-rose-500'];

export default function LessonEditor({ params }: { params: { id: string } }) {
  const { doc, loadError, saveState, setContent, setTitle } = useDoc<LessonContent>(params.id);
  const [open, setOpen] = useState(0);

  if (loadError) return <TeacherPage><ErrorNote>{loadError}</ErrorNote></TeacherPage>;
  if (!doc) return <TeacherPage><Spinner label="Loading lesson plan…" /></TeacherPage>;
  const plan = doc.content;
  const planned = plan.sections.reduce((t, s) => t + s.minutes, 0);
  const meta = `${doc.grade === 'College' ? 'College' : `Class ${doc.grade}`} · ${doc.language}`;

  const patchS = (i: number, p: Partial<LessonSection>) =>
    setContent(c => ({ ...c, sections: c.sections.map((s, j) => (j === i ? { ...s, ...p } : s)) }));
  const move = (i: number, dir: -1 | 1) => setContent(c => {
    const j = i + dir;
    if (j < 0 || j >= c.sections.length) return c;
    const next = [...c.sections];
    [next[i], next[j]] = [next[j], next[i]];
    return { ...c, sections: next };
  });

  return (
    <TeacherPage>
      <div className="print:hidden">
        <div className="mb-6 overflow-hidden rounded-3xl shadow-card">
          <PageHero icon={<NotebookPen />} glyphs={['🎯', '⏱', '✏️', '📖', '🧠', '✓', '👩‍🏫', '∑']} title={doc.title}
            eyebrow={<Link href="/teacher/lesson-plans" className="inline-flex items-center gap-1.5 hover:text-white"><ArrowLeft className="h-3.5 w-3.5" /> Lesson plans</Link>}
            titleNode={<input value={doc.title} onChange={e => setTitle(e.target.value)} aria-label="Title" maxLength={200}
              className="w-full truncate border-b-2 border-transparent bg-transparent font-heading text-2xl font-extrabold tracking-tight text-white outline-none focus:border-saffron/60 sm:text-3xl" />}
            subtitle={undefined}
            action={<button onClick={() => window.print()} className="btn-saffron !py-2 !px-4 text-sm"><Printer className="h-4 w-4" /> Print / PDF</button>}>
            <p className="mb-4 flex flex-wrap items-center gap-x-2 text-sm text-white/70">
              {meta} ·
              {saveState === 'saving' && <span className="inline-flex items-center gap-1"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</span>}
              {saveState === 'saved' && <span className="inline-flex items-center gap-1"><Check className="h-3.5 w-3.5 text-emerald-400" /> Saved</span>}
              {saveState === 'unsaved' && <span>Unsaved changes</span>}
              {saveState === 'error' && <span className="inline-flex items-center gap-1 text-red-300"><CloudOff className="h-3.5 w-3.5" /> Couldn&apos;t save</span>}
            </p>
            {/* the period at a glance: one bar, each stage as wide as its minutes */}
            <div className="flex h-3.5 gap-0.5 overflow-hidden rounded-full bg-white/10" aria-label="Lesson timeline">
              {plan.sections.map((s, i) => (
                <button key={i} type="button" title={`${s.title} · ${s.minutes} min`} onClick={() => setOpen(i)}
                  className={`${SEG[i % SEG.length]} min-w-[6px] origin-left transition-all duration-300 hover:brightness-125 ${open === i ? 'ring-2 ring-white/80' : ''}`} style={{ flexGrow: s.minutes }} />
              ))}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/60">
              {plan.sections.map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${SEG[i % SEG.length]}`} />{s.title} · {s.minutes}m</span>
              ))}
              <span className={`ml-auto font-semibold ${planned === plan.duration ? 'text-emerald-300' : 'text-amber-300'}`}>{planned} / {plan.duration} min</span>
            </div>
          </PageHero>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-lg font-bold text-navy dark:text-dark-text">Lesson flow</h2>
              <label className="flex items-center gap-2 text-sm text-muted">
                Period
                <input type="number" min={10} max={240} className={`${inputCls} !w-20 !h-9`} value={plan.duration}
                  onChange={e => setContent(c => ({ ...c, duration: Math.max(10, Math.min(240, +e.target.value || 40)) }))} /> min
              </label>
            </div>
            {planned !== plan.duration && (
              <p className="mb-3 text-xs text-amber-600 dark:text-amber-400">Stages add up to {planned} min but the period is {plan.duration} min.</p>
            )}
            {/* a vertical timeline: each stage a node on the line, one open at a time */}
            <ol className="ph-stagger relative space-y-3 before:absolute before:bottom-4 before:left-[17px] before:top-4 before:w-0.5 before:bg-gradient-to-b before:from-saffron before:to-rose-400/40">
              {plan.sections.map((s, i) => {
                const on = open === i;
                return (
                  <li key={i} className="relative pl-12">
                    <span className={`absolute left-0 top-3 flex h-9 w-9 items-center justify-center rounded-full font-heading text-sm font-bold text-white shadow-saffron ${SEG[i % SEG.length]} ${on ? 'ph-pulse' : ''}`}>{i + 1}</span>
                    <div className={`${panelCls} ph-shine overflow-hidden transition-all duration-300 ${on ? '!border-saffron/60 shadow-card-hover' : 'hover:border-saffron/40'}`}>
                      <div className="flex items-center gap-2 p-3">
                        <input aria-label="Stage" className="h-10 min-w-0 flex-1 rounded-lg bg-transparent px-2 font-heading font-semibold text-navy outline-none focus:bg-off-white dark:text-dark-text dark:focus:bg-dark-bg" value={s.title}
                          onChange={e => patchS(i, { title: e.target.value })} onFocus={() => setOpen(i)} />
                        <span className="flex items-center gap-1 rounded-full bg-saffron/10 px-2.5 py-1 text-xs font-semibold text-saffron">
                          <input aria-label="Minutes" type="number" min={1} max={180} className="w-9 bg-transparent text-right outline-none" value={s.minutes}
                            onChange={e => patchS(i, { minutes: Math.max(1, Math.min(180, +e.target.value || 1)) })} /> min
                        </span>
                        <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" className="p-1.5 text-muted hover:text-saffron disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                        <button onClick={() => move(i, 1)} disabled={i === plan.sections.length - 1} aria-label="Move down" className="p-1.5 text-muted hover:text-saffron disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                        <button onClick={() => setContent(c => ({ ...c, sections: c.sections.filter((_, j) => j !== i) }))} disabled={plan.sections.length <= 1}
                          aria-label="Delete stage" className="p-1.5 text-muted hover:text-red-500 disabled:opacity-30"><Trash2 className="h-4 w-4" /></button>
                        <button onClick={() => setOpen(on ? -1 : i)} aria-label={on ? 'Collapse' : 'Expand'} aria-expanded={on} className="p-1.5 text-muted hover:text-saffron">
                          <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${on ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                      <div className={`grid transition-all duration-300 ${on ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                        <div className="overflow-hidden">
                          <div className="grid gap-3 border-t border-card-border p-3 md:grid-cols-2 dark:border-dark-border">
                            <div>
                              <label className={`${labelCls} flex items-center gap-1.5`}><GraduationCap className="h-3.5 w-3.5 text-saffron" /> Teacher does</label>
                              <textarea className={textareaCls} value={s.teacher} onChange={e => patchS(i, { teacher: e.target.value })} />
                            </div>
                            <div>
                              <label className={`${labelCls} flex items-center gap-1.5`}><Users className="h-3.5 w-3.5 text-saffron" /> Students do</label>
                              <textarea className={textareaCls} value={s.students} onChange={e => patchS(i, { students: e.target.value })} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
            <button onClick={() => { setContent(c => ({ ...c, sections: [...c.sections, { title: 'New stage', minutes: 5, teacher: '', students: '' }] })); setOpen(plan.sections.length); }}
              className="btn-outline mt-4 !px-4 !py-2 text-sm"><Plus className="h-4 w-4" /> Add stage</button>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className={`${panelCls} p-4`}>
                <label className={`${labelCls} flex items-center gap-1.5`}><Target className="h-3.5 w-3.5 text-saffron" /> Differentiation <span className="normal-case font-normal">(weaker / advanced)</span></label>
                <textarea className={`${textareaCls} min-h-[130px]`} value={plan.differentiation} onChange={e => setContent(c => ({ ...c, differentiation: e.target.value }))} />
              </div>
              <div className={`${panelCls} p-4`}>
                <label className={`${labelCls} flex items-center gap-1.5`}><NotebookPen className="h-3.5 w-3.5 text-saffron" /> Blackboard plan</label>
                <textarea className={`${textareaCls} min-h-[130px]`} value={plan.boardWork} onChange={e => setContent(c => ({ ...c, boardWork: e.target.value }))} />
              </div>
            </div>
          </div>

          <div className="ph-stagger space-y-4 lg:sticky lg:top-5">
            {LISTS.map(({ key, label, emoji }) => (
              <div key={key} className={`${panelCls} ph-shine p-4`}>
                <label className={`${labelCls} flex items-center gap-2`}><span className="text-base leading-none">{emoji}</span>{label} <span className="normal-case font-normal">(one per line)</span></label>
                <textarea className={`${textareaCls} min-h-[100px]`} value={plan[key].join('\n')}
                  onChange={e => setContent(c => ({ ...c, [key]: e.target.value.split('\n') }))} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <FeedbackBar feature="lesson" refId={doc.id} label="Is this lesson plan useful?" className="mt-8" />
      <div className="hidden print:block">
        <LessonView title={doc.title} meta={meta} lesson={{ ...plan, ...Object.fromEntries(LISTS.map(l => [l.key, plan[l.key].filter(Boolean)])) }} />
      </div>
    </TeacherPage>
  );
}
