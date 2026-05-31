'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ListVideo, Plus, Trash2, LogIn, X } from 'lucide-react';

interface Playlist {
  id: string;
  title: string;
  emoji: string;
  count: number;
}

const EMOJIS = ['📚', '🔬', '🧮', '⚡', '🧬', '🚀', '🎯', '💡', '🏆', '🔥'];

export default function PlaylistsPage() {
  const { status } = useSession();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('📚');

  const load = () => {
    fetch('/api/playlists')
      .then(r => r.json())
      .then(d => setPlaylists(Array.isArray(d.playlists) ? d.playlists : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (status !== 'authenticated') { setLoading(false); return; }
    load();
  }, [status]);

  const create = async () => {
    if (!title.trim()) return;
    await fetch('/api/playlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), emoji }),
    });
    setTitle(''); setEmoji('📚'); setCreating(false);
    load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/playlists/${id}`, { method: 'DELETE' });
    setPlaylists(p => p.filter(x => x.id !== id));
  };

  return (
    <main className="min-h-screen bg-off-white dark:bg-dark-bg">
      <div className="container-main pt-24 pb-16">
        <header className="mb-8 flex items-start justify-between gap-4 animate-fade-in-up">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-saffron flex items-center justify-center shadow-md">
                <ListVideo className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-4xl font-heading font-bold text-navy dark:text-dark-text">Playlists</h1>
            </div>
            <p className="text-muted text-lg">Organize lessons into courses — like &ldquo;Class 10 Physics&rdquo;.</p>
          </div>
          {status === 'authenticated' && (
            <button onClick={() => setCreating(true)} className="btn-saffron text-sm shrink-0">
              <Plus className="w-4 h-4" />New
            </button>
          )}
        </header>

        {status === 'unauthenticated' ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-dark-border flex items-center justify-center mb-6"><LogIn className="w-9 h-9 text-muted" /></div>
            <h3 className="text-xl font-heading font-semibold text-navy dark:text-dark-text mb-2">Sign in to make playlists</h3>
            <Link href="/login?callbackUrl=/playlists" className="btn-saffron text-sm mt-2"><LogIn className="w-4 h-4" />Sign In</Link>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 rounded-2xl bg-white dark:bg-dark-surface border border-card-border dark:border-dark-border animate-pulse" />)}
          </div>
        ) : playlists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-dark-border flex items-center justify-center mb-6"><ListVideo className="w-9 h-9 text-muted" /></div>
            <h3 className="text-xl font-heading font-semibold text-navy dark:text-dark-text mb-2">No playlists yet</h3>
            <p className="text-muted text-sm mb-6 max-w-xs">Create a playlist, then add videos from any lesson page.</p>
            <button onClick={() => setCreating(true)} className="btn-saffron text-sm"><Plus className="w-4 h-4" />Create Playlist</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {playlists.map(p => (
              <div key={p.id} className="group relative rounded-2xl border border-card-border dark:border-dark-border bg-white dark:bg-dark-surface p-6 transition-all hover:shadow-card-hover hover:-translate-y-1">
                <Link href={`/playlists/${p.id}`} className="block">
                  <div className="text-4xl mb-3">{p.emoji}</div>
                  <h3 className="font-heading font-semibold text-lg text-navy dark:text-dark-text">{p.title}</h3>
                  <p className="text-sm text-muted mt-1">{p.count} video{p.count !== 1 ? 's' : ''}</p>
                </Link>
                <button onClick={() => remove(p.id)} className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all" aria-label="Delete playlist">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {creating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setCreating(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-dark-surface rounded-2xl shadow-2xl p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-heading font-bold text-navy dark:text-dark-text">New Playlist</h3>
              <button onClick={() => setCreating(false)} className="text-muted hover:text-navy dark:hover:text-dark-text"><X className="w-5 h-5" /></button>
            </div>
            <label className="text-xs font-semibold uppercase tracking-widest text-muted">Icon</label>
            <div className="flex flex-wrap gap-2 mt-2 mb-4">
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setEmoji(e)} className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center border transition-all ${emoji === e ? 'border-saffron bg-saffron/10' : 'border-card-border dark:border-dark-border'}`}>{e}</button>
              ))}
            </div>
            <label className="text-xs font-semibold uppercase tracking-widest text-muted">Title</label>
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && create()}
              placeholder="e.g. Class 10 Physics"
              className="w-full mt-2 h-12 px-4 rounded-xl border-2 border-card-border dark:border-dark-border bg-off-white dark:bg-dark-bg text-navy dark:text-dark-text focus:border-saffron outline-none text-sm"
            />
            <button onClick={create} disabled={!title.trim()} className="w-full btn-saffron mt-5 disabled:opacity-50"><Plus className="w-4 h-4" />Create</button>
          </div>
        </div>
      )}
    </main>
  );
}
