import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { awardXp } from '@/lib/xp';
import { applyDeckPatch, parseDeck, parseDeckPatch, resolveToday, type DeckContent } from '@/lib/flashcards';

export const dynamic = 'force-dynamic';

async function ownDeck(id: string, userId: string) {
  const doc = await prisma.studentDoc.findFirst({ where: { id, userId, type: 'flashcards' } });
  if (!doc) return null;
  let content: unknown = null;
  try { content = JSON.parse(doc.content); } catch { /* treated as empty */ }
  return { doc, deck: parseDeck(content) ?? ({ cards: [], source: null } as DeckContent) };
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const own = await ownDeck(params.id, auth.user.id);
  if (!own) return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
  const { doc, deck } = own;
  return NextResponse.json({
    deck: { id: doc.id, title: doc.title, topic: doc.topic, grade: doc.grade, language: doc.language, updatedAt: doc.updatedAt, ...deck },
  });
}

/**
 * PATCH: send only what changed.
 *   { today, reviews: [{id, grade 1–4}] }  — grade cards; the server runs the SM-2 schedule
 *   { cards: [{id?, kind, front, back, example, emoji}] } — edit (known id) or add cards
 *   { deleted: [id] }, { reset: true }, { title }
 *   { finish: true } — end of a study session: XP once per deck per day (needs a review today)
 * Returns the changed cards with their new schedule.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const patch = parseDeckPatch(body);
  if (typeof patch === 'string') return NextResponse.json({ error: patch }, { status: 400 });
  let title: string | undefined;
  if (body.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim()) return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
    title = body.title.replace(/\s+/g, ' ').trim().slice(0, 200);
  }

  const own = await ownDeck(params.id, auth.user.id);
  if (!own) return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
  const today = resolveToday(body.today);

  const touchesCards = patch.reviews.length || patch.cards.length || patch.deleted.length || patch.reset;
  let deck = own.deck;
  let changed: string[] = [];
  if (touchesCards) {
    const result = applyDeckPatch(own.deck, patch, today);
    if (typeof result === 'string') return NextResponse.json({ error: result }, { status: 400 });
    deck = result.deck;
    changed = result.changed;
  }
  if (touchesCards || title) {
    await prisma.studentDoc.update({
      where: { id: own.doc.id },
      data: { ...(title ? { title } : {}), ...(touchesCards ? { content: JSON.stringify(deck) } : {}) },
    });
  }

  let xp = 0;
  if (body.finish === true && deck.cards.some(c => c.srs.last === today)) {
    xp = await awardXp(auth.user.id, 'flashcards_reviewed', `${own.doc.id}:${today}`);
  }
  return NextResponse.json({ ok: true, cards: deck.cards.filter(c => changed.includes(c.id)), xp });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const { count } = await prisma.studentDoc.deleteMany({ where: { id: params.id, userId: auth.user.id, type: 'flashcards' } });
  return count ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'Deck not found' }, { status: 404 });
}
