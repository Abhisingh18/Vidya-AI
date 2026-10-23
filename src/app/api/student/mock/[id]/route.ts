import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { parseMockContent, publicQuestions, summarize, totalMarks } from '@/lib/mock';

export const dynamic = 'force-dynamic';

/**
 * GET: the test for taking it — questions WITHOUT answers, plus attempt summaries.
 * ?review=<attempt no>|last additionally returns that finished attempt and the
 * full questions (answers, explanations) for its review.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const doc = await prisma.studentDoc.findFirst({ where: { id: params.id, userId: auth.user.id, type: 'mock' } });
  if (!doc) return NextResponse.json({ error: 'Mock test not found' }, { status: 404 });
  const c = parseMockContent(doc.content);
  if (!c) return NextResponse.json({ error: 'This mock test could not be loaded.' }, { status: 500 });

  const test = {
    id: doc.id,
    title: doc.title,
    topic: doc.topic,
    grade: doc.grade,
    language: doc.language,
    createdAt: doc.createdAt,
    config: c.config,
    maxScore: totalMarks(c),
    questions: publicQuestions(c),
    attempts: c.attempts.map(summarize),
  };

  const review = req.nextUrl.searchParams.get('review');
  if (!review) return NextResponse.json({ test });
  const attempt = review === 'last' ? c.attempts[c.attempts.length - 1] : c.attempts.find(a => a.no === Number(review));
  if (!attempt) return NextResponse.json({ error: 'That attempt was not found.' }, { status: 404 });
  return NextResponse.json({ test, review: { attempt, questions: c.questions } });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const { count } = await prisma.studentDoc.deleteMany({ where: { id: params.id, userId: auth.user.id, type: 'mock' } });
  return count ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'Mock test not found' }, { status: 404 });
}
