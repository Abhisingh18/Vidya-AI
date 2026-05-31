import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODELS = [
  'openai/gpt-oss-20b:free',
  'google/gemma-4-31b-it:free',
  'openai/gpt-oss-120b:free',
];

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number; // index into options
  explanation: string;
}

function extractJson(raw: string): QuizQuestion[] | null {
  let s = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  // Find the first [ ... ] array
  const start = s.indexOf('[');
  const end = s.lastIndexOf(']');
  if (start === -1 || end === -1) return null;
  try {
    const arr = JSON.parse(s.slice(start, end + 1));
    if (!Array.isArray(arr)) return null;
    return arr
      .filter(q => q && q.question && Array.isArray(q.options) && q.options.length >= 2)
      .map(q => ({
        question: String(q.question),
        options: q.options.map(String).slice(0, 4),
        correct: Math.max(0, Math.min(3, Number(q.correct) || 0)),
        explanation: String(q.explanation ?? ''),
      }));
  } catch {
    return null;
  }
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
          { role: 'system', content: 'You are a quiz generator. Return ONLY a JSON array, no prose.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 2000,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? '';
    return extractJson(raw);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const { topic, language, script } = await req.json();
  if (!topic) return NextResponse.json({ error: 'topic required' }, { status: 400 });

  const scriptText = Array.isArray(script)
    ? script.map((l: { text?: string }) => l.text ?? '').join(' ').slice(0, 2500)
    : '';

  const prompt = `Create a 4-question multiple-choice quiz to test understanding of "${topic}".
${language && language !== 'English' ? `Write the questions in ${language} (Hinglish style is fine).` : ''}
${scriptText ? `Base it on this lesson content:\n${scriptText}\n` : ''}
Each question must have exactly 4 options, one correct answer, and a one-line explanation.

Return ONLY a JSON array in this exact shape, nothing else:
[
  {"question": "...", "options": ["A","B","C","D"], "correct": 0, "explanation": "..."}
]`;

  if (OPENROUTER_API_KEY) {
    for (const model of MODELS) {
      const quiz = await callModel(model, prompt);
      if (quiz && quiz.length >= 2) {
        return NextResponse.json({ questions: quiz.slice(0, 5) });
      }
    }
  }

  // Fallback — a generic self-reflection quiz so the feature never hard-fails.
  return NextResponse.json({
    questions: [
      {
        question: `What is the main idea of "${topic}"?`,
        options: ['I can explain it clearly', 'I understand most of it', 'I need to rewatch', 'I am confused'],
        correct: 0,
        explanation: 'Rewatch the lesson if you are unsure — repetition builds mastery.',
      },
    ],
    fallback: true,
  });
}
