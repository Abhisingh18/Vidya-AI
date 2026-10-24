'use client';

// Bigger, richer looping demos for the landing page's feature showcase (flashcards,
// mock test, XP). Built on the same frame and tick as the teacher create-page demos.

import { Check, Clock, Flame, Trophy } from 'lucide-react';
import { chip, Frame, useTick } from '@/components/teacher/create-demos';
import ScoreRing from '@/components/ui/score-ring';

// ── Flashcards: flip, grade, next card ───────────────────────────────

const CARDS = [
  { e: '🌿', q: 'What does chlorophyll do?', a: 'Traps sunlight for photosynthesis' },
  { e: '⚡', q: 'State Ohm’s law', a: 'V = I × R' },
];

export function FlashcardsRich() {
  const t = useTick(1100, 8); // 4 beats per card
  const ci = t < 4 ? 0 : 1;
  const beat = t % 4;
  const flipped = beat === 1 || beat === 2;
  const graded = beat === 3;
  const c = CARDS[ci];
  return (
    <Frame label="Flashcards · live preview" footer={<>
      <span className={chip}>Spaced repetition</span>
      <span className={chip}><Flame className="ph-flame h-3 w-3 text-orange-300" /> {ci + (graded ? 1 : 0) + 2} in a row</span>
      <span className="ml-auto text-[11px] text-white/50">{ci + 1} / 2</span>
    </>}>
      <div className="relative mx-auto max-w-sm [perspective:900px]">
        <div key={ci} className="ph-rise relative h-48 [transform-style:preserve-3d] transition-transform duration-700 sm:h-56" style={{ transform: flipped ? 'rotateY(180deg)' : 'none' }}>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl bg-white p-4 text-center shadow-2xl [backface-visibility:hidden]">
            <span className="ph-float text-5xl">{c.e}</span>
            <p className="font-heading text-lg font-extrabold text-navy">{c.q}</p>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-saffron">tap to flip</span>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-gradient-to-br from-saffron to-rose-500 p-4 text-center text-white shadow-2xl [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <span className="rounded-full bg-white/20 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider">Answer</span>
            <p className="font-heading text-lg font-extrabold">{c.a}</p>
          </div>
        </div>
        {graded && <span className="ph-pop absolute -top-3 right-2 rounded-full bg-emerald-400 px-3 py-1 text-xs font-bold text-white shadow-lg">+10 XP</span>}
      </div>
      <div className="mx-auto mt-4 flex max-w-sm gap-2">
        {[['Again', '<10m'], ['Hard', '1d'], ['Good', '3d'], ['Easy', '7d']].map(([l, d]) => (
          <div key={l} className={`flex-1 rounded-xl border-2 py-1.5 text-center text-[11px] font-bold transition-all duration-300 ${graded && l === 'Good' ? 'scale-110 border-teal bg-teal text-white' : 'border-white/15 bg-white/10 text-white/70'}`}>
            {l}<span className="block text-[9px] font-medium opacity-70">{d}</span>
          </div>
        ))}
      </div>
    </Frame>
  );
}

// ── Mock test: timer, answer, score ring ─────────────────────────────

export function MockRich() {
  const t = useTick(1000, 11);
  const result = t >= 6;
  const beat = t;
  return (
    <Frame label="Mock test · live preview" footer={<>
      <span className={chip}>Timed</span>
      <span className={chip}>AI-graded written answers</span>
      <span className="ml-auto text-[11px] text-white/50">chapter-wise report</span>
    </>}>
      {!result ? (
        <div className="rounded-2xl bg-white p-4 text-navy shadow-2xl sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex items-center gap-1 font-mono text-sm font-bold text-saffron"><Clock className="h-4 w-4" /> 29:{String(59 - beat).padStart(2, '0')}</span>
            <div className="ml-auto h-1.5 w-28 overflow-hidden rounded-full bg-saffron/15"><div className="h-full rounded-full bg-saffron transition-all duration-1000 ease-linear" style={{ width: `${100 - beat * 4}%` }} /></div>
          </div>
          <p className="text-sm font-semibold sm:text-base">Which mirror gives a magnified, upright image?</p>
          <div className="mt-3 grid gap-2">
            {['Convex', 'Concave', 'Plane', 'Cylindrical'].map((o, i) => {
              const sel = beat >= 3 && i === 1;
              const ok = beat >= 5 && i === 1;
              return (
                <div key={o} className={`flex items-center gap-2.5 rounded-lg border-2 p-1.5 text-xs transition-all duration-300 sm:text-sm ${beat >= 1 ? 'ph-rise' : 'opacity-0'} ${ok ? 'border-teal bg-teal/10' : sel ? 'border-saffron bg-saffron/10' : 'border-card-border'}`} style={{ animationDelay: `${i * 0.1}s` }}>
                  <span className={`flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold ${ok ? 'bg-teal text-white' : sel ? 'bg-saffron text-white' : 'bg-off-white text-muted'}`}>{ok ? <Check className="h-3.5 w-3.5" /> : String.fromCharCode(65 + i)}</span>{o}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div key="res" className="ph-rise rounded-2xl bg-white p-4 text-navy shadow-2xl sm:p-5">
          <div className="flex items-center gap-4">
            <ScoreRing pct={86} size={104} label="score" />
            <div className="min-w-0 flex-1 space-y-2 text-xs">
              {[['Light', 92], ['Electricity', 84], ['Magnetism', 72]].map(([n, v], i) => (
                <div key={n as string}>
                  <div className="flex justify-between font-semibold"><span>{n}</span><span className="text-muted">{v}%</span></div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-off-white"><div className="h-full origin-left rounded-full bg-teal" style={{ width: `${v}%`, animation: `phGrowX 1s ${0.3 + i * 0.25}s both` }} /></div>
                </div>
              ))}
            </div>
          </div>
          <p className="ph-pop mt-3 inline-flex items-center gap-1.5 rounded-full bg-saffron/10 px-3 py-1 text-xs font-bold text-saffron" style={{ animationDelay: '.6s' }}><Trophy className="h-3.5 w-3.5" /> +40 XP · Outstanding!</p>
        </div>
      )}
    </Frame>
  );
}

// ── XP: level ring, streak, leaderboard ──────────────────────────────

const BOARD = [['Aarav', 940], ['You', 880], ['Meera', 860]] as const;

export function XpRich() {
  const t = useTick(1100, 8);
  const xp = Math.min(100, 30 + t * 12);
  const up = t >= 5;
  const r = 44, len = 2 * Math.PI * r;
  const you = up ? 980 : 880;
  const rows = [...BOARD.map(([n, v]) => [n, n === 'You' ? you : v] as [string, number])].sort((a, b) => b[1] - a[1]);
  return (
    <Frame label="XP & streaks · live preview" footer={<>
      <span className={chip}><Flame className="ph-flame h-3 w-3 text-orange-300" /> 7-day streak</span>
      <span className={chip}>Badges</span>
      <span className="ml-auto text-[11px] text-white/50">class leaderboard</span>
    </>}>
      <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
        <div className="relative mx-auto flex h-32 w-32 items-center justify-center rounded-2xl bg-white/10 p-2">
          <svg width="108" height="108" className="-rotate-90">
            <circle cx="54" cy="54" r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="9" />
            <circle cx="54" cy="54" r={r} fill="none" stroke="#FF6B1A" strokeWidth="9" strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - xp / 100)} style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.22,1,.36,1)' }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <span key={up ? 'u' : 'n'} className={`font-heading text-2xl font-extrabold ${up ? 'ph-pop' : ''}`}>{up ? 'Lv 5' : 'Lv 4'}</span>
            <span className="text-[10px] text-white/60">{xp}% to next</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex gap-1.5">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <div key={i} className={`flex h-8 flex-1 items-center justify-center rounded-lg text-[10px] font-bold transition-all duration-500 ${i <= Math.min(6, t) ? 'bg-gradient-to-b from-saffron to-orange-600 text-white shadow-saffron' : 'bg-white/10 text-white/40'}`}>{i <= Math.min(6, t) ? '🔥' : d}</div>
            ))}
          </div>
          <ul className="space-y-1.5">
            {rows.map(([n, v], i) => (
              <li key={n} className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-700 ${n === 'You' ? 'bg-saffron text-white shadow-saffron' : 'bg-white/10 text-white/80'}`}>
                <span className="w-4 text-center">{['🥇', '🥈', '🥉'][i]}</span><span className="flex-1">{n}</span><span className="tabular-nums">{v} XP</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Frame>
  );
}

// ── Revision notes: one-liner, key points, formula, mind map ─────────

const BRANCHES = [
  { l: 'Inputs', e: '☀️', x: 14, y: 20, c: '#FF6B1A' },
  { l: 'Outputs', e: '🍬', x: 86, y: 20, c: '#6366F1' },
  { l: 'Where', e: '🍃', x: 50, y: 88, c: '#14B8A6' },
];

export function NotesRich() {
  const t = useTick(1300, 8);
  return (
    <Frame label="Revision notes · live preview" footer={<>
      <span className={chip}>Mind map</span>
      <span className={chip}>Formulas</span>
      <span className={chip}>Printable</span>
    </>}>
      <div className="rounded-2xl bg-white p-4 text-navy shadow-2xl sm:p-5">
        <div className={`rounded-xl bg-gradient-to-r from-saffron/15 to-indigo-brand/10 p-3 transition-all duration-500 ${t >= 0 ? 'ph-rise' : ''}`}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-saffron">In one line</p>
          <p className="font-heading text-sm font-extrabold sm:text-base">Plants turn light, water and CO₂ into food and oxygen.</p>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <ol className="space-y-1.5 text-xs">
            {['Happens in chloroplasts', 'Needs sunlight', 'Releases oxygen'].map((k, i) => (
              <li key={k} className={`flex items-center gap-2 transition-all duration-500 ${t >= i + 1 ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-saffron text-[10px] font-bold text-white">{i + 1}</span>{k}
              </li>
            ))}
            <li className={`mt-2 rounded-lg bg-[#1a1a2e] px-3 py-2 font-heading text-[11px] font-bold text-white transition-all duration-500 ${t >= 4 ? 'ph-pop' : 'opacity-0'}`}>6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂</li>
          </ol>
          <div className="relative h-32 rounded-xl bg-off-white">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
              {BRANCHES.map((b, i) => (
                <line key={b.l} x1="50" y1="50" x2={b.x} y2={b.y} stroke={b.c} strokeWidth="1.2" strokeDasharray="60" strokeDashoffset={t >= 5 + Math.min(i, 2) * 0 ? 0 : 60} style={{ transition: `stroke-dashoffset 0.8s ${i * 0.25}s ease-out` }} />
              ))}
            </svg>
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-gradient-to-br from-saffron to-orange-600 px-2 py-1 text-[10px] font-bold text-white shadow-saffron">🌱 Photosynthesis</span>
            {BRANCHES.map((b, i) => (
              <span key={b.l} className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-md border bg-white px-1.5 py-0.5 text-[10px] font-bold transition-all duration-500 ${t >= 5 ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}
                style={{ left: `${b.x}%`, top: `${b.y}%`, borderColor: b.c, color: b.c, transitionDelay: `${0.3 + i * 0.25}s` }}>{b.e} {b.l}</span>
            ))}
          </div>
        </div>
        <p className={`mt-3 rounded-lg bg-teal/10 px-3 py-1.5 text-[11px] font-semibold text-teal transition-all duration-500 ${t >= 7 ? 'ph-pop' : 'opacity-0'}`}>✅ Q: Where does it happen? — Chloroplasts</p>
      </div>
    </Frame>
  );
}
