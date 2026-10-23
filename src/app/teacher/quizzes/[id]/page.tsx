'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Printer, Trash2 } from 'lucide-react';
import { emptyQuestion, type QuestionType, type QuizContent, type QuizQuestion } from '@/lib/teacher-docs';
import { useDoc } from '@/components/teacher/use-doc';
import EditorBar from '@/components/teacher/editor-bar';
import { QuizPaper } from '@/components/teacher/doc-views';
import { ErrorNote, inputCls, labelCls, panelCls, Spinner, TeacherPage, textareaCls } from '@/components/teacher/ui';

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

  return (
    <TeacherPage>
      <div className="print:hidden">
        <EditorBar back="/teacher/quizzes" title={doc.title} onTitle={setTitle} saveState={saveState}
          meta={`${quiz.questions.length} questions · ${totalMarks} marks · ${quiz.difficulty}`}
          actions={<>
            <button onClick={() => print(false)} className="btn-outline !py-2 !px-4 text-sm"><Printer className="w-4 h-4" /> Print paper</button>
            <button onClick={() => print(true)} className="btn-outline !py-2 !px-4 text-sm"><Printer className="w-4 h-4" /> Answer key</button>
          </>} />

        <div className={`${panelCls} p-5 mb-5`}>
          <label className={labelCls}>Instructions for students</label>
          <textarea className={textareaCls} value={quiz.instructions} onChange={e => setContent(c => ({ ...c, instructions: e.target.value }))} />
        </div>

        <ol className="space-y-4">
          {quiz.questions.map((q, i) => (
            <li key={i} className={`${panelCls} p-5 space-y-3`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-saffron/10 text-saffron font-heading font-bold text-sm flex items-center justify-center">{i + 1}</span>
                <select aria-label="Question type" className={`${inputCls} !w-auto !h-9`} value={q.type} onChange={e => changeType(i, e.target.value as QuestionType)}>
                  {(Object.keys(TYPE_LABEL) as QuestionType[]).map(t => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
                </select>
                <label className="flex items-center gap-1.5 text-sm text-muted">
                  Marks
                  <input type="number" min={1} max={10} className={`${inputCls} !w-16 !h-9`} value={q.marks}
                    onChange={e => patchQ(i, { marks: Math.max(1, Math.min(10, +e.target.value || 1)) })} />
                </label>
                <div className="ml-auto flex gap-1">
                  <SmallBtn label="Move up" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp className="w-4 h-4" /></SmallBtn>
                  <SmallBtn label="Move down" onClick={() => move(i, 1)} disabled={i === quiz.questions.length - 1}><ArrowDown className="w-4 h-4" /></SmallBtn>
                  <SmallBtn label="Delete question" danger disabled={quiz.questions.length <= 1}
                    onClick={() => setContent(c => ({ ...c, questions: c.questions.filter((_, j) => j !== i) }))}><Trash2 className="w-4 h-4" /></SmallBtn>
                </div>
              </div>

              <textarea aria-label="Question" className={textareaCls} value={q.question} placeholder="Question" onChange={e => patchQ(i, { question: e.target.value })} />

              {q.type !== 'short' ? (
                <fieldset className="space-y-2">
                  <legend className={labelCls}>Options — select the correct one</legend>
                  {q.options.map((o, j) => (
                    <div key={j} className="flex items-center gap-2">
                      <input type="radio" name={`correct-${i}`} checked={q.correct === j} onChange={() => patchQ(i, { correct: j })}
                        aria-label={`Mark option ${j + 1} correct`} className="w-4 h-4 accent-[#FF6B2C]" />
                      {q.type === 'truefalse' ? (
                        <span className="text-sm text-navy dark:text-dark-text">{o}</span>
                      ) : (
                        <input className={`${inputCls} !h-10 ${q.correct === j ? '!border-teal' : ''}`} value={o} placeholder={`Option ${String.fromCharCode(65 + j)}`}
                          onChange={e => patchQ(i, { options: q.options.map((x, k) => (k === j ? e.target.value : x)) })} />
                      )}
                    </div>
                  ))}
                </fieldset>
              ) : (
                <div>
                  <label className={labelCls}>Model answer</label>
                  <textarea className={textareaCls} value={q.answer} onChange={e => patchQ(i, { answer: e.target.value })} />
                </div>
              )}

              <div>
                <label className={labelCls}>Explanation</label>
                <input className={inputCls} value={q.explanation} onChange={e => patchQ(i, { explanation: e.target.value })} />
              </div>
            </li>
          ))}
        </ol>

        <div className="flex flex-wrap gap-2 mt-4">
          {(Object.keys(TYPE_LABEL) as QuestionType[]).map(t => (
            <button key={t} onClick={() => setContent(c => ({ ...c, questions: [...c.questions, emptyQuestion(t)] }))}
              className="btn-outline !py-2 !px-4 text-sm"><Plus className="w-4 h-4" /> {TYPE_LABEL[t]}</button>
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
