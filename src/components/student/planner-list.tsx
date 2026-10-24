'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Trash2 } from 'lucide-react';
import { formatDate, type PlanState } from '@/lib/planner';
import { api, EmptyState, Spinner } from '@/components/teacher/ui';
import { AccentStrip, itemCardCls } from './study-shell';

interface PlanRow {
  id: string; title: string; examDate: string; subjects: string[];
  progress: { done: number; total: number; pct: number };
  status: { state: PlanState; overdue: number; daysLeft: number };
}
export const STATE_CHIP: Record<PlanState, { label: string; cls: string }> = {
  'on-track': { label: 'On track', cls: 'bg-teal/10 text-teal' },
  behind: { label: 'Behind', cls: 'bg-amber-400/15 text-amber-700' },
  ahead: { label: 'Ahead', cls: 'bg-indigo-brand/10 text-indigo-brand' },
  'exam-over': { label: 'Exam over', cls: 'bg-gray-100 dark:bg-dark-border text-muted' },
};

export default function PlannerList() {
  const [plans, setPlans] = useState<PlanRow[] | null>(null);
  useEffect(() => { api<{ plans: PlanRow[] }>('/api/student/plan').then(d => setPlans(d.plans)).catch(() => setPlans([])); }, []);
  const remove = async (p: PlanRow) => {
    if (!confirm(`Delete the plan "${p.title}"?`)) return;
    await api(`/api/student/plan/${p.id}`, { method: 'DELETE' });
    setPlans(l => l?.filter(x => x.id !== p.id) ?? null);
  };
  if (!plans) return <Spinner label="Loading your plans…" />;
  if (!plans.length) return <EmptyState icon={<CalendarDays className="w-6 h-6" />} title="No study plan yet">Make one above — it takes under a minute.</EmptyState>;
  return (
    <ul className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4" data-testid="plan-list">
      {plans.map(p => (
        <li key={p.id} className={`${itemCardCls}`}>
          <AccentStrip />
          <Link href={`/planner/${p.id}`} className="block p-5">
            <p className="font-heading font-semibold text-navy dark:text-dark-text line-clamp-2 pr-8" dir="auto">{p.title}</p>
            <p className="text-xs text-muted mt-1">Exam {formatDate(p.examDate)} · {p.status.daysLeft > 0 ? `${p.status.daysLeft} days left` : 'today/past'} · {p.subjects.join(', ')}</p>
            <div className="h-2 rounded-full bg-gray-100 dark:bg-dark-border mt-4 overflow-hidden"><div className="h-full bg-saffron rounded-full" style={{ width: `${p.progress.pct}%` }} /></div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-muted">{p.progress.done}/{p.progress.total} tasks · {p.progress.pct}%</span>
              <span className={`pill font-semibold ${STATE_CHIP[p.status.state].cls}`}>{STATE_CHIP[p.status.state].label}</span>
            </div>
          </Link>
          <button onClick={() => remove(p)} aria-label={`Delete ${p.title}`}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-muted sm:opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition">
            <Trash2 className="w-4 h-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}
