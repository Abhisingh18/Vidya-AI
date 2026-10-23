import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { classAccess } from '@/lib/classroom';
import { levelFor } from '@/lib/xp';
import { istWeekStart, publicName, type LeaderboardResponse, type LeaderRow } from '@/lib/badges';

export const dynamic = 'force-dynamic';

const DAY_MS = 86_400_000;
const MAX_ROWS = 50;

function initials(name: string) {
  return name.replace(/\./g, '').split(/\s+/).map(p => p[0] ?? '').join('').slice(0, 2).toUpperCase() || 'S';
}

// GET ?scope=class&classId=…  → this week's XP ranking within one class
//     ?scope=all              → across every class the student is in
// Students see classmates; a class's teacher can view it too. Only first
// name + last initial are returned — never emails or ids.
export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const { user } = auth;
  const isTeacher = user.role === 'TEACHER';
  const params = req.nextUrl.searchParams;
  const scope: 'class' | 'all' = params.get('scope') === 'all' ? 'all' : 'class';

  // Classes this user can see a leaderboard for.
  const classes = isTeacher
    ? await prisma.classroom.findMany({
        where: { teacherId: user.id },
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, subject: true, _count: { select: { members: true } } },
      })
    : (await prisma.classMember.findMany({
        where: { userId: user.id },
        orderBy: { joinedAt: 'desc' },
        select: { classroom: { select: { id: true, name: true, subject: true, _count: { select: { members: true } } } } },
      })).map(m => m.classroom);
  const classList = classes.map(c => ({ id: c.id, name: c.name, subject: c.subject, students: c._count.members }));

  let classId: string | null = null;
  let classIds: string[] = [];
  if (scope === 'class') {
    classId = params.get('classId') || classList[0]?.id || null;
    if (classId) {
      const access = await classAccess(classId, user);
      if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      classIds = [classId];
    }
  } else {
    classIds = classList.map(c => c.id);
  }

  const memberRows = classIds.length
    ? await prisma.classMember.findMany({ where: { classroomId: { in: classIds } }, select: { userId: true }, distinct: ['userId'] })
    : [];
  const ids = new Set(memberRows.map(m => m.userId));
  if (!isTeacher) ids.add(user.id); // a student always sees themselves
  const idList = Array.from(ids);

  const now = new Date();
  const weekStart = istWeekStart(now);
  const [weekly, allTime, users, streaks] = idList.length
    ? await Promise.all([
        prisma.xpEvent.groupBy({ by: ['userId'], where: { userId: { in: idList }, createdAt: { gte: weekStart } }, _sum: { points: true } }),
        prisma.xpEvent.groupBy({ by: ['userId'], where: { userId: { in: idList } }, _sum: { points: true } }),
        prisma.user.findMany({ where: { id: { in: idList } }, select: { id: true, name: true, role: true } }),
        prisma.streak.findMany({ where: { userId: { in: idList } }, select: { userId: true, current: true, lastActiveAt: true } }),
      ])
    : [[], [], [], []];

  const weekXp = new Map(weekly.map(w => [w.userId, w._sum.points ?? 0]));
  const totalXp = new Map(allTime.map(w => [w.userId, w._sum.points ?? 0]));
  // A streak only counts if the student was active today or yesterday (same
  // server-calendar rule as src/lib/streak.ts).
  const aliveSince = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - DAY_MS;
  const streak = new Map(streaks.map(s => [s.userId, s.lastActiveAt.getTime() >= aliveSince ? s.current : 0]));

  const ranked = users
    .filter(u => u.role !== 'TEACHER')
    .map(u => {
      const name = publicName(u.name);
      return {
        id: u.id, name, initials: initials(name),
        xp: weekXp.get(u.id) ?? 0,
        level: levelFor(totalXp.get(u.id) ?? 0).level,
        streak: streak.get(u.id) ?? 0,
      };
    })
    .sort((a, b) => b.xp - a.xp || b.level - a.level || a.name.localeCompare(b.name));

  // Standard competition ranking: equal XP shares a rank (1, 1, 3…).
  const rows: LeaderRow[] = [];
  ranked.forEach((r, i) => {
    const rank = i > 0 && r.xp === ranked[i - 1].xp ? rows[i - 1].rank : i + 1;
    rows.push({ rank, name: r.name, initials: r.initials, xp: r.xp, level: r.level, streak: r.streak, isMe: r.id === user.id });
  });
  const me = rows.find(r => r.isMe) ?? null;

  const body: LeaderboardResponse = {
    scope,
    classId,
    classes: classList,
    viewer: isTeacher ? 'teacher' : 'student',
    weekStart: weekStart.toISOString(),
    weekEnd: new Date(weekStart.getTime() + 7 * DAY_MS - 1).toISOString(),
    total: rows.length,
    rows: rows.slice(0, MAX_ROWS),
    me,
  };
  return NextResponse.json(body);
}
