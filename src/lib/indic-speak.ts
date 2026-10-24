// Local Indic-Speak (bodhan-ai/indic-speak): a 3B text-to-speech model that voices
// 22 Indian languages and English, reads STEM and code-mixed text well, and covers
// the languages Piper has no voice for (Tamil, Gujarati, Kannada, Punjabi, Odia…).
// It is far too big for a serverless host, so it runs as a separate process on this
// machine — tools/indic-speak (./run.sh) — and INDIC_SPEAK_URL points at it. While it
// is down, loading or not configured, this provider switches itself off and the
// other providers in tts.ts carry on.

import type { SpokenAudio, VoiceGender } from './tts';

const URL_BASE = (process.env.INDIC_SPEAK_URL ?? '').replace(/\/$/, '');
const HEALTH_TTL_MS = 15_000;
const SYNTH_TIMEOUT_MS = 90_000;
const COOLDOWN_MS = 2 * 60_000;

let health: { at: number; ready: boolean; languages: string[] } | null = null;
let downUntil = 0;

async function check(): Promise<{ ready: boolean; languages: string[] }> {
  if (!URL_BASE || process.env.INDIC_SPEAK === 'off' || Date.now() < downUntil) return { ready: false, languages: [] };
  if (health && Date.now() - health.at < HEALTH_TTL_MS) return health;
  let next = { at: Date.now(), ready: false, languages: [] as string[] };
  try {
    const res = await fetch(`${URL_BASE}/health`, { signal: AbortSignal.timeout(2500), cache: 'no-store' });
    const d = res.ok ? await res.json() as { ready?: boolean; languages?: string[] } : null;
    next = { at: Date.now(), ready: !!d?.ready, languages: Array.isArray(d?.languages) ? d.languages : [] };
  } catch { /* not running */ }
  health = next;
  return next;
}

export const indicSpeakConfigured = () => !!URL_BASE && process.env.INDIC_SPEAK !== 'off';

/** Locales the running server can voice ([] when it is down or still loading). */
export async function indicSpeakLocales(): Promise<string[]> {
  const h = await check();
  return h.ready ? h.languages : [];
}

/** MP3 narration from the local server, or null when it has no voice for this locale. */
export async function indicSpeak(text: string, locale: string, gender: VoiceGender): Promise<SpokenAudio | null> {
  const h = await check();
  if (!h.ready || !h.languages.includes(locale)) return null;
  try {
    const res = await fetch(`${URL_BASE}/tts`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store',
      body: JSON.stringify({ text, language: locale, gender }), signal: AbortSignal.timeout(SYNTH_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const audio = await res.arrayBuffer();
    if (audio.byteLength < 2000) throw new Error('audio too short');
    return { audio, contentType: res.headers.get('content-type') ?? 'audio/mpeg', voice: res.headers.get('x-voice') ?? 'indic-speak' };
  } catch (err) {
    downUntil = Date.now() + COOLDOWN_MS; // crashed or overloaded: let the other voices cover for a while
    health = null;
    throw new Error(`Indic-Speak: ${(err as Error).message}`);
  }
}
