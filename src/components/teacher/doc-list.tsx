'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Trash2 } from 'lucide-react';
import { DOC_TYPES, type DocType } from '@/lib/teacher-docs';
import { api, EmptyState, Spinner, timeAgo } from './ui';

const COVER: Record<string, { emoji: string; grad: string }> = {
  slides: { emoji: '📊', grad: 'from-orange-400 via-saffron to-orange-600' },
  quiz: { emoji: '❓', grad: 'from-amber-400 via-saffron to-rose-500' },
  lesson: { emoji: '🗒️', grad: 'from-rose-400 via-saffron to-orange-500' },
  exam: { emoji: '📜', grad: 'from-orange-500 via-saffron to-amber-400' },
};

interface DocRow { id: string; type: string; title: string; grade: string; language: string; updatedAt: string }

export default function DocList({ type }: { type: DocType }) {
  const [docs, setDocs] = useState<DocRow[] | null>(null);

  useEffect(() => {
    api<{ docs: DocRow[] }>(`/api/teacher/docs?type=${type}`).then(d => setDocs(d.docs)).catch(() => setDocs([]));
  }, [type]);

  const remove = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This can't be undone.`)) return;
    await api(`/api/teacher/docs/${id}`, { method: 'DELETE' });
    setDocs(d => d?.filter(x => x.id !== id) ?? null);
  };

  if (!docs) return <Spinner />;
  if (!docs.length) {
    return <EmptyState icon={<FileText className="w-6 h-6" />} title={`No ${DOC_TYPES[type].plural.toLowerCase()} yet`}>Generate your first one above.</EmptyState>;
  }

  return (
    <ul className="ph-stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {docs.map(d => {
        const cv = COVER[d.type] ?? COVER[type];
        return (
          <li key={d.id} className="ph-shine group relative overflow-hidden rounded-2xl border border-card-border bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-saffron/50 hover:shadow-card-hover dark:border-dark-border dark:bg-dark-surface">
            <Link href={`${DOC_TYPES[type].path}/${d.id}`} className="block">
              <div className={`relative h-20 overflow-hidden bg-gradient-to-br ${cv.grad}`}>
                <span aria-hidden className="absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/15" />
                <span aria-hidden className="absolute -bottom-10 left-1/3 h-24 w-24 rounded-full bg-black/10" />
                <span className="absolute bottom-2.5 left-4 text-3xl transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110" style={{ fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif' }}>{cv.emoji}</span>
              </div>
              <div className="p-4">
                <p className="line-clamp-2 pr-6 font-heading font-semibold text-navy dark:text-dark-text">{d.title}</p>
                <p className="mt-2 text-xs text-muted">
                  {d.grade === 'College' ? 'College' : `Class ${d.grade}`} · {d.language} · edited {timeAgo(d.updatedAt)}
                </p>
              </div>
            </Link>
            <button onClick={() => remove(d.id, d.title)} aria-label={`Delete ${d.title}`}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg bg-black/25 text-white opacity-0 backdrop-blur transition hover:bg-red-500 focus:opacity-100 group-hover:opacity-100">
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
