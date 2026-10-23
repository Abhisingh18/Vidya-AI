import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { readStoredDoubt } from '../solver';

export const dynamic = 'force-dynamic';

const notFound = () => NextResponse.json({ error: 'Doubt not found.' }, { status: 404 });

// GET → { id, doubt, createdAt } for the owner (404 for anyone else).
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  const doc = await prisma.studentDoc.findFirst({
    where: { id: params.id, userId: auth.user.id, type: 'doubt' },
    select: { id: true, content: true, createdAt: true },
  });
  if (!doc) return notFound();
  const doubt = readStoredDoubt(doc.content);
  if (!doubt) return NextResponse.json({ error: 'This doubt could not be opened.' }, { status: 500 });
  return NextResponse.json({ id: doc.id, doubt, createdAt: doc.createdAt.toISOString() });
}

// DELETE → { ok: true } (owner only).
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  const { count } = await prisma.studentDoc.deleteMany({ where: { id: params.id, userId: auth.user.id, type: 'doubt' } });
  if (!count) return notFound();
  return NextResponse.json({ ok: true });
}
