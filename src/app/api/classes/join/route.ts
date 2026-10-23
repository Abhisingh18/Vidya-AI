import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

// POST { code }: a student joins a class with the teacher's join code.
export async function POST(req: NextRequest) {
  const auth = await requireUser('STUDENT');
  if ('error' in auth) return auth.error;
  const body = await req.json().catch(() => ({}));
  const code = String(body.code ?? '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code.length !== 6) return NextResponse.json({ error: 'Enter the 6-character class code' }, { status: 400 });

  const cls = await prisma.classroom.findUnique({ where: { joinCode: code }, select: { id: true, name: true } });
  if (!cls) return NextResponse.json({ error: 'No class found with that code' }, { status: 404 });

  await prisma.classMember.upsert({
    where: { classroomId_userId: { classroomId: cls.id, userId: auth.user.id } },
    update: {},
    create: { classroomId: cls.id, userId: auth.user.id },
  });
  return NextResponse.json(cls);
}
