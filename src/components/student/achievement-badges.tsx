'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import type { BadgeStatus } from '@/lib/badges';

const dateFmt = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });

/** "6 / 10 lessons", "Best 70% · need 90%", "515 / 1,000 XP". */
export function badgeProgressText(b: BadgeStatus) {
  if (b.unit === '%') return `Best ${b.current}% · need ${b.target}%`;
  if (b.unit === 'XP') return `${b.current.toLocaleString('en-IN')} / ${b.target.toLocaleString('en-IN')} XP`;
  const plural = b.target === 1 ? b.unit : b.unit.endsWith('z') ? `${b.unit}zes` : `${b.unit}s`;
  return `${b.current} / ${b.target} ${plural}`;
}

/** A round emoji medallion: tinted when earned, grey with a lock when not. */
export function BadgeMedal({ badge, size = 64 }: { badge: BadgeStatus; size?: number }) {
  return (
    <div
      className={`relative mx-auto rounded-full flex items-center justify-center ${badge.earned ? '' : 'bg-gray-100 dark:bg-dark-border/60'}`}
      style={{
        width: size, height: size,
        ...(badge.earned ? {
          background: `radial-gradient(circle at 32% 28%, #ffffff 0%, ${badge.tint}33 45%, ${badge.tint}55 100%)`,
          boxShadow: `0 0 0 3px ${badge.tint}40, 0 8px 20px -8px ${badge.tint}99`,
        } : {}),
      }}
    >
      <span className={badge.earned ? '' : 'grayscale opacity-35'} style={{ fontSize: size * 0.46, lineHeight: 1 }} aria-hidden>
        {badge.emoji}
      </span>
      {!badge.earned && (
        <span className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-white dark:bg-dark-surface border border-card-border dark:border-dark-border flex items-center justify-center">
          <Lock className="w-3 h-3 text-muted" />
        </span>
      )}
    </div>
  );
}

function BadgeCard({ badge, isNew }: { badge: BadgeStatus; isNew: boolean }) {
  return (
    <Link
      href={badge.href}
      className={`group relative flex flex-col items-center text-center rounded-2xl border p-4 pt-5 transition-all duration-300 hover:-translate-y-0.5 ${
        badge.earned
          ? 'bg-white dark:bg-dark-surface border-card-border dark:border-dark-border shadow-card dark:shadow-card-dark hover:shadow-card-hover'
          : 'bg-gray-50/80 dark:bg-dark-bg/60 border-dashed border-card-border dark:border-dark-border hover:border-saffron/40'
      } ${isNew ? 'ach-pop' : ''}`}
      aria-label={`${badge.title}: ${badge.earned ? 'earned' : 'locked'}. ${badge.description}`}
    >
      {isNew && (
        <span className="absolute top-2 right-2 rounded-full bg-saffron px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-saffron">
          New
        </span>
      )}
      <BadgeMedal badge={badge} />
      <p className={`mt-3 font-heading font-semibold text-sm leading-tight ${badge.earned ? 'text-navy dark:text-dark-text' : 'text-navy/70 dark:text-dark-text/70'}`}>
        {badge.title}
      </p>
      <p className="mt-1 text-[11px] leading-snug text-muted min-h-[2.2em]">{badge.description}</p>
      {badge.earned ? (
        <p className="mt-2 text-[11px] font-semibold text-teal">
          ✓ Earned{badge.earnedAt ? ` ${dateFmt(badge.earnedAt)}` : ''}
        </p>
      ) : (
        <div className="mt-2 w-full">
          <div className="h-1.5 rounded-full bg-gray-200 dark:bg-dark-border overflow-hidden">
            <div className="h-full rounded-full bg-saffron/70" style={{ width: `${Math.round(badge.progress * 100)}%` }} />
          </div>
          <p className="mt-1 text-[10px] text-muted tabular-nums">{badgeProgressText(badge)}</p>
        </div>
      )}
    </Link>
  );
}

export function BadgeGrid({ badges, newIds }: { badges: BadgeStatus[]; newIds: Set<string> }) {
  // Earned first (newest first), then locked by how close they are.
  const sorted = [...badges].sort((a, b) =>
    a.earned !== b.earned ? (a.earned ? -1 : 1)
      : a.earned ? (b.earnedAt ?? '').localeCompare(a.earnedAt ?? '')
      : b.progress - a.progress);
  return (
    <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
      {sorted.map(b => (
        <li key={b.id} className="flex">
          <div className="w-full flex [&>a]:w-full"><BadgeCard badge={b} isNew={newIds.has(b.id)} /></div>
        </li>
      ))}
    </ul>
  );
}
