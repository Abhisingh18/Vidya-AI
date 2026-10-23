import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { DOC_PARSERS, type DocType } from '@/lib/teacher-docs';
import { parseToolOutput } from '@/lib/toolkit';

export const dynamic = 'force-dynamic';

async function ownDoc(id: string, userId: string) {
  return prisma.teacherDoc.findFirst({ where: { id, userId } });
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser('TEACHER');
  if ('error' in auth) return auth.error;
  const doc = await ownDoc(params.id, auth.user.id);
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ doc: { ...doc, content: JSON.parse(doc.content) } });
}

// PATCH: save edits. Content is re-validated with the same parser as AI output.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser('TEACHER');
  if ('error' in auth) return auth.error;
  const doc = await ownDoc(params.id, auth.user.id);
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const data: { title?: string; content?: string } = {};
  if (typeof body.title === 'string' && body.title.trim()) data.title = body.title.trim().slice(0, 200);
  if (body.content !== undefined) {
    const content = doc.type === 'toolkit'
      ? parseToolOutput(body.content)
      : DOC_PARSERS[doc.type as DocType]?.(body.content, false);
    if (!content) return NextResponse.json({ error: 'Invalid content' }, { status: 400 });
    data.content = JSON.stringify(content);
  }
  const updated = await prisma.teacherDoc.update({ where: { id: doc.id }, data, select: { updatedAt: true } });
  return NextResponse.json({ ok: true, updatedAt: updated.updatedAt });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser('TEACHER');
  if ('error' in auth) return auth.error;
  const { count } = await prisma.teacherDoc.deleteMany({ where: { id: params.id, userId: auth.user.id } });
  return count ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'Not found' }, { status: 404 });
}
