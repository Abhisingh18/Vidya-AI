'use client';

// Looping, animated previews of what each teacher tool makes: a slide deck advancing,
// a quiz being answered, a lesson period filling up. Shown beside the create form so
// a teacher sees the result before generating. Pure React state + CSS (globals.css, ph-*).

import { useEffect, useState, type ReactNode } from 'react';
import { Check, Download, GraduationCap, Play, Users } from 'lucide-react';

/** 0 … n-1, advancing every `ms`; stays on the last frame for people who prefer reduced motion. */
export function useTick(ms: number, n: number) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setT(n - 1); return; }
    const id = setInterval(() => setT(x => (x + 1) % n), ms);
    return () => clearInterval(id);
  }, [ms, n]);
  return t;
}

export function Frame({ label, children, footer }: { label: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="ph-float relative overflow-hidden rounded-3xl bg-[#1a1a2e] p-3 shadow-card sm:p-4" aria-hidden>
      <div className="pointer-events-none absolute inset-0">
        <div className="gen-aurora absolute -left-16 -top-20 h-64 w-64 rounded-full bg-saffron/35 blur-[90px]" />
        <div className="gen-aurora absolute -bottom-16 -right-10 h-60 w-60 rounded-full bg-rose-500/25 blur-[90px] [animation-delay:-8s]" />
      </div>
      <div className="relative">
        <div className="mb-3 flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" /><span className="h-2.5 w-2.5 rounded-full bg-amber-300" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="ml-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/60">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-saffron" /> {label}
          </span>
        </div>
        {children}
        {footer && <div className="mt-3 flex flex-wrap items-center gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export const chip = 'inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/80 backdrop-blur';

// ── Slides ───────────────────────────────────────────────────────────

const SLIDE_NAMES = ['Title', 'Key idea', 'Diagram', 'Summary'];

export function SlidesDemo() {
  const t = useTick(3200, 4);
  return (
    <Frame label="Slides · live preview" footer={<>
      <span className={chip}><Play className="h-3 w-3" /> Present</span>
      <span className={chip}><Download className="h-3 w-3" /> .pptx</span>
      <span className="ml-auto text-[11px] text-white/50">every slide editable</span>
    </>}>
      <div className="flex gap-3">
        <div className="hidden w-16 shrink-0 flex-col gap-2 sm:flex">
          {SLIDE_NAMES.map((n, i) => (
            <div key={n} className={`flex aspect-video items-center justify-center rounded-md border text-[9px] font-bold transition-all duration-500 ${t === i ? 'scale-105 border-saffron bg-white text-saffron shadow-saffron' : 'border-white/10 bg-white/10 text-white/50'}`}>{i + 1}</div>
          ))}
        </div>
        <div className="relative aspect-video flex-1 overflow-hidden rounded-xl bg-white p-4 text-navy shadow-2xl sm:p-6">
          <span className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-saffron/10" />
          <div key={t} className="relative h-full">
            {t === 0 && (
              <div className="flex h-full flex-col justify-center">
                <span className="ph-pop text-4xl">🌿</span>
                <p className="ph-rise font-heading text-2xl font-extrabold leading-tight sm:text-3xl" style={{ animationDelay: '.15s' }}>Photosynthesis</p>
                <span className="ph-rise mt-2 h-1 w-14 rounded-full bg-saffron" style={{ animationDelay: '.3s' }} />
                <p className="ph-rise mt-2 text-xs text-muted" style={{ animationDelay: '.45s' }}>Class 7 · Science</p>
              </div>
            )}
            {t === 1 && (
              <div>
                <p className="ph-rise font-heading text-lg font-extrabold sm:text-xl">☀️ How plants make food</p>
                <ul className="mt-3 space-y-2 text-xs sm:text-sm">
                  {['Leaves absorb sunlight', 'Roots lift water upward', 'CO₂ enters through stomata'].map((b, i) => (
                    <li key={b} className="ph-rise flex items-center gap-2" style={{ animationDelay: `${0.25 + i * 0.35}s` }}>
                      <span className="h-2 w-2 rounded-full bg-saffron" />{b}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {t === 2 && (
              <div className="flex h-full flex-col justify-center">
                <p className="ph-rise mb-3 font-heading text-lg font-extrabold">The process</p>
                <div className="flex items-center justify-between gap-1 text-center text-[10px] font-semibold sm:text-xs">
                  {[['☀️', 'Sunlight'], ['🍃', 'Leaf'], ['🍬', 'Glucose'], ['💨', 'Oxygen']].map(([e, l], i) => (
                    <div key={l} className="flex items-center gap-1">
                      <div className="ph-pop rounded-xl border-2 border-saffron/40 bg-saffron/5 px-2 py-2" style={{ animationDelay: `${i * 0.3}s` }}>
                        <div className="text-xl sm:text-2xl">{e}</div>{l}
                      </div>
                      {i < 3 && <span className="ph-rise text-saffron" style={{ animationDelay: `${i * 0.3 + 0.2}s` }}>➜</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {t === 3 && (
              <div>
                <p className="ph-rise font-heading text-lg font-extrabold">✅ Remember</p>
                <ul className="mt-3 space-y-2 text-xs sm:text-sm">
                  {['Light + water + CO₂ → glucose + O₂', 'Chlorophyll traps the light', 'It happens in the chloroplast'].map((b, i) => (
                    <li key={b} className="ph-rise flex items-start gap-2" style={{ animationDelay: `${0.2 + i * 0.35}s` }}>
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal" />{b}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-saffron/15"><div key={t} className="h-full origin-left bg-saffron" style={{ animation: 'phGrowX 3.2s linear both' }} /></div>
        </div>
      </div>
    </Frame>
  );
}

// ── Quizzes ──────────────────────────────────────────────────────────

const QUIZ = [
  { q: 'Which gas do plants take in for photosynthesis?', o: ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Helium'], c: 1, why: 'CO₂ is the raw material for glucose.' },
  { q: 'Chlorophyll is mainly found in the…', o: ['Roots', 'Stem', 'Leaves', 'Seeds'], c: 2, why: 'Leaf cells hold the chloroplasts.' },
];

export function QuizDemo() {
  const t = useTick(1000, 12); // 6 beats per question
  const qi = t < 6 ? 0 : 1;
  const beat = t % 6;
  const q = QUIZ[qi];
  const picked = beat >= 3;
  const right = beat >= 4;
  return (
    <Frame label="Quiz · live preview" footer={<>
      <span className={chip}>MCQ · True/False · Short</span>
      <span className={chip}>Answer key included</span>
      <span className="ml-auto text-[11px] font-semibold text-white/70">Score {right ? qi + 1 : qi}/2</span>
    </>}>
      <div key={qi} className="ph-rise rounded-xl bg-white p-4 text-navy shadow-2xl sm:p-5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-saffron to-orange-600 text-xs font-bold text-white">{qi + 1}</span>
          <span className="rounded-full bg-saffron/10 px-2.5 py-0.5 text-[10px] font-bold text-saffron">1 mark</span>
        </div>
        <p className="mt-2 text-sm font-semibold leading-snug sm:text-base">{q.q}</p>
        <div className="mt-3 grid gap-2">
          {q.o.map((o, i) => {
            const show = beat >= 1;
            const sel = picked && i === q.c;
            const ok = right && i === q.c;
            return (
              <div key={o} className={`flex items-center gap-2.5 rounded-lg border-2 p-1.5 text-xs transition-all duration-300 sm:text-sm ${show ? 'ph-rise' : 'opacity-0'} ${ok ? 'border-teal bg-teal/10' : sel ? 'border-saffron bg-saffron/10' : 'border-card-border'}`} style={{ animationDelay: `${i * 0.12}s` }}>
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold transition-all ${ok ? 'scale-110 bg-teal text-white' : sel ? 'bg-saffron text-white' : 'bg-off-white text-muted'}`}>{ok ? <Check className="h-3.5 w-3.5" /> : String.fromCharCode(65 + i)}</span>
                {o}
              </div>
            );
          })}
        </div>
        <p className={`mt-3 rounded-lg bg-teal/10 px-3 py-2 text-[11px] text-teal transition-all duration-500 sm:text-xs ${beat >= 5 ? 'ph-pop' : 'opacity-0'}`}>💡 {q.why}</p>
      </div>
    </Frame>
  );
}

// ── Lesson plans ─────────────────────────────────────────────────────

const STAGES = [
  { n: 'Hook', m: 5, t: 'Show a wilted plant, ask why', s: 'Guess and discuss', c: 'bg-saffron' },
  { n: 'Explain', m: 15, t: 'Teach the equation on the board', s: 'Take notes, ask questions', c: 'bg-orange-400' },
  { n: 'Activity', m: 15, t: 'Guide the leaf-starch test', s: 'Run the test in pairs', c: 'bg-rose-400' },
  { n: 'Wrap up', m: 5, t: 'Recap and set homework', s: 'Exit ticket', c: 'bg-amber-400' },
];

export function LessonDemo() {
  const t = useTick(1700, 5); // 0..3 = stage in focus, 4 = all done
  const done = t === 4;
  const elapsed = STAGES.slice(0, done ? 4 : t + 1).reduce((a, s) => a + s.m, 0);
  return (
    <Frame label="Lesson plan · live preview" footer={<>
      <span className={chip}>Minute-by-minute</span>
      <span className={chip}>Objectives · Homework</span>
      <span className="ml-auto text-[11px] font-semibold text-white/70">{elapsed} / 40 min</span>
    </>}>
      <div className="rounded-xl bg-white p-4 text-navy shadow-2xl sm:p-5">
        <p className="font-heading text-sm font-extrabold sm:text-base">Photosynthesis · Class 7</p>
        <div className="mt-3 flex h-3 gap-0.5 overflow-hidden rounded-full bg-off-white">
          {STAGES.map((s, i) => (
            <div key={s.n} className="relative overflow-hidden rounded-sm bg-saffron/10" style={{ flexGrow: s.m }}>
              <div className={`absolute inset-y-0 left-0 ${s.c} transition-all duration-[1400ms] ease-out`} style={{ width: done || i <= t ? '100%' : '0%' }} />
            </div>
          ))}
        </div>
        <ol className="mt-4 space-y-2">
          {STAGES.map((s, i) => {
            const on = !done && i === t;
            const past = done || i < t;
            return (
              <li key={s.n} className={`rounded-xl border-2 p-2.5 transition-all duration-500 ${on ? 'border-saffron bg-saffron/5 shadow-saffron' : 'border-card-border'} ${past || on ? '' : 'opacity-40'}`}>
                <div className="flex items-center gap-2">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white ${s.c} ${on ? 'ph-pulse' : ''}`}>{past ? <Check className="h-3.5 w-3.5" /> : i + 1}</span>
                  <span className="text-sm font-bold">{s.n}</span>
                  <span className="ml-auto rounded-full bg-saffron/10 px-2 py-0.5 text-[10px] font-bold text-saffron">{s.m} min</span>
                </div>
                <div className={`grid overflow-hidden text-[11px] transition-all duration-500 sm:text-xs ${on ? 'mt-2 max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <p className="flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5 text-saffron" /> {s.t}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-muted"><Users className="h-3.5 w-3.5 text-saffron" /> {s.s}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </Frame>
  );
}
