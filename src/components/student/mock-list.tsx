'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ClipboardCheck, Trash2 } from 'lucide-react';
import { api, EmptyState, Spinner } from '@/components/teacher/ui';
import { Cover, itemCardCls } from './study-shell';

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
    <ul className="ph-stagger grid sm:grid-cols-2 xl:grid-cols-3 gap-4" data-testid="mock-list">
      {tests.map(t => (
        <li key={t.id} className={itemCardCls}>
          <Link href={`/practice/${t.id}`} className="block">
            <Cover theme="mock" emoji="📝" badge={t.bestPct === null
              ? <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-orange-600 shadow">New</span>
              : <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-orange-600 shadow">Best {t.bestPct}%</span>} />
            <div className="p-4">
            <p className="font-heading font-semibold text-navy dark:text-dark-text line-clamp-2 pr-8" dir="auto">{t.title}</p>
            <p className="text-xs text-muted mt-1">Class {t.grade} · {t.language} · {t.questionCount} questions · {t.minutes} min · {t.maxScore} marks</p>
            <div className="mt-4 flex items-center gap-2">
              {t.bestPct === null ? <span className="pill-saffron font-semibold">Not attempted</span> : (
                <span className={`pill font-semibold ${t.bestPct >= 75 ? 'bg-saffron text-white' : t.bestPct >= 50 ? 'bg-saffron/15 text-orange-700' : 'bg-gray-100 text-muted dark:bg-dark-border'}`}>
                  Best {t.bestPct}%{t.bestPending ? ' (grading…)' : ''}
                </span>
              )}
              {t.attempts > 0 && <span className="text-xs text-muted">{t.attempts} attempt{t.attempts === 1 ? '' : 's'}</span>}
            </div>
            </div>
          </Link>
          <button onClick={() => remove(t)} aria-label={`Delete ${t.title}`}
            className="absolute left-3 top-3 z-10 w-8 h-8 rounded-full flex items-center justify-center bg-black/25 text-white sm:opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-red-500 transition">
            <Trash2 className="w-4 h-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}
