import { NextRequest, NextResponse } from 'next/server';
import { MODELS, NO_REASONING } from '@/lib/llm';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

interface SceneText { headline: string; say: string }

function extractJson(raw: string): { title?: string; scenes?: Partial<SceneText>[] } | null {
  let s = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try { return JSON.parse(s.slice(start, end + 1)); } catch { return null; }
}

async function callModel(model: string, prompt: string) {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://vidyaai.app',
        'X-Title': 'VidyaAI',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are a translator for short educational reels. Return ONLY JSON.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 3500,
        reasoning: NO_REASONING,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return extractJson(data.choices?.[0]?.message?.content ?? '');
  } catch {
    return null;
  }
}

// Translate a reel's title, headlines and spoken lines (written in English) into an Indian language.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const language = typeof body.language === 'string' ? body.language.trim().slice(0, 30) : '';
  const title = typeof body.title === 'string' ? body.title.slice(0, 200) : '';
  const scenes: SceneText[] = (Array.isArray(body.scenes) ? body.scenes : []).slice(0, 12).map((x: Partial<SceneText>) => ({
    headline: String(x?.headline ?? '').slice(0, 200), say: String(x?.say ?? '').slice(0, 500),
  }));
  if (!language || !scenes.length) {
    return NextResponse.json({ error: 'language and scenes required' }, { status: 400 });
  }

  const prompt = `Translate this short educational reel into ${language} for a school student.
Keep it natural, simple and friendly — the way a good teacher speaks in an Indian classroom. Use the ${language} script.
"say" is read aloud by a text-to-speech voice: plain words, numbers written as words where natural, no emoji or symbols.
"headline" is short on-screen text: keep it short, keep any emoji, numbers, formulas and symbols (a², CO₂, →, =) exactly, and keep the *asterisks* around the translated version of the starred word.
Keep scientific terms that Indian ${language}-medium textbooks keep in English.

TITLE: ${title}

SCENES (JSON): ${JSON.stringify(scenes.map((sc, i) => ({ i, ...sc })))}

Return ONLY this JSON shape:
{"title":"<translated title>","scenes":[{"headline":"...","say":"..."}, ...]}
The scenes array must have exactly ${scenes.length} items in the same order.`;

  if (OPENROUTER_API_KEY) {
    for (const model of MODELS) {
      const out = await callModel(model, prompt);
      if (out && Array.isArray(out.scenes) && out.scenes.length === scenes.length) {
        return NextResponse.json({
          title: String(out.title || title),
          scenes: out.scenes.map((sc, i) => ({
            headline: String(sc?.headline || scenes[i].headline),
            say: String(sc?.say || scenes[i].say),
          })),
        });
      }
    }
  }

  // No translation available: the player keeps the English text.
  return NextResponse.json({ title, scenes, fallback: true });
}
