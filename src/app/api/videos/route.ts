import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { bumpStreak } from '@/lib/streak';

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

  const body = await req.json();
  const { topic, language, grade, voiceType, videoStyle, script, manimCode, scene, duration } = body;

  if (!topic || !script || !manimCode) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const video = await prisma.video.create({
    data: {
      topic,
      language,
      grade,
      voiceType,
      videoStyle,
      script: JSON.stringify(script),
      manimCode,
      scene: scene ? JSON.stringify(scene) : null,
      duration: duration ?? null,
      subject: inferSubject(topic),
      userId,
    },
  });

  await bumpStreak(userId);

  return NextResponse.json({ id: video.id });
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
