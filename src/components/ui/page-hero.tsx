'use client';

// The banner on top of every VidyaAI feature page: a dark stage with a slow saffron aurora,
// a fine grid, subject glyphs drifting past, a gradient-lit title, an icon tile that pulses,
// and optional live stats that count up. One component so the whole app feels like one product.

import { useEffect, useRef, useState, type ReactNode } from 'react';

export interface HeroStat { label: string; value: number; suffix?: string }

const DEFAULT_GLYPHS = ['π', 'E = mc²', '∑', '🧬', '⚛️', 'H₂O', '📐', '🪐'];

function Count({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [n, setN] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setN(to); return; }
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / 1100);
      setN(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [to]);
  return <>{n.toLocaleString('en-IN')}{suffix}</>;
}

const rand = (i: number) => { const s = Math.sin(i * 91.7 + 17.3) * 43758.5453; return s - Math.floor(s); };

export default function PageHero({ icon, eyebrow, title, titleNode, subtitle, stats, action, glyphs = DEFAULT_GLYPHS, children, className = '' }: {
  icon: ReactNode; eyebrow?: ReactNode; title: string; titleNode?: ReactNode; subtitle?: string; stats?: HeroStat[];
  action?: ReactNode; glyphs?: string[]; children?: ReactNode; className?: string;
}) {
  return (
    <header className={`relative overflow-hidden bg-[#1a1a2e] px-5 py-8 text-white sm:px-8 sm:py-10 ${className}`}>
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="gen-aurora absolute -left-24 -top-32 h-96 w-96 rounded-full bg-saffron/40 blur-[110px]" />
        <div className="gen-aurora absolute -right-16 top-0 h-80 w-80 rounded-full bg-rose-500/25 blur-[110px] [animation-delay:-7s]" />
        <div className="gen-aurora absolute bottom-[-6rem] left-1/3 h-72 w-72 rounded-full bg-indigo-brand/25 blur-[110px] [animation-delay:-12s]" />
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '44px 44px' }} />
        {glyphs.map((g, i) => (
          <span key={i} className="ph-drift absolute hidden select-none font-heading font-bold text-white/[0.14] sm:block"
            style={{
              left: `${42 + rand(i) * 54}%`, top: `${8 + rand(i + 9) * 76}%`,
              fontSize: `${18 + rand(i + 3) * 22}px`,
              animationDuration: `${12 + rand(i + 5) * 10}s`, animationDelay: `${-rand(i + 7) * 14}s`,
              filter: rand(i + 2) > 0.65 ? 'blur(1.5px)' : undefined,
            }}>{g}</span>
        ))}
      </div>
      <div className="relative flex flex-wrap items-center gap-x-5 gap-y-4">
        <div className="ph-rise ph-pulse flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-saffron to-orange-600 text-white shadow-saffron [&>svg]:h-7 [&>svg]:w-7">{icon}</div>
        <div className="ph-rise min-w-0 flex-1" style={{ animationDelay: '.08s' }}>
          {eyebrow && <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-saffron">{eyebrow}</p>}
          {titleNode ?? <h1 className="ph-grad-text font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>}
        </div>
        {action && <div className="ph-rise" style={{ animationDelay: '.16s' }}>{action}</div>}
      </div>
      {subtitle && <p className="ph-rise relative mt-4 max-w-xl text-sm text-white/70 sm:text-base" style={{ animationDelay: '.14s' }}>{subtitle}</p>}
      {stats && stats.length > 0 && (
        <div className="relative mt-6 flex flex-wrap gap-3">
          {stats.map((s, i) => (
            <div key={s.label} className="ph-rise rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-2.5 backdrop-blur" style={{ animationDelay: `${0.2 + i * 0.08}s` }}>
              <p className="font-heading text-xl font-extrabold leading-none"><Count to={s.value} suffix={s.suffix} /></p>
              <p className="mt-1 text-[11px] uppercase tracking-wider text-white/55">{s.label}</p>
            </div>
          ))}
        </div>
      )}
      {children && <div className="relative mt-5">{children}</div>}
    </header>
  );
}
