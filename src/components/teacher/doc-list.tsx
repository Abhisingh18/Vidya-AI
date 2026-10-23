'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Trash2 } from 'lucide-react';
import { DOC_TYPES, type DocType } from '@/lib/teacher-docs';
import { api, EmptyState, panelCls, Spinner, timeAgo } from './ui';

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
    <ul className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {docs.map(d => (
        <li key={d.id} className={`${panelCls} group relative p-5 hover:border-saffron/50 transition-colors`}>
          <Link href={`${DOC_TYPES[type].path}/${d.id}`} className="block">
            <p className="font-heading font-semibold text-navy dark:text-dark-text line-clamp-2 pr-8">{d.title}</p>
            <p className="text-xs text-muted mt-2">
              {d.grade === 'College' ? 'College' : `Class ${d.grade}`} · {d.language} · edited {timeAgo(d.updatedAt)}
            </p>
          </Link>
          <button onClick={() => remove(d.id, d.title)} aria-label={`Delete ${d.title}`}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-muted opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition">
            <Trash2 className="w-4 h-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}
