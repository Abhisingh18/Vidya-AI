import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function ownerCheck(playlistId: string, userId: string) {
  const pl = await prisma.playlist.findUnique({ where: { id: playlistId } });
  return pl && pl.userId === userId ? pl : null;
}

// GET: playlist detail with its videos in order.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const playlist = await prisma.playlist.findUnique({
    where: { id: params.id },
    include: {
      items: {
        orderBy: { order: 'asc' },
        include: {
          video: {
            select: { id: true, topic: true, language: true, grade: true, subject: true, duration: true },
          },
        },
      },
    },
  });
  if (!playlist) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    id: playlist.id,
    title: playlist.title,
    emoji: playlist.emoji ?? '📚',
    videos: playlist.items.filter(i => i.video).map(i => ({
      id: i.video.id,
      topic: i.video.topic,
      language: i.video.language,
      grade: i.video.grade,
      subject: i.video.subject ?? 'General',
      duration: i.video.duration ?? 0,
    })),
  });
}

// POST: add a video to the playlist  ({ videoId }).
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const pl = await ownerCheck(params.id, userId);
  if (!pl) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const videoId = String(body.videoId ?? '');
  if (!videoId) return NextResponse.json({ error: 'videoId required' }, { status: 400 });

  const count = await prisma.playlistItem.count({ where: { playlistId: params.id } });
  try {
    await prisma.playlistItem.create({
      data: { playlistId: params.id, videoId, order: count },
    });
  } catch {
    // unique constraint — already in playlist; treat as success
  }
  return NextResponse.json({ ok: true });
}

// DELETE: remove the playlist, or one video (?videoId=...).
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const pl = await ownerCheck(params.id, userId);
  if (!pl) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const videoId = req.nextUrl.searchParams.get('videoId');
  if (videoId) {
    await prisma.playlistItem.deleteMany({ where: { playlistId: params.id, videoId } });
  } else {
    await prisma.playlist.delete({ where: { id: params.id } });
  }
  return NextResponse.json({ ok: true });
}
