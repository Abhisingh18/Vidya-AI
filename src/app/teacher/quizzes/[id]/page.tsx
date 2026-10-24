'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowLeft, ArrowUp, Check, ClipboardList, CloudOff, Loader2, Plus, Printer, Trash2 } from 'lucide-react';
import PageHero from '@/components/ui/page-hero';
import { emptyQuestion, type QuestionType, type QuizContent, type QuizQuestion } from '@/lib/teacher-docs';
import { useDoc } from '@/components/teacher/use-doc';
import { QuizPaper } from '@/components/teacher/doc-views';
import { ErrorNote, inputCls, labelCls, panelCls, Spinner, TeacherPage, textareaCls } from '@/components/teacher/ui';

const TYPE_ICON: Record<QuestionType, string> = { mcq: '🔘', truefalse: '⚖️', short: '✍️' };
const TYPE_LABEL: Record<QuestionType, string> = { mcq: 'Multiple choice', truefalse: 'True / False', short: 'Short answer' };

export default function QuizEditor({ params }: { params: { id: string } }) {
  const { doc, loadError, saveState, setContent, setTitle } = useDoc<QuizContent>(params.id);
  const [printKey, setPrintKey] = useState(false);

  if (loadError) return <TeacherPage><ErrorNote>{loadError}</ErrorNote></TeacherPage>;
  if (!doc) return <TeacherPage><Spinner label="Loading quiz…" /></TeacherPage>;
  const quiz = doc.content;
  const totalMarks = quiz.questions.reduce((t, q) => t + q.marks, 0);

  const patchQ = (i: number, p: Partial<QuizQuestion>) =>
    setContent(c => ({ ...c, questions: c.questions.map((q, j) => (j === i ? { ...q, ...p } : q)) }));
  const changeType = (i: number, type: QuestionType) => {
    const fresh = emptyQuestion(type);
    const q = quiz.questions[i];
    patchQ(i, { type, options: type === 'mcq' && q.options.length >= 2 && q.type === 'mcq' ? q.options : fresh.options, correct: fresh.correct });
  };
  const move = (i: number, dir: -1 | 1) => setContent(c => {
    const j = i + dir;
    if (j < 0 || j >= c.questions.length) return c;
    const next = [...c.questions];
    [next[i], next[j]] = [next[j], next[i]];
    return { ...c, questions: next };
  });
  const print = (withKey: boolean) => {
    setPrintKey(withKey);
    setTimeout(() => window.print(), 50);
  };

  const mix = (Object.keys(TYPE_LABEL) as QuestionType[]).map(t => ({ t, n: quiz.questions.filter(q => q.type === t).length }));
  return (
    <TeacherPage>
      <div className="print:hidden">
        <div className="mb-6 overflow-hidden rounded-3xl shadow-card">
          <PageHero icon={<ClipboardList />} glyphs={['?', 'A', 'B', 'C', '✓', '½', '10/10', '∑']} title={doc.title}
            eyebrow={<Link href="/teacher/quizzes" className="inline-flex items-center gap-1.5 hover:text-white"><ArrowLeft className="h-3.5 w-3.5" /> Quizzes</Link>}
            titleNode={<input value={doc.title} onChange={e => setTitle(e.target.value)} aria-label="Title" maxLength={200}
              className="w-full truncate border-b-2 border-transparent bg-transparent font-heading text-2xl font-extrabold tracking-tight text-white outline-none focus:border-saffron/60 sm:text-3xl" />}
            stats={[{ label: 'questions', value: quiz.questions.length }, { label: 'marks', value: totalMarks }]}
            action={<div className="flex flex-wrap gap-2">
              <button onClick={() => print(false)} className="btn-saffron !py-2 !px-4 text-sm"><Printer className="h-4 w-4" /> Print paper</button>
              <button onClick={() => print(true)} className="inline-flex items-center gap-2 rounded-full border border-white/25 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"><Printer className="h-4 w-4" /> Answer key</button>
            </div>}>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-white/70">
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold capitalize">{quiz.difficulty}</span>
              {mix.filter(m => m.n).map(m => <span key={m.t} className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs">{TYPE_ICON[m.t]} {m.n} {TYPE_LABEL[m.t].toLowerCase()}</span>)}
              <span className="ml-auto inline-flex items-center gap-1 text-xs">
                {saveState === 'saving' && <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</>}
                {saveState === 'saved' && <><Check className="h-3.5 w-3.5 text-emerald-400" /> Saved</>}
                {saveState === 'unsaved' && <>Unsaved changes</>}
                {saveState === 'error' && <span className="inline-flex items-center gap-1 text-red-300"><CloudOff className="h-3.5 w-3.5" /> Couldn&apos;t save</span>}
              </span>
            </p>
          </PageHero>
        </div>

        <div className={`${panelCls} mb-5 p-5`}>
          <label className={labelCls}>📣 Instructions for students</label>
          <textarea className={textareaCls} value={quiz.instructions} onChange={e => setContent(c => ({ ...c, instructions: e.target.value }))} />
        </div>

        <ol className="ph-stagger space-y-4">
          {quiz.questions.map((q, i) => (
            <li key={i} className={`${panelCls} ph-shine relative space-y-4 p-5 pl-6 transition-shadow focus-within:shadow-card-hover`}>
              <span aria-hidden className="absolute inset-y-4 left-0 w-1 rounded-r-full bg-gradient-to-b from-saffron to-rose-400" />
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-saffron to-orange-600 font-heading text-sm font-bold text-white shadow-saffron">{i + 1}</span>
                <select aria-label="Question type" className={`${inputCls} !w-auto !h-9`} value={q.type} onChange={e => changeType(i, e.target.value as QuestionType)}>
                  {(Object.keys(TYPE_LABEL) as QuestionType[]).map(t => <option key={t} value={t}>{TYPE_ICON[t]} {TYPE_LABEL[t]}</option>)}
                </select>
                <label className="flex items-center gap-1.5 rounded-full bg-saffron/10 px-3 py-1 text-xs font-semibold text-saffron">
                  Marks
                  <input type="number" min={1} max={10} className="w-8 bg-transparent text-center outline-none" value={q.marks}
                    onChange={e => patchQ(i, { marks: Math.max(1, Math.min(10, +e.target.value || 1)) })} />
                </label>
                <div className="ml-auto flex gap-1">
                  <SmallBtn label="Move up" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp className="w-4 h-4" /></SmallBtn>
                  <SmallBtn label="Move down" onClick={() => move(i, 1)} disabled={i === quiz.questions.length - 1}><ArrowDown className="w-4 h-4" /></SmallBtn>
                  <SmallBtn label="Delete question" danger disabled={quiz.questions.length <= 1}
                    onClick={() => setContent(c => ({ ...c, questions: c.questions.filter((_, j) => j !== i) }))}><Trash2 className="w-4 h-4" /></SmallBtn>
                </div>
              </div>

              <textarea aria-label="Question" className={`${textareaCls} font-medium`} value={q.question} placeholder="Question" onChange={e => patchQ(i, { question: e.target.value })} />

              {q.type !== 'short' ? (
                <fieldset className="grid gap-2 sm:grid-cols-2">
                  <legend className={`${labelCls} sm:col-span-2`}>Options — tap a letter to mark the correct one</legend>
                  {q.options.map((o, j) => {
                    const right = q.correct === j;
                    return (
                      <div key={j} className={`flex items-center gap-2.5 rounded-xl border-2 p-1.5 transition-all ${right ? 'border-teal bg-teal/5' : 'border-card-border dark:border-dark-border'}`}>
                        <button type="button" role="radio" aria-checked={right} aria-label={`Mark option ${j + 1} correct`} onClick={() => patchQ(i, { correct: j })}
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-heading text-sm font-bold transition-all ${right ? 'scale-105 bg-teal text-white' : 'bg-off-white text-muted hover:bg-saffron/10 hover:text-saffron dark:bg-dark-bg'}`}>
                          {right ? <Check className="h-4 w-4" /> : String.fromCharCode(65 + j)}
                        </button>
                        {q.type === 'truefalse' ? (
                          <span className="text-sm font-medium text-navy dark:text-dark-text">{o}</span>
                        ) : (
                          <input className="h-9 min-w-0 flex-1 bg-transparent text-sm text-navy outline-none placeholder:text-muted dark:text-dark-text" value={o} placeholder={`Option ${String.fromCharCode(65 + j)}`}
                            onChange={e => patchQ(i, { options: q.options.map((x, k) => (k === j ? e.target.value : x)) })} />
                        )}
                      </div>
                    );
                  })}
                </fieldset>
              ) : (
                <div>
                  <label className={labelCls}>Model answer</label>
                  <textarea className={textareaCls} value={q.answer} onChange={e => patchQ(i, { answer: e.target.value })} />
                </div>
              )}

              <div>
                <label className={labelCls}>💡 Explanation</label>
                <input className={inputCls} value={q.explanation} onChange={e => patchQ(i, { explanation: e.target.value })} />
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl border-2 border-dashed border-card-border p-3 dark:border-dark-border">
          <span className="px-1 text-sm font-semibold text-muted">Add a question</span>
          {(Object.keys(TYPE_LABEL) as QuestionType[]).map(t => (
            <button key={t} onClick={() => setContent(c => ({ ...c, questions: [...c.questions, emptyQuestion(t)] }))}
              className="btn-outline !px-4 !py-2 text-sm"><Plus className="h-4 w-4" /> {TYPE_ICON[t]} {TYPE_LABEL[t]}</button>
          ))}
        </div>
      </div>

      <div className="hidden print:block"><QuizPaper title={doc.title} quiz={quiz} withAnswers={printKey} /></div>
    </TeacherPage>
  );
}

function SmallBtn({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled} aria-label={label} title={label}
      className={`w-9 h-9 rounded-lg flex items-center justify-center border border-card-border dark:border-dark-border text-navy dark:text-dark-text disabled:opacity-30 ${danger ? 'hover:text-red-500 hover:border-red-300' : 'hover:text-saffron hover:border-saffron'}`}>
      {children}
    </button>
  );
}
