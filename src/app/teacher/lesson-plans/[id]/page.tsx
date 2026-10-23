'use client';

import { ArrowDown, ArrowUp, Plus, Printer, Trash2 } from 'lucide-react';
import type { LessonContent, LessonSection } from '@/lib/teacher-docs';
import { useDoc } from '@/components/teacher/use-doc';
import EditorBar from '@/components/teacher/editor-bar';
import { LessonView } from '@/components/teacher/doc-views';
import { ErrorNote, inputCls, labelCls, panelCls, Spinner, TeacherPage, textareaCls } from '@/components/teacher/ui';

type ListKey = 'objectives' | 'prerequisites' | 'materials' | 'assessment' | 'homework';
const LISTS: { key: ListKey; label: string }[] = [
  { key: 'objectives', label: 'Learning objectives' },
  { key: 'prerequisites', label: 'Prerequisites' },
  { key: 'materials', label: 'Materials' },
  { key: 'assessment', label: 'Assessment' },
  { key: 'homework', label: 'Homework' },
];

export default function LessonEditor({ params }: { params: { id: string } }) {
  const { doc, loadError, saveState, setContent, setTitle } = useDoc<LessonContent>(params.id);

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
        <EditorBar back="/teacher/lesson-plans" title={doc.title} onTitle={setTitle} saveState={saveState}
          meta={`${meta} · ${planned}/${plan.duration} min planned`}
          actions={<button onClick={() => window.print()} className="btn-outline !py-2 !px-4 text-sm"><Printer className="w-4 h-4" /> Print / PDF</button>} />

        <div className="grid lg:grid-cols-[1fr_340px] gap-5 items-start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-semibold text-navy dark:text-dark-text">Lesson flow</h2>
              <label className="flex items-center gap-2 text-sm text-muted">
                Period
                <input type="number" min={10} max={240} className={`${inputCls} !w-20 !h-9`} value={plan.duration}
                  onChange={e => setContent(c => ({ ...c, duration: Math.max(10, Math.min(240, +e.target.value || 40)) }))} /> min
              </label>
            </div>
            {planned !== plan.duration && (
              <p className="text-xs text-amber-600 dark:text-amber-400">Stages add up to {planned} min but the period is {plan.duration} min.</p>
            )}
            {plan.sections.map((s, i) => (
              <div key={i} className={`${panelCls} p-4 space-y-3`}>
                <div className="flex items-center gap-2">
                  <input aria-label="Stage" className={`${inputCls} !h-10 font-medium`} value={s.title} onChange={e => patchS(i, { title: e.target.value })} />
                  <input aria-label="Minutes" type="number" min={1} max={180} className={`${inputCls} !w-20 !h-10`} value={s.minutes}
                    onChange={e => patchS(i, { minutes: Math.max(1, Math.min(180, +e.target.value || 1)) })} />
                  <span className="text-xs text-muted">min</span>
                  <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" className="p-2 text-muted hover:text-saffron disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
                  <button onClick={() => move(i, 1)} disabled={i === plan.sections.length - 1} aria-label="Move down" className="p-2 text-muted hover:text-saffron disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
                  <button onClick={() => setContent(c => ({ ...c, sections: c.sections.filter((_, j) => j !== i) }))} disabled={plan.sections.length <= 1}
                    aria-label="Delete stage" className="p-2 text-muted hover:text-red-500 disabled:opacity-30"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <div><label className={labelCls}>Teacher does</label><textarea className={textareaCls} value={s.teacher} onChange={e => patchS(i, { teacher: e.target.value })} /></div>
                  <div><label className={labelCls}>Students do</label><textarea className={textareaCls} value={s.students} onChange={e => patchS(i, { students: e.target.value })} /></div>
                </div>
              </div>
            ))}
            <button onClick={() => setContent(c => ({ ...c, sections: [...c.sections, { title: 'New stage', minutes: 5, teacher: '', students: '' }] }))}
              className="btn-outline !py-2 !px-4 text-sm"><Plus className="w-4 h-4" /> Add stage</button>

            <div className={`${panelCls} p-4 space-y-3`}>
              <div><label className={labelCls}>Differentiation (weaker / advanced students)</label>
                <textarea className={textareaCls} value={plan.differentiation} onChange={e => setContent(c => ({ ...c, differentiation: e.target.value }))} /></div>
              <div><label className={labelCls}>Blackboard plan</label>
                <textarea className={textareaCls} value={plan.boardWork} onChange={e => setContent(c => ({ ...c, boardWork: e.target.value }))} /></div>
            </div>
          </div>

          <div className="space-y-4">
            {LISTS.map(({ key, label }) => (
              <div key={key} className={`${panelCls} p-4`}>
                <label className={labelCls}>{label} <span className="normal-case font-normal">(one per line)</span></label>
                <textarea className={`${textareaCls} min-h-[110px]`} value={plan[key].join('\n')}
                  onChange={e => setContent(c => ({ ...c, [key]: e.target.value.split('\n') }))} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="hidden print:block">
        <LessonView title={doc.title} meta={meta} lesson={{ ...plan, ...Object.fromEntries(LISTS.map(l => [l.key, plan[l.key].filter(Boolean)])) }} />
      </div>
    </TeacherPage>
  );
}
