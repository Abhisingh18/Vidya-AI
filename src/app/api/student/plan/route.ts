import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { generateJson, llmErrorMessage, LlmUnavailableError } from '@/lib/llm';
import { parseSources, sourceBlock } from '@/lib/source';
import {
  buildPlanPrompt, createPlanContent, istDate, parsePlanAi, parsePlanContent, parsePlanRequest, planProgress,
  planStatus, plannerSystemPrompt, studyDates,
} from '@/lib/planner';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// POST { examName, examDate, hoursPerDay, daysOff, language, grade, subjects[{name, chapters, confidence}], sources }
export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const body = await req.json().catch(() => ({}));
  const now = new Date();
  const today = istDate(now);
  const sources = parseSources(body.sources);
  const parsed = parsePlanRequest(body, today, sources.length > 0);
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { req: plan } = parsed;

  const focus = plan.subjects.map(s => s.name).join(', ');
  const prompt = buildPlanPrompt(plan, { today, studyDays: studyDates(today, plan.examDate, plan.daysOff).length },
    sourceBlock(sources, focus, 16_000));
  let ai;
  try {
    ai = await generateJson(prompt, v => parsePlanAi(v, plan.subjects), {
      system: plannerSystemPrompt, maxTokens: plan.language === 'English' ? 5000 : 9000,
    });
  } catch (err) {
    if (err instanceof LlmUnavailableError) {
      console.error('[student/plan]', err.message);
      return NextResponse.json({ error: llmErrorMessage(err) }, { status: 503 });
    }
    throw err;
  }

  const content = createPlanContent(plan, ai, now);
  const doc = await prisma.studentDoc.create({
    data: {
      userId: auth.user.id, type: 'plan', title: plan.examName, topic: focus.slice(0, 200),
      grade: plan.grade, language: plan.language, content: JSON.stringify(content),
    },
    select: { id: true },
  });
  return NextResponse.json({ id: doc.id });
}

// GET: my study plans with progress and status.
export async function GET() {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const docs = await prisma.studentDoc.findMany({ where: { userId: auth.user.id, type: 'plan' }, orderBy: { updatedAt: 'desc' }, take: 50 });
  const plans = docs.flatMap(d => {
    const c = parsePlanContent(d.content);
    if (!c) return [];
    return [{
      id: d.id, title: d.title, examDate: c.examDate, subjects: c.subjects.map(s => s.name),
      progress: planProgress(c), status: planStatus(c), updatedAt: d.updatedAt,
    }];
  });
  return NextResponse.json({ plans });
}
