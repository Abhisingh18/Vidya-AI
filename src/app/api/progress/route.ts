import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET: which library videos the current user has watched.
// Returns a list of watched videoIds so the UI can mark progress.
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ watched: [], totalVideos: 0 });

  const [watches, totalVideos] = await Promise.all([
    prisma.watch.findMany({
      where: { userId },
      select: { videoId: true, completed: true },
      distinct: ['videoId'],
    }),
    prisma.video.count(),
  ]);

  return NextResponse.json({
    watched: watches.map(w => w.videoId),
    completed: watches.filter(w => w.completed).map(w => w.videoId),
    totalVideos,
  });
}
