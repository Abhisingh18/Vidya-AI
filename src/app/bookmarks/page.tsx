'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Bookmark, Clock, Eye, Sparkles, LogIn } from 'lucide-react';

interface SavedVideo {
  id: string;
  topic: string;
  language: string;
  grade: string;
  subject: string;
  duration: number;
}

const SUBJECT_GRADIENT: Record<string, string> = {
  Mathematics: 'from-indigo-brand-400 to-indigo-brand-700',
  Physics: 'from-saffron-300 to-saffron-700',
  Chemistry: 'from-teal-400 to-teal-700',
  Biology: 'from-emerald-400 to-emerald-700',
  'Computer Science': 'from-violet-400 to-violet-700',
  History: 'from-amber-400 to-amber-700',
  General: 'from-gray-400 to-gray-700',
};

function formatDuration(sec: number) {
  if (!sec) return '—';
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

export default function BookmarksPage() {
  const { status } = useSession();
  const [videos, setVideos] = useState<SavedVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== 'authenticated') { setLoading(false); return; }
    let cancelled = false;
    fetch('/api/bookmarks')
      .then(r => r.json())
      .then(d => { if (!cancelled) setVideos(Array.isArray(d.videos) ? d.videos : []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [status]);

  return (
    <main className="min-h-screen bg-off-white dark:bg-dark-bg">
      <div className="container-main pt-24 pb-16">
        <header className="mb-8 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-saffron flex items-center justify-center shadow-md">
              <Bookmark className="w-5 h-5 text-white fill-white" />
            </div>
            <h1 className="text-4xl font-heading font-bold text-navy dark:text-dark-text">Saved Videos</h1>
          </div>
          <p className="text-muted text-lg">Your bookmarked lessons — revisit them anytime.</p>
        </header>

        {status === 'unauthenticated' ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-dark-border flex items-center justify-center mb-6">
              <LogIn className="w-9 h-9 text-muted" />
            </div>
            <h3 className="text-xl font-heading font-semibold text-navy dark:text-dark-text mb-2">Sign in to see your bookmarks</h3>
            <Link href="/login?callbackUrl=/bookmarks" className="btn-saffron text-sm mt-2"><LogIn className="w-4 h-4" />Sign In</Link>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-card-border dark:border-dark-border bg-white dark:bg-dark-surface overflow-hidden animate-pulse">
                <div className="h-40 bg-gray-100 dark:bg-dark-border" />
                <div className="p-4 space-y-3"><div className="h-4 bg-gray-100 dark:bg-dark-border rounded w-3/4" /><div className="h-3 bg-gray-100 dark:bg-dark-border rounded w-1/3" /></div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-dark-border flex items-center justify-center mb-6">
              <Bookmark className="w-9 h-9 text-muted" />
            </div>
            <h3 className="text-xl font-heading font-semibold text-navy dark:text-dark-text mb-2">No bookmarks yet</h3>
            <p className="text-muted text-sm mb-6 max-w-xs">Tap the Save button on any video to keep it here.</p>
            <Link href="/library" className="btn-saffron text-sm"><Sparkles className="w-4 h-4" />Browse Library</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {videos.map((v, i) => (
              <Link
                key={v.id}
                href={`/library/${v.id}`}
                className="group rounded-2xl border border-card-border dark:border-dark-border bg-white dark:bg-dark-surface overflow-hidden transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className={`relative h-40 bg-gradient-to-br ${SUBJECT_GRADIENT[v.subject] ?? SUBJECT_GRADIENT.General}`}>
                  <Bookmark className="absolute top-3 right-3 w-5 h-5 text-white fill-white/80" />
                  <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-md font-mono flex items-center gap-1"><Clock className="w-3 h-3" />{formatDuration(v.duration)}</div>
                  <div className="absolute top-3 left-3 bg-white/95 text-xs px-2.5 py-1 rounded-full font-medium text-navy shadow-sm">{v.language}</div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-sm text-navy dark:text-dark-text line-clamp-2 leading-snug min-h-[2.5rem]">{v.topic}</h3>
                  <div className="flex items-center justify-between mt-3 text-xs text-muted">
                    <span>{v.subject}</span>
                    <span className="inline-flex items-center gap-1"><Eye className="w-3.5 h-3.5" />Watch</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
