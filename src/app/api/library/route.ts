import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Public: list all generated videos for the community library.
// No auth required so visitors can browse the gallery.
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
    })),
  });
}
