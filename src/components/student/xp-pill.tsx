'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ProgressSummary } from '@/lib/badges';

const REFRESH_MS = 20_000;

/**
 * XP headline for the sidebar user card, fetched lazily (never blocks the
 * sidebar). Refreshes on navigation at most every 20 s so new XP shows up.
 */
export function useXpSummary(enabled: boolean) {
  const pathname = usePathname();
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const lastFetch = useRef(0);

  useEffect(() => {
    if (!enabled || Date.now() - lastFetch.current < REFRESH_MS) return;
    lastFetch.current = Date.now();
    fetch('/api/student/progress?view=summary')
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d && typeof d.totalXp === 'number') setSummary(d); else lastFetch.current = 0; })
      .catch(() => { lastFetch.current = 0; });
  }, [enabled, pathname]);

  return summary;
}

export function XpPill({ summary, onNavigate }: { summary: ProgressSummary; onNavigate?: () => void }) {
  return (
    <Link
      href="/achievements"
      onClick={onNavigate}
      className="mt-1 inline-flex items-center gap-1 max-w-full whitespace-nowrap overflow-hidden rounded-full bg-saffron/10 dark:bg-saffron/20 px-2 py-0.5 text-[11px] font-semibold text-saffron hover:bg-saffron/20 transition-colors"
      title={`Level ${summary.level.level} · ${summary.totalXp.toLocaleString('en-IN')} XP · ${summary.streak.current}-day streak`}
    >
      <span className="tabular-nums">Lv {summary.level.level}</span>
      <span className="opacity-40">·</span>
      <span className="tabular-nums">{summary.totalXp.toLocaleString('en-IN')} XP</span>
      {summary.streak.current > 0 && (
        <>
          <span className="opacity-40">·</span>
          <span className="tabular-nums" aria-label={`${summary.streak.current}-day streak`}>🔥{summary.streak.current}</span>
        </>
      )}
    </Link>
  );
}
