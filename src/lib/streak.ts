import { prisma } from './prisma';

/**
 * Update a user's learning streak whenever they take a meaningful action
 * (generate a video, watch one, download one).
 * - Same calendar day → no change
 * - Yesterday → increment by 1
 * - Older  → reset to 1
 */
export async function bumpStreak(userId: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const existing = await prisma.streak.findUnique({ where: { userId } });

  if (!existing) {
    return prisma.streak.create({
      data: { userId, current: 1, longest: 1, lastActiveAt: now },
    });
  }

  const last = new Date(existing.lastActiveAt);
  const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate());
  const diffDays = Math.round((today.getTime() - lastDay.getTime()) / 86_400_000);

  let current = existing.current;
  if (diffDays === 0) {
    // same day — keep current streak, just bump activity time
  } else if (diffDays === 1) {
    current = existing.current + 1;
  } else {
    current = 1;
  }

  const longest = Math.max(existing.longest, current);

  return prisma.streak.update({
    where: { userId },
    data: { current, longest, lastActiveAt: now },
  });
}
