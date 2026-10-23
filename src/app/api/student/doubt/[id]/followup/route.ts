import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { generateJson, LlmUnavailableError, llmErrorMessage } from '@/lib/llm';
import { buildFollowupPrompt, parseFollowupReply, readStoredDoubt, TEXT_AI_DEADLINE_MS, validateFollowupInput, withDeadline } from '../../solver';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

// POST { message, simpler?, history? } → { answer } — a short reply (≤ 120 words)
// in the doubt's language, with the saved solution as context.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  const body = await req.json().catch(() => null);
  const v = validateFollowupInput(body);
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: v.status });

  const doc = await prisma.studentDoc.findFirst({
    where: { id: params.id, userId: auth.user.id, type: 'doubt' },
    select: { content: true },
  });
  if (!doc) return NextResponse.json({ error: 'Doubt not found.' }, { status: 404 });
  const doubt = readStoredDoubt(doc.content);
  if (!doubt) return NextResponse.json({ error: 'This doubt could not be opened.' }, { status: 500 });

  const { system, prompt } = buildFollowupPrompt(doubt, v.value);
  try {
    const answer = await withDeadline(generateJson(prompt, parseFollowupReply, { system, maxTokens: 900 }), TEXT_AI_DEADLINE_MS);
    return NextResponse.json({ answer });
  } catch (err) {
    if (err instanceof LlmUnavailableError) return NextResponse.json({ error: llmErrorMessage(err) }, { status: 503 });
    console.error('[doubt] follow-up failed:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
