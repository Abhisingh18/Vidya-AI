'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { Play, Volume2, VolumeX, Sparkles, Globe } from 'lucide-react';
import type { Short, ShortBeat } from '@/lib/shorts';
import { getAmbientMusic } from '@/lib/ambient-music';
import { langCode } from '@/lib/languages';
import AvatarTeacher from './avatar-teacher';
import ReelScene, { pickViz } from './reel-scene';

interface Props {
  short: Short;
  active: boolean;
  muted: boolean;
  language: string;           // selected display/narration language
  onToggleMute: () => void;
  onOpenLanguages: () => void;
}

const ACCENT: Record<string, { grad: string; chip: string }> = {
  saffron: { grad: 'from-[#2A1206] via-[#7A2E12] to-[#FF6B2C]', chip: 'bg-saffron' },
  indigo: { grad: 'from-[#0B0B1F] via-[#1E1C6B] to-[#3D3BDB]', chip: 'bg-indigo-brand' },
  teal: { grad: 'from-[#04140F] via-[#0A5C44] to-[#0F9E75]', chip: 'bg-teal' },
};

// Module-level translation cache: `${shortId}:${language}` → translated content.
const tCache = new Map<string, { hook: string; beats: ShortBeat[] }>();

export default function ReelPlayer({ short, active, muted, language, onToggleMute, onOpenLanguages }: Props) {
  const accent = ACCENT[short.accent] ?? ACCENT.saffron;

  // Translated content (falls back to original).
  const [content, setContent] = useState<{ hook: string; beats: ShortBeat[] }>({ hook: short.hook, beats: short.beats });
  const [translating, setTranslating] = useState(false);
  const beats = content.beats;

  const durations = beats.map(b => Math.min(6.5, Math.max(3.4, b.say.split(' ').length * 0.42)));
  const starts: number[] = [];
  durations.reduce((acc, d, i) => { starts[i] = acc; return acc + d; }, 0);
  const total = durations.reduce((a, b) => a + b, 0) || 1;

  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [docked, setDocked] = useState(false);   // avatar moved to corner?
  const viz = pickViz(short.id, short.subject);

  const dockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const baseRef = useRef(0);
  const offsetRef = useRef(0);
  const spokenRef = useRef(-1);
  const stopRef = useRef(false);

  // ── Fetch translation when language differs from the reel's native language.
  useEffect(() => {
    if (language === short.language) {
      setContent({ hook: short.hook, beats: short.beats });
      setTranslating(false);
      return;
    }
    const key = `${short.id}:${language}`;
    const cached = tCache.get(key);
    if (cached) { setContent(cached); return; }

    // Only the reel in view fetches a translation — avoids 60+ parallel calls.
    if (!active) return;

    let cancelled = false;
    setTranslating(true);
    fetch('/api/translate-short', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language,
        hook: short.hook,
        beats: short.beats.map(b => ({ say: b.say, sub: b.sub })),
      }),
    })
      .then(r => r.json())
      .then(d => {
        if (cancelled || !Array.isArray(d.beats)) return;
        const merged: ShortBeat[] = short.beats.map((b, i) => ({
          big: b.big,
          sub: d.beats[i]?.sub ?? b.sub,
          say: d.beats[i]?.say ?? b.say,
        }));
        const result = { hook: d.hook ?? short.hook, beats: merged };
        tCache.set(key, result);
        setContent(result);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setTranslating(false); });
    return () => { cancelled = true; };
  }, [language, short, active]);

  const speak = useCallback((i: number) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    if (muted) { setSpeaking(true); return; }
    const u = new SpeechSynthesisUtterance(beats[i]?.say ?? '');
    u.lang = langCode(language);
    u.rate = 1.02;
    const base = u.lang.split('-')[0];
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find(x => x.lang === u.lang) ?? voices.find(x => x.lang.startsWith(base)) ?? voices.find(x => x.lang.startsWith('en'));
    if (v) u.voice = v;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  }, [beats, language, muted]);

  const loop = useCallback(() => {
    if (stopRef.current) return;
    const elapsed = offsetRef.current + (performance.now() - baseRef.current) / 1000;
    const t = elapsed % total;
    setProgress(t / total);

    let cur = 0;
    for (let i = 0; i < beats.length; i++) if (t >= starts[i]) cur = i;
    setIdx(cur);

    if (cur !== spokenRef.current) {
      spokenRef.current = cur;
      speak(cur);
    }
    if (t < 0.2 && spokenRef.current === beats.length - 1) spokenRef.current = -1;

    rafRef.current = requestAnimationFrame(loop);
  }, [beats.length, starts, total, speak]);

  const start = useCallback(() => {
    stopRef.current = false;
    baseRef.current = performance.now();
    spokenRef.current = -1;
    setPlaying(true);
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    if (!muted) getAmbientMusic().start(short.accent);
    rafRef.current = requestAnimationFrame(loop);
  }, [loop, muted, short.accent]);

  const pause = useCallback(() => {
    stopRef.current = true;
    offsetRef.current += (performance.now() - baseRef.current) / 1000;
    setPlaying(false);
    setSpeaking(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    getAmbientMusic().stop();
  }, []);

  useEffect(() => {
    if (dockTimer.current) clearTimeout(dockTimer.current);
    if (active) {
      offsetRef.current = 0; setIdx(0); setDocked(false);
      start();
      // After a short intro, the avatar steps aside to a corner and the
      // animated visual explanation takes the stage.
      dockTimer.current = setTimeout(() => setDocked(true), 1600);
    } else {
      pause(); offsetRef.current = 0; setProgress(0); setIdx(0); setDocked(false);
    }
    return () => {
      stopRef.current = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (dockTimer.current) clearTimeout(dockTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => {
    getAmbientMusic().setMuted(muted);
    if (muted && typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [muted]);

  const togglePlay = () => { if (playing) pause(); else start(); };
  const beat = beats[idx] ?? beats[0];
  const showTalking = playing && (speaking || muted);

  return (
    <div className={`relative w-full h-full rounded-[28px] overflow-hidden bg-gradient-to-b ${accent.grad} shadow-2xl select-none`}>
      {/* Texture */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle at 20% 10%, #fff 0.5px, transparent 0.5px)', backgroundSize: '22px 22px' }} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30" />

      {/* Progress segments */}
      <div className="absolute top-3 left-3 right-3 flex gap-1 z-30">
        {beats.map((_, i) => (
          <div key={i} className="flex-1 h-1 rounded-full bg-white/25 overflow-hidden">
            <div className="h-full bg-white rounded-full" style={{ width: i < idx ? '100%' : i === idx ? `${Math.max(0, Math.min(100, ((progress * total - starts[i]) / durations[i]) * 100))}%` : '0%' }} />
          </div>
        ))}
      </div>

      {/* Top bar */}
      <div className="absolute top-7 left-4 right-4 flex items-center justify-between z-30">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold text-white ${accent.chip}/90`}>
          {short.emoji} {short.subject}
        </span>
        <div className="flex items-center gap-2">
          <button onClick={onOpenLanguages} className="h-8 pl-2 pr-3 rounded-full bg-black/35 backdrop-blur flex items-center gap-1.5 text-white text-xs font-medium" aria-label="Change language">
            <Globe className="w-4 h-4" /> {language}
          </button>
          <button onClick={onToggleMute} className="w-9 h-9 rounded-full bg-black/35 backdrop-blur flex items-center justify-center text-white" aria-label="Toggle sound">
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Tap layer for play/pause */}
      <button onClick={togglePlay} className="absolute inset-0 z-10" aria-label={playing ? 'Pause' : 'Play'} />

      {/* Animated visual stage — revealed once the avatar docks */}
      <div className={`absolute inset-x-0 top-[16%] bottom-[28%] flex items-center justify-center px-6 pointer-events-none z-20 transition-opacity duration-500 ${docked ? 'opacity-100' : 'opacity-0'}`}>
        <div className="w-full max-w-[300px] aspect-square">
          <ReelScene viz={viz} beat={idx} accent={short.accent} />
        </div>
      </div>

      {/* Per-beat concept title (the maths/keyword for this step) */}
      {docked && (
        <div className="absolute top-[15%] left-0 right-0 flex justify-center px-6 z-20 pointer-events-none">
          <div key={idx} className="reel-pop max-w-[88%] rounded-2xl bg-black/35 backdrop-blur-md border border-white/10 px-5 py-2.5 text-center">
            <p className="text-white font-heading font-extrabold tracking-tight text-2xl sm:text-3xl drop-shadow break-words leading-tight">{beat?.big}</p>
            {beat?.sub && <p className="text-white/70 text-xs mt-1 font-medium">{beat.sub}</p>}
          </div>
        </div>
      )}

      {/* AI teacher avatar — centred intro, then docks to a corner */}
      <div
        className={`absolute z-30 pointer-events-none transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          docked
            ? 'top-[14%] left-4 w-16 h-16'
            : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36'
        }`}
      >
        <AvatarTeacher speaking={showTalking} accent={short.accent} size={docked ? 64 : 144} />
      </div>

      {/* Intro topic label (only during the centred intro) */}
      {!docked && (
        <div className="absolute top-[64%] left-0 right-0 flex justify-center px-8 z-30 pointer-events-none">
          <p className="text-white/90 text-center text-lg font-heading font-semibold animate-fade-in">{short.topic}</p>
        </div>
      )}

      {/* Pause overlay */}
      {!playing && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/25 pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <Play className="w-7 h-7 text-navy fill-navy ml-1" />
          </div>
        </div>
      )}

      {/* Bottom — caption + CTA */}
      <div className="absolute bottom-0 left-0 right-0 p-5 pt-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-20 pointer-events-none">
        <p className="text-white/90 text-sm font-semibold mb-1.5 flex items-center gap-1.5">
          <span className="text-base">{short.emoji}</span>{content.hook}
        </p>
        {/* Caption — what the teacher is saying */}
        <div className="min-h-[46px] rounded-2xl bg-black/30 backdrop-blur-sm px-3.5 py-2.5 border border-white/10">
          <p className="text-white text-[15px] leading-snug">{translating ? '🌐 Translating…' : beat?.say}</p>
        </div>
        <div className="mt-3 flex items-center justify-between pointer-events-auto">
          <span className="text-white/55 text-xs truncate max-w-[55%]">{short.topic}</span>
          <Link href={`/generate?topic=${encodeURIComponent(short.topic)}`} className="inline-flex items-center gap-1 text-white text-xs font-semibold bg-white/15 backdrop-blur px-3 py-1.5 rounded-full hover:bg-white/25 transition-colors">
            <Sparkles className="w-3.5 h-3.5" /> Full lesson
          </Link>
        </div>
      </div>
    </div>
  );
}
