'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { NotebookText, Trash2 } from 'lucide-react';
import { api, EmptyState, Spinner, timeAgo } from '@/components/teacher/ui';
import { AccentStrip, itemCardCls } from './study-shell';

interface NotesRow {
  id: string; title: string; grade: string; language: string; updatedAt: string;
  oneLine: string; emoji: string; branches: string[];
}

export default function NotesList() {
  const [notes, setNotes] = useState<NotesRow[] | null>(null);

  useEffect(() => {
    api<{ notes: NotesRow[] }>('/api/student/notes').then(d => setNotes(d.notes)).catch(() => setNotes([]));
  }, []);

  const remove = async (n: NotesRow) => {
    if (!confirm(`Delete "${n.title}"?`)) return;
    await api(`/api/student/notes/${n.id}`, { method: 'DELETE' });
    setNotes(list => list?.filter(x => x.id !== n.id) ?? null);
  };

  if (!notes) return <Spinner label="Loading your notes…" />;
  if (!notes.length) {
    return <EmptyState icon={<NotebookText className="w-6 h-6" />} title="No revision sheets yet">Make your first one above — it takes under a minute.</EmptyState>;
  }
  return (
    <ul className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4" data-testid="notes-list">
      {notes.map(n => (
        <li key={n.id} className={`${itemCardCls}`}>
          <AccentStrip />
          <Link href={`/notes/${n.id}`} className="block p-5">
            <div className="flex items-start gap-3 pr-8">
              <div className="w-11 h-11 shrink-0 rounded-xl bg-saffron/10 flex items-center justify-center text-2xl">{n.emoji || '📄'}</div>
              <div className="min-w-0">
                <p className="font-heading font-semibold text-navy dark:text-dark-text line-clamp-2" dir="auto">{n.title}</p>
                <p className="text-xs text-muted mt-1">Class {n.grade} · {n.language} · {timeAgo(n.updatedAt)}</p>
              </div>
            </div>
            {n.oneLine && <p className="text-sm text-navy/70 dark:text-dark-text/70 mt-3 line-clamp-2" dir="auto">{n.oneLine}</p>}
            {n.branches.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {n.branches.slice(0, 4).map(b => <span key={b} className="pill bg-gray-100 dark:bg-dark-border text-navy/70 dark:text-dark-text/70 text-xs" dir="auto">{b}</span>)}
              </div>
            )}
          </Link>
          <button onClick={() => remove(n)} aria-label={`Delete ${n.title}`}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-muted sm:opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition">
            <Trash2 className="w-4 h-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}
