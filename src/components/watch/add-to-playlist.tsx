'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ListPlus, Check, Plus, Loader2, X } from 'lucide-react';

interface Playlist { id: string; title: string; emoji: string; count: number }

export default function AddToPlaylist({ videoId }: { videoId: string }) {
  const { status } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const [newTitle, setNewTitle] = useState('');

  const openMenu = async () => {
    if (status !== 'authenticated') {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/library/${videoId}`)}`);
      return;
    }
    setOpen(true);
    setLoading(true);
    try {
      const d = await (await fetch('/api/playlists')).json();
      setPlaylists(Array.isArray(d.playlists) ? d.playlists : []);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  const addTo = async (playlistId: string) => {
    await fetch(`/api/playlists/${playlistId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId }),
    });
    setAdded(a => ({ ...a, [playlistId]: true }));
  };

  const createAndAdd = async () => {
    if (!newTitle.trim()) return;
    const res = await fetch('/api/playlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim() }),
    });
    const d = await res.json();
    if (d.id) {
      await addTo(d.id);
      setPlaylists(p => [{ id: d.id, title: d.title, emoji: d.emoji ?? '📚', count: 1 }, ...p]);
      setNewTitle('');
    }
  };

  return (
    <>
      <button
        onClick={openMenu}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border border-card-border dark:border-dark-border text-navy dark:text-dark-text hover:border-saffron transition-all"
      >
        <ListPlus className="w-4 h-4" /> Add to Playlist
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-dark-surface rounded-2xl shadow-2xl p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-heading font-bold text-navy dark:text-dark-text">Add to Playlist</h3>
              <button onClick={() => setOpen(false)} className="text-muted hover:text-navy dark:hover:text-dark-text"><X className="w-5 h-5" /></button>
            </div>

            {loading ? (
              <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted" /></div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                {playlists.length === 0 && <p className="text-sm text-muted">No playlists yet — create one below.</p>}
                {playlists.map(p => (
                  <button
                    key={p.id}
                    onClick={() => addTo(p.id)}
                    disabled={added[p.id]}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-card-border dark:border-dark-border hover:border-saffron transition-all text-sm text-navy dark:text-dark-text"
                  >
                    <span className="flex items-center gap-2"><span className="text-lg">{p.emoji}</span>{p.title}</span>
                    {added[p.id] ? <Check className="w-4 h-4 text-teal" /> : <Plus className="w-4 h-4 text-muted" />}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 pt-3 border-t border-card-border dark:border-dark-border">
              <input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createAndAdd()}
                placeholder="New playlist…"
                className="flex-1 h-10 px-3 rounded-xl border-2 border-card-border dark:border-dark-border bg-off-white dark:bg-dark-bg text-navy dark:text-dark-text focus:border-saffron outline-none text-sm"
              />
              <button onClick={createAndAdd} disabled={!newTitle.trim()} className="h-10 px-3 rounded-xl bg-saffron text-white flex items-center disabled:opacity-50 shrink-0"><Plus className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
