import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { XP_RULES, levelFor, type XpKind } from '@/lib/xp';
import {
  evaluateBadges, istDayKey, istDayStart, istWeekDays, istWeekStart, XP_EMOJI,
  type BadgeMetric, type BadgeStats, type LevelInfo, type ProgressResponse, type ProgressSummary,
  type StreakInfo, type SubjectStrength, type XpEventView,
} from '@/lib/badges';

export const dynamic = 'force-dynamic';

const DAY_MS = 86_400_000;
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function levelInfo(totalXp: number): LevelInfo {
  const l = levelFor(totalXp);
  return { ...l, nextLevelAt: totalXp - l.intoLevel + l.levelSize };
}

// Same calendar-day rule as src/lib/streak.ts: a streak whose last activity was
// before yesterday is already broken, even though the row still holds it.
function streakInfo(s: { current: number; longest: number; lastActiveAt: Date } | null): StreakInfo {
  if (!s) return { current: 0, longest: 0, activeToday: false };
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const last = new Date(s.lastActiveAt);
  const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate());
  const diff = Math.round((today.getTime() - lastDay.getTime()) / DAY_MS);
  return { current: diff <= 1 ? s.current : 0, longest: s.longest, activeToday: diff === 0 };
}

function inferSubject(text: string): string {
  const t = text.toLowerCase();
  if (/(math|theorem|integral|integration|deriv|equation|trig|algebra|geometry|calcul|matri|polynomial|fraction|probability|statistic|number system|quadratic|mensuration)/.test(t)) return 'Mathematics';
  if (/(physics|newton|force|motion|gravit|ohm|circuit|electric|magnet|wave|optic|light|sound|energy|relativity|quantum)/.test(t)) return 'Physics';
  if (/(chemi|periodic|element|bond|acid|base|salt|reaction|organic|atom|molecule|metal|carbon)/.test(t)) return 'Chemistry';
  if (/(bio|cell|dna|photosynth|organ|evolution|gene|plant|animal|human body|digest|respirat|heredity)/.test(t)) return 'Biology';
  if (/(history|revolution|war|empire|king|ancient|medieval|mughal|freedom|nationalism)/.test(t)) return 'History';
  if (/(geograph|climate|river|soil|resource|map|monsoon)/.test(t)) return 'Geography';
  if (/(civics|democra|constitution|government|parliament|rights|economics|economy|money|budget)/.test(t)) return 'Social Science';
  if (/(english|grammar|poem|poetry|essay|literature|tense|prose)/.test(t)) return 'English';
  if (/(hindi|vyakaran|kavita)/.test(t)) return 'Hindi';
  if (/(algorithm|sort|search|code|program|recursion|data structure|binary|computer|python|java)/.test(t)) return 'Computer Science';
  return 'General';
}

// ── Mock tests: their `content` shape belongs to another feature, so read it
// defensively and skip anything unrecognised. ────────────────────────────

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const rec = (v: unknown) => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null);

function attemptPct(raw: unknown): { pct: number; at?: number } | null {
  const r = rec(raw);
  if (!r || r.pending === true) return null; // written answers still being graded
  let pct = num(r.percent) ?? num(r.percentage) ?? num(r.pct);
  if (pct === null) {
    const score = num(r.score) ?? num(r.marks) ?? num(r.obtained) ?? num(r.correct);
    const total = num(r.total) ?? num(r.maxScore) ?? num(r.maxMarks) ?? num(r.outOf) ?? num(r.totalMarks);
    if (score !== null && total !== null && total > 0) pct = (100 * score) / total;
  }
  if (pct === null || pct < 0) return null;
  const when = [r.submittedAt, r.completedAt, r.finishedAt, r.createdAt, r.at, r.date]
    .map(v => (typeof v === 'string' || typeof v === 'number' ? new Date(v).getTime() : NaN))
    .find(t => Number.isFinite(t));
  return { pct: Math.min(100, pct), at: when };
}

function mockAttempts(content: string): { subject?: string; attempts: { pct: number; at?: number }[] } {
  let parsed: unknown;
  try { parsed = JSON.parse(content); } catch { return { attempts: [] }; }
  const c = rec(parsed);
  if (!c) return { attempts: [] };
  const list: unknown[] = Array.isArray(c.attempts)
    ? c.attempts
    : [c.attempt, c.result, c.lastAttempt, c.submission].filter(Boolean);
  // src/lib/mock.ts keeps it in config.subject.
  const rawSubject = typeof c.subject === 'string' ? c.subject : rec(c.config)?.subject;
  const subject = typeof rawSubject === 'string' && rawSubject.trim() ? rawSubject.trim().slice(0, 40) : undefined;
  return { subject, attempts: list.map(attemptPct).filter((a): a is { pct: number; at?: number } => !!a) };
}

/** First time a run of consecutive IST days with XP reached `target` days. */
function streakReachedAt(times: number[], target: number): string | undefined {
  let run = 0;
  let prev = '';
  for (const t of times) {
    const key = istDayKey(t);
    if (key === prev) continue;
    const yesterday = new Date(Date.parse(`${key}T00:00:00Z`) - DAY_MS).toISOString().slice(0, 10);
    run = prev === yesterday ? run + 1 : 1;
    prev = key;
    if (run >= target) return new Date(t).toISOString();
  }
  return undefined;
}

async function summary(userId: string): Promise<ProgressSummary> {
  const now = new Date();
  const [total, week, today, streak] = await Promise.all([
    prisma.xpEvent.aggregate({ where: { userId }, _sum: { points: true } }),
    prisma.xpEvent.aggregate({ where: { userId, createdAt: { gte: istWeekStart(now) } }, _sum: { points: true } }),
    prisma.xpEvent.aggregate({ where: { userId, createdAt: { gte: istDayStart(now) } }, _sum: { points: true } }),
    prisma.streak.findUnique({ where: { userId } }),
  ]);
  const totalXp = total._sum.points ?? 0;
  return {
    totalXp,
    level: levelInfo(totalXp),
    weekXp: week._sum.points ?? 0,
    todayXp: today._sum.points ?? 0,
    streak: streakInfo(streak),
  };
}

// GET: the signed-in student's XP, level, streak, badges, recent XP and subject
// strengths. `?view=summary` returns only the cheap headline numbers.
export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const userId = auth.user.id;

  if (req.nextUrl.searchParams.get('view') === 'summary') {
    return NextResponse.json(await summary(userId));
  }

  const now = new Date();
  const [events, streakRow, docGroups, docDates, quizAttempts, mocks, watched, languages] = await Promise.all([
    prisma.xpEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, kind: true, points: true, refId: true, createdAt: true },
      take: 20_000,
    }),
    prisma.streak.findUnique({ where: { userId } }),
    prisma.studentDoc.groupBy({ by: ['type'], where: { userId }, _count: { _all: true } }),
    prisma.studentDoc.findMany({
      where: { userId, type: { in: ['doubt', 'notes'] } },
      orderBy: { createdAt: 'asc' },
      select: { type: true, createdAt: true },
    }),
    prisma.quizAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: {
        score: true, total: true, createdAt: true,
        assignment: { select: { title: true, classroom: { select: { subject: true } }, doc: { select: { topic: true } } } },
      },
    }),
    prisma.studentDoc.findMany({
      where: { userId, type: 'mock' },
      orderBy: { updatedAt: 'desc' },
      take: 100,
      select: { title: true, topic: true, content: true, createdAt: true },
    }),
    prisma.watch.findMany({ where: { userId }, distinct: ['videoId'], select: { videoId: true } }),
    prisma.video.findMany({
      where: { OR: [{ userId }, { watches: { some: { userId } } }] },
      distinct: ['language'],
      select: { language: true },
    }),
  ]);

  // ── XP totals and timelines ──
  const totalXp = events.reduce((s, e) => s + e.points, 0);
  const weekStart = istWeekStart(now);
  const dayStart = istDayStart(now);
  const todayKey = istDayKey(now);
  const weekKeys = istWeekDays(weekStart);
  const weekXpByDay = new Map<string, number>(weekKeys.map(k => [k, 0]));
  const activeDays = new Set<string>();
  const lastWeekCutoff = dayStart.getTime() - 6 * DAY_MS;
  const byKind = new Map<string, { count: number; earned: number; times: number[] }>();
  let weekXp = 0;
  let todayXp = 0;

  for (const e of events) {
    const t = e.createdAt.getTime();
    const k = byKind.get(e.kind) ?? { count: 0, earned: 0, times: [] };
    k.count += 1;
    k.earned += e.points;
    k.times.push(t);
    byKind.set(e.kind, k);
    if (t >= weekStart.getTime()) {
      weekXp += e.points;
      const key = istDayKey(t);
      weekXpByDay.set(key, (weekXpByDay.get(key) ?? 0) + e.points);
    }
    if (t >= dayStart.getTime()) todayXp += e.points;
    if (t >= lastWeekCutoff) activeDays.add(istDayKey(t));
  }
  const kindTimes = (kind: XpKind) => byKind.get(kind)?.times ?? [];

  // Flashcard review *days*: the first review of each IST day.
  const flashDays: number[] = [];
  let lastFlashDay = '';
  for (const t of kindTimes('flashcards_reviewed')) {
    const key = istDayKey(t);
    if (key !== lastFlashDay) { flashDays.push(t); lastFlashDay = key; }
  }

  const docTimes = (type: string) => docDates.filter(d => d.type === type).map(d => d.createdAt.getTime());
  const longer = (a: number[], b: number[]) => (a.length >= b.length ? a : b);
  const timelines: Partial<Record<BadgeMetric, number[]>> = {
    xpEvents: events.map(e => e.createdAt.getTime()),
    videosWatched: kindTimes('video_watched'),
    classQuizzes: longer(quizAttempts.map(q => q.createdAt.getTime()), kindTimes('class_quiz')),
    doubts: longer(kindTimes('doubt_solved'), docTimes('doubt')),
    flashcardDays: flashDays,
    notes: longer(kindTimes('notes_created'), docTimes('notes')),
    planTasks: kindTimes('plan_task_done'),
  };

  // ── Strengths: class quizzes + mock tests, grouped by subject ──
  const subjects = new Map<string, { sum: number; attempts: number; quizzes: number; mocks: number }>();
  const addScore = (subject: string, pct: number, source: 'quizzes' | 'mocks') => {
    const s = subjects.get(subject) ?? { sum: 0, attempts: 0, quizzes: 0, mocks: 0 };
    s.sum += pct;
    s.attempts += 1;
    s[source] += 1;
    subjects.set(subject, s);
  };
  for (const q of quizAttempts) {
    if (q.total <= 0) continue;
    const subject = q.assignment.classroom.subject?.trim() || inferSubject(`${q.assignment.doc?.topic ?? ''} ${q.assignment.title}`);
    addScore(subject, (100 * q.score) / q.total, 'quizzes');
  }
  let bestMockPct = 0;
  let mockChampionAt: number | undefined;
  for (const m of mocks) {
    const parsed = mockAttempts(m.content);
    const subject = parsed.subject ?? inferSubject(`${m.topic} ${m.title}`);
    for (const a of parsed.attempts) {
      addScore(subject, a.pct, 'mocks');
      bestMockPct = Math.max(bestMockPct, a.pct);
      if (a.pct >= 90) {
        const at = a.at ?? m.createdAt.getTime();
        mockChampionAt = mockChampionAt === undefined ? at : Math.min(mockChampionAt, at);
      }
    }
  }
  const strengths: SubjectStrength[] = Array.from(subjects.entries())
    .map(([subject, s]) => ({ subject, pct: Math.round(s.sum / s.attempts), attempts: s.attempts, quizzes: s.quizzes, mocks: s.mocks }))
    .sort((a, b) => b.pct - a.pct || b.attempts - a.attempts);

  // ── Badges ──
  const docCount = (type: string) => docGroups.find(g => g.type === type)?._count._all ?? 0;
  const kindCount = (kind: XpKind) => byKind.get(kind)?.count ?? 0;
  const streak = streakInfo(streakRow);
  const stats: BadgeStats = {
    xpEvents: events.length,
    totalXp,
    streakLongest: Math.max(streak.longest, streak.current),
    videosWatched: Math.max(kindCount('video_watched'), watched.length),
    classQuizzes: Math.max(quizAttempts.length, kindCount('class_quiz')),
    doubts: Math.max(kindCount('doubt_solved'), docCount('doubt')),
    flashcardDays: flashDays.length,
    notes: Math.max(kindCount('notes_created'), docCount('notes')),
    bestMockPct: Math.round(bestMockPct),
    planTasks: kindCount('plan_task_done'),
    languages: languages.length,
  };
  const iso = (t: number | undefined) => (t === undefined ? undefined : new Date(t).toISOString());
  const badges = evaluateBadges(stats, (metric, target) => {
    if (metric === 'totalXp') {
      let sum = 0;
      for (const e of events) { sum += e.points; if (sum >= target) return e.createdAt.toISOString(); }
      return undefined;
    }
    if (metric === 'bestMockPct') return iso(mockChampionAt);
    if (metric === 'streakLongest') return streakReachedAt(timelines.xpEvents ?? [], target);
    return iso(timelines[metric]?.[target - 1]);
  });

  // ── Recent XP, labelled with what earned it ──
  const recentRaw = events.slice(-15).reverse();
  const refBase = (ref: string) => ref.split(/[:@|#/]/)[0];
  const videoIds = recentRaw.filter(e => e.refId && e.kind.startsWith('video_')).map(e => e.refId as string);
  const assignmentIds = recentRaw.filter(e => e.refId && e.kind === 'class_quiz').map(e => e.refId as string);
  const docIds = recentRaw
    .filter(e => e.refId && !e.kind.startsWith('video_') && e.kind !== 'class_quiz')
    .flatMap(e => [e.refId as string, refBase(e.refId as string)]);
  const [videos, assignments, docs] = await Promise.all([
    videoIds.length ? prisma.video.findMany({ where: { id: { in: videoIds } }, select: { id: true, topic: true } }) : [],
    assignmentIds.length ? prisma.assignment.findMany({ where: { id: { in: assignmentIds } }, select: { id: true, title: true } }) : [],
    docIds.length ? prisma.studentDoc.findMany({ where: { userId, id: { in: Array.from(new Set(docIds)) } }, select: { id: true, title: true } }) : [],
  ]);
  const titles = new Map<string, string>([
    ...videos.map(v => [v.id, v.topic] as const),
    ...assignments.map(a => [a.id, a.title] as const),
    ...docs.map(d => [d.id, d.title] as const),
  ]);
  const recent: XpEventView[] = recentRaw.map(e => ({
    id: e.id,
    kind: e.kind,
    emoji: XP_EMOJI[e.kind] ?? '⚡',
    label: XP_RULES[e.kind as XpKind]?.label ?? 'Earned XP',
    detail: e.refId ? titles.get(e.refId) ?? titles.get(refBase(e.refId)) : undefined,
    points: e.points,
    createdAt: e.createdAt.toISOString(),
  }));

  const body: ProgressResponse = {
    totalXp,
    level: levelInfo(totalXp),
    weekXp,
    todayXp,
    streak,
    week: weekKeys.map((day, i) => ({ day, label: WEEKDAYS[i], xp: weekXpByDay.get(day) ?? 0, isToday: day === todayKey })),
    activeDays: Array.from(activeDays).sort(),
    badges,
    recent,
    strengths,
    counts: {
      doubt: docCount('doubt'), flashcards: docCount('flashcards'), notes: docCount('notes'),
      mock: docCount('mock'), plan: docCount('plan'),
    },
    xpRules: (Object.keys(XP_RULES) as XpKind[]).map(kind => ({
      kind,
      emoji: XP_EMOJI[kind] ?? '⚡',
      label: XP_RULES[kind].label,
      points: XP_RULES[kind].points,
      note: kind === 'class_quiz' ? '10–30 by score' : kind === 'video_watched' ? 'once per lesson' : undefined,
      count: byKind.get(kind)?.count ?? 0,
      earned: byKind.get(kind)?.earned ?? 0,
    })),
  };
  return NextResponse.json(body);
}
