'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Loader2, PlayCircle, XCircle } from 'lucide-react';
import type { LessonContent, QuizContent, SlidesContent } from '@/lib/teacher-docs';
import SlideView from './slide-view';
import { LessonView, QuizPaper } from './doc-views';
import { api, ErrorNote, panelCls, Spinner, TeacherPage } from './ui';

interface Base { id: string; kind: string; title: string; dueAt: string | null; videoId: string | null; classId: string; className: string; grade?: string; language?: string }
interface StudentQuiz { instructions: string; questions: { type: string; question: string; options: string[]; marks: number }[] }
interface Result {
  score: number; total: number;
  review: { question: string; options: string[]; chosen: number; correct: number; explanation: string; right: boolean }[];
}
type Payload =
  | { isTeacher: true; assignment: Base & { content: unknown }; results: { name: string | null; score: number; total: number; at: string }[] }
  | { isTeacher: false; assignment: Base & { content?: unknown; quiz?: StudentQuiz }; result?: Result };

export default function AssignmentView({ id }: { id: string }) {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { api<Payload>(`/api/assignments/${id}`).then(setData).catch(e => setError(e.message)); }, [id]);

  if (error) return <TeacherPage><ErrorNote>{error}</ErrorNote></TeacherPage>;
  if (!data) return <TeacherPage><Spinner /></TeacherPage>;
  const a = data.assignment;
  const back = data.isTeacher ? `/teacher/classes/${a.classId}` : `/classes/${a.classId}`;
  const meta = [a.grade && (a.grade === 'College' ? 'College' : `Class ${a.grade}`), a.language].filter(Boolean).join(' · ');

  return (
    <TeacherPage>
      <div className="flex items-center gap-3 mb-6">
        <Link href={back} aria-label="Back" className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center border border-card-border dark:border-dark-border hover:border-saffron hover:text-saffron"><ArrowLeft className="w-4 h-4" /></Link>
        <div className="min-w-0">
          <h1 className="text-2xl font-heading font-bold text-navy dark:text-dark-text truncate">{a.title}</h1>
          <p className="text-sm text-muted">
            {a.className}{a.dueAt && ` · due ${new Date(a.dueAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
          </p>
        </div>
      </div>

      {data.isTeacher && a.kind === 'quiz' && (
        <section className={`${panelCls} p-5 mb-6`}>
          <h2 className="font-heading font-semibold text-navy dark:text-dark-text mb-3">Results ({data.results.length})</h2>
          {data.results.length ? (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs uppercase tracking-wider text-muted"><th className="py-1">Student</th><th className="py-1">Score</th><th className="py-1 text-right">Submitted</th></tr></thead>
              <tbody>
                {data.results.map((r, i) => (
                  <tr key={i} className="border-t border-card-border dark:border-dark-border">
                    <td className="py-2 text-navy dark:text-dark-text">{r.name ?? 'Student'}</td>
                    <td className="py-2 tabular-nums"><b>{r.score}</b>/{r.total} <span className="text-muted">({r.total ? Math.round((r.score / r.total) * 100) : 0}%)</span></td>
                    <td className="py-2 text-right text-muted">{new Date(r.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="text-sm text-muted">No submissions yet.</p>}
        </section>
      )}

      {a.kind === 'video' && a.videoId && (
        <Link href={`/library/${a.videoId}`} className="btn-saffron"><PlayCircle className="w-5 h-5" /> Watch the video</Link>
      )}
      {a.kind === 'slides' && !!a.content && <SlidesCarousel content={a.content as SlidesContent} />}
      {a.kind === 'lesson' && !!a.content && <div className={`${panelCls} p-6`}><LessonView title={a.title} meta={meta} lesson={a.content as LessonContent} /></div>}
      {a.kind === 'quiz' && data.isTeacher && !!a.content && (
        <div className={`${panelCls} p-6 [&_*]:!text-inherit text-navy dark:text-dark-text`}>
          <div className="bg-white rounded-xl p-5"><QuizPaper title={a.title} quiz={a.content as QuizContent} withAnswers /></div>
        </div>
      )}
      {a.kind === 'quiz' && !data.isTeacher && (
        data.result ? <QuizResult result={data.result} />
          : data.assignment.quiz ? <TakeQuiz id={a.id} quiz={data.assignment.quiz} onDone={r => setData({ ...data, result: r })} /> : null
      )}
    </TeacherPage>
  );
}

function SlidesCarousel({ content }: { content: SlidesContent }) {
  const [i, setI] = useState(0);
  const slide = content.slides[i];
  return (
    <div className="max-w-4xl">
      <SlideView slide={slide} theme={content.theme} index={i} total={content.slides.length} />
      <div className="flex items-center justify-center gap-3 mt-4">
        <button onClick={() => setI(x => Math.max(0, x - 1))} disabled={i === 0} aria-label="Previous slide" className="btn-outline !p-2.5 disabled:opacity-30"><ChevronLeft className="w-5 h-5" /></button>
        <span className="text-sm text-muted tabular-nums">{i + 1} / {content.slides.length}</span>
        <button onClick={() => setI(x => Math.min(content.slides.length - 1, x + 1))} disabled={i === content.slides.length - 1} aria-label="Next slide" className="btn-outline !p-2.5 disabled:opacity-30"><ChevronRight className="w-5 h-5" /></button>
      </div>
      {slide.notes && <p className={`${panelCls} p-4 mt-4 text-sm text-navy/80 dark:text-dark-text/80`}>{slide.notes}</p>}
    </div>
  );
}

function TakeQuiz({ id, quiz, onDone }: { id: string; quiz: StudentQuiz; onDone: (r: Result) => void }) {
  const [answers, setAnswers] = useState<number[]>(() => quiz.questions.map(() => -1));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unanswered = answers.filter(x => x < 0).length;

  const submit = async () => {
    if (unanswered && !confirm(`${unanswered} question(s) are unanswered. Submit anyway? You can only submit once.`)) return;
    setBusy(true); setError(null);
    try {
      const r = await api<{ result: Result }>(`/api/assignments/${id}/attempt`, { method: 'POST', json: { answers } });
      onDone(r.result);
    } catch (err) { setError((err as Error).message); setBusy(false); }
  };

  return (
    <div className="max-w-3xl space-y-4">
      {quiz.instructions && <p className="text-sm text-muted">{quiz.instructions}</p>}
      {quiz.questions.map((q, i) => (
        <fieldset key={i} className={`${panelCls} p-5`}>
          <legend className="sr-only">Question {i + 1}</legend>
          <p className="font-medium text-navy dark:text-dark-text">{i + 1}. {q.question}</p>
          <div className="mt-3 grid gap-2">
            {q.options.map((o, j) => (
              <label key={j} className={`flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 cursor-pointer text-sm transition ${answers[i] === j ? 'border-saffron bg-saffron/5 text-navy dark:text-dark-text' : 'border-card-border dark:border-dark-border text-navy/80 dark:text-dark-text/80 hover:border-saffron/40'}`}>
                <input type="radio" name={`q${i}`} checked={answers[i] === j} onChange={() => setAnswers(a => a.map((x, k) => (k === i ? j : x)))} className="accent-[#FF6B2C]" />
                {o}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      {error && <ErrorNote>{error}</ErrorNote>}
      <button onClick={submit} disabled={busy} className="btn-saffron disabled:opacity-60">
        {busy && <Loader2 className="w-4 h-4 animate-spin" />} Submit quiz
      </button>
    </div>
  );
}

function QuizResult({ result }: { result: Result }) {
  const pct = result.total ? Math.round((result.score / result.total) * 100) : 0;
  return (
    <div className="max-w-3xl space-y-4">
      <div className={`${panelCls} p-6 flex items-center gap-5`}>
        <div className="w-20 h-20 rounded-full bg-saffron/10 text-saffron flex items-center justify-center text-2xl font-heading font-bold">{pct}%</div>
        <div>
          <p className="font-heading font-semibold text-lg text-navy dark:text-dark-text">You scored {result.score} / {result.total}</p>
          <p className="text-sm text-muted">{pct >= 80 ? 'Excellent work! 🎉' : pct >= 50 ? 'Good effort — review the ones you missed.' : 'Keep practising — check the explanations below.'}</p>
        </div>
      </div>
      {result.review.map((r, i) => (
        <div key={i} className={`${panelCls} p-5`}>
          <p className="font-medium text-navy dark:text-dark-text flex gap-2">
            {r.right ? <CheckCircle2 className="w-5 h-5 text-teal shrink-0" /> : <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
            {i + 1}. {r.question}
          </p>
          <ul className="mt-2 ml-7 space-y-1 text-sm">
            {r.options.map((o, j) => (
              <li key={j} className={j === r.correct ? 'text-teal font-medium' : j === r.chosen ? 'text-red-500 line-through' : 'text-muted'}>{o}</li>
            ))}
          </ul>
          {r.explanation && <p className="mt-2 ml-7 text-sm text-navy/70 dark:text-dark-text/70">💡 {r.explanation}</p>}
        </div>
      ))}
    </div>
  );
}
