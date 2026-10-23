'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Activity, ArrowRight, Award, BarChart3, Medal, Trophy, Zap } from 'lucide-react';
import { levelTitle, type ProgressResponse } from '@/lib/badges';
import { api, EmptyState, ErrorNote, PageHeader, panelCls, Spinner, TeacherPage, timeAgo } from '@/components/teacher/ui';
import { XpBar, XpLevelRing, formatXp } from '@/components/student/xp-level-ring';
import { XpWeekChart } from '@/components/student/xp-week-chart';
import { BadgeGrid } from '@/components/student/achievement-badges';
import { BadgeCelebration, CelebrationStyles, useNewBadges } from '@/components/student/achievement-celebration';
import { Leaderboard } from '@/components/student/achievement-leaderboard';

type Tab = 'overview' | 'leaderboard';

function Hero({ p }: { p: ProgressResponse }) {
  const { level, streak } = p;
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-navy to-[#0E0D3E] dark:from-[#0F0F1A] dark:via-[#13132A] dark:to-[#0E0D3E] p-5 sm:p-8 text-white">
      <div className="pointer-events-none absolute -top-10 -right-10 w-72 h-72 bg-saffron/20 rounded-full blur-[90px]" />
      <div className="pointer-events-none absolute -bottom-16 left-1/4 w-72 h-72 bg-indigo-brand/20 rounded-full blur-[90px]" />
      <div className="relative grid gap-6 lg:grid-cols-[1fr_minmax(260px,340px)] lg:gap-10 lg:items-center">
        <div>
          <div className="flex items-center gap-4 sm:gap-6">
            <XpLevelRing level={level.level} intoLevel={level.intoLevel} levelSize={level.levelSize} size={104} tone="dark" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-saffron">{levelTitle(level.level)}</p>
              <p className="mt-1 font-heading font-bold text-3xl sm:text-4xl tabular-nums leading-none">
                {formatXp(p.totalXp)} <span className="text-base sm:text-lg font-semibold text-white/60">XP</span>
              </p>
              <XpBar intoLevel={level.intoLevel} levelSize={level.levelSize} tone="dark" className="mt-3" />
              <p className="mt-1.5 text-xs text-white/60 tabular-nums">
                {formatXp(level.levelSize - level.intoLevel)} XP to Level {level.level + 1}
              </p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { label: 'This week', value: formatXp(p.weekXp), sub: 'XP' },
              { label: 'Today', value: formatXp(p.todayXp), sub: 'XP' },
              { label: 'Badges', value: `${p.badges.filter(b => b.earned).length}`, sub: `/ ${p.badges.length}` },
            ].map(s => (
              <div key={s.label} className="rounded-2xl bg-white/[0.06] border border-white/10 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-widest text-white/50 font-semibold">{s.label}</p>
                <p className="mt-0.5 font-heading font-bold text-xl tabular-nums">{s.value} <span className="text-xs font-semibold text-white/50">{s.sub}</span></p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <span className={`text-4xl ${streak.current > 0 ? 'ach-flicker' : 'grayscale opacity-40'}`} aria-hidden>🔥</span>
            <div className="min-w-0 flex-1">
              <p className="font-heading font-bold text-2xl leading-none tabular-nums">
                {streak.current} <span className="text-sm font-semibold text-white/60">day streak</span>
              </p>
              <p className="mt-1 text-xs text-white/60">
                {streak.current === 0
                  ? 'Learn anything today to start a streak'
                  : streak.activeToday ? `Done for today · best ${streak.longest} days` : 'Learn today to keep it alive!'}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <XpWeekChart week={p.week} tone="dark" height={64} />
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionTitle({ icon, title, right }: { icon: React.ReactNode; title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <h2 className="flex items-center gap-2 font-heading font-bold text-lg text-navy dark:text-dark-text">
        <span className="text-saffron">{icon}</span>{title}
      </h2>
      {right}
    </div>
  );
}

function HowToEarn({ p }: { p: ProgressResponse }) {
  return (
    <section className={`${panelCls} p-4 sm:p-5`}>
      <SectionTitle icon={<Zap className="w-5 h-5" />} title="How to earn XP" />
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-wider text-muted">
            <th className="font-semibold pb-2">Action</th>
            <th className="font-semibold pb-2 text-right">XP</th>
            <th className="font-semibold pb-2 text-right pl-3">You</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-card-border dark:divide-dark-border">
          {p.xpRules.map(r => (
            <tr key={r.kind}>
              <td className="py-2.5 pr-2">
                <span className="flex items-center gap-2.5">
                  <span className="w-8 h-8 shrink-0 rounded-lg bg-saffron/10 dark:bg-saffron/20 flex items-center justify-center text-base" aria-hidden>{r.emoji}</span>
                  <span className="min-w-0">
                    <span className="block font-medium text-navy dark:text-dark-text leading-tight">{r.label}</span>
                    {r.note && <span className="block text-[11px] text-muted">{r.note}</span>}
                  </span>
                </span>
              </td>
              <td className="py-2.5 text-right font-bold text-saffron tabular-nums whitespace-nowrap">+{r.points}</td>
              <td className="py-2.5 pl-3 text-right text-muted tabular-nums whitespace-nowrap">{r.count ? `${r.count}×` : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-[11px] text-muted">Every action that earns XP also counts towards your daily streak. Each level needs 100 XP more than the last.</p>
    </section>
  );
}

function RecentActivity({ p }: { p: ProgressResponse }) {
  return (
    <section className={`${panelCls} p-4 sm:p-5`}>
      <SectionTitle icon={<Activity className="w-5 h-5" />} title="Recent activity" />
      {!p.recent.length ? (
        <div className="py-8 text-center text-sm text-muted">
          No XP yet. <Link href="/library" className="text-saffron font-semibold hover:underline">Watch a lesson</Link> to earn your first 10 XP.
        </div>
      ) : (
        <ol className="space-y-1">
          {p.recent.map(e => (
            <li key={e.id} className="flex items-center gap-3 py-2">
              <span className="w-9 h-9 shrink-0 rounded-full bg-gray-100 dark:bg-dark-border flex items-center justify-center text-base" aria-hidden>{e.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-navy dark:text-dark-text truncate">{e.label}</p>
                <p className="text-[11px] text-muted truncate">{e.detail ? `${e.detail} · ` : ''}{timeAgo(e.createdAt)}</p>
              </div>
              <span className="shrink-0 rounded-full bg-teal/10 dark:bg-teal/20 px-2 py-0.5 text-xs font-bold text-teal tabular-nums">+{e.points}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function Strengths({ p }: { p: ProgressResponse }) {
  const list = p.strengths;
  return (
    <section className={`${panelCls} p-4 sm:p-5`}>
      <SectionTitle icon={<BarChart3 className="w-5 h-5" />} title="Strengths by subject" right={list.length > 0 && <span className="text-[11px] text-muted">avg. score in quizzes &amp; mocks</span>} />
      {!list.length ? (
        <div className="py-6 text-center text-sm text-muted">
          Finish a <Link href="/classes" className="text-saffron font-semibold hover:underline">class quiz</Link> or a{' '}
          <Link href="/practice" className="text-saffron font-semibold hover:underline">mock test</Link> to see where you shine.
        </div>
      ) : (
        <ul className="space-y-3.5">
          {list.map((s, i) => {
            const strongest = i === 0 && list.length > 1;
            const weakest = i === list.length - 1 && list.length > 1 && s.pct < 75;
            return (
              <li key={s.subject}>
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <p className="text-sm font-semibold text-navy dark:text-dark-text truncate">
                    {s.subject}
                    {strongest && <span className="ml-2 pill-teal !text-[10px] !px-1.5 !py-0">💪 Strongest</span>}
                    {weakest && <span className="ml-2 pill-saffron !text-[10px] !px-1.5 !py-0">🎯 Practise more</span>}
                  </p>
                  <p className="shrink-0 text-sm font-bold text-navy dark:text-dark-text tabular-nums">{s.pct}%</p>
                </div>
                <div className="h-2 rounded-full bg-gray-100 dark:bg-dark-border overflow-hidden">
                  <div className="h-full rounded-full bg-indigo-brand" style={{ width: `${Math.max(2, s.pct)}%` }} />
                </div>
                <p className="mt-1 text-[11px] text-muted">
                  {[s.quizzes && `${s.quizzes} class quiz${s.quizzes === 1 ? '' : 'zes'}`, s.mocks && `${s.mocks} mock test${s.mocks === 1 ? '' : 's'}`].filter(Boolean).join(' · ')}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default function AchievementsPage() {
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const [tab, setTab] = useState<Tab>('overview');
  const [p, setP] = useState<ProgressResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(true);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('tab') === 'leaderboard') setTab('leaderboard');
    api<ProgressResponse>('/api/student/progress').then(setP).catch(e => setError((e as Error).message));
  }, []);

  const switchTab = (t: Tab) => {
    setTab(t);
    try { window.history.replaceState(null, '', t === 'leaderboard' ? '?tab=leaderboard' : window.location.pathname); } catch { /* ignore */ }
  };

  const { fresh, markSeen } = useNewBadges(userId, p?.badges);
  const newIds = useMemo(() => new Set(fresh), [fresh]);
  const freshBadges = useMemo(() => (p?.badges ?? []).filter(b => newIds.has(b.id)), [p, newIds]);
  const closeCelebration = useCallback(() => { setCelebrate(false); markSeen(); }, [markSeen]);

  const earned = p?.badges.filter(b => b.earned).length ?? 0;

  return (
    <TeacherPage>
      <CelebrationStyles />
      <PageHeader
        icon={<Trophy className="w-5 h-5" />}
        title="Achievements"
        subtitle="Earn XP for every bit of learning — level up, unlock badges and top your class this week."
      />

      <div className="mb-6 inline-flex rounded-full bg-white dark:bg-dark-surface border border-card-border dark:border-dark-border p-1" role="tablist" aria-label="Achievements sections">
        {([['overview', 'My progress', Award], ['leaderboard', 'Class leaderboard', Medal]] as const).map(([id, label, Icon]) => (
          <button
            key={id} role="tab" aria-selected={tab === id} onClick={() => switchTab(id)}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              tab === id ? 'bg-saffron text-white shadow-saffron' : 'text-navy/70 dark:text-dark-text/70 hover:text-navy dark:hover:text-dark-text'
            }`}
          >
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {tab === 'leaderboard' ? (
        <Leaderboard />
      ) : error ? (
        <ErrorNote>{error}</ErrorNote>
      ) : !p ? (
        <Spinner label="Loading your progress…" />
      ) : (
        <div className="space-y-6">
          <Hero p={p} />

          <section>
            <SectionTitle
              icon={<Award className="w-5 h-5" />}
              title="Badges"
              right={<span className="text-sm text-muted"><b className="text-navy dark:text-dark-text">{earned}</b> of {p.badges.length} earned</span>}
            />
            <BadgeGrid badges={p.badges} newIds={newIds} />
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <RecentActivity p={p} />
            <div className="space-y-6">
              <Strengths p={p} />
              <HowToEarn p={p} />
            </div>
          </div>

          {p.totalXp === 0 && (
            <EmptyState icon={<Zap className="w-6 h-6" />} title="Your XP journey starts here">
              <p>Watch a lesson, ask a doubt or review flashcards — every action earns XP.</p>
              <Link href="/doubts" className="inline-flex items-center gap-1 mt-3 text-saffron font-semibold">Ask your first doubt <ArrowRight className="w-4 h-4" /></Link>
            </EmptyState>
          )}
        </div>
      )}

      {celebrate && freshBadges.length > 0 && tab === 'overview' && (
        <BadgeCelebration badges={freshBadges} onClose={closeCelebration} />
      )}
    </TeacherPage>
  );
}
