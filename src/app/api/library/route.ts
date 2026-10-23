import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isExplainer } from '@/lib/explainer';

// Always hit the DB at request time. Without this Next.js statically
// pre-renders the response at build, freezing whatever was in the DB
// at that moment (often an empty array).
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface SceneStep {
  at: number;
  type: string;
  [key: string]: unknown;
}

interface Scene {
  steps?: SceneStep[];
}

/** Card preview for a visual explainer: its first scene's picture, else its emoji. */
interface ExplainerPreview {
  image: string | null;
  emoji: string;
  scenes: number;
}

function parseScene(sceneJson: string | null): unknown {
  if (!sceneJson) return null;
  try { return JSON.parse(sceneJson); } catch { return null; }
}

function buildExplainerPreview(scene: unknown): ExplainerPreview | null {
  if (!isExplainer(scene) || !Array.isArray(scene.scenes)) return null;
  const first = scene.scenes[0]?.slide;
  const image = typeof first?.image?.url === 'string' ? first.image.url : null;
  const emoji = first?.emoji || scene.scenes.map(s => s?.slide?.emoji).find(Boolean) || '🎬';
  return { image, emoji, scenes: scene.scenes.length };
}

// Build a small preview = the opening tableau before the first `clear`.
// Filters out subtitles so the thumbnail isn't dominated by text.
function buildPreview(parsed: unknown): SceneStep[] {
  if (!parsed || typeof parsed !== 'object') return [];
  const scene = parsed as Scene;
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
    videos: videos.map(v => {
      const parsed = parseScene(v.scene);
      const explainer = buildExplainerPreview(parsed);
      return {
        id: v.id,
        topic: v.topic,
        language: v.language,
        grade: v.grade,
        subject: v.subject ?? 'General',
        duration: v.duration ?? 0,
        createdAt: v.createdAt,
        author: v.user?.name ?? 'VidyaAI',
        views: v._count.watches,
        previewSteps: explainer ? [] : buildPreview(parsed),
        /** Set for visual explainers (thumbnail picture/emoji); null for classic animations. */
        explainer,
      };
    }),
  });
}
