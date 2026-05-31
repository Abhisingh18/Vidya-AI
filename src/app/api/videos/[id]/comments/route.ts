import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET: list comments for a video, newest first.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const comments = await prisma.comment.findMany({
    where: { videoId: params.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { user: { select: { name: true, image: true } } },
  });

  return NextResponse.json({
    comments: comments.map(c => ({
      id: c.id,
      text: c.text,
      createdAt: c.createdAt,
      author: c.user?.name ?? 'Student',
      image: c.user?.image ?? null,
    })),
  });
}

// POST: add a comment.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const text = String(body.text ?? '').trim().slice(0, 1000);
  if (!text) return NextResponse.json({ error: 'Empty comment' }, { status: 400 });

  const video = await prisma.video.findUnique({ where: { id: params.id } });
  if (!video) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const c = await prisma.comment.create({
    data: { userId, videoId: params.id, text },
    include: { user: { select: { name: true, image: true } } },
  });

  return NextResponse.json({
    comment: {
      id: c.id,
      text: c.text,
      createdAt: c.createdAt,
      author: c.user?.name ?? 'Student',
      image: c.user?.image ?? null,
    },
  });
}
