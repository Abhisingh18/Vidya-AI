'use client';

// Tiny looping demos shown on the landing page's feature cards — a glimpse of each
// tool at work. Each one steps through a short script on a timer, only while it
// is on screen.

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Check, Mic } from 'lucide-react';
import { REELS } from '@/lib/reels';
import { MotionStage } from '@/components/motion/motion-stage';
import { slidePalette } from '@/components/teacher/slide-diagram';
import type { SceneMotion } from '@/lib/motion';

export type FeatureDemoId = 'video' | 'reels' | 'doubt' | 'flashcards' | 'notes' | 'mock' | 'planner' | 'xp';

/** Step counter 0…n-1 that advances every `ms` while `on`. */
function useStep(n: number, ms: number, on: boolean) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!on) return;
    const id = window.setInterval(() => setStep(s => (s + 1) % n), ms);
    return () => window.clearInterval(id);
  }, [n, ms, on]);
  return step;
}

const shown = (on: boolean) => `transition-all duration-500 ${on ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`;

// ── demos ───────────────────────────────────────────────────────────

const ORBIT: SceneMotion = { kind: 'orbit', items: [{ emoji: '☀️', label: 'सूरज' }, { emoji: '🌍', label: 'पृथ्वी' }, { emoji: '', label: 'गुरुत्व' }] };
const VIDEO_LINES = ['पृथ्वी सूरज के चारों ओर घूमती है…', 'सूरज का गुरुत्वाकर्षण उसे खींचता है…', 'इसलिए वह कक्षा में रहती है!'];

function VideoDemo({ on }: { on: boolean }) {
  const step = useStep(4, 2200, on);
  const beat = Math.min(step, 2);
  return (
    <div className="relative mx-auto h-full w-full max-w-[17rem] overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-card-border dark:bg-dark-bg dark:ring-dark-border">
      <div className="absolute inset-x-0 top-0 bottom-9">{on && <MotionStage motion={ORBIT} beat={beat} p={slidePalette('saffron')} fit />}</div>
      <div className="absolute inset-x-2 bottom-2 rounded-md bg-navy/90 px-2 py-1 text-center text-[10px] font-medium text-white">{VIDEO_LINES[Math.min(step, 2)]}</div>
      <span className="absolute right-2 top-2 rounded-full bg-saffron/10 px-1.5 py-0.5 text-[9px] font-bold text-saffron">🔊 हिंदी</span>
      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-card-border dark:bg-dark-border"><div className="h-full bg-saffron transition-all duration-[2200ms] ease-linear" style={{ width: `${((step + 1) / 4) * 100}%` }} /></div>
    </div>
  );
}

const REEL_SHOTS = (['photosynthesis', 'black-hole', 'lightning', 'volcano'] as const).map(id => {
  const r = REELS.find(x => x.id === id)!;
  return { src: r.scenes[0].image!.src, headline: r.scenes[0].headline.en.replace(/\*/g, ''), emoji: r.emoji };
});

function ReelsDemo({ on }: { on: boolean }) {
  const step = useStep(REEL_SHOTS.length, 1800, on);
  return (
    <div className="relative mx-auto h-full aspect-[9/16] overflow-hidden rounded-[1rem] bg-black shadow-md ring-4 ring-navy dark:ring-black">
      <div className="absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ transform: `translateY(-${step * 100}%)` }}>
        {REEL_SHOTS.map((s, i) => (
          <div key={i} className="relative h-full w-full">
            {on || i === 0
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={s.src} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" draggable={false} />
              : null}
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-black/70 to-transparent" />
            <p className="absolute inset-x-1.5 top-4 text-center text-[10px] font-black leading-tight text-white">{s.headline}</p>
            <span className="absolute bottom-2 left-1.5 text-[11px]">{s.emoji}</span>
          </div>
        ))}
      </div>
      <div className="absolute inset-x-1.5 top-1.5 flex gap-0.5">{REEL_SHOTS.map((_, i) => <span key={i} className={`h-0.5 flex-1 rounded-full ${i <= step ? 'bg-white' : 'bg-white/30'}`} />)}</div>
      <span className="absolute bottom-2 right-1.5 animate-bounce text-[10px] text-white">⬆</span>
    </div>
  );
}

function DoubtDemo({ on }: { on: boolean }) {
  const step = useStep(6, 1100, on);
  const steps = ['Subtract 5 from both sides: 2x = 10', 'Divide both sides by 2: x = 5'];
  return (
    <div className="flex h-full flex-col justify-end gap-1.5 px-1 text-[10px]">
      <div className="ml-auto flex items-center gap-1.5 rounded-xl rounded-br-sm bg-saffron px-2.5 py-1.5 text-white">
        <span className="rounded bg-white/90 px-1.5 py-0.5 font-mono text-[10px] text-navy">📷 2x + 5 = 15</span>
        <Mic className="h-3 w-3 animate-pulse" />
      </div>
      {step === 1 && (
        <div className="flex w-fit gap-1 rounded-xl rounded-bl-sm bg-white px-2.5 py-2 shadow-sm dark:bg-dark-bg">
          {[0, 1, 2].map(i => <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted" style={{ animationDelay: `${i * 120}ms` }} />)}
        </div>
      )}
      <div className={`w-fit max-w-[92%] space-y-1 rounded-xl rounded-bl-sm bg-white px-2.5 py-1.5 text-navy shadow-sm dark:bg-dark-bg dark:text-dark-text ${step >= 2 ? '' : 'hidden'}`}>
        {steps.map((s, i) => <p key={s} className={shown(step >= 2 + i)}><b className="text-saffron">Step {i + 1}.</b> {s}</p>)}
        <p className={`font-bold text-success ${shown(step >= 4)}`}>✅ Answer: x = 5</p>
      </div>
    </div>
  );
}

function FlashcardDemo({ on }: { on: boolean }) {
  const step = useStep(4, 1500, on);
  const flipped = step >= 1 && step <= 2;
  const rated = step === 2;
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2">
      <div className="h-[62%] w-[78%] [perspective:600px]">
        <div className="relative h-full w-full transition-transform duration-700 [transform-style:preserve-3d]" style={{ transform: flipped ? 'rotateY(180deg)' : 'none' }}>
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white p-2 text-center text-[11px] font-semibold text-navy shadow-md [backface-visibility:hidden] dark:bg-dark-bg dark:text-dark-text">
            What does chlorophyll do? 🌿
          </div>
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-teal to-emerald-600 p-2 text-center text-[11px] font-semibold text-white shadow-md [backface-visibility:hidden] [transform:rotateY(180deg)]">
            It traps the Sun’s energy for photosynthesis ☀️
          </div>
        </div>
      </div>
      <div className="flex gap-1 text-[9px] font-semibold">
        {['Again', 'Good', 'Easy'].map(l => (
          <span key={l} className={`rounded-full px-2 py-0.5 transition-all ${rated && l === 'Good' ? 'scale-110 bg-saffron text-white' : 'bg-white text-muted dark:bg-dark-bg'}`}>{l}</span>
        ))}
      </div>
      <p className={`text-[9px] text-muted ${shown(rated)}`}>Next review in 3 days</p>
    </div>
  );
}

function NotesDemo({ on }: { on: boolean }) {
  const step = useStep(6, 900, on);
  const branches: [number, number, string][] = [[24, 16, '☀️ Light'], [76, 16, '💧 Water'], [24, 84, '🍬 Sugar'], [76, 84, '🫧 O₂']];
  return (
    <div className="flex h-full gap-2">
      <div className="flex-1 space-y-0.5 rounded-lg bg-white p-2 text-[9px] leading-snug text-navy shadow-sm dark:bg-dark-bg dark:text-dark-text">
        <p className="font-heading text-[10px] font-bold">Photosynthesis ✍️</p>
        {['In chloroplasts', 'Sunlight + water + CO₂', 'Makes sugar + O₂'].map((t, i) => (
          <p key={t} className={shown(step > i)}>• {t}</p>
        ))}
        <p className={`rounded bg-saffron/10 px-1 py-0.5 font-mono text-[8px] leading-tight text-saffron ${shown(step > 3)}`}>6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂</p>
      </div>
      <svg viewBox="0 0 100 100" className="h-full w-[46%] overflow-visible">
        {branches.map(([x, y], i) => (
          <line key={i} x1={50} y1={50} x2={x} y2={y} stroke="#FF6B2C" strokeWidth={1.6} strokeLinecap="round"
            pathLength={1} strokeDasharray={1} strokeDashoffset={step > i + 1 ? 0 : 1} style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
        ))}
        <circle cx={50} cy={50} r={12} fill="#FF6B2C" />
        <text x={50} y={51} textAnchor="middle" dominantBaseline="central" fontSize={10}>🌱</text>
        {branches.map(([x, y, l], i) => (
          <g key={l} style={{ opacity: step > i + 1 ? 1 : 0, transition: 'opacity 0.4s' }}>
            <rect x={x - 21} y={y - 7.5} width={42} height={15} rx={7.5} className="fill-white dark:fill-[#1E1E34]" stroke="#FF6B2C" strokeWidth={0.7} />
            <text x={x} y={y + 0.5} textAnchor="middle" dominantBaseline="central" fontSize={8} fontWeight={600} className="fill-navy dark:fill-white">{l}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function MockDemo({ on }: { on: boolean }) {
  const step = useStep(5, 1100, on);
  const [secs, setSecs] = useState(598);
  useEffect(() => {
    if (!on) return;
    const id = window.setInterval(() => setSecs(s => (s <= 540 ? 598 : s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [on]);
  const options = ['Carbon dioxide', 'Oxygen', 'Nitrogen'];
  const chosen = step >= 2 ? 1 : step === 1 ? 0 : -1;
  return (
    <div className="flex h-full flex-col gap-1.5 text-[10px]">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-navy dark:text-dark-text">Q4 of 10</span>
        <span className="rounded-full bg-navy px-2 py-0.5 font-mono text-[9px] text-white dark:bg-black/50">⏱ {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}</span>
      </div>
      <p className="font-medium text-navy dark:text-dark-text">Which gas do plants release in sunlight?</p>
      {options.map((o, i) => {
        const right = step >= 3 && i === 1;
        return (
          <div key={o} className={`flex items-center justify-between rounded-md border px-2 py-0.5 transition-all ${
            right ? 'border-success bg-success/10 text-success' : chosen === i ? 'border-saffron bg-saffron/10 text-saffron' : 'border-card-border bg-white text-muted dark:border-dark-border dark:bg-dark-bg'}`}>
            {String.fromCharCode(65 + i)}. {o} {right && <Check className="h-3 w-3" />}
          </div>
        );
      })}
      <div className="mt-auto h-1.5 overflow-hidden rounded-full bg-card-border dark:bg-dark-border">
        <div className="h-full rounded-full bg-success transition-all duration-700" style={{ width: step >= 3 ? '80%' : '70%' }} />
      </div>
      <p className="text-right text-[9px] font-semibold text-success">Score {step >= 3 ? '8' : '7'}/10</p>
    </div>
  );
}

function PlannerDemo({ on }: { on: boolean }) {
  const step = useStep(5, 1100, on);
  const tasks = ['🎬 Watch: Light — reflection', '🃏 Flashcards: 15 cards', '🏁 Mock test: Chapter 10'];
  return (
    <div className="flex h-full flex-col gap-1.5 text-[10px]">
      <div className="grid grid-cols-7 gap-0.5 text-center text-[8px] font-semibold">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <span key={i} className={`rounded py-0.5 ${i === 2 ? 'bg-saffron text-white' : i < 2 ? 'bg-success/15 text-success' : 'bg-white text-muted dark:bg-dark-bg'}`}>{d}</span>
        ))}
      </div>
      {tasks.map((t, i) => {
        const done = step > i;
        return (
          <div key={t} className="flex items-center gap-1.5 rounded-md bg-white px-1.5 py-1 shadow-sm dark:bg-dark-bg">
            <span className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border-2 transition-all ${done ? 'border-teal bg-teal text-white' : 'border-card-border dark:border-dark-border'}`}>
              {done && <Check className="h-2.5 w-2.5" />}
            </span>
            <span className={`truncate transition-colors ${done ? 'text-muted line-through' : 'text-navy dark:text-dark-text'}`}>{t}</span>
          </div>
        );
      })}
      <span className={`mt-auto w-fit rounded-full bg-success/15 px-2 py-0.5 text-[9px] font-bold text-success ${shown(step >= 3)}`}>✅ On track for exam day</span>
    </div>
  );
}

function XpDemo({ on }: { on: boolean }) {
  const step = useStep(4, 1400, on);
  const gained = step >= 1;
  const board = gained && step >= 2
    ? [['Ananya', 1420], ['You', 1380], ['Rohan', 1360]] as const
    : [['Ananya', 1420], ['Rohan', 1360], ['You', 1360]] as const;
  return (
    <div className="flex h-full flex-col gap-1.5 text-[10px]">
      <div className="relative flex items-center gap-2">
        <span className="rounded-full bg-amber-400/20 px-2 py-0.5 font-bold text-amber-600">🔥 7-day streak</span>
        <span className={`rounded-full bg-indigo-brand/10 px-2 py-0.5 font-bold text-indigo-brand transition-all ${step >= 3 ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>🏅 Quiz Master</span>
        <span key={step} className={`absolute right-0 -top-1 font-black text-saffron ${step === 1 ? 'animate-fade-in-up' : 'opacity-0'}`}>+20 XP</span>
      </div>
      <div>
        <div className="flex justify-between text-[9px] text-muted"><span>Level 6</span><span>{gained ? 1380 : 1360} / 1500 XP</span></div>
        <div className="mt-0.5 h-2 overflow-hidden rounded-full bg-card-border dark:bg-dark-border">
          <div className="h-full rounded-full bg-gradient-to-r from-saffron to-amber-400 transition-all duration-700" style={{ width: gained ? '92%' : '90.7%' }} />
        </div>
      </div>
      <div className="space-y-0.5">
        {board.map(([name, xp], i) => (
          <div key={name} className={`flex items-center justify-between rounded-md px-1.5 py-0.5 transition-all duration-500 ${name === 'You' ? 'bg-saffron/15 font-bold text-saffron' : 'bg-white text-navy dark:bg-dark-bg dark:text-dark-text'}`}>
            <span>#{i + 1} {name}</span><span>{name === 'You' && gained ? 1380 : xp}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const DEMOS: Record<FeatureDemoId, (p: { on: boolean }) => ReactNode> = {
  video: VideoDemo, reels: ReelsDemo, doubt: DoubtDemo, flashcards: FlashcardDemo,
  notes: NotesDemo, mock: MockDemo, planner: PlannerDemo, xp: XpDemo,
};

/** A feature card's demo panel; plays while on screen. */
export default function FeatureDemo({ id }: { id: FeatureDemoId }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const Demo = DEMOS[id];
  return (
    <div ref={ref} aria-hidden className="mb-4 h-36 overflow-hidden rounded-xl bg-gradient-to-br from-off-white to-saffron/[0.06] p-3 ring-1 ring-card-border dark:from-dark-bg dark:to-saffron/[0.06] dark:ring-dark-border">
      <Demo on={on} />
    </div>
  );
}
