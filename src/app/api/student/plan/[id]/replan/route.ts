import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { generateJson, llmErrorMessage, LlmUnavailableError } from '@/lib/llm';
import {
  buildPlanPrompt, chapterStatuses, istDate, parseDaysOff, parseHours, parsePlanAi, parsePlanContent, plannerSystemPrompt,
  replanContent, studyDates,
} from '@/lib/planner';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// POST { hoursPerDay?, daysOff? } → keep finished tasks, re-schedule everything else from today (one AI call).
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const doc = await prisma.studentDoc.findFirst({ where: { id: params.id, userId: auth.user.id, type: 'plan' } });
  if (!doc) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
  const content = parsePlanContent(doc.content);
  if (!content) return NextResponse.json({ error: 'This plan could not be loaded.' }, { status: 500 });

  const body = await req.json().catch(() => ({}));
  const now = new Date();
  const today = istDate(now);
  if (content.examDate <= today) return NextResponse.json({ error: 'The exam date has passed — make a new plan.' }, { status: 400 });
  const hoursPerDay = body.hoursPerDay === undefined ? content.hoursPerDay : parseHours(body.hoursPerDay);
  if (hoursPerDay === null) return NextResponse.json({ error: 'Hours per day must be between 0.5 and 12.' }, { status: 400 });
  const daysOff = body.daysOff === undefined ? content.daysOff : parseDaysOff(body.daysOff);
  const days = studyDates(today, content.examDate, daysOff).length;
  if (!days) return NextResponse.json({ error: 'There are no study days left before the exam with these days off.' }, { status: 400 });

  const prompt = buildPlanPrompt(
    { examName: content.examName, examDate: content.examDate, hoursPerDay, language: content.language, subjects: content.subjects, grade: doc.grade },
    { today, studyDays: days, status: chapterStatuses(content) },
  );
  let ai;
  try {
    ai = await generateJson(prompt, v => parsePlanAi(v, content.subjects), {
      system: plannerSystemPrompt, maxTokens: content.language === 'English' ? 5000 : 9000,
    });
  } catch (err) {
    if (err instanceof LlmUnavailableError) return NextResponse.json({ error: llmErrorMessage(err) }, { status: 503 });
    throw err;
  }
  const next = replanContent(content, ai, now, { hoursPerDay, daysOff });
  await prisma.studentDoc.update({ where: { id: doc.id }, data: { content: JSON.stringify(next) } });
  return NextResponse.json({ ok: true });
}
