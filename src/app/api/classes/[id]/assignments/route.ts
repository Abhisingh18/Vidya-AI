import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

const DOC_KINDS = ['quiz', 'slides', 'lesson'];

// POST { kind, docId? , videoId?, title?, dueAt? }: teacher assigns material to a class.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser('TEACHER');
  if ('error' in auth) return auth.error;
  const cls = await prisma.classroom.findFirst({ where: { id: params.id, teacherId: auth.user.id }, select: { id: true } });
  if (!cls) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const kind = String(body.kind ?? '');
  const dueAt = body.dueAt ? new Date(body.dueAt) : null;
  if (dueAt && Number.isNaN(dueAt.getTime())) return NextResponse.json({ error: 'Invalid due date' }, { status: 400 });

  let title = String(body.title ?? '').trim().slice(0, 200);
  let docId: string | null = null;
  let videoId: string | null = null;

  if (DOC_KINDS.includes(kind)) {
    const doc = await prisma.teacherDoc.findFirst({
      where: { id: String(body.docId ?? ''), userId: auth.user.id, type: kind },
      select: { id: true, title: true },
    });
    if (!doc) return NextResponse.json({ error: 'Pick one of your documents' }, { status: 400 });
    docId = doc.id;
    title ||= doc.title;
  } else if (kind === 'video') {
    const video = await prisma.video.findUnique({ where: { id: String(body.videoId ?? '') }, select: { id: true, topic: true } });
    if (!video) return NextResponse.json({ error: 'Pick a library video' }, { status: 400 });
    videoId = video.id;
    title ||= video.topic;
  } else {
    return NextResponse.json({ error: 'Unknown assignment type' }, { status: 400 });
  }

  const a = await prisma.assignment.create({
    data: { classroomId: cls.id, kind, title, docId, videoId, dueAt },
    select: { id: true },
  });
  return NextResponse.json(a);
}
