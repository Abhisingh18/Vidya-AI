'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Crown, Users } from 'lucide-react';
import type { LeaderboardResponse, LeaderRow } from '@/lib/badges';
import { api, EmptyState, ErrorNote, panelCls, Spinner } from '@/components/teacher/ui';

const IST = 'Asia/Kolkata';
const dayFmt = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: IST });

function resetsIn(weekEnd: string) {
  const ms = new Date(weekEnd).getTime() + 1 - Date.now();
  if (ms <= 0) return 'soon';
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  return d > 0 ? `${d}d ${h}h` : `${h}h ${Math.floor((ms % 3_600_000) / 60_000)}m`;
}

const MEDAL = ['🥇', '🥈', '🥉'];
const PODIUM = [
  { ring: 'ring-[#F5B301]', bg: 'from-[#FFD54A] to-[#F5A300]', block: 'h-28 sm:h-32', glow: 'bg-[#FFD54A]/20' },
  { ring: 'ring-[#B8BCC8]', bg: 'from-[#E3E6EE] to-[#A9AFBE]', block: 'h-20 sm:h-24', glow: 'bg-gray-300/20' },
  { ring: 'ring-[#D08B4F]', bg: 'from-[#F2B27A] to-[#C2773C]', block: 'h-14 sm:h-16', glow: 'bg-[#F2B27A]/20' },
];

function Avatar({ row, size = 'md' }: { row: LeaderRow; size?: 'md' | 'lg' }) {
  const dims = size === 'lg' ? 'w-14 h-14 sm:w-16 sm:h-16 text-lg' : 'w-9 h-9 text-xs';
  return (
    <div className={`${dims} shrink-0 rounded-full flex items-center justify-center font-heading font-bold ${
      row.isMe ? 'bg-gradient-saffron text-white' : 'bg-indigo-brand/10 text-indigo-brand dark:bg-indigo-brand/25 dark:text-indigo-brand-200'
    }`}>
      {row.initials}
    </div>
  );
}

function Podium({ rows }: { rows: LeaderRow[] }) {
  // Visual order: 2nd, 1st, 3rd.
  const order = [rows[1], rows[0], rows[2]];
  return (
    <div className="grid grid-cols-3 items-end gap-2 sm:gap-4 max-w-xl mx-auto">
      {order.map((row, i) => {
        if (!row) return <div key={i} />;
        const place = i === 1 ? 0 : i === 0 ? 1 : 2;
        const s = PODIUM[place];
        return (
          <div key={i} className="flex flex-col items-center min-w-0">
            <div className="relative">
              {place === 0 && <Crown className="absolute -top-5 left-1/2 -translate-x-1/2 w-5 h-5 text-[#F5B301] fill-[#FFD54A]" aria-hidden />}
              <div className={`rounded-full ring-4 ${s.ring} ring-offset-2 ring-offset-white dark:ring-offset-dark-surface`}>
                <Avatar row={row} size="lg" />
              </div>
              <span className="absolute -bottom-1 -right-1 text-lg" aria-hidden>{MEDAL[place]}</span>
            </div>
            <p className="mt-2 w-full truncate text-center text-sm font-semibold text-navy dark:text-dark-text">
              {row.name}{row.isMe && <span className="text-saffron"> (you)</span>}
            </p>
            <p className="text-xs font-bold text-saffron tabular-nums">{row.xp.toLocaleString('en-IN')} XP</p>
            <div className={`mt-2 w-full ${s.block} rounded-t-2xl bg-gradient-to-b ${s.bg} flex items-start justify-center pt-2 shadow-inner`}>
              <span className="font-heading font-extrabold text-2xl sm:text-3xl text-white/90 drop-shadow-sm">{row.rank}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Row({ row }: { row: LeaderRow }) {
  return (
    <li className={`flex items-center gap-3 px-3 sm:px-4 py-2.5 rounded-xl ${row.isMe ? 'bg-saffron/10 dark:bg-saffron/15 ring-1 ring-saffron/30' : ''}`}>
      <span className="w-6 text-center text-sm font-bold text-muted tabular-nums">{row.rank}</span>
      <Avatar row={row} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-navy dark:text-dark-text">
          {row.name}{row.isMe && <span className="ml-1.5 pill-saffron !text-[10px] !px-1.5 !py-0">You</span>}
        </p>
        <p className="text-[11px] text-muted">
          Level {row.level}{row.streak > 0 && <> · 🔥 {row.streak}-day streak</>}
        </p>
      </div>
      <span className="text-sm font-bold text-navy dark:text-dark-text tabular-nums">{row.xp.toLocaleString('en-IN')}<span className="ml-0.5 text-[10px] font-semibold text-muted">XP</span></span>
    </li>
  );
}

export function Leaderboard() {
  // '' = default (first class); 'all' = every class the student is in.
  const [selected, setSelected] = useState('');
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const qs = selected === 'all' ? 'scope=all' : `scope=class${selected ? `&classId=${encodeURIComponent(selected)}` : ''}`;
    api<LeaderboardResponse>(`/api/student/leaderboard?${qs}`)
      .then(setData)
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [selected]);

  if (!data && loading) return <Spinner label="Loading leaderboard…" />;
  if (error && !data) return <ErrorNote>{error}</ErrorNote>;
  if (!data) return null;

  const current = data.scope === 'all' ? 'all' : data.classId ?? '';
  const top = data.rows.slice(0, 3);
  const rest = data.rows.slice(3);
  const meHidden = data.me && !data.rows.some(r => r.isMe);
  const nobodyScored = data.rows.every(r => r.xp === 0);

  if (!data.classes.length) {
    return (
      <EmptyState icon={<Users className="w-6 h-6" />} title="Join a class to compete">
        <p>The weekly leaderboard ranks you against your classmates.</p>
        <Link href="/classes" className="inline-flex mt-4 btn-saffron !py-2 !px-5 text-sm">Join a class</Link>
        {data.me && <p className="mt-4 text-xs">You&apos;ve earned <b className="text-saffron">{data.me.xp} XP</b> this week so far.</p>}
      </EmptyState>
    );
  }

  return (
    <div className="space-y-5">
      {/* Class selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0" role="tablist" aria-label="Choose a class">
          {data.classes.length > 1 && data.viewer === 'student' && (
            <ClassChip active={current === 'all'} onClick={() => setSelected('all')}>All my classes</ClassChip>
          )}
          {data.classes.map(c => (
            <ClassChip key={c.id} active={current === c.id} onClick={() => setSelected(c.id)}>{c.name}</ClassChip>
          ))}
        </div>
        <p className="text-xs text-muted shrink-0">
          {dayFmt(data.weekStart)} – {dayFmt(data.weekEnd)} · resets in <b className="text-navy dark:text-dark-text">{resetsIn(data.weekEnd)}</b>
        </p>
      </div>

      <div className={`${panelCls} p-4 sm:p-6 relative overflow-hidden ${loading ? 'opacity-60' : ''} transition-opacity`}>
        <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-saffron/10 blur-3xl" />
        <div className="relative">
          <div className="text-center mb-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-saffron">This week&apos;s top learners</p>
            {nobodyScored && <p className="mt-1 text-sm text-muted">No XP yet this week — be the first on the board!</p>}
          </div>
          <Podium rows={top} />
        </div>
      </div>

      {(rest.length > 0 || meHidden) && (
        <ul className={`${panelCls} p-2 sm:p-3 space-y-1`}>
          {rest.map(r => <Row key={`${r.rank}-${r.name}`} row={r} />)}
          {meHidden && data.me && (
            <>
              <li className="px-4 py-1 text-center text-muted text-xs">⋯</li>
              <Row row={data.me} />
            </>
          )}
        </ul>
      )}

      {data.me && (
        <p className="text-center text-sm text-muted">
          You&apos;re <b className="text-navy dark:text-dark-text">#{data.me.rank}</b> of {data.total} this week
          {data.me.rank > 1 && (() => {
            const ahead = data.rows.filter(r => r.rank < data.me!.rank).pop();
            const gap = ahead ? ahead.xp - data.me!.xp + 1 : 0;
            return gap > 0 ? <> — earn <b className="text-saffron">{gap} XP</b> to move up</> : null;
          })()}
          {data.me.rank === 1 && !nobodyScored && <> — you&apos;re leading! 🎉</>}
        </p>
      )}
      <p className="text-center text-[11px] text-muted">Only first names and initials are shown to classmates.</p>
    </div>
  );
}

function ClassChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      role="tab" aria-selected={active} onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
        active
          ? 'bg-navy text-white dark:bg-saffron'
          : 'bg-white dark:bg-dark-surface border border-card-border dark:border-dark-border text-navy/70 dark:text-dark-text/70 hover:border-saffron/50'
      }`}
    >
      {children}
    </button>
  );
}
