import { prisma } from './prisma';
import { bumpStreak } from './streak';

// Points per learning action. Shown to students on the Achievements page.
export const XP_RULES = {
  video_watched: { points: 10, label: 'Watched a lesson' },
  video_generated: { points: 15, label: 'Generated a lesson' },
  class_quiz: { points: 20, label: 'Finished a class quiz' },
  doubt_solved: { points: 10, label: 'Solved a doubt' },
  flashcards_reviewed: { points: 5, label: 'Flashcard review session' },
  notes_created: { points: 10, label: 'Made revision notes' },
  mock_completed: { points: 30, label: 'Finished a mock test' },
  plan_task_done: { points: 5, label: 'Completed a planner task' },
} as const;

export type XpKind = keyof typeof XP_RULES;

/**
 * Award XP for an action and count it towards the daily streak. With `refId`,
 * the same (kind, refId) is only ever awarded once — e.g. watching the same
 * video twice. `points` overrides the default (e.g. scaled by a test score).
 * Never throws: XP must not break the action that earned it.
 */
export async function awardXp(userId: string, kind: XpKind, refId?: string, points?: number): Promise<number> {
  try {
    if (refId) {
      const seen = await prisma.xpEvent.findFirst({ where: { userId, kind, refId }, select: { id: true } });
      if (seen) return 0;
    }
    const value = Math.max(0, Math.round(points ?? XP_RULES[kind].points));
    await prisma.xpEvent.create({ data: { userId, kind, points: value, refId: refId ?? null } });
    await bumpStreak(userId);
    return value;
  } catch (err) {
    console.error('[xp] award failed:', err);
    return 0;
  }
}

/** Level from total XP: each level needs 100 more XP than the previous one. */
export function levelFor(totalXp: number) {
  let level = 1;
  let need = 100;
  let floor = 0;
  while (totalXp >= floor + need) {
    floor += need;
    level += 1;
    need += 100;
  }
  return { level, intoLevel: totalXp - floor, levelSize: need };
}
