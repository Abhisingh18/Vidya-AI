'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Subtitles, Sparkles, SkipBack, SkipForward, Gauge } from 'lucide-react';
import SceneRenderer, { type Scene } from './scene-renderer';

interface ScriptLine { time: string; text: string; }

interface Props {
  topic: string;
  script: ScriptLine[];
  language: string;
  scene?: Scene | null;
  onWatchTracked?: () => void;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;

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
  const [rate, setRate] = useState(1.0);
  const [speedOpen, setSpeedOpen] = useState(false);

  const stopRef = useRef(false);
  const startedTrackRef = useRef(false);
  const tickRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lineIdxRef = useRef(0);
  const rateRef = useRef(1.0);
  const mutedRef = useRef(false);
  const clockBaseRef = useRef(0);   // performance.now() at start of "this leg" of playback
  const offsetSecRef = useRef(0);   // virtual seconds at start of leg

  const totalSeconds = script.length > 0
    ? Math.max(timeToSeconds(script[script.length - 1].time) + 25, scene?.duration ?? 60)
    : 60;

  const formatTime = (sec: number) => {
    const m = Math.floor(Math.max(0, sec) / 60);
    const s = Math.floor(Math.max(0, sec) % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  useEffect(() => { rateRef.current = rate; }, [rate]);
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  // ── line index ↔ time helpers
  const lineIndexAtTime = useCallback((sec: number) => {
    let idx = 0;
    for (let i = 0; i < script.length; i++) {
      if (timeToSeconds(script[i].time) <= sec) idx = i;
      else break;
    }
    return idx;
  }, [script]);

  const setVirtualClock = useCallback((seconds: number) => {
    offsetSecRef.current = Math.max(0, Math.min(totalSeconds, seconds));
    clockBaseRef.current = performance.now();
    setCurrentTime(offsetSecRef.current);
  }, [totalSeconds]);

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

    if (!startedTrackRef.current) {
      startedTrackRef.current = true;
      onWatchTracked?.();
    }

    // Init clock from current virtual time (so seeking before play still works)
    clockBaseRef.current = performance.now();
    // If we were at the end, restart from 0
    if (offsetSecRef.current >= totalSeconds - 0.5) {
      offsetSecRef.current = 0;
      lineIdxRef.current = 0;
      setCurrentTime(0);
    } else if (offsetSecRef.current > 0) {
      // Resuming from a seek — sync line index to virtual time
      lineIdxRef.current = lineIndexAtTime(offsetSecRef.current);
    }

    // Ticker — drives both scene playhead and progress UI
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      if (stopRef.current) return;
      const elapsed = offsetSecRef.current + ((performance.now() - clockBaseRef.current) / 1000) * rateRef.current;
      const capped = Math.min(elapsed, totalSeconds + 1);
      setCurrentTime(capped);
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

    while (!stopRef.current && lineIdxRef.current < script.length) {
      const i = lineIdxRef.current;
      setCaptionIdx(i);

      await new Promise<void>(resolve => {
        const u = new SpeechSynthesisUtterance(script[i].text);
        u.lang = lang;
        u.rate = Math.max(0.5, Math.min(2, rateRef.current * 0.95));
        u.volume = mutedRef.current ? 0 : 1;
        const v = getVoice();
        if (v) u.voice = v;
        u.onend = () => resolve();
        u.onerror = () => resolve();
        window.speechSynthesis.speak(u);
      });

      if (stopRef.current) break;
      // Only advance if user hasn't seek-jumped to a different line during this utterance
      if (lineIdxRef.current === i) {
        lineIdxRef.current = i + 1;
      }
      if (!stopRef.current && lineIdxRef.current < script.length) {
        await new Promise(r => setTimeout(r, 220 / rateRef.current));
      }
    }

    if (!stopRef.current) {
      setPlaying(false);
      setTimeout(() => {
        if (!stopRef.current) { setCaptionIdx(-1); }
      }, 2000);
    }
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
  }, [playing, script, language, totalSeconds, onWatchTracked, lineIndexAtTime]);

  // ── Seek
  const seekTo = useCallback((seconds: number) => {
    const clamped = Math.max(0, Math.min(totalSeconds, seconds));
    setVirtualClock(clamped);
    const newIdx = lineIndexAtTime(clamped);
    lineIdxRef.current = newIdx;
    setCaptionIdx(newIdx);
    // Cancel current speech so the loop picks up the new index immediately
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, [totalSeconds, setVirtualClock, lineIndexAtTime]);

  const skipBy = useCallback((delta: number) => seekTo(currentTime + delta), [currentTime, seekTo]);

  // ── Rate change
  const changeRate = useCallback((newRate: number) => {
    rateRef.current = newRate;
    setRate(newRate);
    setSpeedOpen(false);
    // Snapshot current elapsed and rebase clock so the new rate takes effect from "here"
    const elapsedNow = offsetSecRef.current + ((performance.now() - clockBaseRef.current) / 1000) * (rateRef.current /* prior */);
    offsetSecRef.current = elapsedNow;
    clockBaseRef.current = performance.now();
    // Re-speak current line at new rate
    if (playing && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, [playing]);

  // ── Progress bar interaction
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seekTo(frac * totalSeconds);
  };

  const enterFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else el.requestFullscreen?.();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.getVoices();
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  // Close speed menu on outside click
  useEffect(() => {
    if (!speedOpen) return;
    const close = () => setSpeedOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [speedOpen]);

  // Keyboard shortcuts — space play/pause, ← → seek
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (playing) stopAll(); else play();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        skipBy(-10);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        skipBy(10);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [playing, play, stopAll, skipBy]);

  const currentCaption = captionIdx >= 0 ? script[captionIdx]?.text : null;
  const progress = currentTime / totalSeconds;
  const hasScene = scene && scene.steps && scene.steps.length > 0;

  return (
    <div ref={containerRef} className="rounded-2xl overflow-hidden bg-navy dark:bg-dark-surface shadow-xl">
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

      {/* Clickable progress bar */}
      <div
        role="slider"
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={totalSeconds}
        aria-valuenow={Math.floor(currentTime)}
        onClick={handleProgressClick}
        className="relative h-2 bg-white/10 cursor-pointer group/seek"
      >
        <div className="absolute left-0 top-0 h-full bg-saffron transition-[width] duration-100" style={{ width: `${Math.min(100, progress * 100)}%` }} />
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-saffron border-2 border-white opacity-0 group-hover/seek:opacity-100 transition-opacity pointer-events-none"
          style={{ left: `${Math.min(100, progress * 100)}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[#141428]">
        <button
          type="button"
          onClick={() => (playing ? stopAll() : play())}
          className="text-white/80 hover:text-white transition-colors"
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={() => skipBy(-10)}
          className="text-white/70 hover:text-white transition-colors flex items-center gap-0.5"
          aria-label="Back 10 seconds"
          title="Back 10s (←)"
        >
          <SkipBack className="w-4 h-4" />
          <span className="text-[10px] font-mono">10</span>
        </button>

        <button
          type="button"
          onClick={() => skipBy(10)}
          className="text-white/70 hover:text-white transition-colors flex items-center gap-0.5"
          aria-label="Forward 10 seconds"
          title="Forward 10s (→)"
        >
          <span className="text-[10px] font-mono">10</span>
          <SkipForward className="w-4 h-4" />
        </button>

        <span className="text-xs text-white/60 font-mono tabular-nums ml-1">
          {formatTime(Math.min(currentTime, totalSeconds))} / {formatTime(totalSeconds)}
        </span>

        <div className="flex-1" />

        <button type="button" onClick={() => setMuted(m => !m)} className="text-white/60 hover:text-white" aria-label={muted ? 'Unmute' : 'Mute'}>
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <button type="button" onClick={() => setShowCaptions(c => !c)} className={`hover:text-white ${showCaptions ? 'text-saffron' : 'text-white/60'}`} aria-label="Toggle captions">
          <Subtitles className="w-4 h-4" />
        </button>

        {/* Speed control */}
        <div className="relative" onClick={e => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setSpeedOpen(o => !o)}
            className="text-xs text-white/70 hover:text-white font-mono px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-1"
            aria-label="Playback speed"
            title="Playback speed"
          >
            <Gauge className="w-3.5 h-3.5" />
            {rate}x
          </button>
          {speedOpen && (
            <div className="absolute right-0 bottom-full mb-2 w-24 bg-[#1a1a2e] border border-white/10 rounded-lg overflow-hidden shadow-xl z-30">
              {SPEED_OPTIONS.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => changeRate(s)}
                  className={`w-full px-3 py-1.5 text-xs text-left font-mono transition-colors ${
                    s === rate
                      ? 'bg-saffron/20 text-saffron font-semibold'
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  {s}x{s === 1 ? '  (normal)' : ''}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={enterFullscreen}
          className="text-white/60 hover:text-white"
          aria-label="Fullscreen"
        >
          <Maximize className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
