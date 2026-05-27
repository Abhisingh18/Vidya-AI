import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface SceneStep {
  at: number;
  type: string;
  [key: string]: unknown;
}

interface Scene {
  steps?: SceneStep[];
}

// Build a small preview = the opening tableau before the first `clear`.
// Filters out subtitles so the thumbnail isn't dominated by text.
function buildPreview(sceneJson: string | null): SceneStep[] {
  if (!sceneJson) return [];
  let scene: Scene;
  try { scene = JSON.parse(sceneJson) as Scene; } catch { return []; }
  const steps = Array.isArray(scene?.steps) ? scene.steps : [];

  // Find when the first clear happens — that's the end of the opening tableau.
  let cutoff = Infinity;
  for (const s of steps) {
    if (s.type === 'clear') { cutoff = s.at; break; }
  }

  return steps
    .filter(s => s.at < cutoff && s.type !== 'clear' && s.type !== 'subtitle')
    .slice(0, 10);
}

export async function GET() {
  const videos = await prisma.video.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true,
      topic: true,
      language: true,
      grade: true,
      subject: true,
      duration: true,
      createdAt: true,
      scene: true,
      user: { select: { name: true } },
      _count: { select: { watches: true } },
    },
  });

  return NextResponse.json({
    videos: videos.map(v => ({
      id: v.id,
      topic: v.topic,
      language: v.language,
      grade: v.grade,
      subject: v.subject ?? 'General',
      duration: v.duration ?? 0,
      createdAt: v.createdAt,
      author: v.user?.name ?? 'VidyaAI',
      views: v._count.watches,
      previewSteps: buildPreview(v.scene),
    })),
  });
}
