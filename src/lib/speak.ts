'use client';

// "Read aloud" for answers (client only). speak(text, langCode) uses the server's
// neural voices (/api/tts, Azure) when /api/tts/status lists the language, else the
// browser's speechSynthesis with the best voice for the language or, failing that,
// for the SCRIPT of the text (Devanagari → hi-IN, Bengali script → bn-IN…).
// Text is spoken in chunks (≤ 300 chars for the server, shorter for browser
// voices, which Chrome cuts off after ~15 s). Only one thing speaks at a time:
// a new speak() or stopSpeaking() cancels the previous one.

import { useSyncExternalStore } from 'react';
import { LANGUAGES } from '@/lib/languages';

export type SpeakResult = 'done' | 'stopped' | 'no-voice';

const SERVER_CHUNK = 300;
const BROWSER_CHUNK = 200;

/** BCP-47 code for a language name from languages.ts ("Hindi" → "hi-IN"); codes pass through. */
export function speechCode(language: string): string {
  const name = language.trim();
  if (/^[a-z]{2,3}-[A-Za-z]{2,4}$/.test(name)) return name;
  if (/^hinglish$/i.test(name)) return 'hi-IN';
  return LANGUAGES.find(l => l.name.toLowerCase() === name.toLowerCase())?.code ?? 'en-IN';
}

// ── Text → chunks ───────────────────────────────────────────────────

const EMOJI = (() => {
  try { return new RegExp('\\p{Extended_Pictographic}', 'gu'); } catch { return /[\u2600-\u27BF]/g; }
})();

/** Strips things that shouldn't be read out (markdown, emoji, bullets). */
export function cleanForSpeech(text: string): string {
  return text
    .replace(/[*_#`>|]+/g, ' ')
    .replace(EMOJI, ' ')
    .replace(/[→⇒]/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Splits at sentence ends (., ?, !, ।, ॥, ۔), then commas, then spaces, so each chunk ≤ max chars. */
export function chunkText(text: string, max: number): string[] {
  const out: string[] = [];
  const sentences = text.match(/[^.?!।॥۔\n]+[.?!।॥۔]*\s*/g) ?? [text];
  let cur = '';
  const push = (s: string) => { const t = s.trim(); if (t) out.push(t); };
  for (const sentence of sentences) {
    if ((cur + sentence).length <= max) { cur += sentence; continue; }
    push(cur);
    cur = '';
    if (sentence.length <= max) { cur = sentence; continue; }
    // Long sentence: break at commas/semicolons, then at spaces, then hard.
    let rest = sentence.trim();
    while (rest.length > max) {
      const window = rest.slice(0, max);
      let at = Math.max(window.lastIndexOf(', '), window.lastIndexOf('; '), window.lastIndexOf('، '));
      if (at < max * 0.4) at = window.lastIndexOf(' ');
      if (at < max * 0.4) at = max - 1;
      push(rest.slice(0, at + 1));
      rest = rest.slice(at + 1).trim();
    }
    cur = rest ? `${rest} ` : '';
  }
  push(cur);
  return out;
}

// ── Scripts → voices ────────────────────────────────────────────────

const SCRIPTS: { re: RegExp; langs: string[] }[] = [
  { re: /[ऀ-ॿ]/g, langs: ['hi-IN', 'mr-IN', 'ne-NP'] },
  { re: /[ঀ-৿]/g, langs: ['bn-IN', 'as-IN', 'bn-BD'] },
  { re: /[؀-ۿ]/g, langs: ['ur-IN', 'ur-PK'] },
  { re: /[਀-੿]/g, langs: ['pa-IN'] },
  { re: /[઀-૿]/g, langs: ['gu-IN'] },
  { re: /[଀-୿]/g, langs: ['or-IN'] },
  { re: /[஀-௿]/g, langs: ['ta-IN'] },
  { re: /[ఀ-౿]/g, langs: ['te-IN'] },
  { re: /[ಀ-೿]/g, langs: ['kn-IN'] },
  { re: /[ഀ-ൿ]/g, langs: ['ml-IN'] },
  { re: /[᱐-᱿]/g, langs: [] }, // Ol Chiki (Santali): no voices exist
  { re: /[A-Za-z]/g, langs: ['en-IN', 'en-GB', 'en-US'] },
];

const baseOf = (lang: string) => lang.toLowerCase().replace('_', '-').split('-')[0];

/** Voice languages to try: the requested code, unless the text's main script needs another (Kashmiri code ur-IN, text in Devanagari). */
export function voiceLangs(code: string, text: string): string[] {
  let best: (typeof SCRIPTS)[number] | null = null;
  let most = 0;
  for (const s of SCRIPTS) {
    const n = text.match(s.re)?.length ?? 0;
    if (n > most) { most = n; best = s; }
  }
  if (!best) return [code];
  if (!best.langs.some(l => baseOf(l) === baseOf(code))) return best.langs;
  return [code, ...best.langs.filter(l => l.toLowerCase() !== code.toLowerCase())];
}

const NOVELTY = /albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|eloquence/i;
function voiceScore(v: SpeechSynthesisVoice): number {
  let s = 0;
  if (/natural|neural/i.test(v.name)) s += 30;
  if (/google/i.test(v.name)) s += 20;
  if (/microsoft/i.test(v.name)) s += 15;
  if (/enhanced|premium/i.test(v.name)) s += 12;
  if (!v.localService) s += 4;
  if (v.default) s += 2;
  if (NOVELTY.test(v.name)) s -= 80;
  return s;
}

function pickBrowserVoice(voices: SpeechSynthesisVoice[], langs: string[]): SpeechSynthesisVoice | null {
  const norm = (l: string) => l.toLowerCase().replace('_', '-');
  const top = (list: SpeechSynthesisVoice[]) => [...list].sort((a, b) => voiceScore(b) - voiceScore(a))[0] ?? null;
  for (const want of langs) {
    const v = top(voices.filter(x => norm(x.lang) === norm(want)));
    if (v) return v;
  }
  for (const want of langs) {
    const v = top(voices.filter(x => baseOf(x.lang) === baseOf(want)));
    if (v) return v;
  }
  return null;
}

// ── Engines ─────────────────────────────────────────────────────────

const synth = (): SpeechSynthesis | null =>
  typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function'
    ? window.speechSynthesis : null;

interface TtsStatus { enabled: boolean; languages: string[] }
let ttsStatus: Promise<TtsStatus> | null = null;
/** Server narration status (fetched once per page load). Call early to warm it up. */
export function getTtsStatus(): Promise<TtsStatus> {
  if (typeof window === 'undefined') return Promise.resolve({ enabled: false, languages: [] });
  ttsStatus ??= fetch('/api/tts/status')
    .then(r => (r.ok ? r.json() : null))
    .then((j: Partial<TtsStatus> | null) => ({ enabled: !!j?.enabled, languages: Array.isArray(j?.languages) ? j.languages.map(String) : [] }))
    .catch(() => ({ enabled: false, languages: [] }));
  return ttsStatus;
}

async function browserVoices(): Promise<SpeechSynthesisVoice[]> {
  const s = synth();
  if (!s) return [];
  const now = s.getVoices();
  if (now.length) return now;
  // Chrome loads voices asynchronously.
  return new Promise(resolve => {
    const done = () => { s.removeEventListener?.('voiceschanged', done); clearTimeout(t); resolve(s.getVoices()); };
    const t = setTimeout(done, 1200);
    s.addEventListener?.('voiceschanged', done);
  });
}

let speechUnlocked = false;
/** iOS only plays speech started from a tap; speak one silent utterance inside the click. */
function unlockSpeech() {
  const s = synth();
  if (!s || speechUnlocked) return;
  speechUnlocked = true;
  try {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    s.speak(u);
  } catch { /* ignore */ }
}

let gen = 0;
let audio: HTMLAudioElement | null = null;
let speakingId: string | null = null;
const listeners = new Set<() => void>();
const setSpeaking = (id: string | null) => {
  if (speakingId === id) return;
  speakingId = id;
  listeners.forEach(l => l());
};

/** Stops whatever is being read aloud. */
export function stopSpeaking() {
  gen++;
  if (audio) {
    audio.pause();
    audio.removeAttribute('src');
    audio = null;
  }
  synth()?.cancel();
  setSpeaking(null);
}

const ttsUrl = (text: string, lang: string) => `/api/tts?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(lang)}&voice=female`;

function fetchAudio(text: string, lang: string): Promise<string> {
  return fetch(ttsUrl(text, lang)).then(r => {
    if (!r.ok) throw new Error(`tts ${r.status}`);
    return r.blob();
  }).then(b => URL.createObjectURL(b));
}

function playUrl(url: string, my: number): Promise<void> {
  return new Promise((resolve, reject) => {
    if (my !== gen) return resolve();
    const el = new Audio(url);
    audio = el;
    el.onended = () => resolve();
    el.onerror = () => reject(new Error('audio error'));
    el.play().catch(reject);
    // Resolve if stopped from elsewhere (pause doesn't fire `ended`).
    el.onpause = () => { if (my !== gen) resolve(); };
  });
}

function speakChunk(text: string, voice: SpeechSynthesisVoice | null, lang: string, my: number): Promise<void> {
  const s = synth();
  return new Promise(resolve => {
    if (!s || my !== gen) return resolve();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = voice?.lang ?? lang;
    if (voice) u.voice = voice;
    u.rate = 0.95;
    // Watchdog: some engines never fire `end` (or `error`) — don't hang forever.
    const watchdog = setTimeout(() => resolve(), Math.max(4000, text.length * 160));
    const finish = () => { clearTimeout(watchdog); resolve(); };
    u.onend = finish;
    u.onerror = finish;
    s.speak(u);
  });
}

/**
 * Reads `text` aloud in the language `langCode` (BCP-47, e.g. "hi-IN"). Resolves when
 * finished ('done'), cancelled by stopSpeaking()/another speak() ('stopped'), or
 * immediately with 'no-voice' when this device can't speak the language.
 * `id` lets buttons show which one is speaking (see useSpeakingId).
 */
export async function speak(text: string, langCode: string, { id = 'default' }: { id?: string } = {}): Promise<SpeakResult> {
  stopSpeaking();
  const my = ++gen;
  const clean = cleanForSpeech(text);
  if (!clean) return 'done';
  setSpeaking(id);
  const finish = (r: SpeakResult): SpeakResult => {
    if (my === gen) setSpeaking(null);
    return my === gen ? r : 'stopped';
  };

  unlockSpeech();
  const langs = voiceLangs(langCode, clean);
  const status = await getTtsStatus();
  if (my !== gen) return 'stopped';
  const serverOk = status.enabled && langs.some(l => status.languages.includes(l));

  let rest = clean;
  if (serverOk) {
    const chunks = chunkText(clean, SERVER_CHUNK);
    let next: Promise<string> | null = fetchAudio(chunks[0], langCode);
    let i = 0;
    try {
      for (; i < chunks.length; i++) {
        const url = await next!;
        next = i + 1 < chunks.length ? fetchAudio(chunks[i + 1], langCode) : null;
        if (my !== gen) { URL.revokeObjectURL(url); return 'stopped'; }
        try { await playUrl(url, my); } finally { URL.revokeObjectURL(url); }
        if (my !== gen) return 'stopped';
      }
      return finish('done');
    } catch {
      // Server voice failed (quota, network, autoplay block): the browser voice reads the rest.
      next?.then(u => URL.revokeObjectURL(u), () => {});
      if (my !== gen) return 'stopped';
      rest = chunks.slice(i).join(' ');
    }
  }

  if (!synth()) return finish('no-voice');
  const voice = pickBrowserVoice(await browserVoices(), langs);
  if (my !== gen) return 'stopped';
  // Without a matching voice the browser would read e.g. Tamil text with an English voice.
  if (!voice && !langs.some(l => baseOf(l) === 'en')) return finish('no-voice');
  for (const chunk of chunkText(rest, BROWSER_CHUNK)) {
    await speakChunk(chunk, voice, langs[0] ?? langCode, my);
    if (my !== gen) return 'stopped';
  }
  return finish('done');
}

/** Subscribe to speaking changes (for useSyncExternalStore). */
export function subscribeSpeaking(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** The `id` passed to the speak() call that is currently reading aloud, or null. */
export function useSpeakingId(): string | null {
  return useSyncExternalStore(subscribeSpeaking, () => speakingId, () => null);
}
