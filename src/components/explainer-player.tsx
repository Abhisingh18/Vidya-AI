'use client';

import { memo, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Captions, CaptionsOff, Check, Clock, Maximize, Minimize, Pause, Play, RotateCcw, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import SlideView from '@/components/teacher/slide-view';
import MotionSlide from '@/components/motion/motion-stage';
import { motionBeat } from '@/lib/motion';
import { EMOJI_FONT } from '@/components/teacher/slide-diagram';
import { LANGUAGES } from '@/lib/languages';
import { estimateSeconds, explainerDuration, revealForSentence, type ExplainerContent, type SceneTransition } from '@/lib/explainer';
import type { SlideTheme } from '@/lib/teacher-docs';

// Explainer "video" player: animated scenes (SlideView) driven by spoken narration.
//
// Narration engine (Narrator) plays one sentence at a time, split into chunks of
// ≤150 chars at punctuation. Each chunk tries, in order:
//   1. server TTS audio (/api/tts) through one shared <audio> element, when
//      /api/tts/status lists the language — next chunks are prefetched;
//   2. Web Speech, with the best voice for the language or, failing that, for the
//      SCRIPT of the text (Marathi → a Hindi voice, Devanagari Kashmiri → Hindi…);
//   3. a silent timer (estimateSeconds / rate), with a visible "no voice" notice.
// A failing chunk drops to the next tier, so playback never stalls: errors, a voice
// that never starts, or one that never ends (watchdog: estimate × 1.8 + 2s).
// Pause: audio.pause() / speechSynthesis.cancel(); resume: audio.play() / re-speak
// the current chunk (reliable on Chrome, Safari and Android). Every play/stop bumps
// a generation counter, so callbacks from cancelled utterances/timers are ignored.
// The first chunk is started inside the Play click (browsers block speech/audio
// that isn't started from a user gesture).
//
// Sync: while sentence i of scene s plays, the slide shows
// revealForSentence(slide, i, count) items and the caption highlights the spoken
// word (speech onboundary when available, else audio time or a paced estimate).

export interface ExplainerPlayerProps {
  content: ExplainerContent;
  /** Called once, the first time playback starts (watch tracking). */
  onWatchTracked?: () => void;
}

type Status = 'idle' | 'playing' | 'paused' | 'ended';

const RATES = [0.75, 1, 1.25, 1.5] as const;
const CHUNK_MAX = 150;       // chars per utterance / audio request
const CUE_MAX = 90;          // chars per caption cue
const SENTENCE_GAP = 220;    // ms between sentences of a scene
const SCENE_HOLD = 550;      // ms on a finished scene before moving on
const SILENT_SCENE = 3000;   // ms for a scene without narration
// A voice must start speaking within this; network voices (e.g. Chrome's Google
// voices) can take several seconds to warm up.
const SPEECH_START_MS = { local: 3500, network: 7000 };
const AUDIO_START_MS = 8000;  // server audio must start playing within this
const FAIL_LIMIT = 2;        // consecutive failures before a tier is skipped
const INTRO_MS = 820;
const TRANSITION_MS: Record<SceneTransition, number> = { swipe: 760, zoom: 720, fade: 620, rise: 700 };
const REDUCED_MS = 420;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// ── Theme look (stage backdrop) ─────────────────────────────────────

interface Look {
  base: string; ink: string; sub: string; accent: string; glow: string;
  blobs: [string, string, string];
  /** Highlight for the spoken word on the dark caption box. */
  word: string;
  shadow: string;
  scrim: string;
}

const LOOKS: Record<SlideTheme, Look> = {
  saffron: {
    base: '#FFF3EA', ink: '#1A1A2E', sub: '#5B5B70', accent: '#FF6B2C', glow: '#FF6B2C59', word: '#FFAE7E',
    blobs: ['#FF6B2C4D', '#3D3BDB2B', '#0F9E7529'],
    shadow: '0 1.6cqw 4.5cqw -1cqw #1A1A2E59, 0 0 0 1px #1A1A2E0F', scrim: '#FFF6EFF5',
  },
  indigo: {
    base: '#EDEDFF', ink: '#1E1B4B', sub: '#55557A', accent: '#4F46E5', glow: '#4F46E559', word: '#B4BCFF',
    blobs: ['#4F46E547', '#FF6B2C29', '#22D3EE29'],
    shadow: '0 1.6cqw 4.5cqw -1cqw #1E1B4B59, 0 0 0 1px #1E1B4B0F', scrim: '#F1F1FFF5',
  },
  midnight: {
    base: '#08080F', ink: '#F0F0FF', sub: '#A3A3BD', accent: '#FF8A50', glow: '#FF8A5059', word: '#FFB088',
    blobs: ['#FF8A5038', '#6F6DE147', '#0F9E7533'],
    shadow: '0 1.6cqw 5cqw -0.6cqw #000000B3, 0 0 0 1px #FFFFFF14', scrim: '#08080FF0',
  },
};

// ── Text: words, utterance chunks, caption cues ─────────────────────

interface Span { start: number; end: number; f0: number; f1: number }
interface Word { text: string; start: number; f0: number; f1: number }
interface Line { text: string; words: Word[]; chunks: Span[]; cues: Span[]; est: number }

const BREAKS = [/[।॥.!?]/, /[;:—–]/, /[,،]/];
const PUNCT = /[.,!?;:—–\-"'“”‘’()[\]।॥…]/g;

/** Best break in (from + min, to]: sentence end, then clause marks, then commas, then a space. */
function breakAt(text: string, from: number, to: number, min: number): number {
  for (const re of BREAKS) {
    for (let i = to - 1; i >= from + min; i--) {
      if (re.test(text[i]) && (i + 1 >= text.length || /\s/.test(text[i + 1]))) return i + 1;
    }
  }
  for (let i = to; i > from + min; i--) if (/\s/.test(text[i])) return i;
  return to;
}

/** [start, end) ranges of at most `max` chars, roughly balanced. */
function ranges(text: string, max: number): [number, number][] {
  const out: [number, number][] = [];
  let from = 0;
  for (;;) {
    while (from < text.length && /\s/.test(text[from])) from++;
    if (from >= text.length) return out;
    const rest = text.length - from;
    if (rest <= max) { out.push([from, text.length]); return out; }
    const target = Math.min(max, Math.ceil(rest / Math.ceil(rest / max)) + Math.round(max * 0.15));
    const end = breakAt(text, from, from + target, Math.round(target * 0.35));
    out.push([from, end]);
    from = end;
  }
}

function prepareLine(text: string, language: string): Line {
  const words: Word[] = [];
  let total = 0;
  const re = /\S+/g;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    const weight = Math.max(1, m[0].replace(PUNCT, '').length) + 1.5;
    words.push({ text: m[0], start: m.index, f0: total, f1: (total += weight) });
  }
  for (const w of words) { w.f0 /= total || 1; w.f1 /= total || 1; }
  const span = ([start, end]: [number, number]): Span => {
    const inside = words.filter(w => w.start >= start && w.start < end);
    return { start, end, f0: inside[0]?.f0 ?? 0, f1: inside[inside.length - 1]?.f1 ?? 1 };
  };
  return { text, words, chunks: ranges(text, CHUNK_MAX).map(span), cues: ranges(text, CUE_MAX).map(span), est: estimateSeconds(text, language) };
}

/** Word being spoken at sentence fraction `f` (0–1). */
function wordAtFrac(line: Line, f: number): number {
  const i = line.words.findIndex(w => w.f1 > f);
  return i < 0 ? line.words.length - 1 : i;
}

function wordAtChar(line: Line, at: number): number {
  let k = 0;
  for (let i = 0; i < line.words.length; i++) if (line.words[i].start <= at) k = i;
  return k;
}

interface Timeline { sceneStart: number[]; sceneDur: number[]; sentStart: number[][]; total: number }

/** Estimated seconds (at 1×), same accounting as explainerDuration(). */
function buildTimeline(lines: Line[][]): Timeline {
  const sceneStart: number[] = [], sceneDur: number[] = [], sentStart: number[][] = [];
  let t = 0;
  lines.forEach((scene, s) => {
    sceneStart[s] = t;
    let u = 0;
    sentStart[s] = scene.map(l => { const at = u; u += l.est; return at; });
    sceneDur[s] = u + 1;
    t += u + 1;
  });
  return { sceneStart, sceneDur, sentStart, total: t };
}

const fmt = (sec: number) => {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

// ── Voices: language code + script fallback ─────────────────────────

export function langCode(language: string): string {
  const name = language.trim().toLowerCase();
  if (name === 'hinglish') return 'hi-IN';
  return LANGUAGES.find(l => l.name.toLowerCase() === name)?.code ?? 'en-IN';
}

/** Voice languages that can read each script, best first. */
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

/**
 * Voice languages to try for this narration: the language's code, unless the text
 * is in a script that code can't read (Kashmiri is mapped to ur-IN but written in
 * Devanagari) — the script of the actual text wins.
 */
export function voiceLangs(language: string, text: string): string[] {
  const code = langCode(language);
  let best: { langs: string[] } | null = null;
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
  let score = 0;
  if (/natural|neural/i.test(v.name)) score += 30;
  if (/google/i.test(v.name)) score += 20;
  if (/microsoft/i.test(v.name)) score += 15;
  if (/enhanced|premium/i.test(v.name)) score += 12;
  if (!v.localService) score += 4;
  if (v.default) score += 2;
  if (NOVELTY.test(v.name)) score -= 80;
  return score;
}

/**
 * Usable voices, best first: exact lang (hi-IN, en-IN, …in `langs` order), then the
 * same language (en-*); natural engines first. Later entries are fallbacks for a
 * voice that fails to speak (e.g. a network voice that never starts).
 */
export function pickVoices(voices: SpeechSynthesisVoice[], langs: string[]): SpeechSynthesisVoice[] {
  const norm = (l: string) => l.toLowerCase().replace('_', '-');
  const ranked = (list: SpeechSynthesisVoice[]) => list.slice().sort((a, b) => voiceScore(b) - voiceScore(a));
  const out: SpeechSynthesisVoice[] = [];
  const add = (list: SpeechSynthesisVoice[]) => ranked(list).forEach(v => { if (!out.includes(v)) out.push(v); });
  for (const want of langs) add(voices.filter(x => norm(x.lang) === norm(want)));
  for (const want of langs) add(voices.filter(x => baseOf(x.lang) === baseOf(want)));
  return out;
}

// ── Server TTS ──────────────────────────────────────────────────────

export interface TtsStatus { enabled: boolean; languages: string[]; slowLanguages: string[] }
let ttsStatus: Promise<TtsStatus> | null = null;
/** The server voice for this narration takes seconds per chunk (e.g. a free Hugging Face model): wait longer, buffer further. */
let slowAudio = false;
export function getTtsStatus(): Promise<TtsStatus> {
  const list = (v: unknown) => (Array.isArray(v) ? v.map(String) : []);
  ttsStatus ??= fetch('/api/tts/status')
    .then(r => (r.ok ? r.json() : null))
    .then((j: Partial<TtsStatus> | null) => ({ enabled: !!j?.enabled, languages: list(j?.languages), slowLanguages: list(j?.slowLanguages) }))
    .catch(() => ({ enabled: false, languages: [], slowLanguages: [] }));
  return ttsStatus;
}
const audioStartMs = () => (slowAudio ? 60_000 : AUDIO_START_MS);

export const ttsUrl = (text: string, lang: string) => `/api/tts?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(lang)}&voice=female`;

/** url → object URL (ready), null (failed) or a pending fetch. */
export const ttsCache = new Map<string, string | null | Promise<void>>();
export function prefetchTts(text: string, lang: string) {
  const url = ttsUrl(text, lang);
  if (ttsCache.has(url) || typeof window === 'undefined') return;
  ttsCache.set(url, fetch(url)
    .then(r => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
    .then(b => { ttsCache.set(url, URL.createObjectURL(b)); }, () => { ttsCache.set(url, null); }));
  if (ttsCache.size > 160) {
    const [oldest, v] = ttsCache.entries().next().value as [string, string | null | Promise<void>];
    if (typeof v === 'string') URL.revokeObjectURL(v);
    ttsCache.delete(oldest);
  }
}

// ── Narrator ────────────────────────────────────────────────────────

export const getSynth = (): SpeechSynthesis | null =>
  typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function'
    ? window.speechSynthesis : null;

/** 50 ms of silence (8 kHz mono WAV). */
export const SILENT_WAV = (() => {
  if (typeof window === 'undefined') return '';
  const n = 400, b = new DataView(new ArrayBuffer(44 + n));
  const str = (o: number, t: string) => { for (let i = 0; i < t.length; i++) b.setUint8(o + i, t.charCodeAt(i)); };
  str(0, 'RIFF'); b.setUint32(4, 36 + n, true); str(8, 'WAVEfmt '); b.setUint32(16, 16, true); b.setUint16(20, 1, true); b.setUint16(22, 1, true);
  b.setUint32(24, 8000, true); b.setUint32(28, 8000, true); b.setUint16(32, 1, true); b.setUint16(34, 8, true); str(36, 'data'); b.setUint32(40, n, true);
  for (let i = 0; i < n; i++) b.setUint8(44 + i, 128);
  return URL.createObjectURL(new Blob([b.buffer], { type: 'audio/wav' }));
})();

let speechUnlocked = false;
/** iOS needs one utterance started from a gesture before later (timer-driven) ones play. */
export function unlockSpeech() {
  const synth = getSynth();
  if (!synth || speechUnlocked) return;
  speechUnlocked = true;
  try {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    synth.speak(u);
  } catch { /* ignore */ }
}

interface SpeakOptions {
  rate: number;
  /** Muted: timer only. */
  silent: boolean;
  /** Server TTS language, when the server can voice this narration. */
  audioLang: string | null;
  speechLang: string;
  /** Candidate voices, best first (see pickVoices). */
  voices: SpeechSynthesisVoice[];
  /** False when this device has no voice for the narration. */
  speechOk: boolean;
}

interface SpeakEvents {
  onChunk: (i: number) => void;
  /** Fraction (0–1) of the sentence spoken so far. */
  onProgress: (frac: number) => void;
  onDone: () => void;
  /** A chunk fell back to a lower tier; `silent` once nothing audible is left. */
  onFail: (silent: boolean) => void;
}

type Tier = 'audio' | 'speech' | 'timer';

/** Speaks one sentence chunk by chunk: server audio → Web Speech → silent timer. */
class Narrator {
  private gen = 0;
  private timers: number[] = [];
  private ticker = 0;
  private utterance: SpeechSynthesisUtterance | null = null;
  private audio: HTMLAudioElement | null = null;
  private cancelledAt = -1e9;
  private session: { pause: () => boolean; resume: () => boolean; setRate: (r: number) => boolean } | null = null;
  /** Consecutive failures per tier; at FAIL_LIMIT the tier is skipped. */
  speechFailures = 0;
  /** Index into SpeakOptions.voices of the voice in use; moves on when one fails. */
  voiceIdx = 0;
  audioFailures = 0;
  /** Measured speech time ÷ estimate, to pace the estimated word highlight. */
  pace = 1;
  /** Tier of the chunk being played (for the voice indicator). */
  tier: Tier = 'timer';
  private audioUnlocked = false;

  /**
   * iOS only lets an <audio> element play later (e.g. once a chunk has downloaded)
   * if it was first played from a tap: play a moment of silence on it now.
   */
  unlockAudio() {
    if (this.audioUnlocked || !SILENT_WAV) return;
    this.audioUnlocked = true;
    const a = this.el();
    a.src = SILENT_WAV;
    a.play()?.catch(() => {});
  }

  private el() {
    if (!this.audio) {
      this.audio = new Audio();
      this.audio.preload = 'auto';
    }
    return this.audio;
  }

  stop() {
    this.gen++;
    this.session = null;
    this.timers.forEach(t => window.clearTimeout(t));
    this.timers = [];
    window.clearInterval(this.ticker);
    const synth = getSynth();
    if (synth && (this.utterance || synth.speaking || synth.pending)) {
      synth.cancel();
      this.cancelledAt = performance.now();
    }
    this.utterance = null;
    if (this.audio && !this.audio.paused) this.audio.pause();
  }

  /** Pause in place (server audio only); false → caller stops and re-speaks later. */
  pause() { return this.session?.pause() ?? false; }
  resume() { return this.session?.resume() ?? false; }
  /** Apply a new rate without restarting (server audio only). */
  setRate(r: number) { return this.session?.setRate(r) ?? false; }

  play(line: Line, from: number, opts: SpeakOptions, ev: SpeakEvents) {
    this.stop();
    const gen = this.gen;
    const synth = getSynth();
    const live = () => gen === this.gen;
    const later = (fn: () => void, ms: number) => {
      this.timers.push(window.setTimeout(() => { if (live()) fn(); }, ms));
    };

    let i = from;
    let chunkId = 0;
    let rate = opts.rate;
    let mode: Tier = 'timer';
    let t0 = 0, estMs = 0, started = false, boundary = -1, quietSince = 0, paused = false, pausedFor = 0;
    /** The <audio> element holds this chunk's audio (it may still be downloading). */
    let srcReady = false;

    const canSpeak = () => !!synth && opts.speechOk && this.speechFailures < FAIL_LIMIT;
    const canAudio = () => !!opts.audioLang && this.audioFailures < FAIL_LIMIT;
    const chunkText = () => { const c = line.chunks[i]; return line.text.slice(c.start, c.end); };
    const fracAt = (p: number) => {
      const c = line.chunks[i];
      return c ? c.f0 + (c.f1 - c.f0) * clamp(p, 0, 1) : 1;
    };
    const setMode = (m: Tier) => { mode = m; this.tier = m; };
    const next = () => { i++; run(); };

    // ── tier 1: server audio
    const playAudio = () => {
      const id = chunkId;
      const text = chunkText();
      const lang = opts.audioLang as string;
      const a = this.el();
      const mine = () => live() && id === chunkId && mode === 'audio';
      const url = ttsUrl(text, lang);
      const begin = (src: string) => {
        a.onplaying = () => {
          if (!mine() || started) return;
          started = true;
          t0 = performance.now();
          const ms = Math.max(estMs, ((a.duration || 0) * 1000) / rate) * 1.8 + 2000;
          later(() => { if (mine() && !paused) next(); }, ms);
        };
        a.onended = () => { if (mine()) { this.audioFailures = 0; next(); } };
        a.onerror = () => { if (mine()) audioFailed(); };
        a.src = src;
        srcReady = true;
        a.defaultPlaybackRate = rate;
        a.playbackRate = rate;
        if (!paused) a.play()?.catch((e: unknown) => { if (mine() && (e as Error)?.name !== 'AbortError') audioFailed(); });
      };
      srcReady = false;
      // One request per chunk: wait for a prefetch in flight instead of fetching it again.
      if (!ttsCache.has(url)) prefetchTts(text, lang);
      const cached = ttsCache.get(url);
      if (cached === null) { audioFailed(); return; }
      if (typeof cached === 'string') begin(cached);
      else {
        Promise.resolve(cached).then(() => {
          if (!mine()) return;
          const got = ttsCache.get(url);
          if (typeof got === 'string') begin(got);
          else audioFailed();
        });
      }
      later(() => { if (mine() && !started && !paused) audioFailed(); }, audioStartMs());
      for (const k of [i + 1, i + 2]) {
        const c = line.chunks[k];
        if (c) prefetchTts(line.text.slice(c.start, c.end), lang);
      }
    };
    const audioFailed = () => {
      if (mode !== 'audio') return;
      this.audioFailures++;
      if (this.audio) { this.audio.onplaying = this.audio.onended = this.audio.onerror = null; this.audio.pause(); }
      chunkId++;
      t0 = performance.now();
      started = false;
      if (canSpeak()) { setMode('speech'); speak(); }
      else { setMode('timer'); started = true; ev.onFail(!canAudio()); }
    };

    // ── tier 2: Web Speech
    const speechFailed = (error?: string) => {
      if (mode !== 'speech') return;
      // Another installed voice may work where this one didn't (e.g. a local voice
      // when the network one never starts): retry this chunk with it.
      if (error !== 'synthesis-unavailable' && error !== 'language-unavailable' && this.voiceIdx < opts.voices.length - 1) {
        this.voiceIdx++;
        if (this.utterance && synth) {
          this.utterance = null;
          synth.cancel();
          this.cancelledAt = performance.now();
        }
        chunkId++;
        started = false;
        t0 = performance.now();
        speak();
        return;
      }
      // These won't get better on the next sentence.
      this.speechFailures = /^(synthesis|language|voice)-unavailable$/.test(error ?? '') ? FAIL_LIMIT : this.speechFailures + 1;
      setMode('timer');
      started = true; // the ticker ends this chunk at t0 + estMs
      if (this.utterance && synth) {
        this.utterance = null;
        synth.cancel();
        this.cancelledAt = performance.now();
      }
      ev.onFail(!canSpeak() && !canAudio());
    };
    const spoken = (how: 'end' | 'quiet') => {
      if (mode !== 'speech') return;
      const took = performance.now() - t0;
      // A voice that "finishes" a long chunk instantly can't read this script.
      if (how === 'end' && estMs > 1500 && took < estMs * 0.35) { speechFailed(); return; }
      this.utterance = null;
      if (how === 'end') {
        this.speechFailures = 0;
        if (estMs > 1500) this.pace = clamp(this.pace * 0.6 + (took / estMs) * 0.4, 0.6, 1.8);
      }
      next();
    };
    const speak = () => {
      const c = line.chunks[i];
      const id = chunkId;
      const u = new SpeechSynthesisUtterance(chunkText());
      const voice = opts.voices[this.voiceIdx] ?? null;
      u.lang = voice?.lang ?? opts.speechLang;
      if (voice) u.voice = voice;
      u.rate = rate;
      const mine = () => live() && this.utterance === u;
      const begin = () => { if (!started) { started = true; t0 = performance.now(); } };
      u.onstart = () => { if (mine()) begin(); };
      u.onboundary = e => {
        if (!mine() || (e.name && e.name !== 'word')) return;
        begin();
        boundary = line.words[wordAtChar(line, c.start + e.charIndex)]?.f0 ?? boundary;
      };
      u.onend = () => { if (mine()) spoken('end'); };
      u.onerror = e => { if (mine()) speechFailed(e.error); };
      this.utterance = u;
      synth?.speak(u);
      const startMs = voice && !voice.localService ? SPEECH_START_MS.network : SPEECH_START_MS.local;
      later(() => { if (id === chunkId && mode === 'speech' && !started) speechFailed(); }, startMs);
      later(() => { if (id === chunkId && mode === 'speech') speechFailed(); }, estMs * Math.max(1, this.pace) * 1.8 + 2000);
    };

    const run = () => {
      if (!live()) return;
      chunkId++;
      const c = line.chunks[i];
      if (!c) {
        window.clearInterval(this.ticker);
        this.session = null;
        ev.onProgress(1);
        ev.onDone();
        return;
      }
      ev.onChunk(i);
      estMs = Math.max(400, (line.est * (c.f1 - c.f0) * 1000) / rate);
      t0 = performance.now();
      started = false; boundary = -1; quietSince = 0;
      setMode(opts.silent ? 'timer' : canAudio() ? 'audio' : canSpeak() ? 'speech' : 'timer');
      if (mode === 'audio') playAudio();
      else if (mode === 'speech') speak();
      else started = true;
      ev.onProgress(fracAt(0));
    };

    const tick = () => {
      if (!live() || paused || !line.chunks[i]) return;
      const now = performance.now();
      if (mode === 'timer') {
        const p = (now - t0) / estMs;
        if (p >= 1) next();
        else ev.onProgress(fracAt(p));
        return;
      }
      if (!started) return;
      if (mode === 'audio') {
        const a = this.audio;
        const d = a?.duration ?? NaN;
        ev.onProgress(fracAt(Math.min(0.99, a && Number.isFinite(d) && d > 0 ? a.currentTime / d : (now - t0) / estMs)));
        return;
      }
      ev.onProgress(boundary >= 0 ? boundary : fracAt(Math.min(0.97, (now - t0) / (estMs * this.pace))));
      // Some engines go quiet without ever firing onend.
      if (synth && !synth.speaking && !synth.pending) {
        if (!quietSince) quietSince = now;
        else if (now - quietSince > 1500 && now - t0 > estMs * 0.5) spoken('quiet');
      } else quietSince = 0;
    };

    this.session = {
      pause: () => {
        if (mode !== 'audio' || paused || !this.audio) return false;
        paused = true;
        pausedFor = performance.now() - t0;
        this.audio.pause();
        this.timers.forEach(t => window.clearTimeout(t));
        this.timers = [];
        return true;
      },
      resume: () => {
        if (!paused || !live() || mode !== 'audio' || !this.audio) return false;
        paused = false;
        t0 = performance.now() - pausedFor;
        const a = this.audio;
        const id = chunkId;
        if (srcReady) a.play()?.catch((e: unknown) => { if (live() && id === chunkId && (e as Error)?.name !== 'AbortError') audioFailed(); });
        if (started) {
          const left = Math.max(estMs, ((a.duration || 0) * 1000) / rate) * 1.8 + 2000 - pausedFor;
          later(() => { if (live() && id === chunkId && !paused) next(); }, Math.max(2000, left));
        } else later(() => { if (live() && id === chunkId && !started && !paused) audioFailed(); }, audioStartMs());
        return true;
      },
      setRate: r => {
        if (mode !== 'audio' || !this.audio) return false;
        rate = r;
        this.audio.defaultPlaybackRate = r;
        this.audio.playbackRate = r;
        return true;
      },
    };

    this.ticker = window.setInterval(tick, 100);
    // Safari/iOS may drop an utterance spoken right after cancel().
    if (!opts.silent && !canAudio() && performance.now() - this.cancelledAt < 150) later(run, 120);
    else run();
  }
}

function useVoices(narrator: Narrator) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[] | null>(null);
  useEffect(() => {
    const synth = getSynth();
    if (!synth) { setVoices([]); return; }
    const update = () => {
      const list = synth.getVoices();
      if (list.length) narrator.speechFailures = 0;
      setVoices(list);
    };
    update();
    synth.addEventListener?.('voiceschanged', update);
    return () => synth.removeEventListener?.('voiceschanged', update);
  }, [narrator]);
  return voices;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(m.matches);
    on();
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return reduced;
}

const preloaded = new Set<string>();
function preloadImage(url: string | undefined) {
  if (!url || preloaded.has(url) || typeof window === 'undefined') return;
  preloaded.add(url);
  const img = new window.Image();
  img.decoding = 'async';
  img.src = url;
}

type FullscreenDoc = Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => void };
type FullscreenEl = HTMLElement & { webkitRequestFullscreen?: () => void };
const fullscreenElement = () => document.fullscreenElement ?? (document as FullscreenDoc).webkitFullscreenElement ?? null;

// ── Component ───────────────────────────────────────────────────────

export default function ExplainerPlayer(props: ExplainerPlayerProps) {
  const c = props.content;
  // New content → fresh player state.
  const key = `${c.title}|${c.language}|${c.theme}|${c.scenes.length}|${c.scenes[0]?.narration[0] ?? ''}`;
  return <Player key={key} {...props} />;
}

interface Trans { id: number; from: number; fromReveal: number; kind: SceneTransition; dir: 1 | -1; ms: number }

function Player({ content, onWatchTracked }: ExplainerPlayerProps) {
  const scenes = content.scenes;
  const total = scenes.length;
  const look = LOOKS[content.theme] ?? LOOKS.saffron;
  const lines = useMemo(() => scenes.map(s => s.narration.map(t => prepareLine(t, content.language))), [scenes, content.language]);
  const tl = useMemo(() => buildTimeline(lines), [lines]);
  const duration = explainerDuration(content);
  const langs = useMemo(() => voiceLangs(content.language, scenes.map(s => s.narration.join(' ')).join(' ')), [scenes, content.language]);
  const lang = langs[0] ?? langCode(content.language);

  const [status, setStatus] = useState<Status>('idle');
  const [scene, setScene] = useState(0);
  const [sentence, setSentence] = useState(-1);
  const [frac, setFrac] = useState(0);
  const [trans, setTrans] = useState<Trans | null>(null);
  const [intro, setIntro] = useState(false);
  const [rate, setRate] = useState(1);
  const [muted, setMuted] = useState(false);
  const [captions, setCaptions] = useState(true);
  const [chrome, setChrome] = useState(true);
  const [focusIn, setFocusIn] = useState(false);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [full, setFull] = useState<'' | 'native' | 'pseudo'>('');
  const [narrow, setNarrow] = useState(false);
  const [notice, setNotice] = useState('');
  const [voiceDead, setVoiceDead] = useState(false);
  const [tts, setTts] = useState<TtsStatus | null>(null);
  const [flash, setFlash] = useState<{ id: number; play: boolean } | null>(null);
  const reduced = useReducedMotion();

  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [narrator] = useState(() => new Narrator());
  const voices = useVoices(narrator);
  const st = useRef({ status: 'idle' as Status, scene: 0, sentence: -1, chunk: 0, done: false, timers: [] as number[] });
  const prefs = useRef({ rate: 1, muted: false });
  const timers = useRef({ trans: 0, intro: 0, hide: 0, notice: 0, seq: 0 });
  const tracked = useRef(false);
  const pointer = useRef('mouse');

  // ── which voice will narrate ──
  const voiceList = useMemo(() => (voices ? pickVoices(voices, langs) : []), [voices, langs]);
  const voice = voiceList[0] ?? null;
  const audioLang = useMemo(() => {
    if (!tts?.enabled) return null;
    const served = tts.languages.map(l => l.toLowerCase());
    return langs.find(l => served.includes(l.toLowerCase())) ?? langs.find(l => served.some(s => baseOf(s) === baseOf(l) && !s.includes('-'))) ?? null;
  }, [tts, langs]);
  const slow = !!audioLang && !!tts?.slowLanguages.some(l => l.toLowerCase() === audioLang.toLowerCase());
  slowAudio = slow;
  // Only rule speech out once the voice list has loaded (Android may list none yet still speak by lang).
  const speechOk = !voiceDead && langs.length > 0 && !(voices?.length && !voice);
  const noVoice = voiceDead || (!audioLang && !speechOk && voices !== null);
  const noVoiceText = voiceDead
    ? `🔇 Couldn't play the ${content.language} voice — showing captions. Tap the speaker button to try again.`
    : `🔇 This browser has no ${content.language} voice — showing captions.`;
  const voiceLabel = muted ? 'muted — captions only'
    : noVoice ? 'none — captions only'
    : audioLang ? `Vidya server voice (${audioLang})${voice ? ` · fallback ${voice.name}` : ''}`
    : voice ? `${(voiceList[narrator.voiceIdx] ?? voice).name} (${(voiceList[narrator.voiceIdx] ?? voice).lang})` : `device default (${lang})`;
  const speakOpts = useRef<Omit<SpeakOptions, 'rate' | 'silent'>>({ audioLang: null, speechLang: lang, voices: [], speechOk: true });
  speakOpts.current = { audioLang: voiceDead ? null : audioLang, speechLang: lang, voices: voiceList, speechOk };

  // ── playback sequencing (all mutable state lives in `st`) ──

  const after = (ms: number, fn: () => void) => {
    const s = st.current;
    const id = window.setTimeout(() => { s.timers = s.timers.filter(t => t !== id); fn(); }, ms);
    s.timers.push(id);
  };
  const clearPending = () => {
    st.current.timers.forEach(t => window.clearTimeout(t));
    st.current.timers = [];
  };
  const halt = () => { narrator.stop(); clearPending(); };
  const setPlayStatus = (v: Status) => { st.current.status = v; setStatus(v); };
  const revealOf = (i: number, sent: number) => {
    const sc = scenes[i];
    return !sc || sent < 0 ? 0 : revealForSentence(sc.slide, sent, sc.narration.length);
  };
  const showNotice = (text: string, ms = 9000) => {
    setNotice(text);
    window.clearTimeout(timers.current.notice);
    timers.current.notice = window.setTimeout(() => setNotice(''), ms);
  };
  const prefetchLine = (l: Line | undefined) => {
    const a = speakOpts.current.audioLang;
    if (!a || !l || prefs.current.muted) return;
    // A slow voice needs the whole next sentence ready, not just its first chunk.
    for (const c of slowAudio ? l.chunks : l.chunks.slice(0, 1)) prefetchTts(l.text.slice(c.start, c.end), a);
  };
  /** The next `n` sentences after (scene, sentence), across scene boundaries. */
  const upcoming = (scene: number, sentence: number, n: number) => {
    const out: Line[] = [];
    for (let sc = scene, se = sentence + 1; sc < lines.length && out.length < n; sc++, se = 0) {
      for (; se < (lines[sc]?.length ?? 0) && out.length < n; se++) out.push(lines[sc][se]);
    }
    return out;
  };

  const speak = (fromChunk: number) => {
    const s = st.current;
    const line = lines[s.scene]?.[s.sentence];
    if (!line) { s.done = true; advance(); return; }
    s.done = false;
    narrator.play(line, fromChunk, { ...speakOpts.current, rate: prefs.current.rate, silent: prefs.current.muted }, {
      onChunk: i => { s.chunk = i; },
      onProgress: setFrac,
      onDone: () => { s.done = true; s.chunk = 0; advance(); },
      onFail: silent => {
        if (!silent) return;
        setVoiceDead(true);
        setCaptions(true);
        showNotice(noVoiceText);
      },
    });
    upcoming(s.scene, s.sentence, slowAudio ? 2 : 1).forEach(prefetchLine);
  };

  const startSentence = (i: number) => {
    const s = st.current;
    s.sentence = i; s.chunk = 0; s.done = false;
    setSentence(i);
    setFrac(0);
    speak(0);
  };

  const advance = () => {
    const s = st.current;
    const count = scenes[s.scene]?.narration.length ?? 0;
    if (s.sentence + 1 < count) {
      after(SENTENCE_GAP / prefs.current.rate, () => startSentence(s.sentence + 1));
      return;
    }
    after(count ? SCENE_HOLD : SILENT_SCENE, () => {
      if (s.scene + 1 < total) goTo(s.scene + 1);
      else finish();
    });
  };

  const enter = (target: number) => {
    const s = st.current;
    s.scene = target; s.sentence = -1; s.chunk = 0; s.done = false;
    setScene(target);
    setSentence(-1);
    setFrac(0);
    preloadImage(scenes[target + 1]?.slide.image?.url);
    preloadImage(scenes[target + 2]?.slide.image?.url);
  };

  /** Move to a scene with its transition; keeps playing/paused. */
  const goTo = (target: number) => {
    const s = st.current;
    const to = clamp(target, 0, total - 1);
    halt();
    const from = s.scene;
    let delay = 300;
    if (to !== from) {
      const kind: SceneTransition = reduced ? 'fade' : scenes[to].transition ?? 'swipe';
      const ms = reduced ? REDUCED_MS : TRANSITION_MS[kind] ?? 700;
      const id = ++timers.current.seq;
      setTrans({ id, from, fromReveal: revealOf(from, s.sentence), kind, dir: to > from ? 1 : -1, ms });
      window.clearTimeout(timers.current.trans);
      timers.current.trans = window.setTimeout(() => setTrans(t => (t?.id === id ? null : t)), ms + 60);
      delay = ms * 0.5;
    }
    enter(to);
    if (s.status === 'playing') {
      prefetchLine(lines[to]?.[0]);
      after(delay, () => startSentence(0));
    }
  };

  /** From the title card / end screen. Runs inside the click so the first chunk is gesture-started. */
  const start = (target: number) => {
    halt();
    setTrans(null);
    setPlayStatus('playing');
    enter(target);
    setIntro(true);
    window.clearTimeout(timers.current.intro);
    timers.current.intro = window.setTimeout(() => setIntro(false), INTRO_MS);
    if (noVoice && !prefs.current.muted) {
      setCaptions(true);
      showNotice(noVoiceText);
    } else if (slowAudio && audioLang && !prefs.current.muted) {
      showNotice('🎙️ Getting the narrator’s voice ready — the first line can take a few seconds…', 8000);
    }
    startSentence(0);
  };

  const finish = () => {
    halt();
    setPlayStatus('ended');
    setSpeedOpen(false);
  };

  const play = () => {
    const s = st.current;
    if (!tracked.current) { tracked.current = true; onWatchTracked?.(); }
    if (s.status === 'playing') return;
    if (speakOpts.current.audioLang && !prefs.current.muted) narrator.unlockAudio();
    if (s.status === 'idle' || s.status === 'ended') start(0);
    else {
      setPlayStatus('playing');
      if (s.sentence < 0) startSentence(0);
      else if (s.done) advance();
      else if (!narrator.resume()) speak(s.chunk);
    }
    // Speech is primed by the first real utterance; audio/muted starts prime it here for later fallbacks.
    if (speakOpts.current.audioLang || prefs.current.muted) unlockSpeech();
    poke(); // controls auto-hide shortly after playback starts
  };

  const pause = () => {
    if (st.current.status !== 'playing') return;
    clearPending();
    if (!narrator.pause()) narrator.stop();
    setPlayStatus('paused');
  };

  const toggle = (feedback = false) => {
    const playing = st.current.status === 'playing';
    if (playing) pause(); else play();
    if (feedback && st.current.status !== 'idle') setFlash({ id: ++timers.current.seq, play: !playing });
  };

  /** Jump from the progress bar, recap or prev/next. */
  const jump = (target: number) => {
    const s = st.current;
    if (s.status === 'idle') { play(); return; }
    if (s.status === 'ended') {
      if (!tracked.current) { tracked.current = true; onWatchTracked?.(); }
      setPlayStatus('playing');
    }
    goTo(target);
  };

  const prev = () => {
    const s = st.current;
    jump(s.sentence >= 1 || s.scene === 0 ? s.scene : s.scene - 1);
  };
  const next = () => {
    const s = st.current;
    if (s.status === 'idle') return;
    if (s.scene + 1 < total) jump(s.scene + 1);
    else finish();
  };

  /** Re-speak the current chunk with new settings (rate / mute). */
  const respeak = () => {
    const s = st.current;
    if (s.status === 'paused') narrator.stop(); // resume will re-speak with the new settings
    else if (s.status === 'playing' && s.sentence >= 0 && !s.done) speak(s.chunk);
  };
  const changeRate = (r: number) => {
    prefs.current.rate = r;
    setRate(r);
    setSpeedOpen(false);
    if (!narrator.setRate(r)) respeak();
  };
  const toggleMute = () => {
    const m = !prefs.current.muted;
    prefs.current.muted = m;
    setMuted(m);
    if (!m) {
      narrator.speechFailures = 0;
      narrator.audioFailures = 0;
      narrator.voiceIdx = 0;
      setVoiceDead(false);
      if (noVoice) showNotice(noVoiceText);
    }
    respeak();
  };

  const toggleFull = () => {
    const el = rootRef.current as FullscreenEl | null;
    if (!el) return;
    if (fullscreenElement()) {
      const d = document as FullscreenDoc;
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      else d.webkitExitFullscreen?.();
      return;
    }
    if (full === 'pseudo') { setFull(''); return; }
    const lockLandscape = () => {
      const o = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
      o?.lock?.('landscape').catch(() => {});
    };
    if (el.requestFullscreen) el.requestFullscreen().then(lockLandscape, () => setFull('pseudo'));
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else setFull('pseudo'); // iPhone: no element fullscreen
  };

  const poke = () => {
    setChrome(true);
    window.clearTimeout(timers.current.hide);
    timers.current.hide = window.setTimeout(() => setChrome(false), 2600);
  };

  const api = useRef({ toggle, prev, next, toggleMute, toggleFull, poke, setCaptions, setSpeedOpen, setFull });
  api.current = { toggle, prev, next, toggleMute, toggleFull, poke, setCaptions, setSpeedOpen, setFull };

  // ── effects ──

  useEffect(() => {
    preloadImage(scenes[0]?.slide.image?.url);
    preloadImage(scenes[1]?.slide.image?.url);
  }, [scenes]);

  useEffect(() => {
    let alive = true;
    getTtsStatus().then(s => { if (alive) setTts(s); });
    return () => { alive = false; };
  }, []);

  // Warm the first chunk so Play starts instantly (the first two sentences for a slow voice).
  useEffect(() => {
    if (!audioLang) return;
    const first = lines[0]?.slice(0, slow ? 2 : 1) ?? [];
    first.forEach((l, i) => (slow ? l.chunks : l.chunks.slice(0, i ? 0 : 1)).forEach(c => prefetchTts(l.text.slice(c.start, c.end), audioLang)));
  }, [audioLang, lines, slow]);

  // Stop speech/audio on unmount / navigation.
  useEffect(() => {
    const s = st.current;
    const t = timers.current;
    const stop = () => narrator.stop();
    window.addEventListener('pagehide', stop);
    return () => {
      window.removeEventListener('pagehide', stop);
      narrator.stop();
      s.timers.forEach(id => window.clearTimeout(id));
      s.timers = [];
      Object.values(t).forEach(id => window.clearTimeout(id));
    };
  }, [narrator]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([e]) => setNarrow(e.contentRect.width < 560));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const on = () => {
      const el = fullscreenElement();
      setFull(f => (el && el === rootRef.current ? 'native' : f === 'native' ? '' : f));
    };
    document.addEventListener('fullscreenchange', on);
    document.addEventListener('webkitfullscreenchange', on);
    return () => {
      document.removeEventListener('fullscreenchange', on);
      document.removeEventListener('webkitfullscreenchange', on);
    };
  }, []);

  // Keyboard: Space/K play-pause, ←/→ scenes, C captions, M mute, F fullscreen.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      const root = rootRef.current;
      if (!root) return;
      const t = e.target instanceof HTMLElement ? e.target : null;
      if (!t || !root.contains(t)) {
        // Page-level shortcuts only when nothing else is focused and the player is on screen.
        if (t && t !== document.body) return;
        const r = root.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
      }
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      const a = api.current;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (k === ' ' || k === 'k') {
        if (k === ' ' && t?.closest('[role="menu"]')) return;
        a.toggle(true);
      } else if (k === 'ArrowLeft') a.prev();
      else if (k === 'ArrowRight') a.next();
      else if (k === 'c') a.setCaptions(v => !v);
      else if (k === 'm') a.toggleMute();
      else if (k === 'f') a.toggleFull();
      else if (k === 'Escape') { a.setSpeedOpen(false); a.setFull(f => (f === 'pseudo' ? '' : f)); return; }
      else return;
      e.preventDefault();
      a.poke();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── derived view ──

  const sc = scenes[scene];
  const reveal = revealOf(scene, sentence);
  const line = sentence >= 0 ? lines[scene]?.[sentence] : undefined;
  const word = line && status !== 'ended' ? wordAtFrac(line, frac) : -1;
  const cue = line ? line.cues.find(c => line.words[word] && line.words[word].start < c.end) ?? line.cues[0] : undefined;
  const elapsed = status === 'ended' ? tl.total
    : (tl.sceneStart[scene] ?? 0) + (line ? (tl.sentStart[scene]?.[sentence] ?? 0) + frac * line.est : 0);
  const sceneFrac = status === 'ended' ? 1 : clamp((elapsed - (tl.sceneStart[scene] ?? 0)) / (tl.sceneDur[scene] || 1), 0, 1);
  const controlsOn = status === 'paused' || ((status === 'playing' || status === 'ended') && (chrome || focusIn || speedOpen));
  const inStageCaptions = captions && !narrow;
  const showCaption = captions && !!line && !!cue && (status === 'playing' || status === 'paused');
  const box = inStageCaptions ? { y: 2.3, k: 0.85 } : narrow ? { y: 2.2, k: 0.956 } : { y: 3, k: 0.94 };

  // Motion scenes play step `beat` while sentence k is spoken; a scene on its way out shows its last step.
  const beatOf = (i: number, sent: number) => {
    const m = scenes[i]?.motion;
    return m ? motionBeat(m, sent, scenes[i].narration.length) : 0;
  };
  const layers = trans && trans.from !== scene && scenes[trans.from]
    ? [{ i: trans.from, role: 'out' as const, reveal: trans.fromReveal, beat: beatOf(trans.from, Infinity) }, { i: scene, role: 'in' as const, reveal, beat: beatOf(scene, sentence) }]
    : [{ i: scene, role: 'still' as const, reveal, beat: beatOf(scene, sentence) }];

  const captionWords = line && cue ? line.words.map((w, k) => ({ w, k })).filter(({ w }) => w.start >= cue.start && w.start < cue.end) : [];
  const captionNode = showCaption && (
    // In the stage the whole box animates per sentence; the text alone fades on later cues.
    <p key={`${scene}-${sentence}-${cue?.start}`} data-caption="" className={`${!inStageCaptions || cue !== line?.cues[0] ? 'xp-cue' : ''} font-medium`}
      lang={lang} style={{ textWrap: 'balance' } as CSSProperties}>
      {captionWords.map(({ w, k }) => (
        <span key={k}>
          <span className={`xp-word ${k === word ? 'xp-word-on' : ''}`}
            style={k === word ? { color: look.word, background: `${look.accent}38` } : { opacity: k < word ? 1 : 0.72 }}>
            {w.text}
          </span>{' '}
        </span>
      ))}
    </p>
  );

  const stageStyle: CSSProperties = { containerType: 'inline-size', background: look.base };
  if (full) stageStyle.width = `min(100%, calc((100dvh - ${captions && narrow ? '5rem' : '0px'}) * 16 / 9))`;

  return (
    <div ref={rootRef} lang="en"
      className={`${full ? 'flex flex-col items-center justify-center bg-black' : 'relative w-full'} ${full === 'pseudo' ? 'fixed inset-0 z-[100]' : ''} ${full === 'native' ? 'w-screen h-screen' : ''}`}>
      <div ref={stageRef} tabIndex={0} role="region" aria-roledescription="video player"
        aria-label={`${content.title} — explainer video. Space to play or pause, arrow keys for scenes.`}
        className={`group/stage relative w-full aspect-video overflow-hidden select-none outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-saffron ${full ? '' : 'rounded-2xl shadow-[0_20px_60px_-20px_rgba(26,26,46,0.45)]'} ${status === 'playing' && !controlsOn ? 'cursor-none' : ''}`}
        style={stageStyle}
        onPointerDown={e => { pointer.current = e.pointerType; }}
        // Mouse clicks don't move focus into the player (no stray focus rings on the next key press);
        // keyboard users Tab in as usual and shortcuts work from the page.
        onMouseDown={e => { if (!(e.target as HTMLElement).closest('[role="menu"]')) e.preventDefault(); }}
        onPointerMove={e => { if (e.pointerType === 'mouse') poke(); }}
        onMouseLeave={() => { if (st.current.status === 'playing') setChrome(false); }}
        onClick={e => {
          if ((e.target as HTMLElement).closest('button, [role="menu"]')) return;
          if (status === 'idle') { play(); return; }
          if (status === 'ended') return;
          if (pointer.current === 'mouse') toggle(true);
          else if (controlsOn && status === 'playing') setChrome(false);
          else poke();
        }}>
        <Backdrop look={look} scene={scene} still={reduced} />

        {/* scene layers */}
        <div aria-hidden={status === 'idle'} className="absolute inset-0 origin-top transition-transform duration-500 ease-out"
          style={{ transform: `translate3d(0, ${box.y}%, 0) scale(${box.k})` }}>
          <div className={`absolute inset-0 ${status === 'idle' ? 'opacity-0' : intro ? 'xp-intro' : ''}`}>
            {layers.map(l => (
              <SceneLayer key={l.i} scene={scenes[l.i]} theme={content.theme} reveal={l.reveal} beat={l.beat} shadow={look.shadow}
                anim={l.role === 'still' || !trans ? '' : `xp-${trans.kind}-${l.role}`} dir={trans?.dir ?? 1} ms={trans?.ms ?? 0}
                z={l.role === 'still' ? 1 : (l.role === 'out') === (trans?.kind === 'zoom') ? 2 : 1} />
            ))}
          </div>
        </div>

        {/* captions inside the stage (wide players) */}
        {inStageCaptions && (
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center px-[5%] transition-transform duration-300 ease-out"
            style={{ paddingBottom: '1.6%', transform: controlsOn ? 'translate3d(0, -4.4rem, 0)' : 'none' }}>
            {showCaption && (
              <div key={`${scene}-${sentence}`} className="xp-cue-box max-w-full rounded-[0.9em] bg-[#0B0B16]/80 text-white text-center backdrop-blur-md shadow-lg"
                style={{ fontSize: 'clamp(13px, 1.85cqw, 34px)', lineHeight: 1.42, padding: '0.38em 0.95em 0.42em' }}>
                {captionNode}
              </div>
            )}
          </div>
        )}

        {(status === 'idle' || intro) && (
          <TitleCard content={content} look={look} duration={duration} leaving={intro} narrow={narrow} onPlay={play}
            note={noVoice ? `🔇 ${content.language} narration voice unavailable here — captions only` : ''} />
        )}

        {status === 'paused' && (
          <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
            <button type="button" onClick={play} aria-label="Resume"
              className="xp-pop-in pointer-events-auto flex items-center justify-center rounded-full text-white transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/80"
              style={{ width: 'clamp(52px, 8cqw, 96px)', height: 'clamp(52px, 8cqw, 96px)', background: look.accent, boxShadow: `0 10px 40px ${look.glow}` }}>
              <Play className="w-[42%] h-[42%] fill-white translate-x-[6%]" />
            </button>
          </div>
        )}

        {status === 'ended' && <EndScreen content={content} look={look} narrow={narrow} onReplay={() => start(0)} onJump={jump} />}

        {flash && status !== 'paused' && (
          <div key={flash.id} aria-hidden className="xp-flash pointer-events-none absolute left-1/2 top-1/2 z-30 flex items-center justify-center rounded-full bg-black/45 text-white"
            style={{ width: 'clamp(48px, 7cqw, 84px)', height: 'clamp(48px, 7cqw, 84px)', marginLeft: 'calc(clamp(48px, 7cqw, 84px) / -2)', marginTop: 'calc(clamp(48px, 7cqw, 84px) / -2)' }}>
            {flash.play ? <Play className="w-[40%] h-[40%] fill-white translate-x-[6%]" /> : <Pause className="w-[40%] h-[40%] fill-white" />}
          </div>
        )}

        {notice && status !== 'idle' && (
          <div className="pointer-events-none absolute inset-x-0 top-2.5 z-40 flex justify-center px-3">
            <p role="status" className="xp-pop-in max-w-[min(100%,36rem)] rounded-2xl bg-black/80 px-3.5 py-1.5 text-center text-[11px] sm:text-sm leading-snug text-white backdrop-blur">
              {notice}
            </p>
          </div>
        )}

        {/* controls */}
        {status !== 'idle' && (
          <div
            className={`absolute inset-x-0 bottom-0 z-30 transition-all duration-300 ease-out ${controlsOn ? 'opacity-100' : 'opacity-0 translate-y-2 pointer-events-none'}`}
            onFocus={e => { if (e.target.matches(':focus-visible')) { setFocusIn(true); poke(); } }}
            onBlur={() => setFocusIn(false)}>
            <div aria-hidden className={`pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent ${narrow ? 'h-[150%]' : 'h-[160%]'}`} />
            <div className="relative px-2.5 sm:px-4 pb-1.5 sm:pb-2 pt-4">
              <Segments content={content} tl={tl} scene={scene} sceneFrac={sceneFrac} done={status === 'ended'} accent={look.accent} onJump={jump} />
              <div className="mt-0.5 flex items-center gap-0.5 sm:gap-1 text-white">
                <IconButton label={status === 'playing' ? 'Pause (k)' : 'Play (k)'} onClick={() => toggle()}>
                  {status === 'playing' ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white translate-x-px" />}
                </IconButton>
                <IconButton label={sentence >= 1 || scene === 0 ? 'Restart scene (←)' : 'Previous scene (←)'} onClick={prev}>
                  <SkipBack className="w-[18px] h-[18px] fill-white" />
                </IconButton>
                <IconButton label="Next scene (→)" onClick={next} disabled={status === 'ended'}>
                  <SkipForward className="w-[18px] h-[18px] fill-white" />
                </IconButton>
                <span className="ml-1 sm:ml-2 text-xs sm:text-sm tabular-nums text-white/90 whitespace-nowrap">
                  {fmt(Math.min(elapsed, tl.total))}<span className="text-white/55"> / {fmt(duration)}</span>
                </span>
                {!narrow && sc && (
                  <span className="ml-3 min-w-0 truncate text-sm text-white/75">
                    <span className="text-white/50 tabular-nums">{scene + 1}/{total}</span> · {sc.slide.title}
                  </span>
                )}
                <div className="flex-1" />
                <SpeedMenu rate={rate} open={speedOpen} setOpen={setSpeedOpen} onPick={changeRate} voice={voiceLabel} />
                <IconButton label={captions ? 'Turn captions off (c)' : 'Turn captions on (c)'} pressed={captions} onClick={() => setCaptions(v => !v)}>
                  {captions ? <Captions className="w-5 h-5" /> : <CaptionsOff className="w-5 h-5 opacity-80" />}
                </IconButton>
                <IconButton label={muted ? 'Unmute narration (m)' : 'Mute narration (m)'} pressed={muted} onClick={toggleMute}>
                  {muted || noVoice ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </IconButton>
                <IconButton label={full ? 'Exit full screen (f)' : 'Full screen (f)'} onClick={toggleFull}>
                  {full ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </IconButton>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* captions below the stage on phones */}
      {captions && narrow && (status === 'playing' || status === 'paused') && (
        <div aria-hidden className={`w-full flex items-center justify-center bg-[#0B0B16] text-white text-center px-4 py-2.5 min-h-[4.75rem] text-[15px] leading-snug ${full ? '' : 'rounded-b-2xl -mt-3 pt-5'}`}>
          {showCaption ? captionNode : <span aria-hidden className="text-white/40 text-sm">…</span>}
        </div>
      )}

      <p className="sr-only" aria-live="polite" lang={lang}>{captions && line && status !== 'ended' ? line.text : ''}</p>
    </div>
  );
}

// ── Stage pieces ────────────────────────────────────────────────────

/** Theme-tinted gradient blobs that drift slowly and shift a little with each scene (parallax). */
const Backdrop = memo(function Backdrop({ look, scene, still }: { look: Look; scene: number; still: boolean }) {
  const x = still ? 0 : Math.sin(scene * 1.7) * 5;
  const y = still ? 0 : Math.cos(scene * 1.1) * 3;
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      <div className="xp-parallax absolute -inset-[12%]" style={{ transform: `translate3d(${x}%, ${y}%, 0)` }}>
        {look.blobs.map((color, k) => (
          <div key={k} className={`xp-blob xp-blob-${k}`}
            style={{ background: `radial-gradient(closest-side, ${color}, transparent)`,
              width: ['62%', '55%', '48%'][k], aspectRatio: '1', left: ['-4%', '50%', '22%'][k], top: ['-10%', '30%', '52%'][k] }} />
        ))}
      </div>
    </div>
  );
});

const SceneLayer = memo(function SceneLayer({ scene, theme, reveal, beat, anim, dir, ms, z, shadow }: {
  scene: ExplainerContent['scenes'][number]; theme: SlideTheme; reveal: number; beat: number; anim: string; dir: 1 | -1; ms: number; z: number; shadow: string;
}) {
  return (
    <div className={`absolute inset-0 ${anim}`}
      style={{ zIndex: z, borderRadius: '1.4cqw', boxShadow: shadow, ['--xp-dir' as string]: dir, animationDuration: anim ? `${ms}ms` : undefined }}>
      <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: '1.4cqw' }}>
        {scene.motion
          ? <MotionSlide slide={scene.slide} motion={scene.motion} theme={theme} beat={beat} />
          : <SlideView slide={scene.slide} theme={theme} reveal={reveal} animate />}
      </div>
    </div>
  );
});

const TitleCard = memo(function TitleCard({ content, look, duration, leaving, narrow, note, onPlay }: {
  content: ExplainerContent; look: Look; duration: number; leaving: boolean; narrow: boolean; note: string; onPlay: () => void;
}) {
  const previews = content.scenes.filter(s => s.slide.layout !== 'title').filter(s => s.slide.image || s.slide.diagram).slice(0, 2);
  const lang = LANGUAGES.find(l => l.name === content.language);
  const textLang = voiceLangs(content.language, content.title)[0];
  return (
    <div className={`absolute inset-0 z-20 ${leaving ? 'xp-title-out pointer-events-none' : ''}`}>
      {!narrow && previews.map((s, k) => (
        <div key={k} aria-hidden className={`absolute xp-float-${k}`}
          style={{ width: '31%', left: k ? undefined : '-5%', right: k ? '-5%' : undefined, top: k ? undefined : '9%', bottom: k ? '9%' : undefined,
            ['--xp-tilt' as string]: k ? '7deg' : '-8deg', borderRadius: '1.2cqw', overflow: 'hidden', boxShadow: look.shadow, opacity: 0.92 }}>
          <SlideView slide={s.slide} theme={content.theme} />
        </div>
      ))}
      <div className="xp-stagger absolute inset-0 flex flex-col items-center justify-center text-center" style={{ padding: narrow ? '6% 7%' : '4% 24%', color: look.ink }}>
        <span className="inline-flex items-center gap-1.5 rounded-full font-semibold uppercase tracking-wider"
          style={{ fontSize: 'clamp(10px, 1.15cqw, 15px)', padding: '0.35em 0.95em', color: look.accent, background: `${look.accent}1F` }}>
          <Play className="w-[1em] h-[1em] fill-current" /> Explainer{content.grade ? ` · Class ${content.grade}` : ''}
        </span>
        <h2 className="font-heading font-extrabold" lang={textLang}
          style={{ fontSize: `clamp(18px, ${content.title.length > 44 ? 3.6 : 4.4}cqw, 64px)`, lineHeight: 1.22, marginTop: '0.55em', textWrap: 'balance' } as CSSProperties}>
          {content.title}
        </h2>
        <p className="flex flex-wrap items-center justify-center gap-x-[0.9em] gap-y-1" style={{ fontSize: 'clamp(11px, 1.45cqw, 20px)', color: look.sub, marginTop: '0.8em' }}>
          <span>{content.scenes.length} scenes</span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1"><Clock className="w-[1em] h-[1em]" /> {fmt(duration)}</span>
          {lang && <><span aria-hidden>·</span><span>{lang.native === lang.name ? lang.name : `${lang.native} · ${lang.name}`}</span></>}
        </p>
        <button type="button" onClick={e => { e.stopPropagation(); onPlay(); }} aria-label={`Play explainer: ${content.title}`}
          className="group relative mt-[4.5cqw] flex items-center justify-center rounded-full text-white transition-transform duration-300 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2"
          style={{ width: 'clamp(56px, 9.5cqw, 120px)', height: 'clamp(56px, 9.5cqw, 120px)', background: look.accent, boxShadow: `0 12px 44px ${look.glow}`, ['--tw-ring-color' as string]: look.accent }}>
          <span aria-hidden className="xp-ring absolute inset-0 rounded-full" style={{ background: look.accent }} />
          <Play className="relative w-[40%] h-[40%] fill-white translate-x-[6%]" />
        </button>
        {note && (
          <p className="rounded-full" style={{ fontSize: 'clamp(10px, 1.2cqw, 16px)', marginTop: '2.4cqw', padding: '0.35em 1em', color: look.sub, background: `${look.ink}0F` }}>{note}</p>
        )}
      </div>
    </div>
  );
});

function EndScreen({ content, look, narrow, onReplay, onJump }: {
  content: ExplainerContent; look: Look; narrow: boolean; onReplay: () => void; onJump: (i: number) => void;
}) {
  const n = content.scenes.length;
  const cols = narrow ? 1 : n > 10 ? 3 : 2;
  const size = n <= 8 ? 1.8 : n <= 12 ? 1.6 : 1.4;
  const textLang = voiceLangs(content.language, content.title)[0];
  return (
    <div className="xp-end-in absolute inset-0 z-30 flex backdrop-blur-xl" style={{ background: look.scrim, color: look.ink }}>
      <div className="m-auto flex max-h-full w-full flex-col overflow-hidden" style={{ padding: narrow ? '4% 5% 3%' : '3.5% 7% 5%' }}>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold uppercase tracking-wider" style={{ fontSize: 'clamp(10px, 1.1cqw, 15px)', color: look.accent }}>✓ Recap</p>
            <h3 className="font-heading font-extrabold truncate" lang={textLang} style={{ fontSize: 'clamp(15px, 2.6cqw, 40px)', lineHeight: 1.3 }}>{content.title}</h3>
          </div>
          <button type="button" onClick={onReplay}
            className="shrink-0 inline-flex items-center gap-2 rounded-full font-heading font-semibold text-white transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2"
            style={{ background: look.accent, fontSize: 'clamp(12px, 1.5cqw, 20px)', padding: '0.6em 1.25em', boxShadow: `0 8px 28px ${look.glow}`, ['--tw-ring-color' as string]: look.accent }}>
            <RotateCcw className="w-[1.1em] h-[1.1em]" /> Replay
          </button>
        </div>
        <ol className="mt-[2cqw] grid min-h-0 overflow-y-auto pr-1" lang={textLang}
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: narrow ? '4px' : '0.8cqw 1.4cqw' }}>
          {content.scenes.map((s, i) => (
            <li key={i} className="xp-recap-item min-w-0" style={{ animationDelay: `${Math.min(i, 14) * 45}ms` }}>
              <button type="button" onClick={() => onJump(i)} aria-label={`Watch scene ${i + 1}: ${s.slide.title}`}
                className="flex w-full min-w-0 items-center gap-[0.6em] rounded-[0.7em] text-left transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2"
                style={{ fontSize: `clamp(12px, ${size}cqw, 24px)`, padding: '0.35em 0.5em', ['--tw-ring-color' as string]: look.accent }}>
                <span className="shrink-0 flex items-center justify-center rounded-full font-heading font-bold tabular-nums"
                  style={{ width: '1.75em', height: '1.75em', fontSize: '0.82em', background: `${look.accent}24`, color: look.accent }}>{i + 1}</span>
                {s.slide.emoji && <span aria-hidden className="shrink-0" style={{ fontFamily: EMOJI_FONT }}>{s.slide.emoji}</span>}
                <span className="truncate font-medium">{s.slide.title}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

// ── Controls ────────────────────────────────────────────────────────

function IconButton({ label, onClick, children, pressed, disabled }: {
  label: string; onClick: () => void; children: ReactNode; pressed?: boolean; disabled?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} aria-pressed={pressed} disabled={disabled}
      className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white transition-colors hover:bg-white/15 active:bg-white/25 disabled:opacity-35 disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
      {children}
    </button>
  );
}

function Segments({ content, tl, scene, sceneFrac, done, accent, onJump }: {
  content: ExplainerContent; tl: Timeline; scene: number; sceneFrac: number; done: boolean; accent: string; onJump: (i: number) => void;
}) {
  const n = content.scenes.length;
  return (
    <div role="group" aria-label="Scenes" className="group/bar flex items-center gap-[3px] h-5">
      {content.scenes.map((s, i) => {
        const fill = done || i < scene ? 1 : i > scene ? 0 : sceneFrac;
        const align = i < n * 0.25 ? 'left-0' : i >= n * 0.75 ? 'right-0' : 'left-1/2 -translate-x-1/2';
        return (
          <button key={i} type="button" onClick={() => onJump(i)} aria-label={`Scene ${i + 1} of ${n}: ${s.slide.title}`}
            aria-current={i === scene ? 'step' : undefined}
            className="group/seg relative h-full min-w-[6px] flex items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            style={{ flexGrow: tl.sceneDur[i] || 1, flexBasis: 0 }}>
            <span className={`relative w-full overflow-hidden rounded-full bg-white/30 transition-[height] duration-200 ${i === scene ? 'h-[5px]' : 'h-[3px]'} group-hover/bar:h-[6px]`}>
              <span className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-150 ease-linear" style={{ width: `${fill * 100}%`, background: accent }} />
            </span>
            <span className={`pointer-events-none absolute bottom-full mb-1.5 ${align} max-w-[16rem] truncate whitespace-nowrap rounded-lg bg-black/85 px-2.5 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/seg:opacity-100`}>
              <span className="tabular-nums text-white/60">{i + 1}</span> {s.slide.emoji && <span style={{ fontFamily: EMOJI_FONT }}>{s.slide.emoji}</span>} {s.slide.title}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SpeedMenu({ rate, open, setOpen, onPick, voice }: {
  rate: number; open: boolean; setOpen: (v: boolean) => void; onPick: (r: number) => void; voice: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    ref.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus({ preventScroll: true });
    const close = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open, setOpen]);
  return (
    <div ref={ref} className="relative shrink-0">
      <button type="button" onClick={() => setOpen(!open)} aria-haspopup="menu" aria-expanded={open} aria-label={`Playback speed: ${rate}×`} title="Playback speed"
        className="h-9 sm:h-10 min-w-[2.75rem] px-2 rounded-full text-sm font-semibold tabular-nums text-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
        {rate}×
      </button>
      {open && (
        <div role="menu" aria-label="Playback speed" className="xp-pop-in absolute bottom-full right-0 mb-2 w-[12.5rem] rounded-xl bg-[#14142A]/95 p-1 text-white shadow-2xl ring-1 ring-white/10 backdrop-blur"
          onKeyDown={e => {
            const items = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]'));
            const at = items.indexOf(document.activeElement as HTMLButtonElement);
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              e.preventDefault();
              e.stopPropagation();
              items[(at + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length]?.focus();
            } else if (e.key === 'Escape') setOpen(false);
          }}>
          <p className="px-3 pt-1.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-white/45">Speed</p>
          {RATES.map(r => (
            <button key={r} type="button" role="menuitemradio" aria-checked={r === rate} onClick={() => onPick(r)}
              className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-1.5 text-sm tabular-nums transition-colors focus-visible:outline-none focus-visible:bg-white/15 hover:bg-white/10 ${r === rate ? 'font-semibold' : 'text-white/85'}`}>
              <span>{r}×{r === 1 && <span className="ml-1.5 text-white/55 font-normal">Normal</span>}</span>
              {r === rate && <Check className="w-4 h-4" />}
            </button>
          ))}
          <p data-voice className="mt-1 border-t border-white/10 px-3 pt-1.5 pb-1 text-[11px] leading-snug text-white/50 break-words">Voice: {voice}</p>
        </div>
      )}
    </div>
  );
}
