'use client';

// Landing-page sample: a real Shorts reel playing on its own inside a phone frame,
// silently with captions until tapped — then the teacher's voice narrates it and
// each scene lasts as long as its line. It only plays while on screen.

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Volume2, VolumeX } from 'lucide-react';
import { REELS } from '@/lib/reels';
import { estimateSeconds } from '@/lib/explainer';
import { ACCENTS, Caption, SceneLayer } from '@/components/shorts/reel-player';
import { usePreviewVoice } from './preview-voice';

const HOLD_MS = 500;

export default function ReelPreview({ id, lang = 'hi', className = '' }: { id: string; lang?: 'en' | 'hi'; className?: string }) {
  const reel = REELS.find(r => r.id === id) ?? REELS[0];
  const accent = ACCENTS[reel.accent];
  const language = lang === 'hi' ? 'Hindi' : 'English';
  const root = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [scene, setScene] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const { soundOn, toggle, setSound, speak, stop } = usePreviewVoice(`reel-${id}-${lang}`);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.25 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  // scrolled away: stop talking
  useEffect(() => { if (!visible) setSound(false); }, [visible, setSound]);

  // Preload this reel's pictures once it is near the screen.
  useEffect(() => {
    if (!visible) return;
    reel.scenes.forEach(s => { if (s.image) { const i = new window.Image(); i.src = s.image.src; } });
  }, [visible, reel]);

  const say = reel.scenes[scene].say[lang];
  const seconds = estimateSeconds(say, language);

  // Play the current scene — spoken, or for as long as its line would take to say — then move on (looping).
  useEffect(() => {
    if (!visible) return;
    let next = 0;
    const advance = () => { next = window.setTimeout(() => { setPrev(scene); setScene(s => (s + 1) % reel.scenes.length); }, HOLD_MS); };
    if (soundOn) {
      setProgress(0);
      speak(say, language, setProgress, advance);
      return () => { stop(); window.clearTimeout(next); };
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const f = (now - t0) / (seconds * 1000);
      setProgress(Math.min(1, f));
      if (f < 1) raf = requestAnimationFrame(tick);
      else advance();
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); window.clearTimeout(next); };
  }, [visible, scene, seconds, reel.scenes.length, soundOn, say, language, speak, stop]);

  useEffect(() => {
    if (prev === null) return;
    const id = window.setTimeout(() => setPrev(null), 700);
    return () => window.clearTimeout(id);
  }, [prev]);

  const line = (i: number) => ({ headline: reel.scenes[i].headline[lang], say: reel.scenes[i].say[lang] });

  return (
    <div ref={root} className={`relative aspect-[9/18.5] rounded-[2.4rem] bg-[#0B0B12] p-[3.2%] shadow-[0_30px_80px_-20px_rgba(26,26,46,0.55)] ring-1 ring-black/10 dark:ring-white/10 ${className}`}>
      <div className="absolute left-1/2 top-[1.6%] z-40 h-[2.2%] w-[28%] -translate-x-1/2 rounded-full bg-black" aria-hidden />
      <div role="button" tabIndex={0} onClick={toggle} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } }}
        aria-label={soundOn ? 'Mute the reel' : `Play “${reel.title.en}” with sound`} aria-pressed={soundOn}
        className="group relative block h-full w-full cursor-pointer overflow-hidden rounded-[2rem] bg-black" style={{ containerType: 'inline-size' }}>
        {prev !== null && (
          <SceneLayer key={`out-${prev}`} scene={reel.scenes[prev]} line={line(prev)} lang={lang} accent={accent} index={prev}
            sceneSeconds={seconds} progress={1} role="out" />
        )}
        <SceneLayer key={`in-${scene}`} scene={reel.scenes[scene]} line={line(scene)} lang={lang} accent={accent} index={scene}
          sceneSeconds={seconds} progress={progress} role="in" />

        <div className="absolute top-[5%] left-[5%] right-[5%] z-30 flex gap-1" aria-hidden>
          {reel.scenes.map((_, i) => (
            <div key={i} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25">
              <div className="h-full rounded-full bg-white" style={{ width: i < scene ? '100%' : i === scene ? `${Math.round(progress * 100)}%` : '0%' }} />
            </div>
          ))}
        </div>
        <span className="absolute top-[8%] left-[5%] z-30 rounded-full border border-white/15 bg-black/35 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
          {reel.emoji} {reel.subject}
        </span>
        <span className={`absolute top-[7.6%] right-[5%] z-30 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold shadow-lg transition-colors ${
          soundOn ? 'bg-white/90 text-navy' : 'animate-pulse bg-saffron text-white'}`}>
          {soundOn ? <><Volume2 className="h-3 w-3" /> Sound on</> : <><VolumeX className="h-3 w-3" /> Tap for sound</>}
        </span>

        <div className="pointer-events-none absolute inset-x-[5%] bottom-[12%] z-20 flex justify-center">
          <div className="max-w-full rounded-2xl border border-white/10 bg-black/45 px-3 py-2 backdrop-blur-md">
            <Caption key={`${scene}-${lang}`} text={say} frac={progress} accent={accent.hex} />
          </div>
        </div>
        <div className="absolute inset-x-[5%] bottom-[4%] z-20 flex items-center justify-between gap-2">
          <p className="truncate text-xs font-bold text-white">{reel.title[lang]}</p>
          <Link href={`/shorts?reel=${reel.id}`} onClick={e => e.stopPropagation()}
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-navy transition-transform hover:scale-105">
            Open in Shorts <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
