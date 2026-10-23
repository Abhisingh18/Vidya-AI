import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { bumpStreak } from '@/lib/streak';
import { awardXp } from '@/lib/xp';
import { explainerDuration, isExplainer, parseExplainer } from '@/lib/explainer';

function inferSubject(topic: string): string {
  const t = topic.toLowerCase();
  if (/(theorem|integral|integration|deriv|equation|trig|algebra|geometry|calcul|matrix|matric)/.test(t)) return 'Mathematics';
  if (/(newton|force|motion|gravity|ohm|circuit|wave|optic|relativity|quantum)/.test(t)) return 'Physics';
  if (/(periodic|element|bond|acid|reaction|organic|atom)/.test(t)) return 'Chemistry';
  if (/(cell|dna|photosynth|biology|organ|evolution|gene)/.test(t)) return 'Biology';
  if (/(revolution|war|empire|king|history|ancient|medieval)/.test(t)) return 'History';
  if (/(algorithm|sort|search|code|program|recursion|data structure|binary)/.test(t)) return 'Computer Science';
  return 'General';
}

// POST: save a freshly generated video
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { topic, language, grade, voiceType, videoStyle, script, manimCode = '', duration } = body;

  if (!topic || !script) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Visual explainers are re-validated so only well-formed scenes are stored.
  const explainer = isExplainer(body.scene) ? parseExplainer(body.scene) : null;
  if (isExplainer(body.scene) && !explainer) {
    return NextResponse.json({ error: 'Invalid explainer scenes' }, { status: 400 });
  }
  const scene = explainer ?? body.scene;

  const video = await prisma.video.create({
    data: {
      topic,
      language: language ?? explainer?.language ?? 'English',
      grade: grade ?? explainer?.grade ?? '',
      voiceType: voiceType ?? '',
      videoStyle: videoStyle ?? (explainer ? 'explainer' : ''),
      script: JSON.stringify(script),
      manimCode: String(manimCode),
      scene: scene ? JSON.stringify(scene) : null,
      duration: duration ?? (explainer ? explainerDuration(explainer) : null),
      subject: inferSubject(topic),
      userId,
    },
  });

  // awardXp also bumps the streak; if awarding failed, still count the activity.
  const xp = await awardXp(userId, 'video_generated', video.id);
  if (!xp) await bumpStreak(userId);

  return NextResponse.json({ id: video.id, xp });
}

// GET: list user's generated videos
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const videos = await prisma.video.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true, topic: true, language: true, grade: true, subject: true,
      duration: true, createdAt: true,
    },
  });

  return NextResponse.json({ videos });
}
