'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Trash2 } from 'lucide-react';
import { formatDate, type PlanState } from '@/lib/planner';
import { api, EmptyState, Spinner } from '@/components/teacher/ui';
import { Cover, itemCardCls } from './study-shell';

interface PlanRow {
  id: string; title: string; examDate: string; subjects: string[];
  progress: { done: number; total: number; pct: number };
  status: { state: PlanState; overdue: number; daysLeft: number };
}
export const STATE_CHIP: Record<PlanState, { label: string; cls: string }> = {
  'on-track': { label: 'On track', cls: 'bg-saffron/15 text-orange-700' },
  behind: { label: 'Behind', cls: 'bg-navy/10 text-navy dark:bg-white/10 dark:text-white' },
  ahead: { label: 'Ahead', cls: 'bg-saffron text-white' },
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
        <li key={p.id} className={itemCardCls}>
          <Link href={`/planner/${p.id}`} className="block">
            <Cover theme="plan" emoji="📅" badge={<span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-sky-700 shadow">{p.status.daysLeft > 0 ? `${p.status.daysLeft} days left` : 'Exam day'}</span>} />
            <div className="p-4">
            <p className="font-heading font-semibold text-navy dark:text-dark-text line-clamp-2 pr-8" dir="auto">{p.title}</p>
            <p className="text-xs text-muted mt-1">Exam {formatDate(p.examDate)} · {p.status.daysLeft > 0 ? `${p.status.daysLeft} days left` : 'today/past'} · {p.subjects.join(', ')}</p>
            <div className="h-2 rounded-full bg-gray-100 dark:bg-dark-border mt-4 overflow-hidden"><div className="h-full bg-saffron rounded-full" style={{ width: `${p.progress.pct}%` }} /></div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-muted">{p.progress.done}/{p.progress.total} tasks · {p.progress.pct}%</span>
              <span className={`pill font-semibold ${STATE_CHIP[p.status.state].cls}`}>{STATE_CHIP[p.status.state].label}</span>
            </div>
            </div>
          </Link>
          <button onClick={() => remove(p)} aria-label={`Delete ${p.title}`}
            className="absolute left-3 top-3 z-10 w-8 h-8 rounded-full flex items-center justify-center bg-black/25 text-white sm:opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-red-500 transition">
            <Trash2 className="w-4 h-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}
