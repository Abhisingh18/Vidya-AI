import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { awardXp } from '@/lib/xp';
import { applyToggles, parsePlanContent, planProgress, planStatus } from '@/lib/planner';

export const dynamic = 'force-dynamic';

const ownPlan = (id: string, userId: string) => prisma.studentDoc.findFirst({ where: { id, userId, type: 'plan' } });

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const doc = await ownPlan(params.id, auth.user.id);
  if (!doc) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
  const content = parsePlanContent(doc.content);
  if (!content) return NextResponse.json({ error: 'This plan could not be loaded.' }, { status: 500 });
  return NextResponse.json({ plan: { id: doc.id, title: doc.title, grade: doc.grade, content, progress: planProgress(content), status: planStatus(content) } });
}

// PATCH { toggles: { [taskId]: boolean } } → tick/untick tasks (XP for newly done ones).
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const doc = await ownPlan(params.id, auth.user.id);
  if (!doc) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
  const content = parsePlanContent(doc.content);
  if (!content) return NextResponse.json({ error: 'This plan could not be loaded.' }, { status: 500 });
  const body = await req.json().catch(() => ({}));
  const toggles = body.toggles && typeof body.toggles === 'object' && !Array.isArray(body.toggles) ? body.toggles as Record<string, unknown> : null;
  if (!toggles) return NextResponse.json({ error: 'Nothing to save' }, { status: 400 });

  const { content: next, newlyDone } = applyToggles(content, toggles, new Date());
  await prisma.studentDoc.update({ where: { id: doc.id }, data: { content: JSON.stringify(next) } });
  let xp = 0;
  for (const taskId of newlyDone) xp += await awardXp(auth.user.id, 'plan_task_done', `${doc.id}:${taskId}`);
  return NextResponse.json({ ok: true, xp, progress: planProgress(next), status: planStatus(next) });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const { count } = await prisma.studentDoc.deleteMany({ where: { id: params.id, userId: auth.user.id, type: 'plan' } });
  return count ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'Plan not found' }, { status: 404 });
}
