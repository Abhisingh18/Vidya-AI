import { NextResponse } from 'next/server';
import { REELS } from '@/lib/reels';

// Public: the Shorts feed (visual reels), lightly shuffled so it feels fresh on each load.
export async function GET() {
  const list = [...REELS];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return NextResponse.json({ shorts: list });
}
