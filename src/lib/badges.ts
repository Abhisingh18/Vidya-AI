// Gamification rules that don't touch the database, so both the API routes and
// client components can import them. XP awards live in src/lib/xp.ts.

// ── Time (IST) ───────────────────────────────────────────────────────
// Weeks and days are counted in India Standard Time (UTC+5:30, no DST), so
// the weekly leaderboard resets at Monday 00:00 IST for every student.

const IST_OFFSET_MS = 330 * 60_000;
const DAY_MS = 86_400_000;

/** "YYYY-MM-DD" of the IST calendar day containing `d`. */
export function istDayKey(d: Date | number): string {
  return new Date(new Date(d).getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** The instant the IST day containing `now` began. */
export function istDayStart(now: Date = new Date()): Date {
  const shifted = new Date(now.getTime() + IST_OFFSET_MS);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - IST_OFFSET_MS);
}

/** Monday 00:00 IST of the week containing `now`. */
export function istWeekStart(now: Date = new Date()): Date {
  const day = istDayStart(now);
  const dow = new Date(day.getTime() + IST_OFFSET_MS).getUTCDay(); // 0 = Sunday
  return new Date(day.getTime() - ((dow + 6) % 7) * DAY_MS);
}

/** The seven IST day keys (Mon–Sun) of the week starting at `weekStart`. */
export function istWeekDays(weekStart: Date): string[] {
  return Array.from({ length: 7 }, (_, i) => istDayKey(weekStart.getTime() + i * DAY_MS));
}

// ── Levels ───────────────────────────────────────────────────────────

/** Total XP needed to reach `level` (mirrors levelFor in xp.ts: +100 XP per level). */
export function xpToReachLevel(level: number): number {
  return 50 * level * (level - 1);
}

const LEVEL_TITLES = ['Beginner', 'Explorer', 'Rising Scholar', 'Achiever', 'Star Learner', 'Scholar', 'Topper', 'Vidya Master'];

/** A friendly name for a level ("Rising Scholar"). */
export function levelTitle(level: number): string {
  return LEVEL_TITLES[Math.max(1, Math.min(level, LEVEL_TITLES.length)) - 1];
}

// ── Badges ───────────────────────────────────────────────────────────

/** Aggregated numbers the badge rules are evaluated over. */
export interface BadgeStats {
  xpEvents: number;       // XP awards ever received
  totalXp: number;
  streakLongest: number;  // longest daily streak, in days
  videosWatched: number;  // distinct lessons watched
  classQuizzes: number;   // class quizzes submitted
  doubts: number;         // doubts solved
  flashcardDays: number;  // distinct IST days with a flashcard review session
  notes: number;          // revision notes made
  bestMockPct: number;    // best mock test score, 0–100
  planTasks: number;      // study-planner tasks completed
  languages: number;      // distinct lesson languages generated or watched
}

export type BadgeMetric = keyof BadgeStats;

export interface BadgeDef {
  id: string;
  title: string;
  emoji: string;
  description: string;
  metric: BadgeMetric;
  target: number;
  /** Accent colour of the earned badge (inline style; src/lib isn't scanned by Tailwind). */
  tint: string;
  /** Where to go to work towards it. */
  href: string;
}

export const BADGES: readonly BadgeDef[] = [
  { id: 'first-step',    title: 'First Step',    emoji: '👣', description: 'Earn your first XP',                       metric: 'xpEvents',      target: 1,    tint: '#FF6B2C', href: '/generate' },
  { id: 'streak-7',      title: '7-Day Streak',  emoji: '🔥', description: 'Learn 7 days in a row',                    metric: 'streakLongest', target: 7,    tint: '#F04D0E', href: '/dashboard' },
  { id: 'streak-30',     title: '30-Day Streak', emoji: '☄️', description: 'Learn 30 days in a row',                   metric: 'streakLongest', target: 30,   tint: '#D13A06', href: '/dashboard' },
  { id: 'lesson-lover',  title: 'Lesson Lover',  emoji: '🎬', description: 'Watch 10 different lessons',               metric: 'videosWatched', target: 10,   tint: '#3D3BDB', href: '/library' },
  { id: 'quiz-whiz',     title: 'Quiz Whiz',     emoji: '🧠', description: 'Finish 5 class quizzes',                   metric: 'classQuizzes',  target: 5,    tint: '#6F6DE1', href: '/classes' },
  { id: 'doubt-buster',  title: 'Doubt Buster',  emoji: '💡', description: 'Solve 10 doubts',                          metric: 'doubts',        target: 10,   tint: '#E0A100', href: '/doubts' },
  { id: 'flash-master',  title: 'Flash Master',  emoji: '🃏', description: 'Review flashcards on 10 different days',   metric: 'flashcardDays', target: 10,   tint: '#0F9E75', href: '/flashcards' },
  { id: 'note-taker',    title: 'Note Taker',    emoji: '📝', description: 'Make 5 sets of revision notes',            metric: 'notes',         target: 5,    tint: '#0A7B5C', href: '/notes' },
  { id: 'mock-champion', title: 'Mock Champion', emoji: '🏆', description: 'Score 90% or more in a mock test',         metric: 'bestMockPct',   target: 90,   tint: '#E0A100', href: '/practice' },
  { id: 'planner-pro',   title: 'Planner Pro',   emoji: '📅', description: 'Complete 25 study-planner tasks',          metric: 'planTasks',     target: 25,   tint: '#2E2CB8', href: '/planner' },
  { id: 'level-5',       title: 'Level 5',       emoji: '⭐', description: `Reach level 5 (${xpToReachLevel(5).toLocaleString('en-IN')} XP)`, metric: 'totalXp', target: xpToReachLevel(5), tint: '#FF6B2C', href: '/achievements' },
  { id: 'polyglot',      title: 'Polyglot',      emoji: '🌏', description: 'Learn lessons in 3 languages',             metric: 'languages',     target: 3,    tint: '#0F9E75', href: '/generate' },
];

export interface BadgeStatus {
  id: string;
  title: string;
  emoji: string;
  description: string;
  tint: string;
  href: string;
  earned: boolean;
  /** 0–1 towards the target. */
  progress: number;
  current: number;
  target: number;
  /** Unit suffix for progress text, e.g. "6 / 10 days". */
  unit: string;
  earnedAt?: string;
}

const UNITS: Record<BadgeMetric, string> = {
  xpEvents: 'XP award', totalXp: 'XP', streakLongest: 'day', videosWatched: 'lesson', classQuizzes: 'quiz',
  doubts: 'doubt', flashcardDays: 'day', notes: 'set', bestMockPct: '%', planTasks: 'task', languages: 'language',
};

/**
 * Evaluate every badge against the stats. `reachedAt(metric, target)` may
 * return when that metric first reached the target (ISO string) — it is only
 * asked about earned badges.
 */
export function evaluateBadges(
  stats: BadgeStats,
  reachedAt?: (metric: BadgeMetric, target: number) => string | undefined,
): BadgeStatus[] {
  return BADGES.map(b => {
    const current = Math.max(0, Math.floor(stats[b.metric] || 0));
    const earned = current >= b.target;
    return {
      id: b.id, title: b.title, emoji: b.emoji, description: b.description, tint: b.tint, href: b.href,
      earned,
      progress: Math.min(1, current / b.target),
      current: Math.min(current, b.target),
      target: b.target,
      unit: UNITS[b.metric],
      earnedAt: earned ? reachedAt?.(b.metric, b.target) : undefined,
    };
  });
}

/** The locked badge the student is closest to (highest progress), if any. */
export function nextBadge(badges: BadgeStatus[]): BadgeStatus | undefined {
  return badges.filter(b => !b.earned).sort((a, b) => b.progress - a.progress)[0];
}

/** Earned badges, most recent first (undated ones last). */
export function recentBadges(badges: BadgeStatus[], limit = 3): BadgeStatus[] {
  return badges
    .filter(b => b.earned)
    .sort((a, b) => (b.earnedAt ?? '').localeCompare(a.earnedAt ?? ''))
    .slice(0, limit);
}

/** "Priya S." — first name and last initial only, for leaderboards. */
export function publicName(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'Student';
  const first = parts[0].slice(0, 20);
  return parts.length > 1 ? `${first} ${parts[parts.length - 1][0].toUpperCase()}.` : first;
}

// ── API response shapes (shared by routes and pages) ─────────────────

export interface LevelInfo {
  level: number;
  intoLevel: number;
  levelSize: number;
  /** Total XP at which the next level starts. */
  nextLevelAt: number;
}

export interface StreakInfo {
  current: number;
  longest: number;
  activeToday: boolean;
}

export interface ProgressSummary {
  totalXp: number;
  level: LevelInfo;
  weekXp: number;
  todayXp: number;
  streak: StreakInfo;
}

export interface XpEventView {
  id: string;
  kind: string;
  emoji: string;
  label: string;
  detail?: string;
  points: number;
  createdAt: string;
}

export interface SubjectStrength {
  subject: string;
  /** Average score, 0–100. */
  pct: number;
  attempts: number;
  quizzes: number;
  mocks: number;
}

export interface ProgressResponse extends ProgressSummary {
  week: { day: string; label: string; xp: number; isToday: boolean }[];
  /** IST day keys with any XP in the last 7 days (for streak calendars). */
  activeDays: string[];
  badges: BadgeStatus[];
  recent: XpEventView[];
  strengths: SubjectStrength[];
  counts: { doubt: number; flashcards: number; notes: number; mock: number; plan: number };
  xpRules: { kind: string; emoji: string; label: string; points: number; note?: string; count: number; earned: number }[];
}

export interface LeaderRow {
  rank: number;
  name: string;
  initials: string;
  xp: number;
  level: number;
  streak: number;
  isMe: boolean;
}

export interface LeaderboardResponse {
  scope: 'class' | 'all';
  classId: string | null;
  classes: { id: string; name: string; subject: string | null; students: number }[];
  viewer: 'student' | 'teacher';
  weekStart: string;
  weekEnd: string;
  total: number;
  rows: LeaderRow[];
  me: LeaderRow | null;
}

/** Emoji per XP kind, for feeds and the "how to earn" table. */
export const XP_EMOJI: Record<string, string> = {
  video_watched: '🎬',
  video_generated: '✨',
  class_quiz: '🧠',
  doubt_solved: '📸',
  flashcards_reviewed: '🃏',
  notes_created: '📄',
  mock_completed: '📝',
  plan_task_done: '📅',
};
