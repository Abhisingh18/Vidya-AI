import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: is this video bookmarked by the current user?
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ bookmarked: false });

  const existing = await prisma.bookmark.findFirst({
    where: { userId, videoId: params.id },
  });
  return NextResponse.json({ bookmarked: !!existing });
}

// POST: toggle bookmark on / off. Returns the new state.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const video = await prisma.video.findUnique({ where: { id: params.id } });
  if (!video) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const existing = await prisma.bookmark.findFirst({
    where: { userId, videoId: params.id },
  });

  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
    return NextResponse.json({ bookmarked: false });
  }

  await prisma.bookmark.create({
    data: { userId, videoId: params.id, topic: video.topic, subject: video.subject },
  });
  return NextResponse.json({ bookmarked: true });
}
