'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, ClipboardList, NotebookPen, Presentation, Video } from 'lucide-react';
import { api, EmptyState, ErrorNote, panelCls, Spinner, TeacherPage, timeAgo } from '@/components/teacher/ui';

interface Detail {
  class: { name: string; subject: string | null; teacher: string | null };
  assignments: { id: string; kind: string; title: string; dueAt: string | null; createdAt: string; myScore: { score: number; total: number } | null }[];
}
const KIND_ICON: Record<string, typeof Video> = { quiz: ClipboardList, slides: Presentation, lesson: NotebookPen, video: Video };
const KIND_LABEL: Record<string, string> = { quiz: 'Quiz', slides: 'Slides', lesson: 'Notes', video: 'Video' };

export default function StudentClass({ params }: { params: { id: string } }) {
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { api<Detail>(`/api/classes/${params.id}`).then(setData).catch(e => setError(e.message)); }, [params.id]);

  if (error) return <TeacherPage><ErrorNote>{error}</ErrorNote></TeacherPage>;
  if (!data) return <TeacherPage><Spinner /></TeacherPage>;

  return (
    <TeacherPage>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/classes" aria-label="Back" className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center border border-card-border dark:border-dark-border hover:border-saffron hover:text-saffron"><ArrowLeft className="w-4 h-4" /></Link>
        <div>
          <h1 className="text-2xl font-heading font-bold text-navy dark:text-dark-text">{data.class.name}</h1>
          <p className="text-sm text-muted">{[data.class.subject, data.class.teacher && `by ${data.class.teacher}`].filter(Boolean).join(' · ')}</p>
        </div>
      </div>
      {data.assignments.length ? (
        <ul className={`${panelCls} divide-y divide-card-border dark:divide-dark-border`}>
          {data.assignments.map(a => {
            const Icon = KIND_ICON[a.kind] ?? ClipboardList;
            return (
              <li key={a.id}>
                <Link href={`/classes/assignments/${a.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-border/50">
                  <div className="w-9 h-9 rounded-lg bg-saffron/10 text-saffron flex items-center justify-center shrink-0"><Icon className="w-4 h-4" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-navy dark:text-dark-text truncate">{a.title}</p>
                    <p className="text-xs text-muted">
                      {KIND_LABEL[a.kind]} · {timeAgo(a.createdAt)}
                      {a.dueAt && ` · due ${new Date(a.dueAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                    </p>
                  </div>
                  {a.kind === 'quiz' && (a.myScore
                    ? <span className="text-xs font-medium text-teal flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> {a.myScore.score}/{a.myScore.total}</span>
                    : <span className="text-xs font-medium text-saffron">To do</span>)}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : <EmptyState icon={<ClipboardList className="w-6 h-6" />} title="Nothing assigned yet">Your teacher&apos;s quizzes, slides and videos will show up here.</EmptyState>}
    </TeacherPage>
  );
}
