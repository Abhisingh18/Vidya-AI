import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { awardXp } from '@/lib/xp';
import { generateJson, llmErrorMessage, LlmUnavailableError } from '@/lib/llm';
import {
  applyGrades, attemptXp, buildAttempt, buildGradingPrompt, gradingSystemPrompt, parseAnswers, parseGrades,
  parseMockContent, summarize, writtenToGrade, type MockAttempt, type MockContent, type WrittenGrade, type WrittenItem,
} from '@/lib/mock';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/** All written answers of a submission in one AI call; null (= pending) if the AI is unavailable. */
async function grade(content: MockContent, items: WrittenItem[]): Promise<{ grades: Record<string, WrittenGrade> | null; error?: string }> {
  if (!items.length) return { grades: {} };
  try {
    const grades = await generateJson(buildGradingPrompt(content.config, items), v => parseGrades(v, items), {
      system: gradingSystemPrompt,
      maxTokens: content.config.language === 'English' ? 3000 : 6000,
    });
    return { grades };
  } catch (err) {
    if (err instanceof LlmUnavailableError) {
      console.error('[student/mock/submit] grading unavailable:', err.message);
      return { grades: null, error: llmErrorMessage(err) };
    }
    throw err;
  }
}

/**
 * POST { answers, startedAt, autoSubmitted } → grade and save a new attempt.
 * POST { regrade: <attempt no> } → retry AI grading of that attempt's pending answers.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const doc = await prisma.studentDoc.findFirst({ where: { id: params.id, userId: auth.user.id, type: 'mock' } });
  if (!doc) return NextResponse.json({ error: 'Mock test not found' }, { status: 404 });
  const content = parseMockContent(doc.content);
  if (!content) return NextResponse.json({ error: 'This mock test could not be loaded.' }, { status: 500 });
  const body = await req.json().catch(() => ({}));

  let attempt: MockAttempt;
  let gradingError: string | undefined;

  if (body.regrade !== undefined) {
    const idx = content.attempts.findIndex(a => a.no === Number(body.regrade));
    if (idx < 0) return NextResponse.json({ error: 'That attempt was not found.' }, { status: 404 });
    const old = content.attempts[idx];
    if (!old.pending) return NextResponse.json({ attempt: summarize(old) });
    const pendingIds = new Set(old.results.filter(r => r.status === 'pending').map(r => r.id));
    const { grades, error } = await grade(content, writtenToGrade(content.questions, old.answers, pendingIds));
    if (!grades) return NextResponse.json({ error }, { status: 503 });
    attempt = applyGrades(old, content, grades);
    content.attempts[idx] = attempt;
  } else {
    const answers = parseAnswers(body.answers, content.questions);
    const startedAt = typeof body.startedAt === 'string' ? body.startedAt : new Date().toISOString();
    const result = await grade(content, writtenToGrade(content.questions, answers));
    gradingError = result.error;
    attempt = buildAttempt({ content, answers, startedAt, now: new Date(), autoSubmitted: body.autoSubmitted === true, grades: result.grades });
    content.attempts.push(attempt);
  }

  // XP once the whole attempt is marked (scaled by the score).
  if (!attempt.pending && !attempt.xp) {
    attempt.xp = await awardXp(auth.user.id, 'mock_completed', `${doc.id}:${attempt.no}`, attemptXp(attempt));
  }

  await prisma.studentDoc.update({ where: { id: doc.id }, data: { content: JSON.stringify(content) } });
  return NextResponse.json({ attempt: summarize(attempt), gradingError });
}
