import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { emptyNotes, parseNotes, parseStudySource } from '@/lib/notes';

export const dynamic = 'force-dynamic';

const ownNotes = (id: string, userId: string) => prisma.studentDoc.findFirst({ where: { id, userId, type: 'notes' } });

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const doc = await ownNotes(params.id, auth.user.id);
  if (!doc) return NextResponse.json({ error: 'Notes not found' }, { status: 404 });
  let content: unknown = null;
  try { content = JSON.parse(doc.content); } catch { /* repaired below */ }
  const notes = parseNotes(content, false, doc.topic) ?? emptyNotes(doc.topic);
  return NextResponse.json({
    doc: { id: doc.id, title: doc.title, topic: doc.topic, grade: doc.grade, language: doc.language, updatedAt: doc.updatedAt, content: notes },
  });
}

// PATCH: autosave edits — { title?, content? }; content is re-validated leniently
// (half-typed items are kept) but keeps the stored source.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const data: { title?: string; content?: string } = {};
  if (body.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim()) return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
    data.title = body.title.replace(/\s+/g, ' ').trim().slice(0, 200);
  }
  const doc = await ownNotes(params.id, auth.user.id);
  if (!doc) return NextResponse.json({ error: 'Notes not found' }, { status: 404 });
  if (body.content !== undefined) {
    const content = parseNotes(body.content, false, doc.topic);
    if (!content) return NextResponse.json({ error: 'Invalid notes' }, { status: 400 });
    let stored: { source?: unknown } = {};
    try { stored = JSON.parse(doc.content); } catch { /* no source */ }
    data.content = JSON.stringify({ ...content, source: parseStudySource(stored?.source) });
  }
  if (!data.title && !data.content) return NextResponse.json({ error: 'Nothing to save' }, { status: 400 });
  const updated = await prisma.studentDoc.update({ where: { id: doc.id }, data, select: { updatedAt: true } });
  return NextResponse.json({ ok: true, updatedAt: updated.updatedAt });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const { count } = await prisma.studentDoc.deleteMany({ where: { id: params.id, userId: auth.user.id, type: 'notes' } });
  return count ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'Notes not found' }, { status: 404 });
}
