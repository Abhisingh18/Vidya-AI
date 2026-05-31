'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Star } from 'lucide-react';

interface Props { videoId: string }

export default function RatingStars({ videoId }: Props) {
  const { status } = useSession();
  const router = useRouter();
  const [average, setAverage] = useState(0);
  const [count, setCount] = useState(0);
  const [userValue, setUserValue] = useState(0);
  const [hover, setHover] = useState(0);

  useEffect(() => {
    fetch(`/api/videos/${videoId}/rating`)
      .then(r => r.json())
      .then(d => { setAverage(d.average ?? 0); setCount(d.count ?? 0); setUserValue(d.userValue ?? 0); })
      .catch(() => {});
  }, [videoId]);

  const rate = async (value: number) => {
    if (status !== 'authenticated') {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/library/${videoId}`)}`);
      return;
    }
    setUserValue(value);
    try {
      const res = await fetch(`/api/videos/${videoId}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
      const d = await res.json();
      setAverage(d.average ?? 0); setCount(d.count ?? 0); setUserValue(d.userValue ?? value);
    } catch { /* ignore */ }
  };

  const display = hover || userValue;

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-dark-surface border border-card-border dark:border-dark-border">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">Rate this lesson</h3>
      <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map(i => (
          <button key={i} onMouseEnter={() => setHover(i)} onClick={() => rate(i)} aria-label={`Rate ${i} stars`} className="p-0.5">
            <Star className={`w-6 h-6 transition-colors ${i <= display ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-dark-border'}`} />
          </button>
        ))}
      </div>
      <p className="text-xs text-muted mt-2">
        {count > 0 ? <><span className="font-semibold text-navy dark:text-dark-text">{average.toFixed(1)}</span> avg · {count} rating{count !== 1 ? 's' : ''}</> : 'Be the first to rate'}
        {userValue > 0 && <span className="text-saffron"> · You: {userValue}★</span>}
      </p>
    </div>
  );
}
