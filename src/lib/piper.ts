// Free, unlimited narration on this server's CPU: Piper neural voices
// (github.com/rhasspy/piper, voices from huggingface.co/rhasspy/piper-voices)
// run with onnxruntime-node; text → phonemes with espeak-ng compiled to WASM
// (@diffusionstudio/piper-wasm). A voice model (60–115 MB) is downloaded on first
// use into the temp dir and stays loaded while the server is warm; a sentence
// takes well under a second. Output is MP3 (lamejs, 48 kbps mono).
//
// Voices were checked by transcribing samples with Whisper; pitch decided the
// speaker of multi-speaker models. Several are trained on datasets licensed for
// non-commercial use (e.g. hi_IN priyamvada: CC BY-NC-SA) — review before a
// commercial launch.

import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Mp3Encoder } from '@breezystack/lamejs';
import type { InferenceSession, Tensor } from 'onnxruntime-node';
import type { SpokenAudio, VoiceGender } from './tts';

// Pinned revision so a model never changes under a cached file.
const REVISION = '5041a7a49ae5b3a0f30e6837769eb03fdbb231bd';
const BASE = process.env.PIPER_VOICES_URL || `https://huggingface.co/rhasspy/piper-voices/resolve/${REVISION}`;
const MODELS_DIR = process.env.PIPER_MODELS_DIR || path.join(os.tmpdir(), 'vidya-piper', REVISION.slice(0, 8));
const MAX_LOADED = Number(process.env.PIPER_MAX_VOICES) || 3;
const LENGTH_SCALE = 1.08;  // a touch slower than the voices' default, for students
const SENTENCE_PAUSE_S = 0.28;
const MP3_KBPS = 48;
const FAILURE_COOLDOWN_MS = 5 * 60 * 1000;

interface PiperVoice { file: string; speaker?: number }

const v = (lang: string, name: string, quality = 'medium', speaker?: number): PiperVoice => {
  const [family] = lang.split('_');
  return { file: `${family}/${lang}/${name}/${quality}/${lang}-${name}-${quality}`, speaker };
};

/** Voice per locale, [female, male]. */
const VOICES: Record<string, Record<VoiceGender, PiperVoice>> = {
  'hi-IN': { female: v('hi_IN', 'priyamvada'), male: v('hi_IN', 'rohan') },
  'te-IN': { female: v('te_IN', 'padmavathi'), male: v('te_IN', 'venkatesh') },
  'ml-IN': { female: v('ml_IN', 'meera'), male: v('ml_IN', 'arjun') },
  'mr-IN': { female: v('mr_IN', 'google', 'medium', 5), male: v('mr_IN', 'google', 'medium', 1) },
  'bn-IN': { female: v('bn_BD', 'google', 'medium', 15), male: v('bn_BD', 'google', 'medium', 0) },
  'ne-NP': { female: v('ne_NP', 'google', 'medium', 2), male: v('ne_NP', 'google', 'medium', 2) },
  'ur-IN': { female: v('ur_PK', 'aegis_female'), male: v('ur_PK', 'fasih') },
  'en-IN': { female: v('en_GB', 'cori', 'high'), male: v('en_GB', 'alan') },
};

export const PIPER_LOCALES = Object.keys(VOICES);

/** Script of each voice's language — a voice only reads text in its own script. */
const SCRIPT: Record<string, RegExp> = {
  'hi-IN': /[ऀ-ॿ]/, 'mr-IN': /[ऀ-ॿ]/, 'ne-NP': /[ऀ-ॿ]/,
  'bn-IN': /[ঀ-৿]/, 'te-IN': /[ఀ-౿]/, 'ml-IN': /[ഀ-ൿ]/,
  'ur-IN': /[؀-ۿ]/, 'en-IN': /[A-Za-z]/,
};

/** The locale whose voice reads `text`: the requested one if the script matches, else one for the script. */
function voiceLocale(locale: string, text: string): string | null {
  const chars = Array.from(text);
  const count = (re: RegExp) => chars.filter(ch => re.test(ch)).length;
  let best: string | null = null, most = 0;
  for (const [l, re] of Object.entries(SCRIPT)) {
    const n = count(re);
    if (n > most || (n === most && n > 0 && l === locale)) { most = n; best = l; }
  }
  if (!best) return null;
  return SCRIPT[locale] && count(SCRIPT[locale]) === most ? locale : best;
}

// ── Runtime (loaded lazily; a failure disables Piper for a while) ───

// Node's own require, untouched by webpack (both packages are server externals).
declare const __non_webpack_require__: NodeRequire | undefined;
const nodeRequire: NodeRequire = typeof __non_webpack_require__ === 'function'
  ? __non_webpack_require__
  : createRequire(path.join(process.cwd(), 'package.json'));
type Ort = typeof import('onnxruntime-node');
let ort: Ort | null = null;
let disabledUntil = 0;  // the runtime itself failed to load
const voiceDownUntil = new Map<string, number>();  // a model failed to download/load

export const piperReady = () => process.env.PIPER_TTS !== 'off' && Date.now() >= disabledUntil;

function loadRuntime(): Ort {
  try {
    ort ??= nodeRequire('onnxruntime-node') as Ort;
    return ort;
  } catch (err) {
    disabledUntil = Date.now() + FAILURE_COOLDOWN_MS;
    throw err;
  }
}

interface Phonemizer { phonemes(voice: string, text: string): string[] }
let phonemizer: Promise<Phonemizer> | null = null;

/** One espeak-ng instance, reused: callMain is synchronous and prints one JSON line per call. */
function getPhonemizer(): Promise<Phonemizer> {
  phonemizer ??= (async () => {
    const js = nodeRequire.resolve('@diffusionstudio/piper-wasm/build/piper_phonemize.js');
    const dir = path.dirname(js);
    const create = nodeRequire(js) as (m: Record<string, unknown>) => Promise<{ callMain(args: string[]): void }>;
    let out: string[] = [];
    const mod = await create({
      print: (line: string) => out.push(line),
      printErr: () => {},
      locateFile: (f: string) => path.join(dir, f),
    });
    return {
      phonemes(voice, text) {
        out = [];
        mod.callMain(['-l', voice, '--input', JSON.stringify([{ text }]), '--espeak_data', '/espeak-ng-data']);
        return out.flatMap(l => (JSON.parse(l).phonemes as string[]) ?? []);
      },
    };
  })();
  phonemizer.catch(() => { phonemizer = null; disabledUntil = Date.now() + FAILURE_COOLDOWN_MS; });
  return phonemizer;
}

interface VoiceConfig {
  audio: { sample_rate: number };
  espeak: { voice: string };
  inference: { noise_scale: number; length_scale: number; noise_w: number };
  num_speakers: number;
  phoneme_id_map: Record<string, number[]>;
}
interface Loaded { session: InferenceSession; config: VoiceConfig; usedAt: number }

const loaded = new Map<string, Promise<Loaded>>();
const downloads = new Map<string, Promise<string>>();

/** Local path of a voice file, downloading it once (to *.part, then renamed). */
function voiceFile(name: string): Promise<string> {
  const dest = path.join(MODELS_DIR, path.basename(name));
  if (fs.existsSync(dest)) return Promise.resolve(dest);
  let p = downloads.get(dest);
  if (!p) {
    p = (async () => {
      const res = await fetch(`${BASE}/${name}`, { signal: AbortSignal.timeout(90_000) });
      if (!res.ok) throw new Error(`voice download ${path.basename(name)} → HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      await fs.promises.mkdir(MODELS_DIR, { recursive: true });
      const part = `${dest}.${process.pid}.part`;
      await fs.promises.writeFile(part, buf);
      await fs.promises.rename(part, dest);
      return dest;
    })().finally(() => downloads.delete(dest));
    downloads.set(dest, p);
  }
  return p;
}

async function evictIfFull() {
  if (loaded.size < MAX_LOADED) return;
  const entries = await Promise.all(Array.from(loaded, async ([k, p]) => [k, await p.catch(() => null)] as const));
  const [key, oldest] = entries.filter(([, l]) => l).sort((a, b) => a[1]!.usedAt - b[1]!.usedAt)[0] ?? [];
  if (!key || !oldest) return;
  loaded.delete(key);
  await oldest.session.release().catch(() => {});
}

function loadVoice(file: string): Promise<Loaded> {
  let p = loaded.get(file);
  if (!p) {
    p = (async () => {
      await evictIfFull();
      const runtime = loadRuntime();
      const [model, json] = await Promise.all([voiceFile(`${file}.onnx`), voiceFile(`${file}.onnx.json`)]);
      const config = JSON.parse(await fs.promises.readFile(json, 'utf8')) as VoiceConfig;
      const session = await runtime.InferenceSession.create(model, { graphOptimizationLevel: 'all' });
      return { session, config, usedAt: Date.now() };
    })();
    p.catch(() => loaded.delete(file));
    loaded.set(file, p);
  }
  return p;
}

// ── Synthesis ───────────────────────────────────────────────────────

/** Sentences, so each gets the model's own sentence intonation and a short pause after it. */
const sentences = (text: string) =>
  text.split(/(?<=[.!?।॥؟])\s+/).map(s => s.trim()).filter(s => s.replace(/[\s.,!?;:'"“”‘’()[\]\-–—।॥؟…]/g, '').length > 0);

function phonemeIds(map: Record<string, number[]>, phonemes: string[]): number[] {
  const pad = map._ ?? [0];
  const ids = [...(map['^'] ?? [1]), ...pad];
  for (const p of phonemes) {
    const id = map[p];
    if (id) ids.push(...id, ...pad);
  }
  ids.push(...(map.$ ?? [2]));
  return ids;
}

function toMp3(pcm: Float32Array, sampleRate: number): Buffer {
  const enc = new Mp3Encoder(1, sampleRate, MP3_KBPS);
  const parts: Buffer[] = [];
  const keep = (b: Int8Array | Uint8Array) => { if (b.length) parts.push(Buffer.from(b.buffer, b.byteOffset, b.length)); };
  const block = 1152 * 16;
  const s16 = new Int16Array(block);
  for (let i = 0; i < pcm.length; i += block) {
    const n = Math.min(block, pcm.length - i);
    for (let j = 0; j < n; j++) {
      const x = pcm[i + j];
      s16[j] = x >= 1 ? 32767 : x <= -1 ? -32768 : Math.round(x * 32767);
    }
    keep(enc.encodeBuffer(n === block ? s16 : s16.subarray(0, n)));
  }
  keep(enc.flush());
  return Buffer.concat(parts);
}

/**
 * MP3 narration of `text` by a Piper voice, or null when no voice fits. By
 * default only locales that have their own voice are taken (the text's script
 * still picks the voice: Devanagari Kashmiri → Hindi); `anyScript` also reads
 * other languages with a voice for their script (Assamese → Bengali), as a last
 * resort. Throws when the runtime or the model can't be loaded (that voice is
 * then skipped for a few minutes).
 */
export async function piperSpeak(text: string, locale: string, gender: VoiceGender, anyScript = false): Promise<SpokenAudio | null> {
  if (!anyScript && !VOICES[locale]) return null;
  const target = voiceLocale(locale, text);
  const voice = target ? VOICES[target]?.[gender] : null;
  if (!target || !voice || Date.now() < (voiceDownUntil.get(voice.file) ?? 0)) return null;
  try {
    const [{ session, config }, espeak] = await Promise.all([loadVoice(voice.file), getPhonemizer()]);
    const runtime = loadRuntime();
    const sr = config.audio.sample_rate;
    const pcm: Float32Array[] = [];
    for (const s of sentences(text)) {
      const ids = phonemeIds(config.phoneme_id_map, espeak.phonemes(config.espeak.voice, s));
      if (ids.length < 4) continue;
      const feeds: Record<string, Tensor> = {
        input: new runtime.Tensor('int64', BigInt64Array.from(ids, BigInt), [1, ids.length]),
        input_lengths: new runtime.Tensor('int64', BigInt64Array.from([BigInt(ids.length)]), [1]),
        scales: new runtime.Tensor('float32', Float32Array.from([
          config.inference.noise_scale, config.inference.length_scale * LENGTH_SCALE, config.inference.noise_w,
        ]), [3]),
      };
      if (config.num_speakers > 1) feeds.sid = new runtime.Tensor('int64', BigInt64Array.from([BigInt(voice.speaker ?? 0)]), [1]);
      const out = await session.run(feeds);
      pcm.push(out.output.data as Float32Array, new Float32Array(Math.round(sr * SENTENCE_PAUSE_S)));
    }
    const l = loaded.get(voice.file);
    l?.then(x => { x.usedAt = Date.now(); }).catch(() => {});
    if (!pcm.length) return null;
    pcm.pop(); // no pause after the last sentence
    const all = new Float32Array(pcm.reduce((n, a) => n + a.length, 0));
    pcm.reduce((at, a) => { all.set(a, at); return at + a.length; }, 0);
    const mp3 = toMp3(all, sr);
    const name = path.basename(voice.file) + (voice.speaker !== undefined ? `#${voice.speaker}` : '');
    return { audio: mp3.buffer.slice(mp3.byteOffset, mp3.byteOffset + mp3.byteLength) as ArrayBuffer, contentType: 'audio/mpeg', voice: `piper:${name}` };
  } catch (err) {
    voiceDownUntil.set(voice.file, Date.now() + FAILURE_COOLDOWN_MS);
    throw new Error(`Piper TTS: ${(err as Error).message}`);
  }
}
