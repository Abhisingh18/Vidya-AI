'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock } from 'lucide-react';

interface RelatedVideo {
  id: string;
  topic: string;
  language: string;
  subject: string;
  duration: number;
}

interface Props {
  currentId: string;
  subject: string;
}

function formatDuration(sec: number) {
  if (!sec) return '—';
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

export default function RelatedVideos({ currentId, subject }: Props) {
  const [videos, setVideos] = useState<RelatedVideo[]>([]);

  useEffect(() => {
    fetch('/api/library')
      .then(r => r.json())
      .then(d => {
        const all: RelatedVideo[] = Array.isArray(d.videos) ? d.videos : [];
        // Prefer same subject, exclude current, fill with others.
        const sameSubject = all.filter(v => v.id !== currentId && v.subject === subject);
        const others = all.filter(v => v.id !== currentId && v.subject !== subject);
        setVideos([...sameSubject, ...others].slice(0, 5));
      })
      .catch(() => {});
  }, [currentId, subject]);

  if (videos.length === 0) return null;

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-dark-surface border border-card-border dark:border-dark-border">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-muted mb-4">Related lessons</h3>
      <div className="space-y-3">
        {videos.map(v => (
          <Link key={v.id} href={`/library/${v.id}`} className="group flex items-start gap-3">
            <div className="w-16 h-12 rounded-lg bg-gradient-saffron/20 flex items-center justify-center shrink-0 text-xs font-mono text-muted">
              <Clock className="w-3 h-3 mr-1" />{formatDuration(v.duration)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-navy dark:text-dark-text line-clamp-2 leading-snug group-hover:text-saffron transition-colors">{v.topic}</p>
              <p className="text-xs text-muted mt-0.5">{v.subject} · {v.language}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
