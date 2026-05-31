import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET: list the current user's bookmarked videos (with video details).
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId, videoId: { not: null } },
    orderBy: { createdAt: 'desc' },
    include: {
      video: {
        select: {
          id: true, topic: true, language: true, grade: true,
          subject: true, duration: true, createdAt: true,
        },
      },
    },
  });

  const videos = bookmarks
    .filter(b => b.video)
    .map(b => ({
      id: b.video!.id,
      topic: b.video!.topic,
      language: b.video!.language,
      grade: b.video!.grade,
      subject: b.video!.subject ?? 'General',
      duration: b.video!.duration ?? 0,
      createdAt: b.video!.createdAt,
      bookmarkedAt: b.createdAt,
    }));

  return NextResponse.json({ videos });
}
