import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parsePlanContent, planStatus, taskHref, todaysTasks } from '@/lib/planner';
import { istDayKey } from '@/lib/badges';

export const dynamic = 'force-dynamic';

const rec = (v: unknown) => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null);

/** The latest study plan's tasks for today (IST), for the dashboard card. */
async function todaysPlan(userId: string) {
  const doc = await prisma.studentDoc.findFirst({
    where: { userId, type: 'plan' },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, title: true, content: true },
  });
  if (!doc) return null;
  try {
    const content = parsePlanContent(doc.content);
    const tasks = todaysTasks(doc.content, new Date());
    const status = content ? planStatus(content) : null;
    return {
      id: doc.id,
      title: doc.title,
      examName: content?.examName ?? null,
      daysLeft: status?.daysLeft ?? null,
      state: status?.state ?? null,
      overdue: status?.overdue ?? 0,
      tasks: tasks.slice(0, 6).map(t => ({
        id: t.id, title: t.title, type: t.type, subject: t.subject, minutes: t.minutes, done: t.done,
        href: taskHref(t, content?.subjects),
      })),
    };
  } catch {
    return { id: doc.id, title: doc.title, examName: null, daysLeft: null, state: null, overdue: 0, tasks: [] };
  }
}

/**
 * Cards to study today across the newest decks: new cards plus reviews whose
 * `srs.due` day has come (same rule as the flashcards feature). Deck content
 * belongs to that feature, so unknown shapes are skipped, not trusted.
 */
async function dueFlashcards(userId: string) {
  const decks = await prisma.studentDoc.findMany({
    where: { userId, type: 'flashcards' },
    orderBy: { updatedAt: 'desc' },
    take: 20,
    select: { id: true, title: true, content: true },
  });
  if (!decks.length) return { decks: 0, due: 0, dueDecks: 0, topDeck: null as null | { id: string; title: string; due: number } };
  const today = istDayKey(new Date());
  let due = 0;
  let dueDecks = 0;
  let topDeck: { id: string; title: string; due: number } | null = null;
  for (const d of decks) {
    let cards: unknown[] = [];
    try { cards = (rec(JSON.parse(d.content))?.cards as unknown[]) ?? []; } catch { continue; }
    if (!Array.isArray(cards)) continue;
    let n = 0;
    for (const c of cards) {
      const srs = rec(rec(c)?.srs);
      if (!srs) continue;
      if (srs.last === null || srs.last === undefined || (typeof srs.due === 'string' && srs.due <= today)) n++;
    }
    if (n) {
      due += n;
      dueDecks++;
      if (!topDeck || n > topDeck.due) topDeck = { id: d.id, title: d.title, due: n };
    }
  }
  return { decks: decks.length, due, dueDecks, topDeck };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [videoCount, watchCount, downloadCount, languages, streak, recentVideos, subjectGroups, plan, flashcards] = await Promise.all([
    prisma.video.count({ where: { userId } }),
    prisma.watch.count({ where: { userId } }),
    prisma.download.count({ where: { userId } }),
    prisma.video.groupBy({ by: ['language'], where: { userId } }),
    prisma.streak.findUnique({ where: { userId } }),
    prisma.video.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: { id: true, topic: true, language: true, grade: true, subject: true, duration: true, createdAt: true },
    }),
    prisma.video.groupBy({
      by: ['subject'],
      where: { userId },
      _count: { _all: true },
    }),
    todaysPlan(userId).catch(() => null),
    dueFlashcards(userId).catch(() => null),
  ]);

  // distinct topics
  const distinctTopics = await prisma.video.findMany({
    where: { userId },
    select: { topic: true },
    distinct: ['topic'],
  });

  return NextResponse.json({
    videoCount,
    watchCount,
    downloadCount,
    languagesUsed: languages.length,
    topicCount: distinctTopics.length,
    streak: streak ? { current: streak.current, longest: streak.longest, lastActiveAt: streak.lastActiveAt } : { current: 0, longest: 0, lastActiveAt: null },
    recentVideos,
    subjectBreakdown: subjectGroups.map(g => ({ subject: g.subject ?? 'General', count: g._count._all })),
    // Student study tools (dashboard cards)
    tools: { plan, flashcards },
  });
}
