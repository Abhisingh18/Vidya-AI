import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET: the current user's playlists with item counts.
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const playlists = await prisma.playlist.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { items: true } } },
  });

  return NextResponse.json({
    playlists: playlists.map(p => ({
      id: p.id,
      title: p.title,
      emoji: p.emoji ?? '📚',
      count: p._count.items,
      createdAt: p.createdAt,
    })),
  });
}

// POST: create a new playlist.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const title = String(body.title ?? '').trim().slice(0, 80);
  const emoji = String(body.emoji ?? '📚').slice(0, 4);
  if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 });

  const playlist = await prisma.playlist.create({
    data: { userId, title, emoji },
  });

  return NextResponse.json({ id: playlist.id, title: playlist.title, emoji: playlist.emoji });
}
