import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { generateJson, llmErrorMessage, LlmUnavailableError } from '@/lib/llm';
import { deriveTopic, parseSources, sourceBlock } from '@/lib/source';
import { LANGUAGES } from '@/lib/languages';
import {
  assembleMock, attemptPct, bestAttempt, buildMockPrompt, chaptersFromText, MOCK_CLASSES, MOCK_DIFFICULTY_LIST,
  MOCK_LENGTH_LIST, mockSystemPrompt, mockTitle, parseMockCall, parseMockContent, planMock, planMockCalls, totalMarks,
  type MockDifficulty, type MockLength, type MockQuestion, type MockRequest,
} from '@/lib/mock';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const LANGUAGE_NAMES = LANGUAGES.map(l => l.name);
const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, max) : '');
const bad = (error: string) => NextResponse.json({ error }, { status: 400 });

// POST { subject, grade, language, length, difficulty, topics, sources }: generate a mock test and save it.
export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const body = await req.json().catch(() => ({}));

  const subject = clean(body.subject, 100);
  if (!subject) return bad('Enter the subject.');
  const grade = String(body.grade ?? '');
  if (!MOCK_CLASSES.includes(grade)) return bad('Pick your class.');
  const length = body.length as MockLength;
  if (!MOCK_LENGTH_LIST.includes(length)) return bad('Pick a test length.');
  const difficulty: MockDifficulty = MOCK_DIFFICULTY_LIST.includes(body.difficulty) ? body.difficulty : 'balanced';
  const language = LANGUAGE_NAMES.includes(body.language) ? String(body.language) : 'English';
  const chapters = chaptersFromText(String(body.topics ?? '').slice(0, 4000));
  const sources = parseSources(body.sources);
  if (!chapters.length && !sources.length) return bad('Add the chapters or topics to cover, or upload your syllabus.');

  const request: MockRequest = { subject, grade, language, length, difficulty, chapters };
  const calls = planMockCalls(planMock(length, difficulty, chapters), language);
  const sourceChars = calls.length > 1 ? 12_000 : 20_000;
  // Usually one request; long or Indic-language tests are split and run in parallel (free models are slow).
  const settled = await Promise.allSettled(calls.map(call => {
    const focus = Array.from(new Set(call.plan.map(q => q.chapter).filter(Boolean))).join(', ') || subject;
    const prompt = buildMockPrompt(request, call, sourceBlock(sources, focus, sourceChars));
    return generateJson<MockQuestion[]>(prompt, v => parseMockCall(v, call), {
      system: mockSystemPrompt,
      maxTokens: Math.min(10_000, Math.max(3000, Math.round(call.estTokens * 2.2))),
    });
  }));

  const failed = settled.flatMap(r => (r.status === 'rejected' ? [r.reason as unknown] : []));
  if (failed.length) {
    const other = failed.find(e => !(e instanceof LlmUnavailableError));
    if (other) throw other;
    const err = (failed.find(e => (e as LlmUnavailableError).reason !== 'busy') ?? failed[0]) as LlmUnavailableError;
    console.error('[student/mock]', err.message);
    return NextResponse.json({ error: llmErrorMessage(err) }, { status: 503 });
  }

  const results = settled.map(r => (r as PromiseFulfilledResult<MockQuestion[]>).value);
  const content = assembleMock(request, sources.map(s => s.name), results);
  const doc = await prisma.studentDoc.create({
    data: {
      userId: auth.user.id,
      type: 'mock',
      title: mockTitle(subject, chapters),
      topic: (chapters.join(', ') || deriveTopic(sources) || subject).slice(0, 200),
      grade,
      language,
      content: JSON.stringify(content),
    },
    select: { id: true },
  });
  return NextResponse.json({ id: doc.id });
}

// GET: the student's mock tests with attempt count and best score.
export async function GET() {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const docs = await prisma.studentDoc.findMany({
    where: { userId: auth.user.id, type: 'mock' },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });
  const tests = docs.flatMap(d => {
    const c = parseMockContent(d.content);
    if (!c) return [];
    const best = bestAttempt(c.attempts);
    const last = c.attempts[c.attempts.length - 1];
    return [{
      id: d.id,
      title: d.title,
      topic: d.topic,
      grade: d.grade,
      language: d.language,
      subject: c.config.subject,
      length: c.config.length,
      minutes: c.config.minutes,
      questionCount: c.questions.length,
      maxScore: totalMarks(c),
      attempts: c.attempts.length,
      bestPct: best ? Math.round(attemptPct(best) * 100) : null,
      bestPending: best?.pending ?? false,
      lastAttemptAt: last?.submittedAt ?? null,
      createdAt: d.createdAt,
    }];
  });
  return NextResponse.json({ tests });
}
