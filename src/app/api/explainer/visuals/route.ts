import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import { parseScenes } from '@/lib/explainer';
import { attachImages } from '@/lib/commons';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const IMAGES_MAX_MS = 90_000;

// POST {topic, grade, language?, scenes}: real Wikimedia Commons pictures for the
// scenes' slides (best effort) → { scenes }. Never fails because of images: on any
// error the scenes come back unchanged. One call with all scenes avoids the same
// picture appearing in two scenes.
export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  const body = await req.json().catch(() => ({}));
  const scenes = parseScenes({ scenes: body.scenes }, false);
  if (!scenes?.length) return NextResponse.json({ error: 'Scenes are required' }, { status: 400 });
  if (scenes.length > 24) return NextResponse.json({ error: 'Too many scenes' }, { status: 400 });

  const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const before = scenes.map(s => s.slide.image);
  try {
    await attachImages(scenes.map(s => s.slide), {
      topic: text(body.topic, 200),
      grade: text(body.grade, 20),
      language: text(body.language, 30) || undefined,
      deadlineMs: IMAGES_MAX_MS,
    });
  } catch (err) {
    console.warn('[explainer/visuals]', err);
    scenes.forEach((s, i) => { s.slide.image = before[i]; });
  }
  return NextResponse.json({ scenes });
}
