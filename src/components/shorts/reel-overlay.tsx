'use client';

// Animated diagrams drawn over (or instead of) a reel scene's photo. `progress`
// (0–1) is how far the narration of the scene has got, so parts appear as they
// are spoken about; the rest is CSS animation (globals.css, reel-*).

import type { ReelOverlay } from '@/lib/reels';

const EMOJI = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
const ACCENT = '#FFB347';

const on = (progress: number, at: number) => progress >= at;

/** A right triangle with legs 3 (vertical) and 4 (horizontal), unit u, right angle at (px, py). */
function triangle(u: number, px: number, py: number) {
  const P = [px, py], B = [px + 4 * u, py], C = [px, py - 3 * u];
  // square on the hypotenuse, outward
  const B2 = [B[0] + 3 * u, B[1] - 4 * u], C2 = [C[0] + 3 * u, C[1] - 4 * u];
  return { P, B, C, B2, C2 };
}

const pts = (...ps: number[][]) => ps.map(p => p.join(',')).join(' ');

function Pythagoras({ kind, progress }: { kind: 'pyth-triangle' | 'pyth-squares' | 'pyth-345'; progress: number }) {
  const u = kind === 'pyth-triangle' ? 30 : 22;
  const { P, B, C, B2, C2 } = kind === 'pyth-triangle' ? triangle(u, 110, 290) : triangle(u, 150, 250);
  const squares = kind !== 'pyth-triangle';
  const grid = kind === 'pyth-345';
  const label = (x: number, y: number, text: string, size = 30, color = '#fff') => (
    <text x={x} y={y} fill={color} fontSize={size} fontWeight={900} textAnchor="middle" dominantBaseline="central"
      stroke="#0008" strokeWidth={size * 0.18} paintOrder="stroke" className="font-heading reel-pop-in">{text}</text>
  );
  const gridLines = (o: number[], ax: number[], ay: number[], n: number, color: string) => (
    <g stroke={color} strokeWidth={1.4} opacity={0.8}>
      {Array.from({ length: n - 1 }, (_, i) => {
        const k = (i + 1) / n;
        return (
          <g key={i}>
            <line x1={o[0] + ax[0] * k} y1={o[1] + ax[1] * k} x2={o[0] + ax[0] * k + ay[0]} y2={o[1] + ax[1] * k + ay[1]} />
            <line x1={o[0] + ay[0] * k} y1={o[1] + ay[1] * k} x2={o[0] + ay[0] * k + ax[0]} y2={o[1] + ay[1] * k + ax[1]} />
          </g>
        );
      })}
    </g>
  );
  const vb = kind === 'pyth-triangle' ? '70 160 260 170' : '60 70 270 290';
  return (
    <svg viewBox={vb} className="w-full h-full overflow-visible" aria-hidden>
      {squares && on(progress, 0.15) && (
        <g className="reel-grow-in" style={{ transformOrigin: `${P[0]}px ${(P[1] + C[1]) / 2}px` }}>
          <rect x={P[0] - 3 * u} y={C[1]} width={3 * u} height={3 * u} fill="#60A5FA55" stroke="#93C5FD" strokeWidth={3} />
          {grid && gridLines([P[0] - 3 * u, C[1]], [3 * u, 0], [0, 3 * u], 3, '#BFDBFE')}
          {label(P[0] - 1.5 * u, C[1] + 1.5 * u, grid ? '9' : 'a²', 26)}
        </g>
      )}
      {squares && on(progress, 0.35) && (
        <g className="reel-grow-in" style={{ transformOrigin: `${(P[0] + B[0]) / 2}px ${P[1]}px` }}>
          <rect x={P[0]} y={P[1]} width={4 * u} height={4 * u} fill="#34D39955" stroke="#6EE7B7" strokeWidth={3} />
          {grid && gridLines([P[0], P[1]], [4 * u, 0], [0, 4 * u], 4, '#A7F3D0')}
          {label(P[0] + 2 * u, P[1] + 2 * u, grid ? '16' : 'b²', 28)}
        </g>
      )}
      {squares && on(progress, 0.55) && (
        <g className="reel-grow-in" style={{ transformOrigin: `${(B[0] + C[0]) / 2}px ${(B[1] + C[1]) / 2}px` }}>
          <polygon points={pts(C, B, B2, C2)} fill="#FB923C55" stroke="#FDBA74" strokeWidth={3} />
          {grid && gridLines(C, [B[0] - C[0], B[1] - C[1]], [C2[0] - C[0], C2[1] - C[1]], 5, '#FED7AA')}
          {label((C[0] + B2[0]) / 2, (C[1] + B2[1]) / 2, grid ? '25' : 'c²', 32)}
        </g>
      )}
      <polygon points={pts(P, B, C)} fill={squares ? '#ffffff22' : '#ffffff1f'} stroke="#fff" strokeWidth={kind === 'pyth-triangle' ? 5 : 4}
        strokeLinejoin="round" className="reel-draw-in" pathLength={100} />
      <polyline points={pts([P[0] + u * 0.55, P[1]], [P[0] + u * 0.55, P[1] - u * 0.55], [P[0], P[1] - u * 0.55])} fill="none" stroke={ACCENT} strokeWidth={3} />
      {kind === 'pyth-triangle' && (
        <>
          {on(progress, 0.3) && label(P[0] - 22, (P[1] + C[1]) / 2, 'a', 34, '#93C5FD')}
          {on(progress, 0.45) && label((P[0] + B[0]) / 2, P[1] + 26, 'b', 34, '#6EE7B7')}
          {on(progress, 0.62) && label((B[0] + C[0]) / 2 + 22, (B[1] + C[1]) / 2 - 22, 'c', 38, ACCENT)}
          {on(progress, 0.62) && <line x1={C[0]} y1={C[1]} x2={B[0]} y2={B[1]} stroke={ACCENT} strokeWidth={7} strokeLinecap="round" className="reel-draw-in" pathLength={100} />}
        </>
      )}
      {grid && (
        <>
          {label(P[0] - 3 * u - 16, (P[1] + C[1]) / 2, '3', 22, '#93C5FD')}
          {label((P[0] + B[0]) / 2, P[1] + 4 * u + 16, '4', 22, '#6EE7B7')}
          {on(progress, 0.6) && label((B[0] + C[0]) / 2 - 16, (B[1] + C[1]) / 2 + 12, '5', 24, ACCENT)}
        </>
      )}
      {squares && on(progress, 0.78) && label(194, 352, grid ? '9 + 16 = 25' : 'a² + b² = c²', 28, ACCENT)}
    </svg>
  );
}

const SPECTRUM = [
  ['V', '#8B5CF6'], ['I', '#4F46E5'], ['B', '#3B82F6'], ['G', '#22C55E'], ['Y', '#FACC15'], ['O', '#FB923C'], ['R', '#EF4444'],
] as const;

function Vibgyor({ progress }: { progress: number }) {
  return (
    <svg viewBox="0 0 400 300" className="w-full h-full overflow-visible" aria-hidden>
      <line x1={0} y1={150} x2={150} y2={150} stroke="#fff" strokeWidth={9} strokeLinecap="round" className="reel-draw-in" pathLength={100} />
      <polygon points="150,70 205,190 95,190" fill="#ffffff30" stroke="#fff" strokeWidth={4} strokeLinejoin="round" />
      {SPECTRUM.map(([letter, color], i) => {
        const y = 60 + i * 30;
        const show = on(progress, 0.08 + i * 0.1);
        return show ? (
          <g key={letter} className="reel-pop-in">
            <line x1={170} y1={150} x2={330} y2={y} stroke={color} strokeWidth={8} strokeLinecap="round" className="reel-draw-in" pathLength={100} />
            <circle cx={350} cy={y} r={14} fill={color} />
            <text x={350} y={y + 1} fill="#fff" fontSize={16} fontWeight={900} textAnchor="middle" dominantBaseline="central" className="font-heading">{letter}</text>
          </g>
        ) : null;
      })}
    </svg>
  );
}

function Charges({ progress }: { progress: number }) {
  const plus = [[18, 30], [34, 24], [50, 28], [66, 25], [26, 40], [44, 37], [60, 39], [76, 34]];
  const minus = [[16, 70], [32, 75], [48, 72], [64, 76], [80, 71], [24, 82], [56, 84], [72, 83]];
  const sign = (x: number, y: number, s: string, color: string, i: number, at: number) => on(progress, at) && (
    <g key={`${s}${i}`} className="reel-pop-in" style={{ animationDelay: `${i * 70}ms` }}>
      <circle cx={x} cy={y} r={4.6} fill={color} opacity={0.9} />
      <text x={x} y={y + 0.4} fill="#fff" fontSize={7} fontWeight={900} textAnchor="middle" dominantBaseline="central">{s}</text>
    </g>
  );
  return (
    <svg viewBox="0 0 96 160" preserveAspectRatio="xMidYMid slice" className="w-full h-full" aria-hidden>
      <g transform="translate(0 6)">
        {plus.map(([x, y], i) => sign(x, y, '+', '#EF4444', i, 0.05))}
        {minus.map(([x, y], i) => sign(x, y, '−', '#3B82F6', i, 0.45))}
      </g>
      {on(progress, 0.85) && (
        <polyline points="48,92 40,108 50,110 38,132 54,112 44,110 52,94" fill="#FDE68A" stroke="#fff" strokeWidth={1} className="reel-flash" />
      )}
    </svg>
  );
}

function Winds({ progress }: { progress: number }) {
  const paths = ['M30 330 C 120 300, 200 230, 270 120', 'M70 360 C 170 330, 250 260, 320 150', 'M120 380 C 220 360, 300 290, 360 190'];
  return (
    <svg viewBox="0 0 400 400" className="w-full h-full overflow-visible" aria-hidden>
      <defs>
        <marker id="reel-wind-head" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0 0 L10 5 L0 10 z" fill="#E0F2FE" />
        </marker>
      </defs>
      {paths.map((d, i) => on(progress, 0.1 + i * 0.18) && (
        <path key={i} d={d} fill="none" stroke="#E0F2FE" strokeWidth={9} strokeLinecap="round" strokeDasharray="22 16"
          markerEnd="url(#reel-wind-head)" className="reel-wind" style={{ animationDelay: `${i * 0.25}s` }} />
      ))}
      {on(progress, 0.55) && <text x={300} y={70} fontSize={54} textAnchor="middle" className="reel-pop-in" style={{ fontFamily: EMOJI }}>🌧️</text>}
      {on(progress, 0.2) && <text x={60} y={300} fontSize={40} textAnchor="middle" className="reel-pop-in" style={{ fontFamily: EMOJI }}>💨</text>}
    </svg>
  );
}

function HalfHalf({ progress }: { progress: number }) {
  const chip = (emoji: string, at: number, delay = 0) => on(progress, at) && (
    <div className="reel-pop-in flex flex-col items-center" style={{ animationDelay: `${delay}ms` }}>
      <span className="text-[64px] leading-none" style={{ fontFamily: EMOJI }}>{emoji}</span>
    </div>
  );
  return (
    <div className="w-full h-full flex items-center justify-center gap-2 text-white font-heading font-black">
      {chip('👩', 0.05)}
      {on(progress, 0.1) && <span className="reel-pop-in text-2xl rounded-full bg-white/20 px-2 py-0.5">½</span>}
      {on(progress, 0.3) && <span className="reel-pop-in text-4xl">+</span>}
      {chip('👨', 0.3, 80)}
      {on(progress, 0.35) && <span className="reel-pop-in text-2xl rounded-full bg-white/20 px-2 py-0.5">½</span>}
      {on(progress, 0.6) && <span className="reel-pop-in text-4xl">=</span>}
      {chip('🧒', 0.6, 80)}
    </div>
  );
}

export default function ReelOverlayView({ overlay, progress }: { overlay: ReelOverlay; progress: number }) {
  switch (overlay) {
    case 'pyth-triangle':
    case 'pyth-squares':
    case 'pyth-345': return <Pythagoras kind={overlay} progress={progress} />;
    case 'vibgyor': return <Vibgyor progress={progress} />;
    case 'charges': return <Charges progress={progress} />;
    case 'winds': return <Winds progress={progress} />;
    case 'half-half': return <HalfHalf progress={progress} />;
  }
}

/** Overlays that cover the whole frame rather than the picture area. */
export const FULL_FRAME_OVERLAYS: ReelOverlay[] = ['charges'];
