import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { awardXp } from '@/lib/xp';
import { generateJson, LlmUnavailableError, llmErrorMessage } from '@/lib/llm';
import { generateVisionJson } from '@/lib/vision';
import {
  buildDoubtPrompt, DAILY_DOUBT_LIMIT, MAX_BODY_CHARS, parseDoubtReply, shortTitle,
  TEXT_AI_DEADLINE_MS, UNREADABLE_MESSAGE, validateDoubtInput, withDeadline, type Doubt, type DoubtReply, type DoubtSummary,
} from './solver';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;


// GET → { doubts: DoubtSummary[] }: the student's solved doubts, newest first.
export async function GET() {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  const docs = await prisma.studentDoc.findMany({
    where: { userId: auth.user.id, type: 'doubt' },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: { id: true, title: true, topic: true, grade: true, language: true, content: true, createdAt: true },
  });
  const doubts: DoubtSummary[] = docs.map(d => {
    let subject = '';
    try { subject = String((JSON.parse(d.content) as { subject?: unknown }).subject ?? ''); } catch { /* corrupt row */ }
    return { id: d.id, title: d.title, subject, topic: d.topic, grade: d.grade, language: d.language, createdAt: d.createdAt.toISOString() };
  });
  return NextResponse.json({ doubts });
}

// POST { image?: data URL, text?, language, grade } → { id, doubt, xp }
// 400/413 for bad input (before any AI call), 422 when the photo can't be read,
// 429 over the daily limit, 503 when the AI is unavailable.
export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const userId = auth.user.id;

  const raw = await req.text().catch(() => '');
  if (raw.length > MAX_BODY_CHARS) {
    return NextResponse.json({ error: 'That photo is too large (max 1.5 MB). Please try a smaller photo.' }, { status: 413 });
  }
  let body: unknown;
  try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }

  const v = validateDoubtInput(body);
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: v.status });
  const { image, text, language, grade } = v.value;

  const recent = await prisma.studentDoc.count({
    where: { userId, type: 'doubt', createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
  });
  if (recent >= DAILY_DOUBT_LIMIT) {
    return NextResponse.json({ error: `You've solved ${DAILY_DOUBT_LIMIT} doubts in the last 24 hours — great work! Please come back a little later.` }, { status: 429 });
  }

  const { system, prompt } = buildDoubtPrompt({ language, grade, text, hasImage: !!image });
  let reply: DoubtReply;
  try {
    reply = image
      ? await generateVisionJson([prompt, image], parseDoubtReply, { system, maxTokens: 4000 })
      : await withDeadline(generateJson(prompt, parseDoubtReply, { system, maxTokens: 4000 }), TEXT_AI_DEADLINE_MS);
  } catch (err) {
    if (err instanceof LlmUnavailableError) return NextResponse.json({ error: llmErrorMessage(err) }, { status: 503 });
    console.error('[doubt] solve failed:', err);
    return NextResponse.json({ error: 'Something went wrong while solving. Please try again.' }, { status: 500 });
  }

  if (reply.kind === 'unreadable') {
    return NextResponse.json({
      error: image ? UNREADABLE_MESSAGE : "That doesn't look like a study question — please type the full question.",
      code: 'unreadable',
      reason: reply.reason,
    }, { status: 422 });
  }

  const doubt: Doubt = {
    ...reply.doubt,
    language,
    grade,
    source: image ? 'photo' : 'text',
    ...(image && text ? { studentNote: text } : {}),
  };
  // The photo itself is never stored.
  const doc = await prisma.studentDoc.create({
    data: {
      userId,
      type: 'doubt',
      title: shortTitle(doubt.question),
      topic: doubt.topic.slice(0, 200),
      grade,
      language,
      content: JSON.stringify(doubt),
    },
    select: { id: true },
  });
  const xp = await awardXp(userId, 'doubt_solved', doc.id);
  return NextResponse.json({ id: doc.id, doubt, xp });
}
