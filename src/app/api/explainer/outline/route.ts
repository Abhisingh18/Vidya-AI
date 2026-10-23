import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import { generateJson, llmErrorMessage, LlmUnavailableError } from '@/lib/llm';
import { buildOutlinePrompt, parseOutlineAnswer, readExplainerInput } from '@/lib/explainer-prompts';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// POST {topic, grade, language, sources?}: plan an explainer video → { outline }.
// `sources` (uploaded notes as text) may replace the topic; the plan then follows them.
// The client then writes the scenes in parallel chunks via /api/explainer/scenes.
export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  const input = readExplainerInput(await req.json().catch(() => ({})));
  if ('error' in input) return NextResponse.json({ error: input.error }, { status: 400 });

  try {
    const outline = await generateJson(buildOutlinePrompt(input), parseOutlineAnswer, { maxTokens: 3000 });
    return NextResponse.json({ outline });
  } catch (err) {
    if (err instanceof LlmUnavailableError) {
      console.error('[explainer/outline]', err.message);
      return NextResponse.json({ error: llmErrorMessage(err) }, { status: 503 });
    }
    throw err;
  }
}
