import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODELS = [
  'openai/gpt-oss-20b:free',
  'google/gemma-4-31b-it:free',
  'openai/gpt-oss-120b:free',
];

interface BeatText { say: string; sub?: string }

function extractJson(raw: string): { hook?: string; beats?: BeatText[] } | null {
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
        max_tokens: 1500,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return extractJson(data.choices?.[0]?.message?.content ?? '');
  } catch {
    return null;
  }
}

// Translate a reel's spoken lines + hook into a target Indian language.
export async function POST(req: NextRequest) {
  const { language, hook, beats } = await req.json();
  if (!language || !Array.isArray(beats)) {
    return NextResponse.json({ error: 'language and beats required' }, { status: 400 });
  }

  const items = beats.map((b: BeatText, i: number) => ({ i, say: b.say, sub: b.sub ?? '' }));

  const prompt = `Translate this short educational reel into ${language} for a school student.
Keep it natural, simple and friendly — the way a good teacher speaks. Use the ${language} script.
Keep any equations, numbers, symbols and emojis exactly as they are.
Do NOT translate proper scientific terms that are normally kept in English (translate them only if a common ${language} word exists).

HOOK: ${hook}

LINES (JSON): ${JSON.stringify(items)}

Return ONLY this JSON shape:
{"hook":"<translated hook>","beats":[{"say":"<translated say>","sub":"<translated sub or empty>"}, ...]}
The beats array must have exactly ${items.length} items in the same order.`;

  if (OPENROUTER_API_KEY) {
    for (const model of MODELS) {
      const out = await callModel(model, prompt);
      if (out && Array.isArray(out.beats) && out.beats.length === items.length) {
        return NextResponse.json({
          hook: out.hook ?? hook,
          beats: out.beats.map((b, idx) => ({
            say: String(b.say ?? items[idx].say),
            sub: b.sub ? String(b.sub) : undefined,
          })),
        });
      }
    }
  }

  // Fallback — return original text untouched so playback still works.
  return NextResponse.json({ hook, beats: items.map(it => ({ say: it.say, sub: it.sub || undefined })), fallback: true });
}
