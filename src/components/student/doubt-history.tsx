'use client';

import { useEffect, useState } from 'react';
import { History, Trash2 } from 'lucide-react';
import type { DoubtSummary } from '@/app/api/student/doubt/solver';
import { LANGUAGES } from '@/lib/languages';
import { panelCls, timeAgo } from '@/components/teacher/ui';

const SUBJECT_TONES: [RegExp, string][] = [
  [/math/i, 'bg-indigo-brand/10 text-indigo-brand dark:bg-indigo-brand/25 dark:text-indigo-brand-200'],
  [/physics|^science$/i, 'bg-teal/10 text-teal dark:bg-teal/20 dark:text-teal-300'],
  [/chem/i, 'bg-saffron/10 text-saffron-600 dark:bg-saffron/20 dark:text-saffron-300'],
  [/bio/i, 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'],
  [/history|geograph|civics|econom|social|political/i, 'bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'],
  [/english|hindi|sanskrit|language|literature/i, 'bg-violet-500/10 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300'],
  [/computer|account|business/i, 'bg-sky-500/10 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300'],
];

export function SubjectPill({ subject, className = '' }: { subject: string; className?: string }) {
  if (!subject) return null;
  const tone = SUBJECT_TONES.find(([re]) => re.test(subject))?.[1] ?? 'bg-gray-100 text-muted dark:bg-dark-border dark:text-dark-text/80';
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${tone} ${className}`}>{subject}</span>;
}

export const nativeName = (language: string) => {
  const l = LANGUAGES.find(x => x.name === language);
  return l && l.name !== 'English' ? l.native : language;
};

export default function DoubtHistory({ items, loading, error, activeId, onOpen, onDelete }: {
  items: DoubtSummary[];
  loading: boolean;
  error: string | null;
  activeId: string | null;
  onOpen: (id: string) => void;
  onDelete: (id: string) => Promise<void> | void;
}) {
  const [confirming, setConfirming] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // The "Delete?" confirmation disarms itself after a few seconds.
  useEffect(() => {
    if (!confirming) return;
    const t = window.setTimeout(() => setConfirming(null), 4000);
    return () => window.clearTimeout(t);
  }, [confirming]);

  const remove = async (id: string) => {
    if (confirming !== id) { setConfirming(id); return; }
    setConfirming(null);
    setDeleting(id);
    try { await onDelete(id); } finally { setDeleting(null); }
  };

  return (
    <section aria-labelledby="doubt-history-title">
      <h2 id="doubt-history-title" className="flex items-center gap-2 font-heading font-semibold text-navy dark:text-dark-text mb-3">
        <History className="w-4 h-4 text-saffron" /> Your doubts
        {items.length > 0 && <span className="text-xs font-normal text-muted">({items.length})</span>}
      </h2>

      {loading ? (
        <div className="space-y-2" aria-busy>
          {[0, 1, 2].map(i => <div key={i} className={`${panelCls} h-[74px] animate-pulse`} />)}
        </div>
      ) : error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : !items.length ? (
        <div className={`${panelCls} p-5 text-sm text-muted text-center`}>
          No doubts yet. Every question you solve is saved here so you can revise it later.
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map(d => (
            <li key={d.id} className={`${panelCls} flex items-stretch transition-colors ${activeId === d.id ? 'ring-2 ring-saffron/50 border-saffron/40' : 'hover:border-saffron/40'} ${deleting === d.id ? 'opacity-50' : ''}`}>
              <button type="button" onClick={() => onOpen(d.id)} className="flex-1 min-w-0 text-left px-4 py-3">
                <span className="block text-sm font-semibold text-navy dark:text-dark-text line-clamp-2 break-words">{d.title}</span>
                <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted">
                  <SubjectPill subject={d.subject} />
                  <span>{nativeName(d.language)}</span>
                  <span aria-hidden>·</span>
                  <span>{timeAgo(d.createdAt)}</span>
                </span>
              </button>
              <button type="button" onClick={() => remove(d.id)} disabled={deleting === d.id}
                aria-label={confirming === d.id ? 'Confirm delete' : `Delete “${d.title}”`}
                className={`shrink-0 px-3 my-2 mr-2 rounded-lg text-xs font-semibold transition-colors ${
                  confirming === d.id ? 'bg-red-500 text-white' : 'text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
                }`}>
                {confirming === d.id ? 'Delete?' : <Trash2 className="w-4 h-4" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
