import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/session';
import { activeProvider, MAX_TTS_CHARS, speak, type VoiceGender } from '@/lib/tts';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

// GET ?text=&lang=<BCP-47>&voice=female|male → narration audio for one chunk.
// Signed-out listeners get only the free local voices (Piper), so no quota can be
// spent anonymously; the browser caches each chunk, so replays cost nothing.
export async function GET(req: NextRequest) {
  const freeOnly = !(await currentUser());
  if (!(await activeProvider(freeOnly))) return NextResponse.json({ error: 'Narration voice is not configured on this server.' }, { status: 503 });

  const params = req.nextUrl.searchParams;
  const text = (params.get('text') ?? '').replace(/\s+/g, ' ').trim();
  const lang = (params.get('lang') ?? 'en-IN').trim();
  const gender: VoiceGender = params.get('voice') === 'male' ? 'male' : 'female';
  if (!text) return NextResponse.json({ error: 'text is required' }, { status: 400 });
  if (text.length > MAX_TTS_CHARS) return NextResponse.json({ error: `text is limited to ${MAX_TTS_CHARS} characters` }, { status: 413 });
  if (!/^[a-z]{2,3}(-[A-Za-z]{2,4})?$/.test(lang)) return NextResponse.json({ error: 'Invalid lang' }, { status: 400 });

  try {
    const spoken = await speak(text, lang, gender, freeOnly);
    if (!spoken) return NextResponse.json({ error: 'No voice for this language' }, { status: 422 });
    return new NextResponse(spoken.audio, {
      headers: {
        'Content-Type': spoken.contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Voice': spoken.voice,
      },
    });
  } catch (err) {
    console.error('[tts]', (err as Error).message);
    return NextResponse.json({ error: 'Could not create the narration audio.' }, { status: 502 });
  }
}
