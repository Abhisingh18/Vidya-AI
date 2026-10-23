import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

// GET: the teacher's documents, optionally filtered by ?type=slides|quiz|lesson|toolkit
export async function GET(req: NextRequest) {
  const auth = await requireUser('TEACHER');
  if ('error' in auth) return auth.error;

  const type = req.nextUrl.searchParams.get('type') ?? undefined;
  const docs = await prisma.teacherDoc.findMany({
    where: { userId: auth.user.id, ...(type ? { type } : {}) },
    orderBy: { updatedAt: 'desc' },
    take: 100,
    select: { id: true, type: true, title: true, topic: true, grade: true, language: true, updatedAt: true },
  });
  return NextResponse.json({ docs });
}
