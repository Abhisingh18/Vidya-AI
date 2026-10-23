import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { newJoinCode } from '@/lib/classroom';
import { GRADES } from '@/lib/teacher-docs';

export const dynamic = 'force-dynamic';

// GET: classes the teacher runs, or the classes a student has joined.
export async function GET() {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const { user } = auth;

  if (user.role === 'TEACHER') {
    const classes = await prisma.classroom.findMany({
      where: { teacherId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { members: true, assignments: true } } },
    });
    return NextResponse.json({
      classes: classes.map(c => ({
        id: c.id, name: c.name, subject: c.subject, grade: c.grade, joinCode: c.joinCode,
        students: c._count.members, assignments: c._count.assignments,
      })),
    });
  }

  const memberships = await prisma.classMember.findMany({
    where: { userId: user.id },
    orderBy: { joinedAt: 'desc' },
    include: {
      classroom: {
        include: { teacher: { select: { name: true } }, _count: { select: { assignments: true } } },
      },
    },
  });
  return NextResponse.json({
    classes: memberships.map(m => ({
      id: m.classroom.id, name: m.classroom.name, subject: m.classroom.subject, grade: m.classroom.grade,
      teacher: m.classroom.teacher.name, assignments: m.classroom._count.assignments,
    })),
  });
}

// POST: teacher creates a class.
export async function POST(req: NextRequest) {
  const auth = await requireUser('TEACHER');
  if ('error' in auth) return auth.error;
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? '').trim().slice(0, 100);
  if (!name) return NextResponse.json({ error: 'Class name is required' }, { status: 400 });

  const cls = await prisma.classroom.create({
    data: {
      teacherId: auth.user.id,
      name,
      subject: String(body.subject ?? '').trim().slice(0, 60) || null,
      grade: GRADES.includes(body.grade) ? body.grade : null,
      joinCode: await newJoinCode(),
    },
    select: { id: true, joinCode: true },
  });
  return NextResponse.json(cls);
}
