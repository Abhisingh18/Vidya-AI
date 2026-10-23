import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { classAccess, gradeQuiz } from '@/lib/classroom';
import { awardXp } from '@/lib/xp';

export const dynamic = 'force-dynamic';

// POST { answers: number[] }: a student submits an assigned quiz once; graded on the server.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser('STUDENT');
  if ('error' in auth) return auth.error;

  const a = await prisma.assignment.findUnique({ where: { id: params.id }, include: { doc: true } });
  if (!a || a.kind !== 'quiz' || !a.doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const access = await classAccess(a.classroomId, auth.user);
  if (!access || access.isTeacher) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const existing = await prisma.quizAttempt.findUnique({
    where: { assignmentId_userId: { assignmentId: a.id, userId: auth.user.id } },
    select: { id: true },
  });
  if (existing) return NextResponse.json({ error: 'You have already submitted this quiz' }, { status: 409 });

  const body = await req.json().catch(() => ({}));
  const result = gradeQuiz(a.doc.content, body.answers);
  if (!result) return NextResponse.json({ error: 'Quiz is unavailable' }, { status: 500 });

  await prisma.quizAttempt.create({
    data: {
      assignmentId: a.id, userId: auth.user.id,
      answers: JSON.stringify(result.answers), score: result.score, total: result.total,
    },
  });
  // 10 XP for finishing plus up to 20 for the score.
  const xp = await awardXp(
    auth.user.id, 'class_quiz', a.id,
    10 + (result.total > 0 ? Math.round((20 * result.score) / result.total) : 0),
  );
  return NextResponse.json({ result, xp });
}
