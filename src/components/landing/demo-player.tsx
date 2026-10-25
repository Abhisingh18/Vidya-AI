'use client';

// The product demo film on /demo: starts playing on arrival (with sound when the browser allows,
// otherwise muted with a "Tap for sound" button), loops, and has chapters for every feature that
// jump the film and light up while that part plays.

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Pause, Play, Volume2, VolumeX } from 'lucide-react';

interface Chapter { t: number; label: string; emoji: string }

// Start times (s) of each part of the film (from the film's timeline).
const INTRO: Chapter[] = [
  { t: 0, label: 'The problem', emoji: '🌏' },
  { t: 18.1, label: 'Meet VidyaAI', emoji: '✨' },
];
const STUDENTS: Chapter[] = [
  { t: 27.8, label: 'Visual explainer videos', emoji: '🎬' },
  { t: 43.3, label: '60-second reels', emoji: '📱' },
  { t: 53.0, label: 'Ask a doubt: text or video', emoji: '📸' },
  { t: 78.2, label: 'Smart flashcards', emoji: '🃏' },
  { t: 89.9, label: 'Revision notes', emoji: '📝' },
  { t: 103.5, label: 'Timed mock tests', emoji: '⏱️' },
  { t: 115.1, label: 'Study planner', emoji: '🗓️' },
  { t: 126.7, label: 'XP, streaks & badges', emoji: '🏆' },
];
const TEACHERS: Chapter[] = [
  { t: 146.1, label: 'AI slide decks', emoji: '🖥️' },
  { t: 159.7, label: 'Quiz builder', emoji: '❓' },
  { t: 173.3, label: 'Lesson plans', emoji: '📋' },
  { t: 184.9, label: 'Exam paper generator', emoji: '📄' },
  { t: 200.4, label: 'Classrooms', emoji: '👩‍🏫' },
  { t: 210.1, label: 'Teacher toolkit', emoji: '🧰' },
  { t: 219.8, label: 'Your material, your way', emoji: '📚' },
];
const ALL = [...INTRO, ...STUDENTS, ...TEACHERS, { t: 229.5, label: 'The numbers', emoji: '🔢' }];

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export default function DemoPlayer() {
  const video = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [now, setNow] = useState(0);

  // Try with sound first (allowed after the click that brought the visitor here); else go muted.
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    v.muted = false;
    v.play().catch(() => {
      v.muted = true;
      setMuted(true);
      v.play().catch(() => {});
    });
  }, []);

  const toggleSound = () => {
    const v = video.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    if (v.paused) v.play().catch(() => {});
  };
  const togglePlay = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {}); else v.pause();
  };
  const jump = (t: number) => {
    const v = video.current;
    if (!v) return;
    v.currentTime = t;
    v.play().catch(() => {});
    v.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const active = ALL.reduce((a, c) => (now >= c.t - 0.05 ? c : a), ALL[0]);

  const list = (title: string, items: Chapter[]) => (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-saffron">{title}</p>
      <ol className="space-y-1.5">
        {items.map(c => {
          const on = active === c;
          return (
            <li key={c.t}>
              <button type="button" onClick={() => jump(c.t)}
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${on ? 'bg-saffron/15 ring-1 ring-saffron/50' : 'hover:bg-white/5'}`}>
                <span className="w-6 text-center text-lg leading-none">{c.emoji}</span>
                <span className={`flex-1 text-sm font-semibold ${on ? 'text-white' : 'text-white/75 group-hover:text-white'}`}>{c.label}</span>
                <span className={`font-mono text-xs ${on ? 'text-saffron' : 'text-white/40'}`}>{clock(c.t)}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl">
      <div className="relative">
        <div aria-hidden className="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-gradient-to-r from-saffron/30 via-rose-500/20 to-indigo-brand/30 blur-3xl" />
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]">
          <video ref={video} src="/demo/vidyaai-demo.mp4" poster="/demo/poster.jpg" playsInline loop controls preload="auto"
            onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onTimeUpdate={e => setNow(e.currentTarget.currentTime)}
            onVolumeChange={e => setMuted(e.currentTarget.muted)}
            className="aspect-video w-full" aria-label="VidyaAI product demo, 4 minutes" />
          {muted && (
            <button type="button" onClick={toggleSound}
              className="absolute left-1/2 top-5 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/70 px-5 py-2.5 text-sm font-semibold text-white shadow-lg ring-1 ring-white/20 backdrop-blur transition hover:bg-black/85">
              <Volume2 className="h-4 w-4 text-saffron" /> Tap for sound
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="button" onClick={togglePlay} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
          {playing ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4" /> Play</>}
        </button>
        <button type="button" onClick={toggleSound} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
          {muted ? <><VolumeX className="h-4 w-4" /> Sound off</> : <><Volume2 className="h-4 w-4" /> Sound on</>}
        </button>
        <span className="text-sm text-white/50">Now: <span className="font-semibold text-white">{active.emoji} {active.label}</span></span>
        <Link href="/login" className="btn-saffron ml-auto !px-6 !py-2.5 text-sm">Try it free <ArrowRight className="h-4 w-4" /></Link>
      </div>

      <div className="mt-10 grid gap-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8 md:grid-cols-2">
        {list('For students · 8 tools', STUDENTS)}
        {list('For teachers · 7 tools', TEACHERS)}
      </div>
      <p className="mt-4 text-center text-xs text-white/40">Recorded from the real app. Some AI answers use example data.</p>
    </div>
  );
}
