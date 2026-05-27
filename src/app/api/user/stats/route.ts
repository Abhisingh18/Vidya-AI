import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [videoCount, watchCount, downloadCount, languages, streak, recentVideos, subjectGroups] = await Promise.all([
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
  });
}
