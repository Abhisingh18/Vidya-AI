// The feedback loop: people rate AI results 👍/👎, and the ratings steer later generations
// without retraining any model —
//   • reuse:     a result that people found helpful is served again for the same input
//                (instant, and it saves the shared free AI quota);
//   • examples:  the best-rated results are shown to the model as examples of what works;
//   • exclusion: a result with more 👎 than 👍 is never reused or shown as an example.
// Ratings are stored per user (one vote each, changeable). No names or emails are copied
// into the feedback rows; `note` is optional free text the user chooses to write.

import { prisma } from '@/lib/prisma';

import type { FeedbackFeature } from './feedback-shared';

export * from './feedback-shared';

/**
 * The same question typed slightly differently should find the same answer:
 * case, spacing, punctuation and look-alike maths characters are ignored.
 * Language and class are part of the key — an answer is only reused for the same audience.
 */
export function inputKey(text: string, language: string, grade: string): string | null {
  const t = text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[−–—]/g, '-')
    .replace(/[×✕]/g, 'x')
    .replace(/[\s"'`.,;:!?()[\]{}]+/g, '')
    .slice(0, 400);
  if (t.length < 6) return null;
  return `${language.toLowerCase()}|${grade.toLowerCase()}|${t}`;
}

interface Score { refId: string; likes: number; dislikes: number }

/** 👍/👎 counts per result, from ratings stored as +1 / −1. */
async function scores(where: { feature: FeedbackFeature; key?: string; refId?: { in: string[] } }): Promise<Score[]> {
  const rows = await prisma.feedback.groupBy({ by: ['refId'], where, _sum: { rating: true }, _count: { _all: true } });
  return rows.map(r => {
    const sum = r._sum.rating ?? 0;
    const n = r._count._all;
    return { refId: r.refId, likes: (n + sum) / 2, dislikes: (n - sum) / 2 };
  });
}

/** Good enough to reuse or to show as an example: liked, and liked clearly more than disliked. */
const trusted = (s: Score) => s.likes >= 1 && s.likes >= 3 * s.dislikes;
const rank = (a: Score, b: Score) => (b.likes - b.dislikes) - (a.likes - a.dislikes);

/** A well-rated solved doubt for exactly this input (same text, language and class), if any. */
export async function reusableDoubt(key: string) {
  const best = (await scores({ feature: 'doubt', key })).filter(trusted).sort(rank)[0];
  if (!best) return null;
  return prisma.studentDoc.findFirst({ where: { id: best.refId, type: 'doubt' }, select: { id: true, content: true } });
}

/**
 * Up to `n` of the best-rated solved doubts in this language and class, newest votes first,
 * to show the model what students found helpful. Returns parsed contents.
 */
export async function helpfulDoubtExamples(language: string, grade: string, n = 2): Promise<unknown[]> {
  const liked = await prisma.feedback.findMany({
    where: { feature: 'doubt', rating: 1 },
    orderBy: { updatedAt: 'desc' },
    take: 200,
    select: { refId: true },
  });
  if (!liked.length) return [];
  const ids = Array.from(new Set(liked.map(l => l.refId)));
  const good = new Set((await scores({ feature: 'doubt', refId: { in: ids } })).filter(trusted).map(s => s.refId));
  const docs = await prisma.studentDoc.findMany({
    where: { id: { in: ids.filter(id => good.has(id)) }, type: 'doubt', language, grade },
    orderBy: { createdAt: 'desc' },
    take: n,
    select: { content: true },
  });
  return docs.flatMap(d => {
    try { return [JSON.parse(d.content)]; } catch { return []; }
  });
}
