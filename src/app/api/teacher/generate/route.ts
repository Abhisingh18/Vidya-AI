import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { generateJson, llmErrorMessage, LlmUnavailableError } from '@/lib/llm';
import { buildPrompt, PARSERS, GRADES, LANGUAGES, type GeneratedDocType, type SlidesContent } from '@/lib/teacher-docs';
import { attachImages } from '@/lib/commons';
import { deriveTopic, parseSources } from '@/lib/source';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const REQUEST_BUDGET_MS = 280_000; // under maxDuration, leaving time to save
const IMAGES_MAX_MS = 90_000;

const clamp = (v: unknown, lo: number, hi: number, d: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(lo, Math.min(hi, Math.round(n))) : d;
};

// POST: generate a slide deck / quiz / lesson plan with AI and save it as a draft.
// Optional `sources` (uploaded syllabus/notes/PPT as text) ground the content.
export async function POST(req: NextRequest) {
  const started = Date.now();
  const auth = await requireUser('TEACHER');
  if ('error' in auth) return auth.error;

  const body = await req.json().catch(() => ({}));
  const type = body.type as GeneratedDocType;
  if (!(type in PARSERS)) return NextResponse.json({ error: 'Unknown type' }, { status: 400 });

  // Uploaded material (text extracted in the browser); the topic may then be left empty.
  const sources = parseSources(body.sources);
  const topic = (String(body.topic ?? '').trim() || deriveTopic(sources)).slice(0, 200);
  if (!topic) return NextResponse.json({ error: 'Add a topic or upload your material' }, { status: 400 });
  const grade = GRADES.includes(body.grade) ? body.grade : '9';
  const language = LANGUAGES.includes(body.language) ? body.language : 'English';

  const options = {
    topic, grade, language,
    slideCount: clamp(body.slideCount, 5, 20, 10),
    questionCount: clamp(body.questionCount, 3, 30, 10),
    difficulty: ['easy', 'medium', 'hard'].includes(body.difficulty) ? body.difficulty : 'medium',
    duration: clamp(body.duration, 20, 120, 40),
    extra: String(body.extra ?? '').trim().slice(0, 500),
    sources,
  };

  let content: unknown;
  try {
    const parse = (v: unknown): unknown => PARSERS[type](v);
    content = await generateJson(buildPrompt(type, options), parse, { maxTokens: type === 'slides' ? 8000 : 6000 });
  } catch (err) {
    if (err instanceof LlmUnavailableError) {
      console.error('[teacher/generate]', err.message);
      return NextResponse.json({ error: llmErrorMessage(err) }, { status: 503 });
    }
    throw err;
  }

  // Real pictures from Wikimedia Commons, checked by a vision model (best effort).
  // Gets what's left of the request budget, capped so teachers aren't kept waiting.
  if (type === 'slides') {
    const left = REQUEST_BUDGET_MS - (Date.now() - started);
    await attachImages((content as SlidesContent).slides, {
      topic, grade, language, deadlineMs: Math.min(IMAGES_MAX_MS, left),
    });
  }

  const doc = await prisma.teacherDoc.create({
    data: { userId: auth.user.id, type, title: topic, topic, grade, language, content: JSON.stringify(content) },
    select: { id: true },
  });
  return NextResponse.json({ id: doc.id });
}
