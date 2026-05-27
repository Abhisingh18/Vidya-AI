'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Subtitles, Sparkles } from 'lucide-react';
import SceneRenderer, { type Scene } from './scene-renderer';

interface ScriptLine { time: string; text: string; }

interface Props {
  topic: string;
  script: ScriptLine[];
  language: string;
  scene?: Scene | null;
  onWatchTracked?: () => void;
}

function langCode(language: string): string {
  const map: Record<string, string> = {
    Hindi: 'hi-IN', English: 'en-IN', Tamil: 'ta-IN', Telugu: 'te-IN',
    Marathi: 'mr-IN', Bengali: 'bn-IN', Kannada: 'kn-IN', Malayalam: 'ml-IN',
    Gujarati: 'gu-IN', Punjabi: 'pa-IN',
  };
  return map[language] ?? 'en-IN';
}

function timeToSeconds(t: string): number {
  const [m, s] = t.split(':').map(Number);
  return (m || 0) * 60 + (s || 0);
}

export default function GeneratedVideoPlayer({ topic, script, language, scene, onWatchTracked }: Props) {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [showCaptions, setShowCaptions] = useState(true);
  const [captionIdx, setCaptionIdx] = useState(-1);
  const [currentTime, setCurrentTime] = useState(0);
  const stopRef = useRef(false);
  const startedTrackRef = useRef(false);
  const tickRef = useRef<NodeJS.Timeout | null>(null);

  const totalSeconds = script.length > 0
    ? Math.max(timeToSeconds(script[script.length - 1].time) + 25, scene?.duration ?? 60)
    : 60;

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const stopAll = useCallback(() => {
    stopRef.current = true;
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    setPlaying(false);
  }, []);

  const play = useCallback(async () => {
    if (typeof window === 'undefined' || playing) return;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    stopRef.current = false;
    setPlaying(true);
    setCaptionIdx(0);
    setCurrentTime(0);

    if (!startedTrackRef.current) {
      startedTrackRef.current = true;
      onWatchTracked?.();
    }

    // Start a clock ticking so scene steps animate in real time
    const startMs = performance.now();
    tickRef.current = setInterval(() => {
      if (stopRef.current) return;
      const elapsed = (performance.now() - startMs) / 1000;
      setCurrentTime(elapsed);
      if (elapsed >= totalSeconds + 2) {
        if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
      }
    }, 100);

    const lang = langCode(language);
    const getVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const base = lang.split('-')[0];
      return (
        voices.find(v => v.lang === lang) ??
        voices.find(v => v.lang.startsWith(base)) ??
        voices.find(v => v.lang.startsWith('en')) ??
        null
      );
    };

    for (let i = 0; i < script.length; i++) {
      if (stopRef.current) break;
      setCaptionIdx(i);

      await new Promise<void>(resolve => {
        const u = new SpeechSynthesisUtterance(script[i].text);
        u.lang = lang;
        u.rate = 0.95;
        u.volume = muted ? 0 : 1;
        const v = getVoice();
        if (v) u.voice = v;
        u.onend = () => resolve();
        u.onerror = () => resolve();
        window.speechSynthesis.speak(u);
      });

      if (!stopRef.current && i < script.length - 1) {
        await new Promise(r => setTimeout(r, 250));
      }
    }

    if (!stopRef.current) {
      setPlaying(false);
      setTimeout(() => {
        if (!stopRef.current) { setCaptionIdx(-1); setCurrentTime(0); }
      }, 2000);
    }
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
  }, [playing, script, language, muted, totalSeconds, onWatchTracked]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.getVoices();
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  const currentCaption = captionIdx >= 0 ? script[captionIdx]?.text : null;
  const progress = currentTime / totalSeconds;
  const hasScene = scene && scene.steps && scene.steps.length > 0;

  return (
    <div className="rounded-2xl overflow-hidden bg-navy dark:bg-dark-surface shadow-xl">
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A2E] via-[#0F0F1A] to-[#1A1A2E]">

          {/* Scene area */}
          <div className="absolute inset-0 flex items-center justify-center p-2">
            {hasScene ? (
              <SceneRenderer scene={scene!} currentTime={currentTime} />
            ) : (
              <div className="text-center">
                <Sparkles className="w-12 h-12 text-saffron mx-auto mb-3" />
                <p className="text-white text-lg font-heading font-semibold">{topic}</p>
                <p className="text-gray-400 text-sm mt-1">{playing ? 'Listening to the lesson…' : 'Press play to begin'}</p>
              </div>
            )}
          </div>

          {/* Play overlay (when NOT playing) */}
          {!playing && (
            <button
              type="button"
              onClick={play}
              className="absolute inset-0 flex items-center justify-center group bg-black/0 hover:bg-black/20 transition-colors z-20"
              aria-label="Play"
            >
              <div className="w-20 h-20 rounded-full bg-saffron flex items-center justify-center shadow-saffron group-hover:scale-110 transition-transform">
                <Play className="w-9 h-9 text-white fill-white ml-1" />
              </div>
            </button>
          )}

          {/* Topic badge */}
          <div className="absolute top-3 left-3 z-10">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-saffron/95 text-xs text-white font-medium shadow-saffron/40 shadow">
              {playing && <Volume2 className="w-3 h-3 animate-pulse" />}
              {topic.length > 35 ? topic.slice(0, 35) + '…' : topic}
            </span>
          </div>

          {/* Live badge */}
          {playing && (
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-70" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
              </span>
              <span className="text-[10px] text-white/90 uppercase tracking-wider font-bold">Playing</span>
            </div>
          )}

          {/* Captions */}
          {showCaptions && currentCaption && (
            <div className="absolute bottom-0 left-0 right-0 px-6 py-5 bg-gradient-to-t from-black/95 via-black/70 to-transparent z-10 pointer-events-none">
              <p key={captionIdx} className="text-white text-sm md:text-base text-center leading-snug font-medium max-w-2xl mx-auto animate-fade-in">
                {currentCaption}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-1.5 bg-white/10">
        <div className="absolute left-0 top-0 h-full bg-saffron rounded-r-full transition-all duration-200" style={{ width: `${Math.min(100, progress * 100)}%` }} />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#141428]">
        <button type="button" onClick={() => (playing ? stopAll() : play())} className="text-white/80 hover:text-white">
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        <span className="text-xs text-white/60 font-mono tabular-nums">
          {formatTime(Math.min(currentTime, totalSeconds))} / {formatTime(totalSeconds)}
        </span>
        <div className="flex-1" />
        <button type="button" onClick={() => setMuted(m => !m)} className="text-white/60 hover:text-white">
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
        <button type="button" onClick={() => setShowCaptions(c => !c)} className={`hover:text-white ${showCaptions ? 'text-saffron' : 'text-white/60'}`}>
          <Subtitles className="w-4 h-4" />
        </button>
        <span className="text-xs text-white/60 font-mono px-1.5 py-0.5 rounded bg-white/5">1x</span>
        <button type="button" className="text-white/60 hover:text-white">
          <Maximize className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
