import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { FEEDBACK_FEATURES, isFeature, isReason, MAX_FEEDBACK_NOTE, type FeedbackFeature } from '@/lib/feedback';

export const dynamic = 'force-dynamic';

/** The rated result must be the user's own; returns its input key (doubts) or false. */
async function ownResult(userId: string, feature: FeedbackFeature, refId: string): Promise<{ key: string | null } | false> {
  const where = { id: refId, userId, type: feature };
  const doc = FEEDBACK_FEATURES[feature] === 'student'
    ? await prisma.studentDoc.findFirst({ where, select: { content: true } })
    : await prisma.teacherDoc.findFirst({ where, select: { content: true } });
  if (!doc) return false;
  let key: string | null = null;
  try {
    const k = (JSON.parse(doc.content) as { inputKey?: unknown }).inputKey;
    if (typeof k === 'string') key = k;
  } catch { /* corrupt row: no key */ }
  return { key };
}

// GET ?feature=doubt&refId=… → { rating: 1 | -1 | 0, reason }
export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const feature = req.nextUrl.searchParams.get('feature');
  const refId = req.nextUrl.searchParams.get('refId') ?? '';
  if (!isFeature(feature) || !refId) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  const row = await prisma.feedback.findUnique({
    where: { userId_feature_refId: { userId: auth.user.id, feature, refId } },
    select: { rating: true, reason: true },
  });
  return NextResponse.json({ rating: row?.rating ?? 0, reason: row?.reason ?? null });
}

// POST { feature, refId, rating: 1 | -1 | 0, reason?, note? } → { ok: true }. Rating 0 removes the vote.
export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const userId = auth.user.id;
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  const feature = body?.feature;
  const refId = typeof body?.refId === 'string' ? body.refId.slice(0, 64) : '';
  const rating = body?.rating;
  if (!isFeature(feature) || !refId || (rating !== 1 && rating !== -1 && rating !== 0)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  const own = await ownResult(userId, feature, refId);
  if (!own) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  const id = { userId_feature_refId: { userId, feature, refId } };
  if (rating === 0) {
    await prisma.feedback.deleteMany({ where: { userId, feature, refId } });
    return NextResponse.json({ ok: true });
  }
  const reason = rating === -1 && isReason(body?.reason) ? body.reason : null;
  const note = rating === -1 && typeof body?.note === 'string' && body.note.trim() ? body.note.trim().slice(0, MAX_FEEDBACK_NOTE) : null;
  await prisma.feedback.upsert({
    where: id,
    create: { userId, feature, refId, rating, reason, note, key: own.key },
    update: { rating, reason, note, key: own.key },
  });
  return NextResponse.json({ ok: true });
}
