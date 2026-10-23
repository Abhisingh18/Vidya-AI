'use client';

// Taking a mock test: intro → timed attempt (answers kept in localStorage so a
// refresh doesn't lose them) → submit → results with chapter analysis and review.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle, ArrowLeft, Check, Clock, Flag, Loader2, PlayCircle, RotateCcw, Sparkles, Trophy, X,
} from 'lucide-react';
import {
  chapterStats, formatSeconds, isAnswered, MOCK_TYPE_LABEL, weakChapters,
  type AttemptSummary, type MockAnswer, type MockAttempt, type MockConfig, type MockQuestion, type PublicQuestion,
} from '@/lib/mock';
import { api, ErrorNote, panelCls, Spinner, TeacherPage, textareaCls } from '@/components/teacher/ui';

interface TestData {
  id: string; title: string; grade: string; language: string; config: MockConfig; maxScore: number;
  questions: PublicQuestion[]; attempts: AttemptSummary[];
}
interface Review { attempt: MockAttempt; questions: MockQuestion[] }
type Phase = 'intro' | 'taking' | 'result';
interface Saved { startedAt: string; answers: Record<string, MockAnswer>; flagged: string[] }

const storeKey = (id: string) => `vidya-mock:${id}`;
const loadSaved = (id: string): Saved | null => {
  try { return JSON.parse(localStorage.getItem(storeKey(id)) ?? 'null'); } catch { return null; }
};
const saveLocal = (id: string, s: Saved | null) => {
  try { if (s) localStorage.setItem(storeKey(id), JSON.stringify(s)); else localStorage.removeItem(storeKey(id)); } catch { /* private mode */ }
};
const clock = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.max(0, sec) % 60).padStart(2, '0')}`;

export default function MockRunner({ id }: { id: string }) {
  const [test, setTest] = useState<TestData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('intro');
  const [saved, setSaved] = useState<Saved | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [gradingNote, setGradingNote] = useState<string | null>(null);
  const [warned, setWarned] = useState<string | null>(null);
  const submitted = useRef(false);

  const load = useCallback(() => api<{ test: TestData }>(`/api/student/mock/${id}`).then(d => setTest(d.test)).catch(e => setError(e.message)), [id]);
  useEffect(() => {
    load();
    const s = loadSaved(id);
    if (s) { setSaved(s); setPhase('taking'); } // resume an attempt in progress
  }, [id, load]);

  const limitSec = (test?.config.minutes ?? 0) * 60;
  const remaining = saved && test ? Math.round(limitSec - (now - Date.parse(saved.startedAt)) / 1000) : limitSec;

  const openReview = useCallback(async (no: number | 'last') => {
    const d = await api<{ review: Review }>(`/api/student/mock/${id}?review=${no}`);
    setReview(d.review);
    setPhase('result');
  }, [id]);

  const submit = useCallback(async (auto: boolean) => {
    if (!saved || submitted.current) return;
    submitted.current = true;
    setSubmitting(true); setSubmitError(null);
    try {
      const r = await api<{ attempt: AttemptSummary; gradingError?: string }>(`/api/student/mock/${id}/submit`, {
        method: 'POST', json: { answers: saved.answers, startedAt: saved.startedAt, autoSubmitted: auto },
      });
      saveLocal(id, null);
      setSaved(null);
      setGradingNote(r.gradingError ? `Your MCQs are marked. Written answers are waiting for AI grading — ${r.gradingError}` : null);
      await load();
      await openReview(r.attempt.no);
    } catch (err) {
      submitted.current = false;
      setSubmitError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }, [saved, id, load, openReview]);

  // Timer tick, warnings and auto-submit at 0:00.
  useEffect(() => {
    if (phase !== 'taking' || !saved) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [phase, saved]);
  useEffect(() => {
    if (phase !== 'taking' || !saved || !test) return;
    if (remaining <= 0) void submit(true);
    else if (remaining <= 60) setWarned('1 minute left!');
    else if (remaining <= 300) setWarned('5 minutes left');
  }, [remaining, phase, saved, test, submit]);

  const start = () => {
    const s: Saved = { startedAt: new Date().toISOString(), answers: {}, flagged: [] };
    submitted.current = false;
    saveLocal(id, s); setSaved(s); setNow(Date.now()); setWarned(null); setReview(null); setGradingNote(null);
    setPhase('taking');
    window.scrollTo({ top: 0 });
  };
  const update = (fn: (s: Saved) => Saved) => setSaved(s => { if (!s) return s; const n = fn(s); saveLocal(id, n); return n; });
  const answer = (qid: string, a: MockAnswer) => update(s => ({ ...s, answers: { ...s.answers, [qid]: a } }));
  const flag = (qid: string) => update(s => ({ ...s, flagged: s.flagged.includes(qid) ? s.flagged.filter(x => x !== qid) : [...s.flagged, qid] }));

  if (error) return <TeacherPage><ErrorNote>{error}</ErrorNote></TeacherPage>;
  if (!test) return <TeacherPage><Spinner label="Loading the test…" /></TeacherPage>;

  const header = (
    <div className="flex items-center gap-3 mb-6">
      <Link href="/practice" aria-label="Back" className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center border border-card-border dark:border-dark-border hover:border-saffron hover:text-saffron"><ArrowLeft className="w-4 h-4" /></Link>
      <div className="min-w-0">
        <h1 className="text-xl lg:text-2xl font-heading font-bold text-navy dark:text-dark-text truncate" dir="auto">{test.title}</h1>
        <p className="text-xs text-muted">Class {test.grade} · {test.language} · {test.questions.length} questions · {test.config.minutes} min · {test.maxScore} marks</p>
      </div>
    </div>
  );

  // ── Intro ──
  if (phase === 'intro') {
    return (
      <TeacherPage>
        {header}
        <div className="grid lg:grid-cols-[1fr_340px] gap-5 items-start">
          <div className={`${panelCls} p-6`}>
            <h2 className="font-heading font-semibold text-lg text-navy dark:text-dark-text">Before you start</h2>
            <ul className="mt-3 space-y-2 text-sm text-navy/80 dark:text-dark-text/80">
              <li className="flex gap-2"><Clock className="w-4 h-4 text-saffron shrink-0 mt-0.5" /> You have <b>{test.config.minutes} minutes</b>. The test submits itself when time is up.</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-saffron shrink-0 mt-0.5" /> {test.questions.filter(q => q.type === 'mcq').length} MCQs are checked instantly; {test.questions.filter(q => q.type !== 'mcq').length} written answers get AI feedback.</li>
              <li className="flex gap-2"><Flag className="w-4 h-4 text-saffron shrink-0 mt-0.5" /> Flag questions to come back to. Your answers are saved on this device as you go.</li>
            </ul>
            <button onClick={start} className="btn-saffron mt-6"><PlayCircle className="w-5 h-5" /> Start test</button>
          </div>
          <div className={`${panelCls} p-5`}>
            <h3 className="font-heading font-semibold text-navy dark:text-dark-text mb-3">Your attempts</h3>
            {test.attempts.length ? (
              <ul className="space-y-2">
                {test.attempts.slice().reverse().map(a => (
                  <li key={a.no}>
                    <button onClick={() => openReview(a.no)} className="w-full flex items-center justify-between rounded-xl border border-card-border dark:border-dark-border px-3 py-2 hover:border-saffron text-sm">
                      <span>Attempt {a.no} · {new Date(a.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      <span className="font-semibold text-navy dark:text-dark-text">{a.pct}%{a.pending ? ' …' : ''}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted">No attempts yet.</p>}
          </div>
        </div>
      </TeacherPage>
    );
  }

  // ── Results ──
  if (phase === 'result' && review) {
    return <MockResult test={test} review={review} note={gradingNote} onAgain={start}
      onRegraded={async no => { await load(); await openReview(no); setGradingNote(null); }} />;
  }

  // ── Taking ──
  const answers = saved?.answers ?? {};
  const answered = test.questions.filter(q => isAnswered(answers[q.id])).length;
  const low = remaining <= 300;
  return (
    <TeacherPage>
      {header}
      <div className={`sticky top-16 lg:top-4 z-30 mb-5 ${panelCls} px-4 py-3 flex flex-wrap items-center gap-3`}>
        <span className={`flex items-center gap-1.5 font-mono text-lg font-bold ${remaining <= 60 ? 'text-red-500 animate-pulse' : low ? 'text-amber-600' : 'text-navy dark:text-dark-text'}`} aria-live="polite">
          <Clock className="w-5 h-5" /> {clock(remaining)}
        </span>
        <span className="text-sm text-muted">{answered}/{test.questions.length} answered</span>
        {warned && <span className="pill bg-amber-400/15 text-amber-700 font-semibold"><AlertTriangle className="w-3.5 h-3.5" /> {warned}</span>}
        <button onClick={() => {
          const left = test.questions.length - answered;
          if (!confirm(left ? `${left} question(s) are unanswered. Submit anyway?` : 'Submit your test?')) return;
          void submit(false);
        }} disabled={submitting} className="btn-saffron !py-2 !px-5 text-sm ml-auto disabled:opacity-60">
          {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking…</> : 'Submit test'}
        </button>
      </div>
      {submitError && <div className="mb-4"><ErrorNote>{submitError}</ErrorNote></div>}

      <div className="grid lg:grid-cols-[1fr_220px] gap-5 items-start">
        <ol className="space-y-4">
          {test.questions.map((q, i) => {
            const a = answers[q.id];
            const flagged = saved?.flagged.includes(q.id);
            return (
              <li key={q.id} id={`q-${q.id}`} className={`${panelCls} p-5 scroll-mt-36 ${flagged ? 'ring-2 ring-amber-400' : ''}`}>
                <div className="flex items-start gap-3">
                  <span className="w-8 h-8 shrink-0 rounded-lg bg-saffron/10 text-saffron font-heading font-bold text-sm flex items-center justify-center">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted">{MOCK_TYPE_LABEL[q.type]} · {q.marks} mark{q.marks === 1 ? '' : 's'} · {q.chapter}</p>
                    <p className="font-medium text-navy dark:text-dark-text mt-1 whitespace-pre-line" dir="auto">{q.text}</p>
                  </div>
                  <button onClick={() => flag(q.id)} aria-pressed={flagged} aria-label="Flag for review" title="Flag for review"
                    className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center ${flagged ? 'bg-amber-400/20 text-amber-600' : 'text-muted hover:text-amber-600'}`}>
                    <Flag className="w-4 h-4" />
                  </button>
                </div>
                {q.type === 'mcq' ? (
                  <div className="mt-3 grid gap-2 sm:ml-11">
                    {q.options.map((o, j) => (
                      <label key={j} className={`flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 cursor-pointer text-sm transition ${a === j ? 'border-saffron bg-saffron/5' : 'border-card-border dark:border-dark-border hover:border-saffron/40'}`} dir="auto">
                        <input type="radio" name={q.id} checked={a === j} onChange={() => answer(q.id, j)} className="accent-[#FF6B2C]" />
                        <span className="font-semibold text-muted">{String.fromCharCode(65 + j)}.</span> {o}
                      </label>
                    ))}
                  </div>
                ) : (
                  <textarea className={`${textareaCls} mt-3 sm:ml-11 sm:w-[calc(100%-2.75rem)] ${q.type === 'long' ? 'min-h-[180px]' : 'min-h-[110px]'}`} dir="auto"
                    value={typeof a === 'string' ? a : ''} onChange={e => answer(q.id, e.target.value)}
                    placeholder={q.type === 'long' ? 'Write a detailed answer…' : 'Write a short answer (2–4 lines)…'} />
                )}
              </li>
            );
          })}
        </ol>
        <nav aria-label="Questions" className={`hidden lg:block sticky top-28 ${panelCls} p-4`}>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Questions</p>
          <div className="grid grid-cols-5 gap-1.5">
            {test.questions.map((q, i) => (
              <a key={q.id} href={`#q-${q.id}`} className={`h-8 rounded-lg text-xs font-semibold flex items-center justify-center border-2 ${
                saved?.flagged.includes(q.id) ? 'border-amber-400 text-amber-600'
                  : isAnswered(answers[q.id]) ? 'border-saffron bg-saffron text-white' : 'border-card-border dark:border-dark-border text-muted'}`}>{i + 1}</a>
            ))}
          </div>
        </nav>
      </div>
    </TeacherPage>
  );
}

function MockResult({ test, review, note, onAgain, onRegraded }: {
  test: TestData; review: Review; note: string | null; onAgain: () => void; onRegraded: (no: number) => Promise<void>;
}) {
  const { attempt, questions } = review;
  const [regrading, setRegrading] = useState(false);
  const [regradeError, setRegradeError] = useState<string | null>(null);
  const pct = attempt.maxScore ? Math.round((attempt.score / attempt.maxScore) * 100) : 0;
  const stats = useMemo(() => chapterStats(questions, attempt.results), [questions, attempt]);
  const weak = weakChapters(stats);
  const byId = new Map(attempt.results.map(r => [r.id, r]));

  const regrade = async () => {
    setRegrading(true); setRegradeError(null);
    try {
      await api(`/api/student/mock/${test.id}/submit`, { method: 'POST', json: { regrade: attempt.no } });
      await onRegraded(attempt.no);
    } catch (err) { setRegradeError((err as Error).message); } finally { setRegrading(false); }
  };

  return (
    <TeacherPage>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/practice" aria-label="Back" className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center border border-card-border dark:border-dark-border hover:border-saffron hover:text-saffron"><ArrowLeft className="w-4 h-4" /></Link>
        <h1 className="text-xl lg:text-2xl font-heading font-bold text-navy dark:text-dark-text truncate" dir="auto">{test.title} — Attempt {attempt.no}</h1>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-5 items-start mb-6">
        <div className={`${panelCls} p-6 text-center`}>
          <div className={`w-28 h-28 mx-auto rounded-full flex items-center justify-center text-3xl font-heading font-bold ${pct >= 75 ? 'bg-teal/10 text-teal' : pct >= 50 ? 'bg-amber-400/15 text-amber-600' : 'bg-red-500/10 text-red-500'}`}>{pct}%</div>
          <p className="mt-3 font-heading font-semibold text-lg text-navy dark:text-dark-text">{attempt.score} / {attempt.maxScore} marks</p>
          <p className="text-sm text-muted">{formatSeconds(attempt.timeTakenSec)}{attempt.autoSubmitted ? ' · submitted when time ran out' : ''}</p>
          {attempt.xp > 0 && <p className="mt-2 pill-saffron font-semibold inline-flex"><Trophy className="w-3.5 h-3.5" /> +{attempt.xp} XP</p>}
          <p className="text-sm mt-3 text-navy/80 dark:text-dark-text/80">{pct >= 85 ? 'Outstanding! 🎉' : pct >= 60 ? 'Good work — polish the weak spots below.' : 'Keep going — review the answers below and try again.'}</p>
          <button onClick={onAgain} className="btn-outline mt-4 !py-2 !px-4 text-sm"><RotateCcw className="w-4 h-4" /> Practice again</button>
        </div>
        <div className="space-y-4">
          {(note || attempt.pending) && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 dark:bg-amber-400/10 p-4 text-sm text-amber-800 dark:text-amber-300">
              <p>{note ?? 'Some written answers are still waiting for AI grading.'}</p>
              {attempt.pending && (
                <button onClick={regrade} disabled={regrading} className="mt-2 btn-outline !py-1.5 !px-3 text-xs">
                  {regrading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} Retry AI grading
                </button>
              )}
              {regradeError && <p className="mt-2 text-red-600">{regradeError}</p>}
            </div>
          )}
          <div className={`${panelCls} p-5`}>
            <h2 className="font-heading font-semibold text-navy dark:text-dark-text mb-3">Chapter-wise</h2>
            <ul className="space-y-2.5">
              {stats.map(s => (
                <li key={s.chapter} className="text-sm">
                  <div className="flex justify-between gap-3"><span className="truncate" dir="auto">{s.chapter}</span><span className="text-muted shrink-0">{s.pct < 0 ? 'grading…' : `${s.marks}/${s.max} · ${s.pct}%`}</span></div>
                  <div className="h-2 rounded-full bg-gray-100 dark:bg-dark-border mt-1 overflow-hidden">
                    <div className={`h-full rounded-full ${s.pct >= 75 ? 'bg-teal' : s.pct >= 50 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${Math.max(0, s.pct)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
          {weak.length > 0 && (
            <div className={`${panelCls} p-5`}>
              <h2 className="font-heading font-semibold text-navy dark:text-dark-text mb-2">Work on these next</h2>
              <ul className="space-y-2">
                {weak.slice(0, 4).map(w => (
                  <li key={w.chapter} className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-medium flex-1 min-w-0 truncate" dir="auto">{w.chapter} <span className="text-muted">({w.pct}%)</span></span>
                    <Link href={`/generate?topic=${encodeURIComponent(w.chapter)}`} className="btn-outline !py-1 !px-3 text-xs">🎬 Watch a video</Link>
                    <Link href={`/practice?topic=${encodeURIComponent(w.chapter)}`} className="btn-outline !py-1 !px-3 text-xs">📝 Practice</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <h2 className="font-heading font-semibold text-navy dark:text-dark-text mb-3">Review every answer</h2>
      <ol className="space-y-3">
        {questions.map((q, i) => {
          const r = byId.get(q.id);
          const a = attempt.answers[q.id];
          const ok = r?.status === 'correct' || (r?.status === 'graded' && r.marks >= r.max);
          const skipped = r?.status === 'skipped';
          return (
            <li key={q.id} className={`${panelCls} p-5`}>
              <div className="flex items-start gap-3">
                <span className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center ${ok ? 'bg-teal/10 text-teal' : r?.status === 'pending' ? 'bg-amber-400/15 text-amber-600' : skipped ? 'bg-gray-100 dark:bg-dark-border text-muted' : 'bg-red-500/10 text-red-500'}`}
                  title={skipped ? 'Skipped' : undefined}>
                  {ok ? <Check className="w-4 h-4" /> : r?.status === 'pending' ? <Clock className="w-4 h-4" /> : skipped ? <span className="text-xs font-bold">—</span> : <X className="w-4 h-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-3">
                    <p className="font-medium text-navy dark:text-dark-text" dir="auto">{i + 1}. {q.text}</p>
                    <span className="text-sm font-semibold shrink-0">{skipped && <span className="text-xs font-normal text-muted mr-1.5">Skipped</span>}{r?.status === 'pending' ? '…' : r?.marks ?? 0}/{q.marks}</span>
                  </div>
                  {q.type === 'mcq' ? (
                    <ul className="mt-2 space-y-1 text-sm">
                      {q.options.map((o, j) => (
                        <li key={j} dir="auto" className={j === q.correct ? 'text-teal font-medium' : j === a ? 'text-red-500 line-through' : 'text-muted'}>
                          {String.fromCharCode(65 + j)}. {o}{j === q.correct ? ' ✓' : ''}
                        </li>
                      ))}
                      {q.answer && <li className="text-navy/70 dark:text-dark-text/70 pt-1" dir="auto">💡 {q.answer}</li>}
                    </ul>
                  ) : (
                    <div className="mt-2 space-y-2 text-sm">
                      <p className="text-navy/80 dark:text-dark-text/80 whitespace-pre-line" dir="auto"><span className="text-muted">Your answer: </span>{typeof a === 'string' && a.trim() ? a : <i className="text-muted">(blank)</i>}</p>
                      {r?.feedback && <p className="text-indigo-brand" dir="auto">📝 {r.feedback}</p>}
                      <p className="text-teal whitespace-pre-line" dir="auto"><span className="text-muted">Model answer: </span>{r?.modelAnswer || q.answer}</p>
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </TeacherPage>
  );
}
