// Server-side narration for explainer videos. Providers, tried in this order
// for each chunk (a failing one falls through to the next):
// - Azure AI Speech (neural voices) when AZURE_SPEECH_KEY + AZURE_SPEECH_REGION are set;
// - Piper voices on this server's CPU (./piper.ts) — free and unlimited, for Hindi,
//   Bengali, Marathi, Telugu, Malayalam, Urdu, Nepali and English;
// - AI4Bharat Indic Parler-TTS (Apache-2.0, 18 Indian languages) through its free
//   Hugging Face Space — on by default; HF_TOKEN (optional) gives the account's
//   own ZeroGPU quota instead of the shared anonymous one. ~5–10 s per chunk;
// - OpenRouter's audio model (openai/gpt-audio-mini) on OPENROUTER_API_KEY —
//   every language, but OpenRouter only allows audio with ≥ $0.50 of credit,
//   so it switches itself on once the account has credit.
// With none available, the player uses the browser's voices (or captions only).

import { LANGUAGES } from './languages';
import { PIPER_LOCALES, piperReady, piperSpeak } from './piper';
import { indicSpeak, indicSpeakConfigured, indicSpeakLocales } from './indic-speak';

export const MAX_TTS_CHARS = 400;
export type VoiceGender = 'female' | 'male';
export type TtsProvider = 'azure' | 'indic-speak' | 'piper' | 'huggingface' | 'openrouter';

export interface SpokenAudio { audio: ArrayBuffer; contentType: string; voice: string }

// ── Provider selection ──────────────────────────────────────────────

const AZURE_KEY = process.env.AZURE_SPEECH_KEY ?? '';
const AZURE_REGION = (process.env.AZURE_SPEECH_REGION ?? '').trim().toLowerCase();
const azureConfigured = () => AZURE_KEY.length > 0 && /^[a-z0-9]+$/.test(AZURE_REGION);

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY ?? '';
const OPENROUTER_TTS_MODEL = process.env.OPENROUTER_TTS_MODEL || 'openai/gpt-audio-mini';
const MIN_AUDIO_BALANCE = 0.5; // OpenRouter's minimum balance for audio output (USD)
const BALANCE_TTL_MS = 5 * 60 * 1000;

let balanceCache: { at: number; ok: boolean } | null = null;

/** Whether the OpenRouter account can produce audio (credit ≥ $0.50); cached for 5 minutes. */
async function openRouterAudioReady(): Promise<boolean> {
  if (!OPENROUTER_KEY || process.env.OPENROUTER_TTS === 'off') return false;
  if (balanceCache && Date.now() - balanceCache.at < BALANCE_TTL_MS) return balanceCache.ok;
  let ok = false;
  try {
    const res = await fetch('https://openrouter.ai/api/v1/credits', {
      headers: { Authorization: `Bearer ${OPENROUTER_KEY}` }, signal: AbortSignal.timeout(8000),
    });
    const d = res.ok ? await res.json() : null;
    const left = Number(d?.data?.total_credits ?? 0) - Number(d?.data?.total_usage ?? 0);
    ok = left >= MIN_AUDIO_BALANCE;
  } catch {
    ok = false;
  }
  balanceCache = { at: Date.now(), ok };
  return ok;
}

/**
 * Providers that can be used right now, in preference order. `freeOnly` (signed-out
 * listeners) keeps just the unlimited local voices, so quotas are never spent anonymously.
 */
export async function activeProviders(freeOnly = false): Promise<TtsProvider[]> {
  const out: TtsProvider[] = [];
  if (!freeOnly && azureConfigured()) out.push('azure');
  // The local Indic-Speak model (tools/indic-speak) — richer than Piper but slower; it is the
  // first choice only when INDIC_SPEAK_PREFER=1, otherwise it covers what Piper cannot voice.
  const indic = indicSpeakConfigured();
  if (indic && process.env.INDIC_SPEAK_PREFER === '1') out.push('indic-speak');
  if (piperReady()) out.push('piper');
  if (indic && process.env.INDIC_SPEAK_PREFER !== '1') out.push('indic-speak');
  if (!freeOnly && hfReady()) out.push('huggingface');
  if (!freeOnly && await openRouterAudioReady()) out.push('openrouter');
  return out;
}

export async function activeProvider(freeOnly = false): Promise<TtsProvider | null> {
  return (await activeProviders(freeOnly))[0] ?? null;
}

const SLOW_PROVIDERS: TtsProvider[] = ['huggingface', 'indic-speak'];

/**
 * BCP-47 locales some active provider can voice ([] when narration is off), and
 * those only a slow provider (seconds per chunk) serves — the player buffers
 * further ahead for them.
 */
export async function supportedLocales(freeOnly = false): Promise<{ languages: string[]; slow: string[] }> {
  const first = new Map<string, TtsProvider>();
  for (const p of await activeProviders(freeOnly)) {
    const list = p === 'azure' ? await azureLocales().catch(() => [])
      : p === 'indic-speak' ? await indicSpeakLocales()
      : p === 'piper' ? PIPER_LOCALES
      : p === 'huggingface' ? HF_LOCALES
      : ['en-IN', ...LANGUAGES.map(l => l.code)];
    list.forEach(l => { if (!first.has(l)) first.set(l, p); });
  }
  const languages = Array.from(first.keys()).sort();
  return { languages, slow: languages.filter(l => SLOW_PROVIDERS.includes(first.get(l)!)) };
}

/**
 * Audio for one narration chunk from the first provider that can voice it.
 * Null when no provider can voice this text/locale; throws when they all failed.
 */
export async function speak(text: string, locale: string, gender: VoiceGender, freeOnly = false): Promise<SpokenAudio | null> {
  let lastError: Error | null = null;
  for (const provider of await activeProviders(freeOnly)) {
    try {
      if (provider === 'azure') {
        const voice = await pickAzureVoice(locale, gender, text);
        if (voice) return { audio: await azureSynthesize(text, voice), contentType: 'audio/mpeg', voice: voice.ShortName };
      } else if (provider === 'indic-speak') {
        const spoken = await indicSpeak(text, locale, gender);
        if (spoken) return spoken;
      } else if (provider === 'piper') {
        const spoken = await piperSpeak(text, locale, gender);
        if (spoken) return spoken;
      } else if (provider === 'huggingface') {
        const spoken = await hfSpeak(text, locale, gender);
        if (spoken) return spoken;
      } else {
        return await openRouterSpeak(text, locale, gender);
      }
    } catch (err) {
      lastError = err as Error;
      console.warn(`[tts] ${provider} failed: ${lastError.message}`);
    }
  }
  // Last resort: a Piper voice for the text's script (Assamese read by the Bengali voice).
  if (piperReady()) {
    try {
      const spoken = await piperSpeak(text, locale, gender, true);
      if (spoken) return spoken;
    } catch (err) {
      lastError = err as Error;
    }
  }
  if (lastError) throw lastError;
  return null;
}

// ── Script fallback (shared) ────────────────────────────────────────

// Languages without their own voice are read by a voice for the same script
// (e.g. Maithili, Dogri, Konkani, Sanskrit → Hindi; Assamese/Manipuri → Bengali).
const SCRIPT_LOCALES: [RegExp, string[]][] = [
  [/[ऀ-ॿ]/, ['hi-IN', 'mr-IN', 'ne-NP']],
  [/[ঀ-৿]/, ['bn-IN', 'as-IN']],
  [/[਀-੿]/, ['pa-IN']],
  [/[઀-૿]/, ['gu-IN']],
  [/[଀-୿]/, ['or-IN']],
  [/[஀-௿]/, ['ta-IN']],
  [/[ఀ-౿]/, ['te-IN']],
  [/[ಀ-೿]/, ['kn-IN']],
  [/[ഀ-ൿ]/, ['ml-IN']],
  [/[؀-ۿ]/, ['ur-IN', 'ur-PK']],
  [/[A-Za-z]/, ['en-IN', 'en-US']],
];

// ── Azure ───────────────────────────────────────────────────────────

const AZURE_BASE = `https://${AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices`;
const VOICES_TTL_MS = 24 * 60 * 60 * 1000;

interface AzureVoice { ShortName: string; Locale: string; Gender: string; VoiceType?: string }
let voiceCache: { at: number; voices: AzureVoice[] } | null = null;

async function listAzureVoices(): Promise<AzureVoice[]> {
  if (voiceCache && Date.now() - voiceCache.at < VOICES_TTL_MS) return voiceCache.voices;
  const res = await fetch(`${AZURE_BASE}/voices/list`, {
    headers: { 'Ocp-Apim-Subscription-Key': AZURE_KEY },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Azure voices list → HTTP ${res.status}`);
  const voices = ((await res.json()) as AzureVoice[]).filter(v => !v.VoiceType || v.VoiceType === 'Neural');
  voiceCache = { at: Date.now(), voices };
  return voices;
}

// Locales the narration can use: India's languages, Nepali, and English.
const isRelevantLocale = (locale: string) => /-IN$/.test(locale) || locale === 'ne-NP' || locale.startsWith('en-');

async function azureLocales(): Promise<string[]> {
  const voices = await listAzureVoices();
  return Array.from(new Set(voices.map(v => v.Locale).filter(isRelevantLocale))).sort();
}

/** The voice to read `text` with, preferring `locale`, then the text's script. */
async function pickAzureVoice(locale: string, gender: VoiceGender, text: string): Promise<AzureVoice | null> {
  const voices = await listAzureVoices();
  const scriptLocales = SCRIPT_LOCALES.find(([re]) => re.test(text))?.[1];
  // Use the requested locale only if its voices read this script (Kashmiri text
  // written in Devanagari must not go to an Urdu voice).
  const candidates = !scriptLocales || scriptLocales.includes(locale) ? [locale, ...(scriptLocales ?? [])] : scriptLocales;
  for (const l of candidates) {
    const inLocale = voices.filter(v => v.Locale === l);
    if (!inLocale.length) continue;
    return inLocale.find(v => v.Gender.toLowerCase() === gender) ?? inLocale[0];
  }
  return null;
}

const escapeXml = (s: string) => s.replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]!);

/** MP3 audio of `text` spoken by `voice`, slightly slower than default for learners. */
async function azureSynthesize(text: string, voice: AzureVoice): Promise<ArrayBuffer> {
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${voice.Locale}">`
    + `<voice name="${voice.ShortName}"><prosody rate="-6%">${escapeXml(text)}</prosody></voice></speak>`;
  const res = await fetch(`${AZURE_BASE}/v1`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': AZURE_KEY,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
      'User-Agent': 'VidyaAI',
    },
    body: ssml,
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`Azure TTS → HTTP ${res.status}`);
  return res.arrayBuffer();
}

// ── OpenRouter (openai/gpt-audio-mini) ──────────────────────────────

const OR_VOICES: Record<VoiceGender, string> = { female: 'coral', male: 'ash' };

function languageName(locale: string, text: string): string {
  const scriptLocale = SCRIPT_LOCALES.find(([re]) => re.test(text))?.[1][0];
  const code = scriptLocale && !scriptLocale.startsWith('en') ? scriptLocale : locale;
  return LANGUAGES.find(l => l.code === code)?.name ?? LANGUAGES.find(l => l.code === locale)?.name ?? 'the language it is written in';
}

function narrationMessages(text: string, locale: string) {
  const lang = languageName(locale, text);
  return [
    {
      role: 'system',
      content: `You are the voice of a warm, clear Indian school teacher recording narration for a lesson video. `
        + `Read the user's text aloud EXACTLY as written, word for word, in ${lang} with a natural Indian accent, at a calm pace for students. `
        + 'Do not translate, explain, answer, add or skip anything — only speak the text. Read numbers, symbols and formulas the way an Indian teacher would say them.',
    },
    { role: 'user', content: text },
  ];
}

/** Wraps raw 16-bit mono PCM in a WAV header. */
function pcm16ToWav(pcm: Buffer, sampleRate = 24_000): ArrayBuffer {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  const out = Buffer.concat([header, pcm]);
  return out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength) as ArrayBuffer;
}

async function openRouterRequest(body: Record<string, unknown>) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://vidyaai.app',
      'X-Title': 'VidyaAI',
    },
    body: JSON.stringify({ model: OPENROUTER_TTS_MODEL, modalities: ['text', 'audio'], temperature: 0.2, ...body }),
    signal: AbortSignal.timeout(45_000),
  });
  if (res.status === 402) balanceCache = { at: Date.now(), ok: false }; // out of credit: stop trying for a while
  return res;
}

async function openRouterSpeak(text: string, locale: string, gender: VoiceGender): Promise<SpokenAudio> {
  const voice = OR_VOICES[gender];
  const messages = narrationMessages(text, locale);

  // 1) Non-streaming MP3 (simplest when the provider supports it).
  const res = await openRouterRequest({ messages, audio: { voice, format: 'mp3' } });
  if (res.ok) {
    const d = await res.json();
    const data = d?.choices?.[0]?.message?.audio?.data;
    if (typeof data === 'string' && data.length > 100) {
      const buf = Buffer.from(data, 'base64');
      return { audio: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer, contentType: 'audio/mpeg', voice: `${OPENROUTER_TTS_MODEL}:${voice}` };
    }
  } else if (res.status !== 400) {
    throw new Error(`OpenRouter TTS → HTTP ${res.status}`);
  }

  // 2) Streaming PCM16 (OpenAI audio models only stream raw PCM) → WAV.
  const stream = await openRouterRequest({ messages, audio: { voice, format: 'pcm16' }, stream: true });
  if (!stream.ok || !stream.body) throw new Error(`OpenRouter TTS (stream) → HTTP ${stream.status}`);
  const chunks: Buffer[] = [];
  const decoder = new TextDecoder();
  let pending = '';
  const reader = stream.body.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    pending += decoder.decode(value, { stream: true });
    const lines = pending.split('\n');
    pending = lines.pop() ?? '';
    for (const line of lines) {
      const m = /^data:\s*(.+)$/.exec(line.trim());
      if (!m || m[1] === '[DONE]') continue;
      try {
        const data = JSON.parse(m[1])?.choices?.[0]?.delta?.audio?.data;
        if (typeof data === 'string') chunks.push(Buffer.from(data, 'base64'));
      } catch { /* keep-alive or partial line */ }
    }
  }
  const pcm = Buffer.concat(chunks);
  if (pcm.length < 2000) throw new Error('OpenRouter TTS returned no audio');
  return { audio: pcm16ToWav(pcm), contentType: 'audio/wav', voice: `${OPENROUTER_TTS_MODEL}:${voice}` };
}

// ── Hugging Face: AI4Bharat Indic Parler-TTS Space ──────────────────

const HF_SPACE = (process.env.HF_TTS_SPACE || 'https://ai4bharat-indic-parler-tts.hf.space').replace(/\/$/, '');
const HF_TOKEN = process.env.HF_TOKEN ?? '';
const HF_TIMEOUT_MS = 50_000;
const HF_COOLDOWN_MS = 10 * 60 * 1000;
let hfCooldownUntil = 0;

const hfReady = () => process.env.HF_TTS !== 'off' && Date.now() >= hfCooldownUntil;

/** Recommended speakers per locale (model card), [female, male]. */
const HF_SPEAKERS: Record<string, [string, string]> = {
  'as-IN': ['Sita', 'Amit'],
  'bn-IN': ['Aditi', 'Arjun'],
  'brx-IN': ['Maya', 'Bikram'],
  'hne-IN': ['Champa', 'Bhanu'],
  'doi-IN': ['Karan', 'Karan'],
  'en-IN': ['Mary', 'Thoma'],
  'gu-IN': ['Neha', 'Yash'],
  'hi-IN': ['Divya', 'Rohit'],
  'kn-IN': ['Anu', 'Suresh'],
  'ml-IN': ['Anjali', 'Harish'],
  'mni-IN': ['Laishram', 'Ranjit'],
  'mr-IN': ['Sunita', 'Sanjay'],
  'ne-NP': ['Amrita', 'Amrita'],
  'or-IN': ['Debjani', 'Manas'],
  'pa-IN': ['Divjot', 'Gurpreet'],
  'sa-IN': ['Aryan', 'Aryan'],
  'ta-IN': ['Jaya', 'Jaya'],
  'te-IN': ['Lalitha', 'Prakash'],
};
const HF_LOCALES = Object.keys(HF_SPEAKERS);

/** Locale whose speaker reads this text: the requested one if its script matches, else by script. */
function hfLocale(locale: string, text: string): string | null {
  const scriptLocales = SCRIPT_LOCALES.find(([re]) => re.test(text))?.[1];
  if (HF_SPEAKERS[locale] && (!scriptLocales || scriptLocales.includes(locale))) return locale;
  return scriptLocales?.find(l => HF_SPEAKERS[l]) ?? null; // Arabic script (Urdu, Sindhi) has no speaker
}

const hfHeaders = (json = false): Record<string, string> => ({
  ...(HF_TOKEN ? { Authorization: `Bearer ${HF_TOKEN}` } : {}),
  ...(json ? { 'Content-Type': 'application/json' } : {}),
});

/** Reads a Gradio SSE stream until `complete` (→ its data) or `error` (→ throws). */
async function readGradioResult(res: Response): Promise<unknown> {
  if (!res.body) throw new Error('empty stream');
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '', event = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    for (const line of lines) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) {
        const data = line.slice(5).trim();
        if (event === 'complete') { reader.cancel().catch(() => {}); return JSON.parse(data); }
        if (event === 'error') throw new Error(`Space error: ${data.slice(0, 200)}`);
      }
    }
  }
  throw new Error('stream ended without a result');
}

async function hfSpeak(text: string, locale: string, gender: VoiceGender): Promise<SpokenAudio | null> {
  const target = hfLocale(locale, text);
  if (!target) return null;
  const speaker = HF_SPEAKERS[target][gender === 'male' ? 1 : 0];
  const description = `${speaker} speaks with a warm, clear and friendly voice at a moderate, slightly slow pace, like a caring teacher explaining to students. `
    + 'The recording is of very high quality, with very clear audio and the voice sounding close up, with no background noise.';
  const signal = AbortSignal.timeout(HF_TIMEOUT_MS);
  try {
    const start = await fetch(`${HF_SPACE}/gradio_api/call/generate_finetuned`, {
      method: 'POST', headers: hfHeaders(true), body: JSON.stringify({ data: [text, description] }), signal,
    });
    if (!start.ok) throw new Error(`HTTP ${start.status}`);
    const { event_id: eventId } = await start.json() as { event_id?: string };
    if (!eventId) throw new Error('no event id');
    const stream = await fetch(`${HF_SPACE}/gradio_api/call/generate_finetuned/${eventId}`, { headers: hfHeaders(), signal });
    if (!stream.ok) throw new Error(`stream HTTP ${stream.status}`);
    const result = await readGradioResult(stream) as { path?: string; url?: string }[];
    const file = result?.[0];
    if (!file?.path) throw new Error('no audio in result');
    const audio = await fetch(`${HF_SPACE}/gradio_api/file=${file.path}`, { headers: hfHeaders(), signal });
    if (!audio.ok) throw new Error(`audio HTTP ${audio.status}`);
    const buf = await audio.arrayBuffer();
    if (buf.byteLength < 2000) throw new Error('audio too short');
    return { audio: buf, contentType: 'audio/mpeg', voice: `indic-parler-tts:${speaker}` };
  } catch (err) {
    // Quota exhausted / Space asleep or down: skip it for a while instead of making every chunk wait.
    // (A ZeroGPU Space reports an exhausted daily GPU quota as a bare `error` event.)
    if (/Space error|quota|GPU|exceeded|HTTP 5\d\d|HTTP 429|abort|timeout/i.test((err as Error).message + ((err as Error).name ?? ''))) {
      hfCooldownUntil = Date.now() + HF_COOLDOWN_MS;
    }
    throw new Error(`Hugging Face TTS: ${(err as Error).message}`);
  }
}
