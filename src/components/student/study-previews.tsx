'use client';

// Live previews that sit beside the study studios' create forms. They show what the
// tool will make — flipping cards, a revision sheet with a mind map, an exam paper with
// a running clock, a week of the study plan — and react to what is typed in the form.

import { useEffect, useState, type ReactNode } from 'react';
import { Check, Flag, Timer } from 'lucide-react';
import { THEMES, type StudyTheme } from './study-shell';

const EMOJI = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

/** 0…n-1, advancing every `ms`. */
function useTick(n: number, ms: number) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setI(v => (v + 1) % n), ms);
    return () => window.clearInterval(id);
  }, [n, ms]);
  return i;
}

function Frame({ theme, label, children }: { theme: StudyTheme; label: string; children: ReactNode }) {
  const t = THEMES[theme];
  return (
    <aside aria-hidden className="relative overflow-hidden rounded-3xl border border-card-border bg-gradient-to-br from-white to-off-white p-5 shadow-card lg:sticky lg:top-24 dark:border-dark-border dark:from-dark-surface dark:to-dark-bg dark:shadow-card-dark">
      <span className={`pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br ${t.cover} opacity-20 blur-2xl`} />
      <p className={`relative mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] ${t.text}`}>
        <span className="relative flex h-2 w-2"><span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${t.dot} opacity-60`} /><span className={`relative inline-flex h-2 w-2 rounded-full ${t.dot}`} /></span>
        {label}
      </p>
      <div className="relative">{children}</div>
    </aside>
  );
}

// ── Flashcards ───────────────────────────────────────────────────────

const SAMPLES: [string, string][] = [
  ['What does chlorophyll do?', 'It traps the Sun’s energy for photosynthesis ☀️'],
  ['State Newton’s second law', 'Force = mass × acceleration (F = ma)'],
  ['Capital of Maharashtra?', 'Mumbai'],
];
const LADDER = ['Today', '1 day', '3 days', '7 days', '21 days'];

export function FlashPreview({ topic, count, grade, language }: { topic: string; count: number; grade: string; language: string }) {
  const tick = useTick(SAMPLES.length * 2, 2600);
  const i = Math.floor(tick / 2), flipped = tick % 2 === 1;
  const t = topic.trim();
  const front = t ? `Key idea ${i + 1} of “${t.slice(0, 40)}”` : SAMPLES[i][0];
  const back = t ? 'The answer, written for your class ✨' : SAMPLES[i][1];
  const step = useTick(LADDER.length, 1100);
  return (
    <Frame theme="flash" label="Live preview · your deck">
      <div className="relative mx-auto h-56 max-w-sm [perspective:900px]">
        <div className="absolute inset-x-6 top-5 h-48 rotate-[5deg] rounded-2xl bg-indigo-300/50 dark:bg-indigo-400/20" />
        <div className="absolute inset-x-3 top-3 h-48 -rotate-[4deg] rounded-2xl bg-violet-300/60 dark:bg-violet-400/25" />
        <div className="absolute inset-0 transition-transform duration-700 [transform-style:preserve-3d]" style={{ transform: flipped ? 'rotateY(180deg)' : 'none' }}>
          <div className="absolute inset-0 flex flex-col justify-between rounded-2xl border border-indigo-100 bg-white p-5 shadow-xl [backface-visibility:hidden] dark:border-indigo-400/20 dark:bg-dark-surface">
            <span className="w-fit rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">Question</span>
            <p className="font-heading text-xl font-bold leading-snug text-navy dark:text-dark-text" dir="auto">{front}</p>
            <span className="text-[11px] text-muted">Tap to flip ↻</span>
          </div>
          <div className="absolute inset-0 flex flex-col justify-between rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 p-5 text-white shadow-xl [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <span className="w-fit rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">Answer</span>
            <p className="font-heading text-xl font-bold leading-snug" dir="auto">{back}</p>
            <div className="flex gap-1.5 text-[11px] font-semibold">
              {['Again', 'Good', 'Easy'].map(l => <span key={l} className={`rounded-full px-2.5 py-0.5 ${l === 'Good' ? 'bg-white text-indigo-600' : 'bg-white/20'}`}>{l}</span>)}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6">
        <p className="mb-2 text-xs font-semibold text-navy dark:text-dark-text">Each card comes back just before you forget it</p>
        <div className="flex items-center">
          {LADDER.map((l, k) => (
            <div key={l} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-500 ${k <= step ? 'scale-110 bg-indigo-500 text-white shadow' : 'bg-indigo-500/10 text-indigo-400'}`}>{k <= step ? <Check className="h-3 w-3" /> : k + 1}</span>
                <span className="text-[10px] text-muted">{l}</span>
              </div>
              {k < LADDER.length - 1 && <span className={`mx-1 mb-4 h-0.5 flex-1 rounded-full transition-colors duration-500 ${k < step ? 'bg-indigo-500' : 'bg-indigo-500/15'}`} />}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-4 text-xs text-muted">{count} cards · Class {grade} · {language}</p>
    </Frame>
  );
}

// ── Revision notes ───────────────────────────────────────────────────

export function NotesPreview({ topic, grade, language }: { topic: string; grade: string; language: string }) {
  const step = useTick(6, 900);
  const title = topic.trim() ? topic.trim().slice(0, 36) : 'Photosynthesis';
  const nodes: [number, number, string, string][] = [[20, 18, '☀️ Light', '#F59E0B'], [80, 18, '💧 Water', '#0EA5E9'], [20, 82, '🍬 Sugar', '#EC4899'], [80, 82, '🫧 Oxygen', '#10B981']];
  const show = (n: number) => `transition-all duration-500 ${step >= n ? 'translate-y-0 opacity-100' : 'translate-y-1.5 opacity-0'}`;
  return (
    <Frame theme="notes" label="Live preview · your sheet">
      <div className="relative mx-auto max-w-sm rounded-2xl bg-white p-5 shadow-xl ring-1 ring-black/5 dark:bg-dark-surface dark:ring-white/10">
        <span aria-hidden className="absolute right-0 top-0 h-8 w-8 rounded-bl-2xl rounded-tr-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 shadow-sm dark:from-emerald-500/20 dark:to-emerald-500/10" />
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-300">Class {grade} · {language}</p>
        <h3 className="mt-1 font-heading text-xl font-extrabold text-navy dark:text-dark-text" dir="auto">{title}</h3>
        <div className="mt-1 h-1 w-10 rounded-full bg-emerald-500" />
        <ul className="mt-3 space-y-1.5">
          {[78, 92, 64].map((w, k) => (
            <li key={k} className={`flex items-center gap-2 ${show(k)}`}>
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
              <span className="h-2 rounded-full bg-navy/15 dark:bg-white/15" style={{ width: `${w}%` }} />
            </li>
          ))}
        </ul>
        <div className={`mt-3 inline-block rounded-lg bg-emerald-500/10 px-2.5 py-1 font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 ${show(3)}`}>6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂</div>
        <div className={`relative mt-3 h-36 rounded-xl bg-emerald-500/[0.06] ${show(4)}`}>
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
            {nodes.map(([x, y, , c], k) => <line key={k} x1="50" y1="50" x2={x} y2={y} stroke={c} strokeWidth="1.2" strokeLinecap="round" />)}
          </svg>
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500 px-3 py-1.5 text-[11px] font-bold text-white shadow-lg">🌱 {title.split(' ')[0]}</span>
          {nodes.map(([x, y, label, c]) => (
            <span key={label} className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold shadow dark:bg-dark-bg" style={{ left: `${x}%`, top: `${y}%`, color: c, fontFamily: EMOJI }}>{label}</span>
          ))}
        </div>
        <div className={`mt-3 flex items-center gap-2 rounded-lg border border-dashed border-emerald-300 px-3 py-2 text-[11px] text-navy dark:border-emerald-400/30 dark:text-dark-text ${show(5)}`}>
          <span className="rounded bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white">Self-check</span> Where does the oxygen come from?
        </div>
      </div>
    </Frame>
  );
}

// ── Mock tests ───────────────────────────────────────────────────────

export function MockPreview({ subject, grade, minutes, summary, marks }: { subject: string; grade: string; minutes: number; summary: string; marks: number }) {
  const [secs, setSecs] = useState(minutes * 60);
  useEffect(() => {
    setSecs(minutes * 60);
    const id = window.setInterval(() => setSecs(s => (s <= 5 ? minutes * 60 : s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [minutes]);
  const pick = useTick(4, 1300);
  const opts = ['Carbon dioxide', 'Oxygen', 'Nitrogen', 'Hydrogen'];
  const chosen = pick >= 1 ? 1 : -1;
  const checked = pick >= 2;
  return (
    <Frame theme="mock" label="Live preview · your exam paper">
      <div className="mx-auto max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-dark-surface dark:ring-white/10">
        <div className="flex items-center justify-between bg-gradient-to-r from-orange-500 to-rose-500 px-4 py-3 text-white">
          <div>
            <p className="font-heading text-sm font-bold" dir="auto">{subject.trim() || 'Science'} · Class {grade}</p>
            <p className="text-[11px] text-white/80">{summary} · {marks} marks</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-black/25 px-2.5 py-1 font-mono text-xs font-bold tabular-nums"><Timer className="h-3.5 w-3.5" />{String(Math.floor(secs / 60)).padStart(2, '0')}:{String(secs % 60).padStart(2, '0')}</span>
        </div>
        <div className="space-y-2 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-300">Question 4 · 1 mark</p>
          <p className="font-heading text-[15px] font-semibold text-navy dark:text-dark-text">Which gas do plants release during photosynthesis?</p>
          {opts.map((o, k) => {
            const right = checked && k === 1;
            return (
              <div key={o} className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm transition-all duration-300 ${right ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : chosen === k ? 'border-orange-500 bg-orange-500/10 text-orange-700 dark:text-orange-300' : 'border-card-border text-navy dark:border-dark-border dark:text-dark-text'}`}>
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${right ? 'bg-emerald-500 text-white' : chosen === k ? 'bg-orange-500 text-white' : 'bg-gray-100 text-muted dark:bg-dark-border'}`}>{right ? <Check className="h-3 w-3" /> : String.fromCharCode(65 + k)}</span>
                {o}
              </div>
            );
          })}
          <div className="flex items-center gap-1 pt-1">
            {Array.from({ length: 10 }, (_, k) => <span key={k} className={`h-1.5 flex-1 rounded-full ${k < 3 ? 'bg-orange-500' : k === 3 ? 'bg-orange-300' : 'bg-gray-200 dark:bg-dark-border'}`} />)}
          </div>
        </div>
      </div>
    </Frame>
  );
}

// ── Study planner ────────────────────────────────────────────────────

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TASKS: { e: string; c: string }[][] = [
  [], [{ e: '🎬', c: 'bg-indigo-500' }, { e: '🃏', c: 'bg-pink-500' }], [{ e: '🎬', c: 'bg-indigo-500' }, { e: '📝', c: 'bg-orange-500' }],
  [{ e: '🔁', c: 'bg-emerald-500' }, { e: '📝', c: 'bg-orange-500' }], [{ e: '🎬', c: 'bg-indigo-500' }, { e: '🃏', c: 'bg-pink-500' }, { e: '🔁', c: 'bg-emerald-500' }],
  [{ e: '📝', c: 'bg-orange-500' }, { e: '🏁', c: 'bg-amber-500' }], [{ e: '🔁', c: 'bg-emerald-500' }],
];

export function PlannerPreview({ examName, examDate, today, hours, daysOff, subjects }: { examName: string; examDate: string; today: string; hours: number; daysOff: number[]; subjects: number }) {
  const left = Math.max(0, Math.round((Date.parse(examDate) - Date.parse(today)) / 86_400_000));
  const done = useTick(9, 800);
  let seen = 0;
  return (
    <Frame theme="plan" label="Live preview · your plan">
      <div className="mx-auto max-w-sm">
        <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 p-4 text-white shadow-lg">
          <div className="text-center">
            <p className="font-heading text-4xl font-extrabold leading-none tabular-nums">{left}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/80">days to go</p>
          </div>
          <span className="h-10 w-px bg-white/30" />
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 truncate font-heading text-sm font-bold" dir="auto"><Flag className="h-4 w-4 shrink-0" />{examName.trim() || 'Your exam'}</p>
            <p className="text-[11px] text-white/80">{hours < 1 ? '30 min' : `${hours} h`} a day · {subjects} subject{subjects === 1 ? '' : 's'}</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-1.5">
          {DAYS.map((d, k) => {
            const off = daysOff.includes(k);
            return (
              <div key={d} className={`rounded-xl border p-1.5 text-center ${off ? 'border-dashed border-card-border bg-transparent dark:border-dark-border' : 'border-card-border bg-white shadow-sm dark:border-dark-border dark:bg-dark-surface'}`}>
                <p className="text-[10px] font-bold text-muted">{d}</p>
                <div className="mt-1 flex min-h-[64px] flex-col items-center gap-1">
                  {off ? <span className="mt-4 text-[10px] text-muted">rest 🌿</span> : TASKS[k].map((t, j) => {
                    const n = seen++;
                    const ok = n < done;
                    return (
                      <span key={j} className={`relative flex h-5 w-5 items-center justify-center rounded-md text-[10px] transition-all duration-500 ${ok ? `${t.c} text-white` : 'bg-gray-100 dark:bg-dark-border'}`}>
                        {ok ? <Check className="h-3 w-3" /> : <span style={{ fontFamily: EMOJI }}>{t.e}</span>}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted">
          <span>🎬 Lesson</span><span>📝 Practice</span><span>🔁 Revise</span><span>🃏 Cards</span><span>🏁 Mock</span>
        </div>
      </div>
    </Frame>
  );
}
