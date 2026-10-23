import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import { searchCommons } from '@/lib/commons';

export const dynamic = 'force-dynamic';

// GET ?q=: free-licensed Wikimedia Commons images for the slide editor's image picker.
export async function GET(req: NextRequest) {
  const auth = await requireUser('TEACHER');
  if ('error' in auth) return auth.error;

  const q = (req.nextUrl.searchParams.get('q') ?? '').trim().slice(0, 100);
  if (!q) return NextResponse.json({ error: 'Search text is required' }, { status: 400 });

  const images = await searchCommons(q, 12);
  return NextResponse.json({ images });
}
