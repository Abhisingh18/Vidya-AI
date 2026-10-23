import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; aid: string } }) {
  const auth = await requireUser('TEACHER');
  if ('error' in auth) return auth.error;
  const { count } = await prisma.assignment.deleteMany({
    where: { id: params.aid, classroomId: params.id, classroom: { teacherId: auth.user.id } },
  });
  return count ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'Not found' }, { status: 404 });
}
