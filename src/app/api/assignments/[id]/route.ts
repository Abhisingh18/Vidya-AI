import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { classAccess, gradeQuiz, quizForStudent } from '@/lib/classroom';
import { parseQuiz } from '@/lib/teacher-docs';

export const dynamic = 'force-dynamic';

// GET: an assignment as the viewer should see it. Students get quizzes without
// answers until they submit; teachers also get every student's result.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  const a = await prisma.assignment.findUnique({ where: { id: params.id }, include: { doc: true } });
  if (!a) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const access = await classAccess(a.classroomId, auth.user);
  if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const base = {
    id: a.id, kind: a.kind, title: a.title, dueAt: a.dueAt, videoId: a.videoId,
    classId: a.classroomId, className: access.cls.name, language: a.doc?.language, grade: a.doc?.grade,
  };

  if (access.isTeacher) {
    const attempts = await prisma.quizAttempt.findMany({
      where: { assignmentId: a.id },
      orderBy: { score: 'desc' },
      include: { user: { select: { name: true } } },
    });
    return NextResponse.json({
      isTeacher: true,
      assignment: { ...base, content: a.doc ? JSON.parse(a.doc.content) : null },
      results: attempts.map(t => ({ name: t.user.name, score: t.score, total: t.total, at: t.createdAt })),
    });
  }

  if (a.kind !== 'quiz' || !a.doc) {
    return NextResponse.json({ isTeacher: false, assignment: { ...base, content: a.doc ? JSON.parse(a.doc.content) : null } });
  }

  const quiz = parseQuiz(JSON.parse(a.doc.content), false);
  if (!quiz) return NextResponse.json({ error: 'Quiz is unavailable' }, { status: 500 });
  const attempt = await prisma.quizAttempt.findUnique({
    where: { assignmentId_userId: { assignmentId: a.id, userId: auth.user.id } },
  });
  if (attempt) {
    const result = gradeQuiz(a.doc.content, JSON.parse(attempt.answers));
    return NextResponse.json({ isTeacher: false, assignment: base, result });
  }
  return NextResponse.json({ isTeacher: false, assignment: { ...base, quiz: quizForStudent(quiz) } });
}
