'use client';

import { useEffect, useId, useState } from 'react';

/** Circular progress through the current level, with the level number inside. */
export function XpLevelRing({
  level, intoLevel, levelSize, size = 120, stroke = 10, tone = 'light',
}: {
  level: number; intoLevel: number; levelSize: number; size?: number; stroke?: number; tone?: 'light' | 'dark';
}) {
  const gradId = useId();
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const target = levelSize > 0 ? Math.min(1, Math.max(0, intoLevel / levelSize)) : 0;
  // Start empty and fill on mount so the ring visibly "charges".
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const t = requestAnimationFrame(() => setShown(target));
    return () => cancelAnimationFrame(t);
  }, [target]);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FF6B2C" />
            <stop offset="100%" stopColor="#FFB547" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke}
          className={tone === 'dark' ? 'stroke-white/10' : 'stroke-gray-100 dark:stroke-dark-border'}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round"
          stroke={`url(#${gradId})`}
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - shown)}
          style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" role="img" aria-label={`Level ${level}, ${intoLevel} of ${levelSize} XP to the next level`}>
        <span className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${tone === 'dark' ? 'text-white/60' : 'text-muted'}`}>Level</span>
        <span
          className={`font-heading font-bold leading-none tabular-nums ${tone === 'dark' ? 'text-white' : 'text-navy dark:text-dark-text'}`}
          style={{ fontSize: size * 0.32 }}
        >
          {level}
        </span>
      </div>
    </div>
  );
}

/** Linear XP bar towards the next level. */
export function XpBar({ intoLevel, levelSize, tone = 'light', className = '' }: { intoLevel: number; levelSize: number; tone?: 'light' | 'dark'; className?: string }) {
  const pct = levelSize > 0 ? Math.min(100, Math.max(0, (intoLevel / levelSize) * 100)) : 0;
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const t = requestAnimationFrame(() => setShown(pct));
    return () => cancelAnimationFrame(t);
  }, [pct]);
  return (
    <div
      className={`h-2.5 rounded-full overflow-hidden ${tone === 'dark' ? 'bg-white/10' : 'bg-gray-100 dark:bg-dark-border'} ${className}`}
      role="progressbar" aria-valuemin={0} aria-valuemax={levelSize} aria-valuenow={intoLevel} aria-label="XP towards next level"
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-saffron to-[#FFB547]"
        style={{ width: `${shown}%`, transition: 'width 1.1s cubic-bezier(0.22, 1, 0.36, 1)' }}
      />
    </div>
  );
}

export const formatXp = (n: number) => n.toLocaleString('en-IN');
