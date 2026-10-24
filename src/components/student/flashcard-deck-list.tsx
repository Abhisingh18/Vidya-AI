'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarCheck, Clapperboard, FileText, Layers, NotebookText, Trash2 } from 'lucide-react';
import { daysBetween, localToday, type StudySource } from '@/lib/flashcards';
import { api, EmptyState, Spinner } from '@/components/teacher/ui';
import { Cover, itemCardCls } from './study-shell';

interface DeckRow {
  id: string; title: string; grade: string; language: string; updatedAt: string; emoji: string;
  source: StudySource | null; due: number; fresh: number; next: string | null; total: number;
}

const SOURCE_ICON = { video: Clapperboard, upload: FileText, notes: NotebookText, topic: Layers } as const;

export function nextLabel(next: string | null, today: string): string {
  if (!next) return 'Nothing scheduled';
  const d = daysBetween(today, next);
  return d <= 1 ? 'Next review tomorrow' : `Next review in ${d} days`;
}

export default function FlashcardDeckList() {
  const [decks, setDecks] = useState<DeckRow[] | null>(null);
  const [today] = useState(localToday);

  useEffect(() => {
    api<{ decks: DeckRow[] }>(`/api/student/flashcards?today=${today}`).then(d => setDecks(d.decks)).catch(() => setDecks([]));
  }, [today]);

  const remove = async (d: DeckRow) => {
    if (!confirm(`Delete the deck "${d.title}"? Your review progress will be lost.`)) return;
    await api(`/api/student/flashcards/${d.id}`, { method: 'DELETE' });
    setDecks(list => list?.filter(x => x.id !== d.id) ?? null);
  };

  if (!decks) return <Spinner label="Loading your decks…" />;
  if (!decks.length) {
    return <EmptyState icon={<Layers className="w-6 h-6" />} title="No decks yet">Make your first deck above — it takes under a minute.</EmptyState>;
  }

  const dueTotal = decks.reduce((n, d) => n + d.due, 0);
  return (
    <>
      {dueTotal > 0 && (
        <p className="text-sm text-muted -mt-2 mb-4"><span className="font-semibold text-saffron">{dueTotal} cards</span> waiting for you today across {decks.filter(d => d.due).length} deck{decks.filter(d => d.due).length === 1 ? '' : 's'}.</p>
      )}
      <ul className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4" data-testid="deck-list">
        {decks.map(d => {
          const Icon = SOURCE_ICON[d.source?.kind ?? 'topic'];
          return (
            <li key={d.id} className={itemCardCls}>
              <Link href={`/flashcards/${d.id}`} className="block">
                <Cover theme="flash" emoji={d.emoji || '🗂️'} badge={d.due > 0
                  ? <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-orange-600 shadow" data-testid="due-badge">{d.due} due today</span>
                  : <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-orange-600 shadow">✓ Caught up</span>} />
                <div className="p-4">
                <div className="flex items-start gap-3 pr-8">
                  <div className="min-w-0">
                    <p className="font-heading font-semibold text-navy dark:text-dark-text line-clamp-2" dir="auto">{d.title}</p>
                    <p className="text-xs text-muted mt-1 flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 shrink-0" /> Class {d.grade} · {d.language} · {d.total} cards
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 flex-wrap text-xs text-muted">
                  {d.due > 0 && d.fresh > 0 && <span>{d.fresh === d.due ? 'all new cards' : `${d.fresh} new`}</span>}
                  {d.due === 0 && <span className="inline-flex items-center gap-1"><CalendarCheck className="w-3.5 h-3.5" /> {nextLabel(d.next, today)}</span>}
                  {d.due > 0 && <span className="font-semibold text-orange-600 dark:text-orange-300">Start reviewing →</span>}
                </div>
                </div>
              </Link>
              <button onClick={() => remove(d)} aria-label={`Delete ${d.title}`}
                className="absolute left-3 top-3 z-10 w-8 h-8 rounded-full flex items-center justify-center bg-black/25 text-white sm:opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-red-500 transition">
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
