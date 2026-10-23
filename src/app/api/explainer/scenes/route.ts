import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import { generateJson, llmErrorMessage, LlmUnavailableError } from '@/lib/llm';
import { parseOutline } from '@/lib/explainer';
import {
  buildScenesPrompt, MAX_CHUNK, parseSceneChunk, readExplainerInput, scenesMaxTokens,
} from '@/lib/explainer-prompts';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// POST {topic, grade, language, sources?, outline, from, to}: narrated scenes for outline
// scenes [from, to) → { scenes }. Chunks of ≤ 5 keep each call inside the LLM budget.
export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  const body = await req.json().catch(() => ({}));
  const input = readExplainerInput(body);
  if ('error' in input) return NextResponse.json({ error: input.error }, { status: 400 });

  const outline = parseOutline(body.outline);
  if (!outline) return NextResponse.json({ error: 'A valid outline is required' }, { status: 400 });
  const from = Number(body.from);
  const to = Number(body.to);
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || from >= to || to > outline.scenes.length) {
    return NextResponse.json({ error: `"from" and "to" must satisfy 0 ≤ from < to ≤ ${outline.scenes.length}` }, { status: 400 });
  }
  if (to - from > MAX_CHUNK) {
    return NextResponse.json({ error: `At most ${MAX_CHUNK} scenes per request` }, { status: 400 });
  }

  try {
    const scenes = await generateJson(
      buildScenesPrompt({ ...input, outline, from, to }),
      v => parseSceneChunk(v, outline, from, to),
      {
        system: 'You are India\'s best school teacher, writing explainer videos that students love. Return ONLY valid JSON, no prose.',
        maxTokens: scenesMaxTokens(to - from, input.language),
      },
    );
    return NextResponse.json({ scenes });
  } catch (err) {
    if (err instanceof LlmUnavailableError) {
      console.error('[explainer/scenes]', err.message);
      return NextResponse.json({ error: llmErrorMessage(err) }, { status: 503 });
    }
    throw err;
  }
}
