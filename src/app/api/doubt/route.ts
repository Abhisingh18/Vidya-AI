import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODELS = [
  'openai/gpt-oss-20b:free',
  'google/gemma-4-31b-it:free',
  'openai/gpt-oss-120b:free',
];

async function callModel(model: string, messages: { role: string; content: string }[]) {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://vidyaai.app',
        'X-Title': 'VidyaAI',
      },
      body: JSON.stringify({ model, messages, temperature: 0.6, max_tokens: 700 }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? '';
    return raw ? String(raw).replace(/<think>[\s\S]*?<\/think>/gi, '').trim() : null;
  } catch {
    return null;
  }
}

// Doubt-solving chatbot scoped to one lesson.
export async function POST(req: NextRequest) {
  const { topic, language, question, script } = await req.json();
  if (!question?.trim()) return NextResponse.json({ error: 'question required' }, { status: 400 });

  const scriptText = Array.isArray(script)
    ? script.map((l: { text?: string }) => l.text ?? '').join(' ').slice(0, 2000)
    : '';

  const system = `You are VidyaAI's friendly tutor helping an Indian student understand "${topic}".
Answer the student's doubt clearly and simply, like a patient teacher.
${language && language !== 'English' ? `Reply in ${language} (Hinglish is welcome).` : 'Reply in simple English.'}
Keep it concise — 2 to 5 sentences. Use an example if it helps.
${scriptText ? `\nLesson context: ${scriptText}` : ''}`;

  if (!OPENROUTER_API_KEY) {
    return NextResponse.json({ answer: 'Tutor is not configured right now. Please try again later.' });
  }

  for (const model of MODELS) {
    const answer = await callModel(model, [
      { role: 'system', content: system },
      { role: 'user', content: question },
    ]);
    if (answer) return NextResponse.json({ answer });
  }

  return NextResponse.json({
    answer: 'Sorry, the tutor is busy right now. Please try asking again in a moment.',
  });
}
