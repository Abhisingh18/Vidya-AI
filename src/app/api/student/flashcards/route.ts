import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { generateJson, llmErrorMessage, LlmUnavailableError } from '@/lib/llm';
import {
  buildFlashcardsPrompt, CARD_COUNTS, dueSummary, flashcardsMaxTokens, parseDeck, parseGeneratedDeck, resolveToday,
} from '@/lib/flashcards';
import { resolveStudyInput } from './study-input';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// GET: my decks with how many cards are due on `?today=YYYY-MM-DD` (the browser's day).
export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const today = resolveToday(req.nextUrl.searchParams.get('today'));
  const docs = await prisma.studentDoc.findMany({
    where: { userId: auth.user.id, type: 'flashcards' },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });
  const decks = docs.map(d => {
    let content: unknown = null;
    try { content = JSON.parse(d.content); } catch { /* counted as empty */ }
    const deck = parseDeck(content, { today });
    const summary = dueSummary(deck?.cards ?? [], today);
    return {
      id: d.id, title: d.title, topic: d.topic, grade: d.grade, language: d.language,
      updatedAt: d.updatedAt, source: deck?.source ?? null, emoji: deck?.cards.find(c => c.emoji)?.emoji ?? '',
      ...summary,
    };
  });
  return NextResponse.json({ decks, today });
}

// POST: generate a deck from a topic, uploaded notes, a library video or my revision notes.
export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const count = body.count === undefined ? 15 : Number(body.count);
  if (!(CARD_COUNTS as readonly number[]).includes(count)) {
    return NextResponse.json({ error: `Choose ${CARD_COUNTS.join(', ')} cards` }, { status: 400 });
  }
  const resolved = await resolveStudyInput(body, auth.user.id, { allowNotes: true });
  if ('error' in resolved) return resolved.error;
  const { topic, grade, language, sources, sourceKind, source } = resolved.input;
  const today = resolveToday(body.today);

  let deck;
  try {
    deck = await generateJson(
      buildFlashcardsPrompt({ topic, grade, language, count, sources, sourceKind }),
      v => parseGeneratedDeck(v, count, today),
      { maxTokens: flashcardsMaxTokens(count, language) },
    );
  } catch (err) {
    if (err instanceof LlmUnavailableError) {
      console.error('[student/flashcards]', err.message);
      return NextResponse.json({ error: llmErrorMessage(err) }, { status: 503 });
    }
    throw err;
  }

  const title = (deck.title || topic).slice(0, 200);
  const doc = await prisma.studentDoc.create({
    data: {
      userId: auth.user.id, type: 'flashcards', title, topic, grade, language,
      content: JSON.stringify({ cards: deck.cards, source }),
    },
    select: { id: true },
  });
  return NextResponse.json({ id: doc.id });
}
