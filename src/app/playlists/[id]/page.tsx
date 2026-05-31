'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, Play, X } from 'lucide-react';

interface PlaylistVideo {
  id: string;
  topic: string;
  language: string;
  grade: string;
  subject: string;
  duration: number;
}

interface PlaylistDetail {
  id: string;
  title: string;
  emoji: string;
  videos: PlaylistVideo[];
}

function formatDuration(sec: number) {
  if (!sec) return '—';
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

export default function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [pl, setPl] = useState<PlaylistDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch(`/api/playlists/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setPl(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (id) load(); }, [id]);

  const removeVideo = async (videoId: string) => {
    await fetch(`/api/playlists/${id}?videoId=${videoId}`, { method: 'DELETE' });
    setPl(p => p ? { ...p, videos: p.videos.filter(v => v.id !== videoId) } : p);
  };

  if (loading) {
    return <main className="min-h-screen bg-off-white dark:bg-dark-bg"><div className="container-main pt-24"><div className="h-10 w-1/2 bg-gray-200 dark:bg-dark-border rounded animate-pulse" /></div></main>;
  }
  if (!pl) {
    return (
      <main className="min-h-screen bg-off-white dark:bg-dark-bg"><div className="container-main pt-24 pb-16 text-center">
        <h1 className="text-2xl font-heading font-bold text-navy dark:text-dark-text mb-4">Playlist not found</h1>
        <Link href="/playlists" className="btn-saffron inline-flex"><ArrowLeft className="w-4 h-4" />Back to Playlists</Link>
      </div></main>
    );
  }

  const totalMin = Math.round(pl.videos.reduce((s, v) => s + v.duration, 0) / 60);

  return (
    <main className="min-h-screen bg-off-white dark:bg-dark-bg">
      <div className="container-main pt-24 pb-16">
        <Link href="/playlists" className="inline-flex items-center gap-2 text-sm text-muted hover:text-saffron mb-6"><ArrowLeft className="w-4 h-4" />All playlists</Link>

        <header className="mb-8 flex items-center gap-4">
          <div className="text-5xl">{pl.emoji}</div>
          <div>
            <h1 className="text-3xl font-heading font-bold text-navy dark:text-dark-text">{pl.title}</h1>
            <p className="text-muted text-sm mt-1">{pl.videos.length} video{pl.videos.length !== 1 ? 's' : ''} · ~{totalMin} min</p>
          </div>
        </header>

        {pl.videos.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted mb-4">This playlist is empty. Add videos from any lesson page.</p>
            <Link href="/library" className="btn-saffron inline-flex"><Play className="w-4 h-4" />Browse Library</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {pl.videos.map((v, i) => (
              <div key={v.id} className="group flex items-center gap-4 p-4 rounded-2xl border border-card-border dark:border-dark-border bg-white dark:bg-dark-surface hover:border-saffron transition-all">
                <span className="text-lg font-bold text-muted w-6 text-center shrink-0">{i + 1}</span>
                <Link href={`/library/${v.id}`} className="flex-1 min-w-0">
                  <h3 className="font-semibold text-navy dark:text-dark-text truncate">{v.topic}</h3>
                  <p className="text-xs text-muted mt-0.5">{v.subject} · {v.language} · Class {v.grade}</p>
                </Link>
                <span className="text-xs text-muted font-mono inline-flex items-center gap-1 shrink-0"><Clock className="w-3 h-3" />{formatDuration(v.duration)}</span>
                <Link href={`/library/${v.id}`} className="w-9 h-9 rounded-full bg-saffron/10 text-saffron flex items-center justify-center shrink-0 hover:bg-saffron hover:text-white transition-all"><Play className="w-4 h-4 fill-current ml-0.5" /></Link>
                <button onClick={() => removeVideo(v.id)} className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0" aria-label="Remove"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
