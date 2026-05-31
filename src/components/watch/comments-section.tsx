'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { MessageSquare, Send, Loader2 } from 'lucide-react';

interface Comment {
  id: string;
  text: string;
  createdAt: string;
  author: string;
  image: string | null;
}

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function CommentsSection({ videoId }: { videoId: string }) {
  const { status } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetch(`/api/videos/${videoId}/comments`)
      .then(r => r.json())
      .then(d => setComments(Array.isArray(d.comments) ? d.comments : []))
      .catch(() => {});
  }, [videoId]);

  const post = async () => {
    const t = text.trim();
    if (!t || posting) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/videos/${videoId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: t }),
      });
      if (res.ok) {
        const d = await res.json();
        if (d.comment) setComments(c => [d.comment, ...c]);
        setText('');
      }
    } catch { /* ignore */ } finally {
      setPosting(false);
    }
  };

  return (
    <section className="mt-8">
      <h2 className="flex items-center gap-2 text-lg font-heading font-bold text-navy dark:text-dark-text mb-4">
        <MessageSquare className="w-5 h-5 text-teal" /> Discussion
        <span className="text-sm font-normal text-muted">({comments.length})</span>
      </h2>

      {status === 'authenticated' ? (
        <div className="flex items-start gap-3 mb-6">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Share a thought or ask the community…"
            rows={2}
            className="flex-1 p-3 rounded-xl border-2 border-card-border dark:border-dark-border bg-off-white dark:bg-dark-bg text-navy dark:text-dark-text focus:border-teal outline-none text-sm resize-none"
          />
          <button onClick={post} disabled={posting || !text.trim()} className="h-11 px-4 rounded-xl bg-teal text-white flex items-center gap-2 disabled:opacity-50 hover:bg-teal/90 transition-all shrink-0 text-sm font-medium">
            {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Post
          </button>
        </div>
      ) : (
        <p className="text-sm text-muted mb-6">Sign in to join the discussion.</p>
      )}

      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-muted">No comments yet. Be the first!</p>
        ) : comments.map(c => (
          <div key={c.id} className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-saffron flex items-center justify-center text-white text-sm font-bold shrink-0">
              {c.author[0]?.toUpperCase() ?? 'S'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-navy dark:text-dark-text">{c.author}</span>
                <span className="text-xs text-muted">{timeAgo(c.createdAt)}</span>
              </div>
              <p className="text-sm text-navy/80 dark:text-dark-text/80 mt-0.5 break-words">{c.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
