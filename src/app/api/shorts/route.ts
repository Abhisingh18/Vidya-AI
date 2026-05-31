import { NextResponse } from 'next/server';
import { SHORTS } from '@/lib/shorts';

// Public: serve the shorts/reels feed (lightly shuffled for variety).
export async function GET() {
  const list = [...SHORTS];
  // Simple shuffle so the feed feels fresh on each load.
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return NextResponse.json({ shorts: list });
}
