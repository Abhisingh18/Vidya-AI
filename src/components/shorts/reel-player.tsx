'use client';

// One reel of the Shorts feed: full-bleed photos with a slow Ken Burns move (or a
// diagram on a blurred backdrop), a kinetic headline, an animated overlay, and one
// narrated line per scene with a word-by-word caption.
//
// Voice, per scene: the server voice (/api/tts — free Piper voices even when signed
// out), else the browser's voice for the language, else a silent timer with
// captions. One <audio> element is shared by the whole feed and unlocked on the
// first tap, so later reels can start with sound on their own.

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { Globe, Play, Sparkles, Volume2, VolumeX } from 'lucide-react';
import type { Reel, ReelScene } from '@/lib/reels';
import { getAmbientMusic } from '@/lib/ambient-music';
import { estimateSeconds } from '@/lib/explainer';
import {
  getSynth, getTtsStatus, langCode, pickVoices, prefetchTts, SILENT_WAV, ttsCache, ttsUrl, unlockSpeech, voiceLangs,
  type TtsStatus,
} from '@/components/explainer-player';
import ReelOverlayView, { FULL_FRAME_OVERLAYS } from './reel-overlay';
import { MotionStage } from '@/components/motion/motion-stage';
import { slidePalette } from '@/components/teacher/slide-diagram';
import { motionSteps, type SceneMotion } from '@/lib/motion';

export interface ReelLines { title: string; scenes: { headline: string; say: string }[] }

/** A reel's text in `language`: written in English and Hindi; other languages come translated. */
export function linesFor(reel: Reel, language: string, translated?: ReelLines | null): ReelLines {
  if (translated) return translated;
  const k = language === 'Hindi' ? 'hi' : 'en';
  return { title: reel.title[k], scenes: reel.scenes.map(s => ({ headline: s.headline[k], say: s.say[k] })) };
}

export const ACCENTS: Record<Reel['accent'], { hex: string; glow: string; grad: string }> = {
  saffron: { hex: '#FFB067', glow: '#FF6B2C', grad: 'linear-gradient(160deg, #2A1206 0%, #7A2E12 55%, #FF6B2C 130%)' },
  indigo: { hex: '#A5B4FC', glow: '#4F46E5', grad: 'linear-gradient(160deg, #0B0B1F 0%, #1E1C6B 55%, #3D3BDB 130%)' },
  teal: { hex: '#6EE7B7', glow: '#0F9E75', grad: 'linear-gradient(160deg, #04140F 0%, #0A5C44 55%, #0F9E75 130%)' },
};

/** Dark palette for motion scenes on the reel's dark backdrop. */
const REEL_PALETTE = { ...slidePalette('midnight'), bg: '#0B0B16', surface: '#1B1B30' };

const HEADLINE_FONT = '"Baloo 2", "Plus Jakarta Sans", "Noto Sans Devanagari", sans-serif';
const SCENE_HOLD_MS = 550;
const ENTRANCES = ['reel-in-zoom', 'reel-in-up', 'reel-in-left'];

// ── shared audio ────────────────────────────────────────────────────

let audioEl: HTMLAudioElement | null = null;
const sharedAudio = () => {
  if (!audioEl) { audioEl = new Audio(); audioEl.preload = 'auto'; }
  return audioEl;
};
let unlocked = false;

/** Call from a tap: lets this and later reels play sound (autoplay rules, iOS). */
export function unlockReelAudio() {
  if (unlocked) return;
  unlocked = true;
  const a = sharedAudio();
  if (SILENT_WAV) { a.src = SILENT_WAV; a.play()?.catch(() => {}); }
  unlockSpeech();
}

type Tier = 'audio' | 'speech' | 'timer';

/** Plays one scene's line: server audio → browser voice → timer, reporting progress (0–1). */
class SceneVoice {
  private gen = 0;
  private ticker = 0;
  private timers: number[] = [];
  private utterance: SpeechSynthesisUtterance | null = null;
  tier: Tier = 'timer';

  stop() {
    this.gen++;
    window.clearInterval(this.ticker);
    this.timers.forEach(t => window.clearTimeout(t));
    this.timers = [];
    const synth = getSynth();
    if (this.utterance && synth) synth.cancel();
    this.utterance = null;
    if (audioEl && !audioEl.paused) audioEl.pause();
  }

  async play(text: string, o: {
    serverLang: string | null; speechLang: string; voices: SpeechSynthesisVoice[]; muted: boolean; seconds: number;
    onProgress: (f: number) => void; onEnd: () => void;
  }) {
    this.stop();
    const gen = this.gen;
    const live = () => gen === this.gen;
    let done = false;
    const end = () => { if (!live() || done) return; done = true; window.clearInterval(this.ticker); o.onProgress(1); o.onEnd(); };
    const later = (fn: () => void, ms: number) => { this.timers.push(window.setTimeout(() => { if (live()) fn(); }, ms)); };

    const timer = (from = 0) => {
      this.tier = 'timer';
      const t0 = performance.now() - from * o.seconds * 1000;
      window.clearInterval(this.ticker);
      this.ticker = window.setInterval(() => {
        const f = (performance.now() - t0) / (o.seconds * 1000);
        if (f >= 1) end(); else o.onProgress(f);
      }, 80);
    };

    const speech = () => {
      const synth = getSynth();
      if (!synth || o.muted) { timer(); return; }
      this.tier = 'speech';
      const u = new SpeechSynthesisUtterance(text);
      const voice = o.voices[0] ?? null;
      u.lang = voice?.lang ?? o.speechLang;
      if (voice) u.voice = voice;
      let started = false, t0 = performance.now();
      u.onstart = () => { started = true; t0 = performance.now(); };
      u.onend = () => { if (live() && this.utterance === u) end(); };
      u.onerror = () => { if (live() && this.utterance === u) { this.utterance = null; timer(); } };
      this.utterance = u;
      synth.speak(u);
      window.clearInterval(this.ticker);
      this.ticker = window.setInterval(() => {
        if (started) o.onProgress(Math.min(0.97, (performance.now() - t0) / (o.seconds * 1000)));
      }, 80);
      later(() => { if (!started && this.utterance === u) { this.utterance = null; synth.cancel(); timer(); } }, 4000);
    };

    if (o.muted) { timer(); return; }
    if (!o.serverLang) { speech(); return; }

    // server voice (one request per line; a prefetch in flight is awaited, not repeated)
    const url = ttsUrl(text, o.serverLang);
    if (!ttsCache.has(url)) prefetchTts(text, o.serverLang);
    let cached = ttsCache.get(url);
    if (cached instanceof Promise) {
      await Promise.race([cached, new Promise(r => setTimeout(r, 15_000))]);
      cached = ttsCache.get(url);
    }
    if (!live()) return;
    if (typeof cached !== 'string') { speech(); return; }
    this.tier = 'audio';
    const a = sharedAudio();
    a.onended = () => { if (live()) end(); };
    a.onerror = () => { if (live() && !done) speech(); };
    a.src = cached;
    a.play()?.catch((e: unknown) => { if (live() && (e as Error)?.name !== 'AbortError') speech(); });
    window.clearInterval(this.ticker);
    this.ticker = window.setInterval(() => {
      const d = a.duration;
      if (Number.isFinite(d) && d > 0) o.onProgress(Math.min(0.99, a.currentTime / d));
    }, 60);
  }
}

// ── pieces ──────────────────────────────────────────────────────────

function useVoices() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    const synth = getSynth();
    if (!synth) return;
    const update = () => setVoices(synth.getVoices());
    update();
    synth.addEventListener?.('voiceschanged', update);
    return () => synth.removeEventListener?.('voiceschanged', update);
  }, []);
  return voices;
}

/** Headline with *accent* words; each word springs in. */
function Headline({ text, accent }: { text: string; accent: string }) {
  let n = 0;
  return (
    <h2 className="font-black text-white leading-[1.08] tracking-tight text-[clamp(26px,8.2cqw,40px)] drop-shadow-[0_3px_14px_rgba(0,0,0,0.55)]"
      style={{ fontFamily: HEADLINE_FONT, textWrap: 'balance' } as CSSProperties}>
      {text.split(/(\*[^*]+\*)/).filter(Boolean).map((part, i) => {
        const hot = part.startsWith('*') && part.endsWith('*');
        return part.replace(/\*/g, '').split(/(\s+)/).map((w, j) => (/^\s+$/.test(w) ? w : (
          <span key={`${i}-${j}`} className="reel-word inline-block" style={{
            animationDelay: `${120 + n++ * 85}ms`,
            ...(hot ? { color: accent, textShadow: `0 0 26px ${accent}88, 0 3px 14px rgba(0,0,0,0.5)` } : {}),
          }}>{w}</span>
        )));
      })}
    </h2>
  );
}

/** The line being spoken, with the current word lit up. */
export function Caption({ text, frac, accent }: { text: string; frac: number; accent: string }) {
  const words = useMemo(() => {
    let total = 0;
    const list = text.split(/\s+/).filter(Boolean).map(w => {
      const at = total;
      total += Math.max(1, w.replace(/[.,!?;:—–\-"'“”‘’()।॥…]/g, '').length) + 1.5;
      return { w, at };
    });
    return list.map(x => ({ ...x, at: x.at / (total || 1) }));
  }, [text]);
  let current = 0;
  words.forEach((x, i) => { if (x.at <= frac) current = i; });
  return (
    <p className="text-white text-[clamp(15px,4.4cqw,19px)] leading-snug font-semibold text-center" style={{ fontFamily: HEADLINE_FONT, textWrap: 'balance' } as CSSProperties}>
      {words.map((x, i) => (
        <span key={i}>
          <span className="rounded-md px-0.5 transition-colors duration-150"
            style={i === current && frac > 0 ? { background: accent, color: '#111' } : { opacity: i < current ? 1 : 0.78 }}>{x.w}</span>{' '}
        </span>
      ))}
    </p>
  );
}

export function SceneLayer({ scene, line, lang, accent, index, sceneSeconds, progress, role }: {
  scene: ReelScene; line: { headline: string; say: string }; lang: 'en' | 'hi'; accent: typeof ACCENTS[Reel['accent']]; index: number;
  sceneSeconds: number; progress: number; role: 'in' | 'out';
}) {
  const img = scene.image;
  const fullOverlay = scene.overlay && FULL_FRAME_OVERLAYS.includes(scene.overlay);
  const kb = scene.pan === 'up' ? 'reel-kb-up' : 'reel-kb-in';
  const motion = useMemo<SceneMotion | null>(() => (scene.motion
    ? { kind: scene.motion.kind, axis: scene.motion.axis, items: scene.motion.items.map(i => ({ emoji: i.emoji, label: i.label[lang] })) }
    : null), [scene.motion, lang]);
  // the animation's steps advance as the line is spoken, finishing a little before it ends
  const steps = motion ? motionSteps(motion) : 0;
  const beat = role === 'out' ? steps : Math.min(steps, Math.floor(progress * (steps + 0.7)));
  const stat = scene.stat?.[lang] ?? null;
  return (
    <div className={`absolute inset-0 ${role === 'out' ? 'reel-out' : ENTRANCES[index % ENTRANCES.length]}`}
      style={{ ['--reel-kb' as string]: `${Math.max(6, sceneSeconds + 2)}s` }}>
      {/* picture (an animated scene keeps it as a dim backdrop) */}
      {motion ? (
        <>
          {img
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={img.src} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover scale-125 blur-2xl brightness-[0.35] saturate-150" draggable={false} />
            : <div className="absolute inset-0" style={{ background: accent.grad }} />}
          <div className="absolute inset-0 opacity-[0.08] reel-grid" />
          <div className="absolute inset-x-[3%] top-[27%] bottom-[25%] rounded-[24px] bg-black/35 border border-white/10 backdrop-blur-sm">
            <MotionStage motion={motion} beat={beat} p={REEL_PALETTE} fit boost={1.35} />
          </div>
        </>
      ) : img ? (
        img.fit === 'cover' ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img.src} alt="" className={`absolute inset-0 w-full h-full object-cover ${kb}`} draggable={false} />
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.src} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover scale-125 blur-2xl brightness-[0.45] saturate-150" draggable={false} />
            <div className="absolute inset-x-[6%] top-[31%] bottom-[30%] flex items-center justify-center reel-float">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt="" className="max-w-full max-h-full object-contain rounded-2xl shadow-[0_18px_50px_rgba(0,0,0,0.55)] reel-kb-soft" draggable={false} />
            </div>
          </>
        )
      ) : (
        <div className="absolute inset-0" style={{ background: accent.grad }}>
          <div className="absolute inset-0 opacity-[0.12] reel-grid" />
        </div>
      )}
      {/* scrims for legibility */}
      <div className="absolute inset-x-0 top-0 h-[46%] bg-gradient-to-b from-black/75 via-black/35 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-[44%] bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
      {/* overlay diagram */}
      {scene.overlay && (
        <div className={fullOverlay ? 'absolute inset-0' : 'absolute inset-x-[7%] top-[31%] bottom-[29%]'}>
          <ReelOverlayView overlay={scene.overlay} progress={role === 'out' ? 1 : progress} />
        </div>
      )}
      {/* headline + stat */}
      <div className="absolute inset-x-[6%] top-[12.5%] text-center">
        <Headline key={line.headline} text={line.headline} accent={accent.hex} />
        {stat && (
          <p className="reel-stat mt-2 font-black text-white text-[clamp(30px,11cqw,58px)] leading-none"
            style={{ fontFamily: HEADLINE_FONT, textShadow: `0 0 34px ${accent.glow}, 0 4px 18px rgba(0,0,0,0.6)` }}>{stat}</p>
        )}
      </div>
    </div>
  );
}

// ── player ──────────────────────────────────────────────────────────

interface Props {
  reel: Reel;
  active: boolean;
  /** Next to the active reel: preload its first pictures and line. */
  near: boolean;
  muted: boolean;
  language: string;
  onToggleMute: () => void;
  onOpenLanguages: () => void;
  /** Played to the end (the feed moves on). */
  onEnded: () => void;
}

/** Translations already fetched: `${reelId}:${language}`. */
const translations = new Map<string, ReelLines>();

export default function ReelPlayer({ reel, active, near, muted, language, onToggleMute, onOpenLanguages, onEnded }: Props) {
  const accent = ACCENTS[reel.accent] ?? ACCENTS.saffron;
  const [translated, setTranslated] = useState<ReelLines | null>(null);
  const [translating, setTranslating] = useState(false);
  const lines = useMemo(() => linesFor(reel, language, translated), [reel, language, translated]);
  const n = reel.scenes.length;

  const [scene, setScene] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [tts, setTts] = useState<TtsStatus | null>(null);
  const voices = useVoices();
  const voice = useRef<SceneVoice | null>(null);
  const endedRef = useRef(onEnded);
  endedRef.current = onEnded;

  useEffect(() => { getTtsStatus().then(setTts); }, []);

  // ── translation (other languages)
  useEffect(() => {
    if (language === 'English' || language === 'Hindi') { setTranslated(null); setTranslating(false); return; }
    const key = `${reel.id}:${language}`;
    const hit = translations.get(key);
    if (hit) { setTranslated(hit); return; }
    setTranslated(null);
    if (!active) return;
    let cancelled = false;
    setTranslating(true);
    fetch('/api/translate-short', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, title: reel.title.en, scenes: reel.scenes.map(s => ({ headline: s.headline.en, say: s.say.en })) }),
    })
      .then(r => r.json())
      .then(d => {
        if (cancelled || d.fallback || !Array.isArray(d.scenes) || d.scenes.length !== n) return;
        const out: ReelLines = { title: String(d.title || reel.title.en), scenes: d.scenes.map((s: { headline?: string; say?: string }, i: number) => ({
          headline: String(s.headline || reel.scenes[i].headline.en), say: String(s.say || reel.scenes[i].say.en),
        })) };
        translations.set(key, out);
        setTranslated(out);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setTranslating(false); });
    return () => { cancelled = true; };
  }, [language, reel, active, n]);

  // ── which voice reads this language
  const sample = lines.scenes.map(s => s.say).join(' ');
  const langs = useMemo(() => voiceLangs(language, sample), [language, sample]);
  const serverLang = useMemo(() => {
    if (!tts?.enabled) return null;
    const served = tts.languages.map(l => l.toLowerCase());
    return langs.find(l => served.includes(l.toLowerCase())) ?? null;
  }, [tts, langs]);
  const speechVoices = useMemo(() => pickVoices(voices, langs), [voices, langs]);

  // ── preload pictures and the first lines
  useEffect(() => {
    if (!active && !near) return;
    const imgs = reel.scenes.slice(0, active ? n : 2).map(s => s.image?.src).filter(Boolean) as string[];
    imgs.forEach(src => { const i = new window.Image(); i.decoding = 'async'; i.src = src; });
  }, [active, near, reel, n]);
  useEffect(() => {
    if (!serverLang || muted || translating || (!active && !near)) return;
    const from = active ? scene : 0;
    lines.scenes.slice(from, from + 2).forEach(s => prefetchTts(s.say, serverLang));
  }, [active, near, serverLang, muted, translating, scene, lines]);

  // ── start / stop with the feed
  useEffect(() => {
    if (active) {
      setScene(0); setPrev(null); setProgress(0);
      setPlaying(unlocked);
    } else {
      setPlaying(false); setScene(0); setPrev(null); setProgress(0);
    }
  }, [active]);

  // ── play the current scene's line
  const line = lines.scenes[scene];
  const say = line?.say ?? '';
  useEffect(() => {
    if (!active || !playing || translating || !say) return;
    const v = (voice.current ??= new SceneVoice());
    setProgress(0);
    v.play(say, {
      serverLang, speechLang: langs[0] ?? langCode(language), voices: speechVoices, muted,
      seconds: estimateSeconds(say, language),
      onProgress: setProgress,
      onEnd: () => {
        window.setTimeout(() => {
          if (scene + 1 < n) { setPrev(scene); setScene(scene + 1); }
          else { setPlaying(false); endedRef.current(); }
        }, SCENE_HOLD_MS);
      },
    });
    return () => v.stop();
  }, [active, playing, translating, scene, say, serverLang, speechVoices, muted, langs, language, n]);

  // the outgoing layer leaves after its exit animation
  useEffect(() => {
    if (prev === null) return;
    const id = window.setTimeout(() => setPrev(null), 700);
    return () => window.clearTimeout(id);
  }, [prev]);

  // background music under the voice
  useEffect(() => {
    const music = getAmbientMusic();
    if (active && playing && !muted) music.start(reel.accent);
    else if (active) music.stop();
    return () => { if (active) music.stop(); };
  }, [active, playing, muted, reel.accent]);
  useEffect(() => { getAmbientMusic().setMuted(muted); }, [muted]);

  useEffect(() => () => voice.current?.stop(), []);

  const toggle = () => {
    unlockReelAudio();
    if (playing) { setPlaying(false); voice.current?.stop(); }
    else setPlaying(true);
  };

  const current = reel.scenes[scene];
  const sceneSeconds = estimateSeconds(line?.say ?? '', language);
  const img = current.image;
  const waiting = active && !playing && !unlocked;
  const statLang = language === 'Hindi' ? 'hi' : 'en';

  return (
    <div className="relative w-full h-full rounded-[28px] overflow-hidden bg-black shadow-2xl select-none" style={{ containerType: 'inline-size' }}>
      {/* scenes */}
      {prev !== null && reel.scenes[prev] && (
        <SceneLayer key={`out-${prev}`} scene={reel.scenes[prev]} line={lines.scenes[prev]} lang={statLang} accent={accent} index={prev} sceneSeconds={sceneSeconds} progress={1} role="out" />
      )}
      <SceneLayer key={`in-${scene}-${language}`} scene={current} line={line} lang={statLang} accent={accent} index={scene} sceneSeconds={sceneSeconds} progress={progress} role="in" />

      {/* tap to pause / play */}
      <button onClick={toggle} className="absolute inset-0 z-10" aria-label={playing ? 'Pause' : 'Play'} />

      {/* progress segments */}
      <div className="absolute top-3 left-3 right-3 flex gap-1 z-30 pointer-events-none">
        {reel.scenes.map((_, i) => (
          <div key={i} className="flex-1 h-1 rounded-full bg-white/25 overflow-hidden">
            <div className="h-full bg-white rounded-full" style={{ width: i < scene ? '100%' : i === scene ? `${Math.round(progress * 100)}%` : '0%' }} />
          </div>
        ))}
      </div>

      {/* top bar */}
      <div className="absolute top-7 left-4 right-4 flex items-center justify-between z-30">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold text-white bg-black/35 backdrop-blur border border-white/15">
          {reel.emoji} {reel.subject}
        </span>
        <div className="flex items-center gap-2">
          <button onClick={onOpenLanguages} className="h-8 pl-2 pr-3 rounded-full bg-black/40 backdrop-blur flex items-center gap-1.5 text-white text-xs font-medium border border-white/15" aria-label="Change language">
            <Globe className="w-4 h-4" /> {language}
          </button>
          <button onClick={() => { unlockReelAudio(); onToggleMute(); }} className="w-9 h-9 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white border border-white/15" aria-label={muted ? 'Turn sound on' : 'Mute'}>
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* caption */}
      <div className="absolute inset-x-4 bottom-[13%] z-20 pointer-events-none flex justify-center">
        <div className="max-w-full rounded-2xl bg-black/45 backdrop-blur-md border border-white/10 px-3.5 py-2.5">
          {translating ? <p className="text-white/80 text-sm text-center">🌐 Translating into {language}…</p>
            : line && <Caption key={`${scene}-${line.say}`} text={line.say} frac={progress} accent={accent.hex} />}
        </div>
      </div>

      {/* footer */}
      <div className="absolute bottom-0 inset-x-0 px-4 pb-4 pt-2 z-20 flex items-end justify-between gap-3">
        <div className="min-w-0 pointer-events-none">
          <p className="text-white text-sm font-bold truncate" style={{ fontFamily: HEADLINE_FONT }}>{lines.title}</p>
          {img && (
            <a href={img.page} target="_blank" rel="noopener noreferrer" className="pointer-events-auto relative z-20 block text-white/55 text-[10px] truncate hover:text-white/80">
              📷 {img.credit} · {img.license} · Wikimedia Commons
            </a>
          )}
        </div>
        <Link href={`/generate?topic=${encodeURIComponent(reel.topic)}`} className="relative z-20 shrink-0 inline-flex items-center gap-1 text-white text-xs font-semibold bg-white/15 backdrop-blur px-3 py-1.5 rounded-full hover:bg-white/25 transition-colors border border-white/15">
          <Sparkles className="w-3.5 h-3.5" /> Full lesson
        </Link>
      </div>

      {/* paused / first tap */}
      {!playing && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/30 pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg reel-pop-in">
            <Play className="w-7 h-7 text-navy fill-navy ml-1" />
          </div>
          {waiting && <p className="text-white text-sm font-semibold drop-shadow">Tap to play with sound 🔊</p>}
        </div>
      )}
    </div>
  );
}
