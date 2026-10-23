'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ClipboardCheck, Trash2 } from 'lucide-react';
import { api, EmptyState, panelCls, Spinner } from '@/components/teacher/ui';

interface TestRow {
  id: string; title: string; subject: string; grade: string; language: string; minutes: number;
  questionCount: number; maxScore: number; attempts: number; bestPct: number | null; bestPending: boolean;
}

export default function MockList() {
  const [tests, setTests] = useState<TestRow[] | null>(null);
  useEffect(() => { api<{ tests: TestRow[] }>('/api/student/mock').then(d => setTests(d.tests)).catch(() => setTests([])); }, []);

  const remove = async (t: TestRow) => {
    if (!confirm(`Delete "${t.title}" and its results?`)) return;
    await api(`/api/student/mock/${t.id}`, { method: 'DELETE' });
    setTests(list => list?.filter(x => x.id !== t.id) ?? null);
  };

  if (!tests) return <Spinner label="Loading your tests…" />;
  if (!tests.length) return <EmptyState icon={<ClipboardCheck className="w-6 h-6" />} title="No mock tests yet">Create one above and practise like the real exam.</EmptyState>;
  return (
    <ul className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4" data-testid="mock-list">
      {tests.map(t => (
        <li key={t.id} className={`${panelCls} group relative hover:border-saffron/50 transition-colors`}>
          <Link href={`/practice/${t.id}`} className="block p-5">
            <p className="font-heading font-semibold text-navy dark:text-dark-text line-clamp-2 pr-8" dir="auto">{t.title}</p>
            <p className="text-xs text-muted mt-1">Class {t.grade} · {t.language} · {t.questionCount} questions · {t.minutes} min · {t.maxScore} marks</p>
            <div className="mt-4 flex items-center gap-2">
              {t.bestPct === null ? <span className="pill-saffron font-semibold">Not attempted</span> : (
                <span className={`pill font-semibold ${t.bestPct >= 75 ? 'bg-teal/10 text-teal' : t.bestPct >= 50 ? 'bg-amber-400/15 text-amber-600' : 'bg-red-500/10 text-red-500'}`}>
                  Best {t.bestPct}%{t.bestPending ? ' (grading…)' : ''}
                </span>
              )}
              {t.attempts > 0 && <span className="text-xs text-muted">{t.attempts} attempt{t.attempts === 1 ? '' : 's'}</span>}
            </div>
          </Link>
          <button onClick={() => remove(t)} aria-label={`Delete ${t.title}`}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-muted sm:opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition">
            <Trash2 className="w-4 h-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}
