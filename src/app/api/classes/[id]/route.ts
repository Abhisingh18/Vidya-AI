import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { classAccess } from '@/lib/classroom';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const access = await classAccess(params.id, auth.user);
  if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const { cls, isTeacher } = access;

  const assignments = await prisma.assignment.findMany({
    where: { classroomId: cls.id },
    orderBy: { createdAt: 'desc' },
    include: {
      attempts: isTeacher
        ? { select: { score: true, total: true } }
        : { where: { userId: auth.user.id }, select: { score: true, total: true } },
    },
  });

  const base = {
    id: cls.id, name: cls.name, subject: cls.subject, grade: cls.grade,
    teacher: (await prisma.user.findUnique({ where: { id: cls.teacherId }, select: { name: true } }))?.name,
  };

  if (!isTeacher) {
    return NextResponse.json({
      isTeacher,
      class: base,
      assignments: assignments.map(a => ({
        id: a.id, kind: a.kind, title: a.title, dueAt: a.dueAt, createdAt: a.createdAt, videoId: a.videoId,
        myScore: a.attempts[0] ? { score: a.attempts[0].score, total: a.attempts[0].total } : null,
      })),
    });
  }

  const members = await prisma.classMember.findMany({
    where: { classroomId: cls.id },
    orderBy: { joinedAt: 'asc' },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json({
    isTeacher,
    class: { ...base, joinCode: cls.joinCode },
    students: members.map(m => ({ id: m.user.id, name: m.user.name, joinedAt: m.joinedAt })),
    assignments: assignments.map(a => ({
      id: a.id, kind: a.kind, title: a.title, dueAt: a.dueAt, createdAt: a.createdAt, docId: a.docId, videoId: a.videoId,
      submissions: a.attempts.length,
      average: a.attempts.length
        ? Math.round((a.attempts.reduce((t, x) => t + (x.total ? x.score / x.total : 0), 0) / a.attempts.length) * 100)
        : null,
    })),
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser('TEACHER');
  if ('error' in auth) return auth.error;
  const { count } = await prisma.classroom.deleteMany({ where: { id: params.id, teacherId: auth.user.id } });
  return count ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'Not found' }, { status: 404 });
}
