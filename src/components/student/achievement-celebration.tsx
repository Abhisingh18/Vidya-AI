'use client';

import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import type { BadgeStatus } from '@/lib/badges';
import { BadgeMedal } from './achievement-badges';

const seenKey = (userId: string) => `vidya:seen-badges:${userId}`;

function readSeen(userId: string): Set<string> | null {
  try {
    const raw = window.localStorage.getItem(seenKey(userId));
    const list: unknown = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : []);
  } catch {
    return null;
  }
}

/**
 * Earned badges this browser hasn't celebrated yet for this user. Seen ids
 * live in localStorage and are written by `markSeen` (call it when the
 * celebration is dismissed). If storage is unavailable nothing is celebrated,
 * so private windows don't throw confetti on every visit.
 */
export function useNewBadges(userId: string | undefined, badges: BadgeStatus[] | undefined) {
  const [fresh, setFresh] = useState<string[]>([]);
  useEffect(() => {
    if (!userId || !badges) return;
    const seen = readSeen(userId);
    setFresh(seen ? badges.filter(b => b.earned && !seen.has(b.id)).map(b => b.id) : []);
  }, [userId, badges]);

  const markSeen = () => {
    if (!userId || !badges) return;
    const seen = readSeen(userId) ?? new Set<string>();
    badges.filter(b => b.earned).forEach(b => seen.add(b.id));
    try { window.localStorage.setItem(seenKey(userId), JSON.stringify(Array.from(seen))); } catch { /* storage blocked */ }
  };
  return { fresh, markSeen };
}

const COLORS = ['#FF6B2C', '#FFB547', '#3D3BDB', '#0F9E75', '#F43F5E', '#FACC15', '#6F6DE1'];

/** One-shot falling confetti. Skipped entirely for reduced-motion users. */
export function Confetti({ pieces = 90 }: { pieces?: number }) {
  const [reduced, setReduced] = useState(true);
  const [done, setDone] = useState(false);
  useEffect(() => {
    setReduced(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
    const t = setTimeout(() => setDone(true), 4200);
    return () => clearTimeout(t);
  }, []);
  const bits = useMemo(() => Array.from({ length: pieces }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.8,
    dur: 2.2 + Math.random() * 1.6,
    drift: (Math.random() - 0.5) * 220,
    spin: (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 720),
    w: 6 + Math.random() * 6,
    h: 8 + Math.random() * 8,
    round: i % 5 === 0,
    color: COLORS[i % COLORS.length],
  })), [pieces]);
  if (reduced || done) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden" aria-hidden>
      {bits.map((b, i) => (
        <span
          key={i}
          className="ach-confetti absolute -top-4"
          style={{
            left: `${b.left}%`, width: b.w, height: b.round ? b.w : b.h, background: b.color,
            borderRadius: b.round ? '9999px' : '2px',
            animationDelay: `${b.delay}s`, animationDuration: `${b.dur}s`,
            ['--drift' as string]: `${b.drift}px`, ['--spin' as string]: `${b.spin}deg`,
          }}
        />
      ))}
    </div>
  );
}

/** Keyframes for the celebration (globals.css belongs to the whole app). */
export function CelebrationStyles() {
  return (
    <style>{`
      @keyframes ach-fall { 0% { transform: translate3d(0,-20px,0) rotate(0); opacity: 1; } 85% { opacity: 1; } 100% { transform: translate3d(var(--drift), 105vh, 0) rotate(var(--spin)); opacity: 0; } }
      @keyframes ach-pop { 0% { transform: scale(0.6); opacity: 0; } 60% { transform: scale(1.06); opacity: 1; } 100% { transform: scale(1); } }
      @keyframes ach-glow { 0%,100% { box-shadow: 0 0 0 0 rgba(255,107,44,0.0); } 50% { box-shadow: 0 0 0 10px rgba(255,107,44,0.12); } }
      @keyframes ach-flicker { 0%,100% { transform: scale(1) rotate(-2deg); } 50% { transform: scale(1.08) rotate(2deg); } }
      .ach-confetti { animation-name: ach-fall; animation-timing-function: cubic-bezier(0.25, 0.6, 0.5, 1); animation-fill-mode: both; }
      .ach-pop { animation: ach-pop 0.6s cubic-bezier(0.22, 1, 0.36, 1) both, ach-glow 2.4s ease-in-out 0.6s 2; }
      .ach-flicker { display: inline-block; animation: ach-flicker 1.6s ease-in-out infinite; transform-origin: 50% 90%; }
      @media (prefers-reduced-motion: reduce) { .ach-pop, .ach-flicker, .ach-confetti { animation: none !important; } }
    `}</style>
  );
}

/** "Badge unlocked!" dialog with confetti for badges seen for the first time. */
export function BadgeCelebration({ badges, onClose }: { badges: BadgeStatus[]; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  if (!badges.length) return null;
  const [first, ...rest] = badges;
  return (
    <>
      <Confetti />
      <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]" onClick={onClose}>
        <div
          role="dialog" aria-modal="true" aria-labelledby="badge-unlocked-title"
          className="ach-pop relative w-full max-w-sm rounded-3xl bg-white dark:bg-dark-surface border border-card-border dark:border-dark-border p-6 pt-8 text-center shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <button onClick={onClose} aria-label="Close" className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-muted hover:bg-gray-100 dark:hover:bg-dark-border">
            <X className="w-4 h-4" />
          </button>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-saffron">
            {badges.length > 1 ? `${badges.length} badges unlocked` : 'Badge unlocked'}
          </p>
          <div className="mt-4"><BadgeMedal badge={first} size={96} /></div>
          <h2 id="badge-unlocked-title" className="mt-4 font-heading font-bold text-2xl text-navy dark:text-dark-text">{first.title}</h2>
          <p className="mt-1 text-sm text-muted">{first.description}</p>
          {rest.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {rest.map(b => (
                <span key={b.id} className="inline-flex items-center gap-1.5 rounded-full bg-saffron/10 dark:bg-saffron/20 px-3 py-1 text-xs font-semibold text-navy dark:text-dark-text">
                  <span aria-hidden>{b.emoji}</span>{b.title}
                </span>
              ))}
            </div>
          )}
          <button onClick={onClose} className="btn-saffron w-full mt-6">Shabaash! Keep going 🎉</button>
        </div>
      </div>
    </>
  );
}
