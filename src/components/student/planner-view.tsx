'use client';

// A study plan: today's tasks first, then the remaining days as an agenda
// (past days collapsed). Ticking a task autosaves and may award XP.
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CalendarDays, Check, ChevronDown, Lightbulb, Loader2, RefreshCw, Trophy } from 'lucide-react';
import {
  formatDate, istDate, taskHref, TASK_TYPES, type PlanContent, type PlanDay, type PlanState, type PlanTask,
} from '@/lib/planner';
import { STATE_CHIP } from './planner-list';
import { api, ErrorNote, panelCls, Spinner, TeacherPage } from '@/components/teacher/ui';
import FeedbackBar from '@/components/feedback-bar';

interface PlanData {
  id: string; title: string; content: PlanContent;
  progress: { done: number; total: number; pct: number; doneMinutes: number; totalMinutes: number };
  status: { state: PlanState; overdue: number; overdueMinutes: number; ahead: number; daysLeft: number };
}

const TYPE_STYLE: Record<PlanTask['type'], string> = {
  learn: 'bg-indigo-brand/10 text-indigo-brand',
  practice: 'bg-saffron/10 text-saffron',
  revise: 'bg-teal/10 text-teal',
  flashcards: 'bg-pink-500/10 text-pink-600',
  mock: 'bg-amber-400/15 text-amber-700',
};
const TYPE_EMOJI: Record<PlanTask['type'], string> = { learn: '🎬', practice: '📝', revise: '🔁', flashcards: '🃏', mock: '🏁' };

export default function PlannerView({ id }: { id: string }) {
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPast, setShowPast] = useState(false);
  const [replanning, setReplanning] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const today = istDate();

  const load = useCallback(() => api<{ plan: PlanData }>(`/api/student/plan/${id}`).then(d => setPlan(d.plan)).catch(e => setError(e.message)), [id]);
  useEffect(() => { load(); }, [load]);

  const toggle = async (task: PlanTask) => {
    if (!plan) return;
    const done = !task.done;
    // optimistic tick
    setPlan(p => p && ({ ...p, content: { ...p.content, days: p.content.days.map(d => ({ ...d, tasks: d.tasks.map(t => (t.id === task.id ? { ...t, done } : t)) })) } }));
    try {
      const r = await api<{ xp: number; progress: PlanData['progress']; status: PlanData['status'] }>(`/api/student/plan/${id}`, { method: 'PATCH', json: { toggles: { [task.id]: done } } });
      setPlan(p => p && ({ ...p, progress: r.progress, status: r.status }));
      if (r.xp > 0) { setToast(`+${r.xp} XP — nice work!`); setTimeout(() => setToast(null), 2500); }
    } catch (err) {
      setError((err as Error).message);
      load();
    }
  };

  const replan = async () => {
    if (!confirm('Re-plan from today? Finished tasks stay; everything else is scheduled again around today.')) return;
    setReplanning(true); setError(null);
    try { await api(`/api/student/plan/${id}/replan`, { method: 'POST', json: {} }); await load(); }
    catch (err) { setError((err as Error).message); }
    finally { setReplanning(false); }
  };

  const { past, todayDay, upcoming } = useMemo(() => {
    const days = plan?.content.days ?? [];
    return {
      past: days.filter(d => d.date < today),
      todayDay: days.find(d => d.date === today) ?? null,
      upcoming: days.filter(d => d.date > today),
    };
  }, [plan, today]);

  if (error && !plan) return <TeacherPage><ErrorNote>{error}</ErrorNote></TeacherPage>;
  if (!plan) return <TeacherPage><Spinner label="Loading your plan…" /></TeacherPage>;
  const c = plan.content;
  const chip = STATE_CHIP[plan.status.state];

  return (
    <TeacherPage>
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Link href="/planner" aria-label="Back" className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center border border-card-border dark:border-dark-border hover:border-saffron hover:text-saffron"><ArrowLeft className="w-4 h-4" /></Link>
          <div className="min-w-0">
            <h1 className="text-xl lg:text-2xl font-heading font-bold text-navy dark:text-dark-text truncate" dir="auto">{plan.title}</h1>
            <p className="text-xs text-muted">Exam on {formatDate(c.examDate, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} · {c.hoursPerDay} h/day · {c.subjects.map(s => s.name).join(', ')}</p>
          </div>
        </div>
        <button onClick={replan} disabled={replanning || plan.status.state === 'exam-over'} className="btn-outline !py-2 !px-4 text-sm disabled:opacity-50">
          {replanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Re-plan from today
        </button>
      </div>
      {error && <div className="mb-4"><ErrorNote>{error}</ErrorNote></div>}

      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <div className={`${panelCls} p-4`}>
          <p className="text-xs text-muted">Progress</p>
          <p className="text-2xl font-heading font-bold text-navy dark:text-dark-text">{plan.progress.pct}%</p>
          <div className="h-2 rounded-full bg-gray-100 dark:bg-dark-border mt-2 overflow-hidden"><div className="h-full bg-saffron rounded-full transition-all" style={{ width: `${plan.progress.pct}%` }} /></div>
          <p className="text-xs text-muted mt-1">{plan.progress.done}/{plan.progress.total} tasks</p>
        </div>
        <div className={`${panelCls} p-4`}>
          <p className="text-xs text-muted">Days left</p>
          <p className="text-2xl font-heading font-bold text-navy dark:text-dark-text">{Math.max(0, plan.status.daysLeft)}</p>
          <p className="text-xs text-muted mt-1">until {formatDate(c.examDate)}</p>
        </div>
        <div className={`${panelCls} p-4`}>
          <p className="text-xs text-muted">Status</p>
          <p className={`pill font-semibold mt-1 inline-flex ${chip.cls}`}>{chip.label}</p>
          <p className="text-xs text-muted mt-2">
            {plan.status.state === 'behind' ? `${plan.status.overdue} task(s) from earlier days are pending — finish them or re-plan.`
              : plan.status.state === 'ahead' ? 'You are ahead of plan. 🚀' : plan.status.state === 'exam-over' ? 'All the best for the results!' : 'Keep going, one day at a time.'}
          </p>
        </div>
      </div>

      {/* Today */}
      <section className={`${panelCls} p-5 mb-6 border-2 !border-saffron/40`}>
        <h2 className="font-heading font-semibold text-navy dark:text-dark-text flex items-center gap-2 mb-3"><CalendarDays className="w-5 h-5 text-saffron" /> Today · {formatDate(today, { weekday: 'long', day: 'numeric', month: 'short' })}</h2>
        {todayDay?.tasks.length ? <TaskList tasks={todayDay.tasks} plan={c} onToggle={toggle} big /> : <p className="text-sm text-muted">No tasks today — it&apos;s a rest day or outside the plan. 🌿</p>}
      </section>

      {c.tips.length > 0 && (
        <section className="rounded-2xl bg-indigo-brand/5 border border-indigo-brand/20 p-4 mb-6">
          <p className="text-sm font-semibold text-indigo-brand flex items-center gap-1.5 mb-1"><Lightbulb className="w-4 h-4" /> Tips for this plan</p>
          <ul className="text-sm text-navy/80 dark:text-dark-text/80 list-disc ml-5 space-y-0.5">{c.tips.map((t, i) => <li key={i} dir="auto">{t}</li>)}</ul>
        </section>
      )}

      <h2 className="font-heading font-semibold text-navy dark:text-dark-text mb-3">Coming up</h2>
      <div className="space-y-3">
        {upcoming.length ? upcoming.map(d => <DayCard key={d.date} day={d} plan={c} onToggle={toggle} />) : <p className="text-sm text-muted">Nothing left after today.</p>}
      </div>

      {past.length > 0 && (
        <div className="mt-8">
          <button onClick={() => setShowPast(s => !s)} className="text-sm font-medium text-muted hover:text-saffron flex items-center gap-1">
            <ChevronDown className={`w-4 h-4 transition-transform ${showPast ? 'rotate-180' : ''}`} /> Past days ({past.length}) · {past.reduce((n, d) => n + d.tasks.filter(t => !t.done).length, 0)} unfinished
          </button>
          {showPast && <div className="space-y-3 mt-3">{past.slice().reverse().map(d => <DayCard key={d.date} day={d} plan={c} onToggle={toggle} />)}</div>}
        </div>
      )}

      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-full bg-navy text-white px-5 py-2.5 shadow-lg flex items-center gap-2 text-sm"><Trophy className="w-4 h-4 text-saffron" /> {toast}</div>}
      <FeedbackBar feature="plan" refId={plan.id} label="Is this plan helpful?" className="mt-8" />
    </TeacherPage>
  );
}

function DayCard({ day, plan, onToggle }: { day: PlanDay; plan: PlanContent; onToggle: (t: PlanTask) => void }) {
  const done = day.tasks.filter(t => t.done).length;
  return (
    <div className={`${panelCls} p-4`}>
      <div className="flex items-center justify-between mb-2">
        <p className="font-heading font-semibold text-sm text-navy dark:text-dark-text">{formatDate(day.date, { weekday: 'short', day: 'numeric', month: 'short' })}</p>
        <span className="text-xs text-muted">{done}/{day.tasks.length} done · {day.tasks.reduce((t, x) => t + x.minutes, 0)} min</span>
      </div>
      <TaskList tasks={day.tasks} plan={plan} onToggle={onToggle} />
    </div>
  );
}

function TaskList({ tasks, plan, onToggle, big = false }: { tasks: PlanTask[]; plan: PlanContent; onToggle: (t: PlanTask) => void; big?: boolean }) {
  return (
    <ul className="space-y-2">
      {tasks.map(t => (
        <li key={t.id} className={`flex items-start gap-3 rounded-xl border border-card-border dark:border-dark-border ${big ? 'p-3' : 'p-2.5'} ${t.done ? 'opacity-60' : ''}`}>
          <button onClick={() => onToggle(t)} aria-pressed={t.done} aria-label={t.done ? `Mark "${t.title}" not done` : `Mark "${t.title}" done`}
            className={`w-6 h-6 shrink-0 rounded-md border-2 flex items-center justify-center mt-0.5 ${t.done ? 'bg-teal border-teal text-white' : 'border-card-border dark:border-dark-border hover:border-saffron'}`}>
            {t.done && <Check className="w-4 h-4" />}
          </button>
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-medium text-navy dark:text-dark-text ${t.done ? 'line-through' : ''}`} dir="auto">{t.title}</p>
            <p className="text-xs text-muted mt-0.5 flex flex-wrap items-center gap-1.5">
              <span className={`pill !py-0 !px-2 text-[11px] font-semibold ${TYPE_STYLE[t.type]}`}>{TYPE_EMOJI[t.type]} {TASK_TYPES[t.type].label}</span>
              <span dir="auto">{t.subject} · {t.chapter}</span> · {t.minutes} min
            </p>
          </div>
          {!t.done && (
            <Link href={taskHref(t, plan.subjects)} className="shrink-0 text-xs font-semibold text-saffron hover:underline flex items-center gap-0.5 mt-1">
              {TASK_TYPES[t.type].action} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}
