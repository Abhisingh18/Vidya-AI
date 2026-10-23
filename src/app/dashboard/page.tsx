'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Play, BookOpen, Globe, Flame, Sparkles, ArrowRight, Clock,
  Calculator, Atom, FlaskConical, Leaf, Zap, Monitor, Landmark,
  Loader2, Target, TrendingUp, Lightbulb, Trophy, CalendarDays, CheckCircle2, Circle, Layers,
} from 'lucide-react';
import { istDayKey, levelTitle, nextBadge, recentBadges, type ProgressResponse } from '@/lib/badges';
import { XpBar, XpLevelRing, formatXp } from '@/components/student/xp-level-ring';
import { BadgeMedal, badgeProgressText } from '@/components/student/achievement-badges';

interface VideoSummary {
  id: string; topic: string; language: string; grade: string;
  subject: string | null; duration: number | null; createdAt: string;
}

interface Stats {
  videoCount: number;
  watchCount: number;
  downloadCount: number;
  languagesUsed: number;
  topicCount: number;
  streak: { current: number; longest: number; lastActiveAt: string | null };
  recentVideos: VideoSummary[];
  subjectBreakdown: { subject: string; count: number }[];
  tools?: {
    plan: TodaysPlan | null;
    flashcards: { decks: number; due: number; dueDecks: number; topDeck: { id: string; title: string; due: number } | null } | null;
  };
}

interface TodaysPlan {
  id: string;
  title: string;
  examName: string | null;
  daysLeft: number | null;
  state: string | null;
  overdue: number;
  tasks: { id: string; title: string; type: string; subject: string; minutes: number; done: boolean; href: string }[];
}

const STUDY_TOOLS = [
  { name: 'Ask a doubt',    emoji: '📸', href: '/doubts',       blurb: 'Snap a question, get steps', count: (p: ProgressResponse) => p.counts.doubt && `${p.counts.doubt} solved` },
  { name: 'Flashcards',     emoji: '🃏', href: '/flashcards',   blurb: 'Smart spaced revision',      count: (p: ProgressResponse) => p.counts.flashcards && `${p.counts.flashcards} deck${p.counts.flashcards === 1 ? '' : 's'}` },
  { name: 'Revision notes', emoji: '📄', href: '/notes',        blurb: 'Crisp chapter notes',        count: (p: ProgressResponse) => p.counts.notes && `${p.counts.notes} made` },
  { name: 'Mock test',      emoji: '📝', href: '/practice',     blurb: 'Timed, exam-style',          count: (p: ProgressResponse) => p.counts.mock && `${p.counts.mock} taken` },
  { name: 'Study planner',  emoji: '📅', href: '/planner',      blurb: 'Day-by-day exam plan',       count: (p: ProgressResponse) => p.counts.plan && `${p.counts.plan} plan${p.counts.plan === 1 ? '' : 's'}` },
  { name: 'Achievements',   emoji: '🏆', href: '/achievements', blurb: 'Badges & leaderboard',       count: (p: ProgressResponse) => `${p.badges.filter(b => b.earned).length}/${p.badges.length} badges` },
];

const QUICK_TOPICS = [
  { name: 'Pythagoras Theorem', subject: 'Mathematics' },
  { name: 'Integration', subject: 'Mathematics' },
  { name: "Newton's Laws", subject: 'Physics' },
  { name: 'Photosynthesis', subject: 'Biology' },
  { name: 'DNA Structure', subject: 'Biology' },
  { name: 'Periodic Table', subject: 'Chemistry' },
  { name: 'Trigonometry', subject: 'Mathematics' },
  { name: "Ohm's Law", subject: 'Physics' },
];

const EXPLORE_SUBJECTS = [
  { name: 'Mathematics',      icon: Calculator,  color: 'from-indigo-brand to-indigo-brand-300',     count: '120+ topics', accent: 'text-indigo-brand', bg: 'bg-indigo-brand/10' },
  { name: 'Physics',          icon: Atom,        color: 'from-teal to-teal-300',                       count: '80+ topics',  accent: 'text-teal',         bg: 'bg-teal/10' },
  { name: 'Chemistry',        icon: FlaskConical,color: 'from-saffron to-saffron-300',                 count: '70+ topics',  accent: 'text-saffron',      bg: 'bg-saffron/10' },
  { name: 'Biology',          icon: Leaf,        color: 'from-emerald-500 to-emerald-300',             count: '60+ topics',  accent: 'text-emerald-600',  bg: 'bg-emerald-500/10' },
  { name: 'History',          icon: Landmark,    color: 'from-amber-500 to-amber-300',                 count: '40+ topics',  accent: 'text-amber-600',    bg: 'bg-amber-500/10' },
  { name: 'Computer Science', icon: Monitor,     color: 'from-violet-500 to-violet-300',               count: '50+ topics',  accent: 'text-violet-600',   bg: 'bg-violet-500/10' },
];

const TIPS = [
  'Use specific topics — "Integration by parts" works better than just "Calculus".',
  'Try generating the same topic in two languages to compare explanations.',
  'Bookmark difficult topics to revisit them later.',
  'A 5-minute video can teach what 30 minutes of reading often can\'t.',
  'Watch generated videos at 1.25× speed for quick reviews.',
];

function subjectStyle(subject: string | null | undefined) {
  switch (subject) {
    case 'Mathematics':      return { gradient: 'bg-gradient-indigo',                          pill: 'pill-indigo', icon: <Calculator className="w-10 h-10 text-white/20" /> };
    case 'Physics':          return { gradient: 'bg-gradient-teal',                            pill: 'pill-teal',   icon: <Atom className="w-10 h-10 text-white/20" /> };
    case 'Chemistry':        return { gradient: 'bg-gradient-saffron',                         pill: 'pill-saffron',icon: <FlaskConical className="w-10 h-10 text-white/20" /> };
    case 'Biology':          return { gradient: 'bg-gradient-to-br from-emerald-500 to-green-400', pill: 'pill-teal',   icon: <Leaf className="w-10 h-10 text-white/20" /> };
    case 'History':          return { gradient: 'bg-gradient-to-br from-amber-500 to-yellow-400', pill: 'pill-saffron',icon: <Landmark className="w-10 h-10 text-white/20" /> };
    case 'Computer Science': return { gradient: 'bg-gradient-indigo',                          pill: 'pill-indigo', icon: <Monitor className="w-10 h-10 text-white/20" /> };
    default:                 return { gradient: 'bg-gradient-saffron',                         pill: 'pill-saffron',icon: <Sparkles className="w-10 h-10 text-white/20" /> };
  }
}

function relativeTime(date: string): string {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
  return `${Math.floor(diff / 604800)} weeks ago`;
}

/* ── Stat Card ── */
function StatCard({ icon, iconColor, iconBg, value, label, accent }: {
  icon: React.ReactNode; iconColor: string; iconBg: string; value: string | number; label: string; accent?: string;
}) {
  return (
    <div className="card group hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className={`${iconBg} w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110`}>
          <span className={iconColor}>{icon}</span>
        </div>
        {accent && <span className="text-[10px] text-muted font-semibold uppercase tracking-wider">{accent}</span>}
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold font-heading text-navy dark:text-dark-text tabular-nums">{value}</p>
        <p className="text-sm text-muted mt-0.5">{label}</p>
      </div>
    </div>
  );
}

/* ── Mini streak calendar (last 7 days) ── */
function StreakCalendar({ lastActive, activeDays }: { lastActive: string | null; activeDays?: string[] }) {
  const today = new Date();
  const days: { day: string; active: boolean; isToday: boolean }[] = [];
  const active = new Set(activeDays ?? []);

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' })[0];
    const isToday = i === 0;
    // Days with XP (IST) when known; otherwise just the last active day.
    const isActive = activeDays
      ? active.has(istDayKey(d)) || (!!lastActive && new Date(lastActive).toDateString() === d.toDateString())
      : lastActive
      ? new Date(lastActive).toDateString() === d.toDateString()
      : false;
    days.push({ day: dayLabel, active: isActive, isToday });
  }

  return (
    <div className="flex items-center justify-between gap-1.5 mt-4">
      {days.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
          <div className={`w-full aspect-square rounded-lg flex items-center justify-center text-[10px] font-semibold transition-all ${
            d.active
              ? 'bg-gradient-saffron text-white shadow-saffron/30 shadow-sm'
              : d.isToday
              ? 'border-2 border-dashed border-saffron/40 text-saffron'
              : 'bg-gray-100 dark:bg-dark-border/50 text-muted/60'
          }`}>
            {d.active && <Flame className="w-3 h-3" />}
          </div>
          <span className="text-[9px] text-muted uppercase">{d.day}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Video Card ── */
function VideoCard({ video }: { video: VideoSummary }) {
  const style = subjectStyle(video.subject);
  const duration = video.duration ? `${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, '0')}` : '—';

  return (
    <div className="group card p-0 overflow-hidden cursor-pointer">
      <div className={`relative h-32 ${style.gradient} flex items-center justify-center`}>
        {style.icon}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20">
          <div className="bg-white/95 dark:bg-dark-surface rounded-full w-11 h-11 flex items-center justify-center shadow-lg">
            <Play className="w-4 h-4 text-saffron fill-saffron ml-0.5" />
          </div>
        </div>
        <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded font-mono">{duration}</span>
      </div>
      <div className="p-3.5 space-y-2">
        <h3 className="font-semibold text-sm text-navy dark:text-dark-text line-clamp-2 leading-snug group-hover:text-saffron transition-colors min-h-[2.5rem]">{video.topic}</h3>
        <div className="flex items-center flex-wrap gap-1.5">
          <span className={`${style.pill} !text-[10px] !px-2 !py-0.5`}>{video.subject ?? 'General'}</span>
          <span className="pill bg-gray-100 dark:bg-dark-border text-muted text-[10px] !px-2 !py-0.5">{video.language}</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-muted">
          <Clock className="w-3 h-3" />{relativeTime(video.createdAt)}
        </div>
      </div>
    </div>
  );
}

/* ── XP / level + streak ── */
function ProgressCard({ p }: { p: ProgressResponse | null }) {
  if (!p) return <div className="skeleton h-[148px] mb-6" aria-hidden />;
  const { level, streak } = p;
  return (
    <section className="card !p-5 sm:!p-6 mb-6 hover:!translate-y-0">
      <div className="flex flex-col md:flex-row md:items-center gap-5">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <XpLevelRing level={level.level} intoLevel={level.intoLevel} levelSize={level.levelSize} size={84} stroke={8} />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-widest text-saffron font-semibold">Level {level.level} · {levelTitle(level.level)}</p>
            <p className="font-heading font-bold text-2xl text-navy dark:text-dark-text tabular-nums">
              {formatXp(p.totalXp)} <span className="text-sm font-semibold text-muted">XP</span>
            </p>
            <XpBar intoLevel={level.intoLevel} levelSize={level.levelSize} className="mt-2" />
            <p className="mt-1 text-[11px] text-muted tabular-nums">{formatXp(level.levelSize - level.intoLevel)} XP to Level {level.level + 1}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 md:w-[360px] shrink-0">
          <div className="rounded-xl bg-saffron/5 dark:bg-saffron/10 border border-saffron/15 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wider text-muted font-semibold">Streak</p>
            <p className="font-heading font-bold text-lg text-navy dark:text-dark-text tabular-nums">
              <span className={streak.current ? '' : 'grayscale opacity-50'} aria-hidden>🔥</span> {streak.current}
              <span className="text-[11px] font-semibold text-muted"> day{streak.current === 1 ? '' : 's'}</span>
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 dark:bg-dark-bg/60 border border-card-border dark:border-dark-border px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wider text-muted font-semibold">This week</p>
            <p className="font-heading font-bold text-lg text-navy dark:text-dark-text tabular-nums">{formatXp(p.weekXp)} <span className="text-[11px] font-semibold text-muted">XP</span></p>
          </div>
          <div className="rounded-xl bg-gray-50 dark:bg-dark-bg/60 border border-card-border dark:border-dark-border px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wider text-muted font-semibold">Today</p>
            <p className="font-heading font-bold text-lg text-navy dark:text-dark-text tabular-nums">+{formatXp(p.todayXp)} <span className="text-[11px] font-semibold text-muted">XP</span></p>
          </div>
        </div>
        <Link href="/achievements" className="btn-outline !px-4 !py-2 text-sm shrink-0 self-start md:self-center">
          <Trophy className="w-4 h-4" /> Achievements
        </Link>
      </div>
      {streak.current > 0 && !streak.activeToday && (
        <p className="mt-4 text-xs text-navy dark:text-dark-text rounded-xl bg-saffron/5 border border-saffron/20 px-3 py-2">
          🔥 Your {streak.current}-day streak ends tonight — do one thing today to keep it!
        </p>
      )}
    </section>
  );
}

/* ── Study tools quick actions ── */
function StudyTools({ p }: { p: ProgressResponse | null }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-heading font-bold text-navy dark:text-dark-text mb-4">Study tools</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {STUDY_TOOLS.map(t => {
          const count = p ? t.count(p) : null;
          return (
            <Link
              key={t.href}
              href={t.href}
              className="group relative flex flex-col rounded-2xl border border-card-border dark:border-dark-border bg-white dark:bg-dark-surface p-4 shadow-card dark:shadow-card-dark hover:border-saffron/50 hover:-translate-y-0.5 hover:shadow-card-hover transition-all"
            >
              <span className="w-11 h-11 rounded-xl bg-saffron/10 dark:bg-saffron/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform" aria-hidden>{t.emoji}</span>
              <span className="mt-3 font-heading font-semibold text-sm text-navy dark:text-dark-text group-hover:text-saffron transition-colors">{t.name}</span>
              <span className="mt-0.5 text-[11px] text-muted leading-snug">{t.blurb}</span>
              {count && <span className="mt-2 self-start rounded-full bg-gray-100 dark:bg-dark-border px-2 py-0.5 text-[10px] font-semibold text-muted">{count}</span>}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/* ── Today's plan ── */
function TodaysPlanCard({ plan }: { plan: TodaysPlan | null | undefined }) {
  if (!plan) {
    return (
      <section className="relative card overflow-hidden hover:!translate-y-0 bg-gradient-to-br from-indigo-brand/5 via-white to-saffron/5 dark:from-indigo-brand/10 dark:via-dark-surface dark:to-saffron/10 border-indigo-brand/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-indigo flex items-center justify-center shrink-0 shadow-indigo">
            <CalendarDays className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-heading font-bold text-lg text-navy dark:text-dark-text">Plan your exam prep</h3>
            <p className="text-sm text-muted mt-1 leading-relaxed">Tell us your exam date and chapters — get a day-by-day plan with revision and mock tests built in.</p>
            <Link href="/planner" className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-indigo-brand dark:text-indigo-brand-300 hover:gap-2 transition-all">
              Create a study plan <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    );
  }
  const done = plan.tasks.filter(t => t.done).length;
  return (
    <section className="card hover:!translate-y-0">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-indigo-brand/10 dark:bg-indigo-brand/20 flex items-center justify-center shrink-0">
            <CalendarDays className="w-5 h-5 text-indigo-brand dark:text-indigo-brand-300" />
          </div>
          <div className="min-w-0">
            <h2 className="font-heading font-semibold text-lg text-navy dark:text-dark-text">Today&apos;s plan</h2>
            <p className="text-xs text-muted truncate">
              {plan.examName || plan.title}
              {plan.daysLeft !== null && plan.daysLeft > 0 && <> · {plan.daysLeft} day{plan.daysLeft === 1 ? '' : 's'} to go</>}
            </p>
          </div>
        </div>
        {plan.tasks.length > 0 && (
          <span className="shrink-0 text-xs font-semibold text-muted tabular-nums">{done}/{plan.tasks.length} done</span>
        )}
      </div>
      {plan.tasks.length === 0 ? (
        <p className="text-sm text-muted rounded-xl bg-gray-50 dark:bg-dark-bg/60 px-4 py-3">
          {plan.state === 'exam-over' ? 'This plan is finished — all the best! 🎉' : 'Nothing scheduled today. Enjoy the break, or get ahead in your planner.'}
        </p>
      ) : (
        <ul className="space-y-2">
          {plan.tasks.map(t => (
            <li key={t.id}>
              <Link href={t.href} className="group flex items-center gap-3 rounded-xl border border-card-border dark:border-dark-border px-3 py-2.5 hover:border-saffron/50 transition-colors">
                {t.done
                  ? <CheckCircle2 className="w-5 h-5 text-teal shrink-0" />
                  : <Circle className="w-5 h-5 text-muted/50 shrink-0" />}
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium truncate ${t.done ? 'text-muted line-through' : 'text-navy dark:text-dark-text'}`}>{t.title}</p>
                  <p className="text-[11px] text-muted truncate">{t.subject} · {t.minutes} min</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted group-hover:text-saffron group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
      {plan.overdue > 0 && <p className="mt-3 text-xs text-saffron font-medium">{plan.overdue} task{plan.overdue === 1 ? '' : 's'} from earlier days still open</p>}
      <Link href={`/planner/${plan.id}`} className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-saffron hover:gap-2 transition-all">
        Open planner <ArrowRight className="w-4 h-4" />
      </Link>
    </section>
  );
}

/* ── Due flashcards ── */
function DueFlashcardsCard({ data }: { data: NonNullable<Stats['tools']>['flashcards'] | undefined }) {
  if (!data) return null;
  const href = data.topDeck ? `/flashcards/${data.topDeck.id}` : '/flashcards';
  return (
    <div className="card relative overflow-hidden hover:!translate-y-0">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-teal/10 rounded-full blur-2xl" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-teal" />
          <p className="text-[10px] uppercase tracking-widest text-muted font-semibold">Flashcards</p>
        </div>
        {data.decks === 0 ? (
          <>
            <p className="text-sm font-semibold text-navy dark:text-dark-text">Remember more with flashcards</p>
            <p className="text-xs text-muted mt-1">Turn any chapter into a smart revision deck.</p>
            <Link href="/flashcards" className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-teal hover:gap-2 transition-all">Make a deck <ArrowRight className="w-4 h-4" /></Link>
          </>
        ) : data.due === 0 ? (
          <>
            <p className="text-sm font-semibold text-navy dark:text-dark-text">All caught up ✅</p>
            <p className="text-xs text-muted mt-1">No cards due today across {data.decks} deck{data.decks === 1 ? '' : 's'}.</p>
          </>
        ) : (
          <>
            <p className="font-heading font-bold text-2xl text-navy dark:text-dark-text tabular-nums">{data.due} <span className="text-sm font-semibold text-muted">card{data.due === 1 ? '' : 's'} due</span></p>
            <p className="text-xs text-muted mt-1 truncate">{data.topDeck ? `Start with “${data.topDeck.title}”` : `${data.dueDecks} decks to review`}</p>
            <Link href={href} className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-teal hover:gap-2 transition-all">Review now <ArrowRight className="w-4 h-4" /></Link>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Badges teaser ── */
function BadgesCard({ p }: { p: ProgressResponse | null }) {
  if (!p) return null;
  const recent = recentBadges(p.badges, 3);
  const next = nextBadge(p.badges);
  return (
    <div className="card bg-gradient-to-br from-indigo-brand/5 to-saffron/5 dark:from-indigo-brand/10 dark:to-saffron/10 border-indigo-brand/20 hover:!translate-y-0">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-saffron" />
          <p className="text-[10px] uppercase tracking-widest text-muted font-semibold">Badges</p>
        </div>
        <Link href="/achievements" className="text-xs text-saffron font-semibold hover:underline">All {p.badges.length} →</Link>
      </div>
      {recent.length > 0 && (
        <div className="flex items-start gap-3 mb-4">
          {recent.map(b => (
            <div key={b.id} className="flex-1 min-w-0 text-center">
              <BadgeMedal badge={b} size={48} />
              <p className="mt-1.5 text-[11px] font-semibold text-navy dark:text-dark-text truncate">{b.title}</p>
            </div>
          ))}
        </div>
      )}
      {next && (
        <>
          <p className="text-[10px] uppercase tracking-widest text-muted font-semibold">Next milestone</p>
          <p className="text-sm font-semibold text-navy dark:text-dark-text mt-1"><span aria-hidden>{next.emoji}</span> {next.title}</p>
          <p className="text-xs text-muted mt-0.5">{next.description} · {badgeProgressText(next)}</p>
          <div className="mt-2 h-2 rounded-full bg-gray-100 dark:bg-dark-border/50 overflow-hidden">
            <div className="h-full bg-gradient-saffron transition-all duration-700" style={{ width: `${Math.round(next.progress * 100)}%` }} />
          </div>
        </>
      )}
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)]);

  useEffect(() => {
    fetch('/api/user/stats')
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {})
      .finally(() => setLoading(false));
    // XP, badges and study-tool counts load alongside; the page never waits on them.
    fetch('/api/student/progress')
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d && typeof d.totalXp === 'number') setProgress(d); })
      .catch(() => {});
  }, []);

  const firstName = session?.user?.name?.split(' ')[0] ?? 'there';
  const recent = stats?.recentVideos ?? [];
  const isNewUser = recent.length === 0;
  const dateString = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  if (loading) {
    return (
      <main className="min-h-screen bg-off-white dark:bg-dark-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-saffron animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-off-white dark:bg-dark-bg">
      <div className="container-main pt-24 pb-16">

        {/* ── Welcome bar ── */}
        <section className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-navy to-[#0E0D3E] dark:from-[#0F0F1A] dark:via-[#0F0F1A] dark:to-[#0E0D3E] p-8 lg:p-10">
          <div className="pointer-events-none absolute top-0 right-0 w-80 h-80 bg-saffron/15 rounded-full blur-[100px]" />
          <div className="pointer-events-none absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-brand/15 rounded-full blur-[100px]" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-saffron font-semibold mb-2">{dateString}</p>
              <h1 className="text-3xl lg:text-4xl font-heading font-bold text-white leading-tight">
                Welcome back, {firstName} <span className="inline-block animate-bounce-gentle">👋</span>
              </h1>
              <p className="text-gray-400 mt-2 text-base">
                {isNewUser
                  ? "Ready to learn something new today? Let's create your first video."
                  : `You're on a ${stats?.streak.current ?? 0}-day learning streak. Keep it going!`}
              </p>
            </div>
            <Link href="/generate" className="btn-saffron whitespace-nowrap self-start lg:self-auto shadow-saffron/40">
              <Zap className="w-4 h-4" />
              Generate New Video
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* ── XP / level + streak ── */}
        <ProgressCard p={progress} />

        {/* ── Study tools ── */}
        <StudyTools p={progress} />

        {/* ── Stats row ── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard
            icon={<Play className="w-5 h-5" />}
            iconColor="text-saffron"
            iconBg="bg-saffron/10 dark:bg-saffron/20"
            value={stats?.videoCount ?? 0}
            label="Videos Generated"
          />
          <StatCard
            icon={<BookOpen className="w-5 h-5" />}
            iconColor="text-indigo-brand"
            iconBg="bg-indigo-brand/10 dark:bg-indigo-brand/20"
            value={stats?.topicCount ?? 0}
            label="Topics Covered"
          />
          <StatCard
            icon={<Globe className="w-5 h-5" />}
            iconColor="text-teal"
            iconBg="bg-teal/10 dark:bg-teal/20"
            value={stats?.languagesUsed ?? 0}
            label="Languages Used"
          />
          <StatCard
            icon={<Flame className="w-5 h-5" />}
            iconColor="text-saffron"
            iconBg="bg-saffron/10 dark:bg-saffron/20"
            value={`${stats?.streak.current ?? 0} ${stats?.streak.current === 1 ? 'day' : 'days'}`}
            label="Learning Streak"
            accent="🔥"
          />
        </section>

        {/* ── Quick Start ── */}
        <section className="mb-10 card">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-saffron/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-saffron" />
              </div>
              <div>
                <h2 className="font-heading font-semibold text-lg text-navy dark:text-dark-text">Quick Start</h2>
                <p className="text-xs text-muted">Click a topic to generate a video instantly</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_TOPICS.map(t => (
              <Link
                key={t.name}
                href={`/generate?topic=${encodeURIComponent(t.name)}`}
                className="group flex items-center gap-2 px-4 py-2.5 rounded-xl border border-card-border dark:border-dark-border bg-white dark:bg-dark-surface hover:border-saffron hover:bg-saffron/5 transition-all duration-200"
              >
                <span className="text-sm font-medium text-navy dark:text-dark-text group-hover:text-saffron transition-colors">{t.name}</span>
                <ArrowRight className="w-3.5 h-3.5 text-muted group-hover:text-saffron group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>
        </section>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT — 2/3 */}
          <div className="lg:col-span-2 space-y-6">

            {/* Today's plan (latest study plan) */}
            <TodaysPlanCard plan={stats?.tools?.plan} />

            {/* Recent Videos / Explore */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-heading font-bold text-navy dark:text-dark-text">
                  {isNewUser ? 'Explore Subjects' : 'Recent Videos'}
                </h2>
                {!isNewUser && (
                  <Link href="/library" className="text-sm text-saffron hover:underline font-medium">
                    View all →
                  </Link>
                )}
              </div>

              {isNewUser ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {EXPLORE_SUBJECTS.map(s => {
                    const Icon = s.icon;
                    return (
                      <Link
                        key={s.name}
                        href={`/generate?topic=${encodeURIComponent(s.name)}`}
                        className="group relative card p-5 overflow-hidden hover:-translate-y-1 transition-all"
                      >
                        <div className={`absolute top-0 right-0 w-24 h-24 ${s.bg} rounded-full blur-2xl opacity-50 group-hover:opacity-80 transition-opacity`} />
                        <div className="relative">
                          <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                            <Icon className={`w-5 h-5 ${s.accent}`} />
                          </div>
                          <h3 className="font-heading font-semibold text-navy dark:text-dark-text">{s.name}</h3>
                          <p className="text-xs text-muted mt-1">{s.count}</p>
                          <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${s.accent} opacity-0 group-hover:opacity-100 transition-opacity`}>
                            Explore <ArrowRight className="w-3 h-3" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recent.slice(0, 6).map(v => <VideoCard key={v.id} video={v} />)}
                </div>
              )}
            </section>

            {/* Learning Goal Card (only for new users) */}
            {isNewUser && (
              <section className="relative card overflow-hidden bg-gradient-to-br from-saffron/5 via-white to-indigo-brand/5 dark:from-saffron/10 dark:via-dark-surface dark:to-indigo-brand/10 border-saffron/20">
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-saffron flex items-center justify-center shrink-0 shadow-saffron/30 shadow-md">
                    <Target className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading font-bold text-lg text-navy dark:text-dark-text">Your first lesson awaits</h3>
                    <p className="text-sm text-muted mt-1 leading-relaxed">
                      Type any topic — from algebra to ancient history — and we&apos;ll create an animated explanation in your language.
                    </p>
                    <Link href="/generate" className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-saffron hover:gap-2 transition-all">
                      Generate your first video <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* RIGHT SIDEBAR — 1/3 */}
          <aside className="space-y-6">

            {/* Streak card with mini calendar */}
            <div className="card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-saffron/10 rounded-full blur-2xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-saffron flex items-center justify-center shadow-saffron/30 shadow-md">
                      <Flame className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-muted font-semibold">Current Streak</p>
                      <p className="font-heading font-bold text-2xl text-navy dark:text-dark-text">
                        {stats?.streak.current ?? 0} day{(stats?.streak.current ?? 0) !== 1 && 's'}
                      </p>
                    </div>
                  </div>
                  {(stats?.streak.longest ?? 0) > 0 && (
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-widest text-muted font-semibold">Best</p>
                      <p className="text-lg font-bold font-heading text-navy dark:text-dark-text">
                        {stats?.streak.longest} <span className="text-xs text-muted font-normal">days</span>
                      </p>
                    </div>
                  )}
                </div>

                <StreakCalendar lastActive={stats?.streak.lastActiveAt ?? null} activeDays={progress?.activeDays} />

                {(stats?.streak.current ?? 0) === 0 && (
                  <div className="mt-4 p-3 rounded-xl bg-saffron/5 border border-saffron/20">
                    <p className="text-xs text-navy dark:text-dark-text">
                      Generate or watch a video today to start your streak 🚀
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Tip of the day */}
            <div className="card relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-brand/10 rounded-full blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-indigo-brand" />
                  <p className="text-[10px] uppercase tracking-widest text-muted font-semibold">Today&apos;s Tip</p>
                </div>
                <p className="text-sm text-navy dark:text-dark-text leading-relaxed">{tip}</p>
              </div>
            </div>

            {/* Activity (only if has data) */}
            {!isNewUser && (
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-teal" />
                  <h3 className="font-heading font-semibold text-sm text-navy dark:text-dark-text uppercase tracking-widest">Your Activity</h3>
                </div>
                <ul className="space-y-3 text-sm">
                  {[
                    { label: 'Videos generated', value: stats?.videoCount ?? 0 },
                    { label: 'Videos watched',   value: stats?.watchCount ?? 0 },
                    { label: 'Downloads',        value: stats?.downloadCount ?? 0 },
                    { label: 'Languages used',   value: stats?.languagesUsed ?? 0 },
                  ].map(s => (
                    <li key={s.label} className="flex items-center justify-between">
                      <span className="text-muted">{s.label}</span>
                      <span className="font-bold font-heading text-navy dark:text-dark-text tabular-nums">{s.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Due flashcards */}
            <DueFlashcardsCard data={stats?.tools?.flashcards} />

            {/* Badges: recent + next milestone */}
            <BadgesCard p={progress} />
          </aside>
        </div>
      </div>
    </main>
  );
}
