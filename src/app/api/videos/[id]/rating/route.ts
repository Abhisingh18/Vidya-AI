import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: average rating + count + this user's rating (if any).
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  const agg = await prisma.rating.aggregate({
    where: { videoId: params.id },
    _avg: { value: true },
    _count: { _all: true },
  });

  let userValue = 0;
  if (userId) {
    const mine = await prisma.rating.findUnique({
      where: { userId_videoId: { userId, videoId: params.id } },
    });
    userValue = mine?.value ?? 0;
  }

  return NextResponse.json({
    average: agg._avg.value ?? 0,
    count: agg._count._all,
    userValue,
  });
}

// POST: set / update the current user's rating (1–5).
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const value = Math.max(1, Math.min(5, Math.round(Number(body.value) || 0)));
  if (!value) return NextResponse.json({ error: 'Invalid rating' }, { status: 400 });

  await prisma.rating.upsert({
    where: { userId_videoId: { userId, videoId: params.id } },
    update: { value },
    create: { userId, videoId: params.id, value },
  });

  const agg = await prisma.rating.aggregate({
    where: { videoId: params.id },
    _avg: { value: true },
    _count: { _all: true },
  });

  return NextResponse.json({
    average: agg._avg.value ?? 0,
    count: agg._count._all,
    userValue: value,
  });
}
