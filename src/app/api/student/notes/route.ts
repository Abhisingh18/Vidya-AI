import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { awardXp } from '@/lib/xp';
import { generateJson, llmErrorMessage, LlmUnavailableError } from '@/lib/llm';
import { buildNotesPrompt, notesMaxTokens, parseGeneratedNotes, parseNotes } from '@/lib/notes';
import { resolveStudyInput } from '../flashcards/study-input';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// GET: my revision notes, newest first.
export async function GET() {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const docs = await prisma.studentDoc.findMany({
    where: { userId: auth.user.id, type: 'notes' },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });
  const notes = docs.map(d => {
    let content: unknown = null;
    try { content = JSON.parse(d.content); } catch { /* shown without a preview */ }
    const n = parseNotes(content, false, d.topic);
    return {
      id: d.id, title: d.title, topic: d.topic, grade: d.grade, language: d.language, updatedAt: d.updatedAt,
      oneLine: n?.oneLine ?? '', emoji: n?.mindMap.emoji || n?.mindMap.children.find(b => b.emoji)?.emoji || '',
      branches: n?.mindMap.children.map(b => b.label).filter(Boolean).slice(0, 6) ?? [],
      source: n?.source ?? null,
    };
  });
  return NextResponse.json({ notes });
}

// POST: generate a revision sheet from a topic, uploaded notes or a library video.
export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const resolved = await resolveStudyInput(body, auth.user.id, { allowNotes: false });
  if ('error' in resolved) return resolved.error;
  const { topic, grade, language, sources, sourceKind, source } = resolved.input;

  let notes;
  try {
    notes = await generateJson(
      buildNotesPrompt({ topic, grade, language, sources, sourceKind }),
      v => parseGeneratedNotes(v, topic),
      { maxTokens: notesMaxTokens(language) },
    );
  } catch (err) {
    if (err instanceof LlmUnavailableError) {
      console.error('[student/notes]', err.message);
      return NextResponse.json({ error: llmErrorMessage(err) }, { status: 503 });
    }
    throw err;
  }

  const { title, ...content } = notes;
  const doc = await prisma.studentDoc.create({
    data: {
      userId: auth.user.id, type: 'notes', title: title.slice(0, 200), topic, grade, language,
      content: JSON.stringify({ ...content, source }),
    },
    select: { id: true },
  });
  const xp = await awardXp(auth.user.id, 'notes_created', doc.id);
  return NextResponse.json({ id: doc.id, xp });
}
