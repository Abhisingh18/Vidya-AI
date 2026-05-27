import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Public: fetch a single video for playback in /library/[id].
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const video = await prisma.video.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { name: true } },
      _count: { select: { watches: true } },
    },
  });

  if (!video) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 });
  }

  let script: unknown = [];
  let scene: unknown = null;
  try { script = JSON.parse(video.script); } catch { script = []; }
  try { scene = video.scene ? JSON.parse(video.scene) : null; } catch { scene = null; }

  return NextResponse.json({
    id: video.id,
    topic: video.topic,
    language: video.language,
    grade: video.grade,
    subject: video.subject ?? 'General',
    voiceType: video.voiceType,
    videoStyle: video.videoStyle,
    duration: video.duration ?? 0,
    createdAt: video.createdAt,
    author: video.user?.name ?? 'VidyaAI',
    views: video._count.watches,
    script,
    scene,
    manimCode: video.manimCode,
  });
}
