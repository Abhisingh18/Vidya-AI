import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/session';
import { activeProvider, supportedLocales } from '@/lib/tts';

export const dynamic = 'force-dynamic';

// GET → { enabled, provider, languages, slowLanguages }: whether the player can use
// server narration, for which BCP-47 locales (browser voices cover the rest), and
// which of those are served by a slow voice (seconds per chunk: buffer further ahead).
// Signed-out listeners get the free local voices only.
export async function GET() {
  const freeOnly = !(await currentUser());
  try {
    const provider = await activeProvider(freeOnly);
    if (!provider) return NextResponse.json({ enabled: false, languages: [] });
    const { languages, slow } = await supportedLocales(freeOnly);
    return NextResponse.json({ enabled: true, provider, languages, slowLanguages: slow });
  } catch (err) {
    console.error('[tts/status]', (err as Error).message);
    return NextResponse.json({ enabled: false, languages: [] });
  }
}
