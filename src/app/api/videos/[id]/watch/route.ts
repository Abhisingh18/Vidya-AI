import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { bumpStreak } from '@/lib/streak';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const duration = Math.max(0, Number(body.duration) || 0);
  const completed = !!body.completed;

  const video = await prisma.video.findUnique({ where: { id: params.id } });
  if (!video) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.watch.create({ data: { userId, videoId: params.id, duration, completed } });
  await bumpStreak(userId);
  return NextResponse.json({ ok: true });
}
