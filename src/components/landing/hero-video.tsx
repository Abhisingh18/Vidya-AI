'use client';

// The landing page's hero "video": one cinematic 16:9 player that teaches six
// subjects in about seven seconds each — every one a live, camera-driven animation
// (zooms, pans, dives, zoom-throughs; no video file) with a chapter title, captions
// in English or Hindi and, after a tap, the teacher's voice. Plays only on screen.

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { EMOJI_FONT } from '@/components/teacher/slide-diagram';
import { usePreviewVoice } from './preview-voice';

type Lang = 'en' | 'hi';
type T2 = Record<Lang, string>;

const SEG_S = 7;
const W = 1600, H = 900, CX = W / 2, CY = H / 2;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ease = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
const easeIn = (x: number) => Math.pow(clamp01(x), 3);
const easeInOut = (x: number) => { const v = clamp01(x); return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2; };
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
/** 0→1 between seconds a and b (eased). */
const span = (t: number, a: number, b: number, f = ease) => f((t - a) / (b - a));
/** Zoom interpolation that feels even (geometric). */
const zlerp = (a: number, b: number, k: number) => a * Math.pow(b / a, k);
const rand = (i: number) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

interface Cam { x: number; y: number; z: number }
/** Camera from keyframes [time, x, y, zoom]. */
function camAt(keys: [number, number, number, number][], t: number): Cam {
  if (t <= keys[0][0]) return { x: keys[0][1], y: keys[0][2], z: keys[0][3] };
  for (let i = 1; i < keys.length; i++) {
    const [t1, x1, y1, z1] = keys[i], [t0, x0, y0, z0] = keys[i - 1];
    if (t <= t1) { const k = easeInOut((t - t0) / (t1 - t0)); return { x: lerp(x0, x1, k), y: lerp(y0, y1, k), z: zlerp(z0, z1, k) }; }
  }
  const l = keys[keys.length - 1];
  return { x: l[1], y: l[2], z: l[3] };
}
const camT = (c: Cam) => `translate(${CX} ${CY}) scale(${c.z}) translate(${-c.x} ${-c.y})`;
const proj = (c: Cam, x: number, y: number): [number, number] => [CX + (x - c.x) * c.z, CY + (y - c.y) * c.z];

function Txt({ x, y, size, children, color = '#fff', weight = 800, opacity = 1, anchor = 'middle' }: {
  x: number; y: number; size: number; children: ReactNode; color?: string; weight?: number; opacity?: number; anchor?: 'start' | 'middle' | 'end';
}) {
  if (opacity <= 0.01) return null;
  return (
    <text x={x} y={y} fontSize={size} fontWeight={weight} fill={color} opacity={opacity} textAnchor={anchor} dominantBaseline="central"
      className="font-heading" stroke="#07070E" strokeWidth={size * 0.2} paintOrder="stroke" strokeLinejoin="round">{children}</text>
  );
}

/** A callout label that pops in, with a thin leader line to (ax, ay). */
function Callout({ x, y, ax, ay, k, children, color = '#fff', size = 30 }: { x: number; y: number; ax: number; ay: number; k: number; children: ReactNode; color?: string; size?: number }) {
  if (k <= 0.01) return null;
  return (
    <g opacity={k}>
      <line x1={ax} y1={ay} x2={lerp(ax, x, k)} y2={lerp(ay, y, k)} stroke={color} strokeWidth={2.5} strokeOpacity={0.7} />
      <circle cx={ax} cy={ay} r={6} fill={color} />
      <Txt x={x} y={y} size={size} color={color} weight={700}>{children}</Txt>
    </g>
  );
}

function Stars({ n = 90, t, drift = 0 }: { n?: number; t: number; drift?: number }) {
  return (
    <g>
      {Array.from({ length: n }, (_, i) => (
        <circle key={i} cx={(rand(i) * W + drift * t * (0.3 + rand(i + 9))) % W} cy={rand(i + 50) * H} r={0.8 + rand(i + 99) * 1.8}
          fill="#fff" opacity={0.25 + 0.45 * (0.5 + 0.5 * Math.sin(t * 2 + i))} />
      ))}
    </g>
  );
}

// ── 1. Maths: what is π? ─────────────────────────────────────────────

function PiScene({ t, lang }: { t: number; lang: Lang }) {
  const r = 140, d = 2 * r, C = Math.PI * d, ground = 600, x0 = 300;
  const p = span(t, 1.2, 3.9, easeInOut);
  const cx = x0 + p * C, cy = ground - r, rot = p * 360;
  const cam = camAt([[0, 760, 450, 1.12], [1.2, 760, 450, 1.12], [3.9, 800, 440, 1], [4.6, 1150, 590, 2.3], [5.5, 1150, 590, 2.3], [6.3, 800, 430, 1]], t);
  const ticks = [1, 2, 3].map(k => ({ k, x: x0 + k * d, on: cx >= x0 + k * d }));
  const draw = span(t, 0.1, 0.9);
  const [px, py] = proj(cam, x0 + 3 * d + 0.07 * d, ground + 40);
  return (
    <g>
      <g transform={camT(cam)}>
        <line x1={120} y1={ground} x2={1480} y2={ground} stroke="#ffffff22" strokeWidth={4} vectorEffect="non-scaling-stroke" />
        <line x1={x0} y1={ground} x2={cx} y2={ground} stroke="#FFB347" strokeWidth={10} strokeLinecap="round" />
        {ticks.map(({ k, x, on }) => on && (
          <g key={k}>
            <line x1={x} y1={ground - 22} x2={x} y2={ground + 22} stroke="#fff" strokeWidth={4} />
            <Txt x={x - d / 2} y={ground + 50} size={34} color="#FDE68A">{k === 1 ? 'd' : `${k}d`}</Txt>
          </g>
        ))}
        {p >= 1 && <line x1={x0 + 3 * d} y1={ground} x2={x0 + C} y2={ground} stroke="#F472B6" strokeWidth={12} strokeLinecap="round" />}
        <g transform={`translate(${cx} ${cy}) rotate(${rot})`}>
          <circle r={r} fill="#FF6B2C14" stroke="#ffffff30" strokeWidth={4} />
          <circle r={r} fill="none" stroke="#FFB347" strokeWidth={10} pathLength={1} strokeDasharray={`${(1 - p) * draw} 1`} transform="rotate(90)" strokeLinecap="round" />
          <line x1={-r} y1={0} x2={r} y2={0} stroke="#93C5FD" strokeWidth={6} opacity={span(t, 0.5, 1)} />
          <circle r={9} fill="#fff" />
        </g>
        <Txt x={cx} y={cy - r - 40} size={38} color="#93C5FD" opacity={span(t, 0.6, 1) * (1 - span(t, 1.3, 1.6))}>d = 1</Txt>
      </g>
      <Txt x={px} y={py} size={34} color="#F9A8D4" opacity={span(t, 4.7, 5.1) * (1 - span(t, 5.6, 5.9))}>+ 0.14…</Txt>
      <Txt x={CX} y={130} size={92} color="#FFB347" opacity={span(t, 5.9, 6.4)}>π = 3.14159…</Txt>
      <Txt x={CX} y={215} size={34} weight={600} color="#C7C7DA" opacity={span(t, 6.2, 6.6)}>{lang === 'hi' ? 'परिधि = π × व्यास' : 'circumference = π × diameter'}</Txt>
    </g>
  );
}

// ── 2. Physics: zoom out from Earth to the Solar System ───────────────

const PLANETS = [
  { r: 95, size: 4, color: '#A8A29E', en: 'Mercury', hi: 'बुध' }, { r: 150, size: 7, color: '#FCD34D', en: 'Venus', hi: 'शुक्र' },
  { r: 215, size: 9, color: '#3B82F6', en: 'Earth', hi: 'पृथ्वी' }, { r: 285, size: 6, color: '#EF4444', en: 'Mars', hi: 'मंगल' },
  { r: 420, size: 21, color: '#F59E0B', en: 'Jupiter', hi: 'बृहस्पति' }, { r: 560, size: 17, color: '#FDE68A', en: 'Saturn', hi: 'शनि', ring: true },
  { r: 680, size: 12, color: '#67E8F9', en: 'Uranus', hi: 'अरुण' }, { r: 790, size: 12, color: '#6366F1', en: 'Neptune', hi: 'वरुण' },
];
const TILT = 0.4;

function SolarScene({ t, lang }: { t: number; lang: Lang }) {
  const pos = (r: number, i: number) => {
    const a = 0.6 * i + t * 0.9 * Math.pow(215 / r, 1.5);
    return [CX + r * Math.cos(a), CY + r * TILT * Math.sin(a)] as const;
  };
  const E = pos(215, 2);
  const k = span(t, 1.1, 4.8, easeInOut);
  const z = zlerp(7, 0.96, k);
  const cam: Cam = { x: lerp(E[0], CX, easeInOut((t - 1.1) / 3.7)), y: lerp(E[1], CY, easeInOut((t - 1.1) / 3.7)), z };
  const ma = t * 3.2, moon = [E[0] + 22 * Math.cos(ma), E[1] + 22 * 0.9 * Math.sin(ma)];
  const [ex, ey] = proj(cam, E[0], E[1]);
  const [mx, my] = proj(cam, moon[0], moon[1]);
  return (
    <g>
      <Stars t={t} />
      <defs>
        <radialGradient id="hv-sun"><stop offset="0" stopColor="#FFF7CC" /><stop offset="0.45" stopColor="#FDBA2D" /><stop offset="1" stopColor="#F97316" /></radialGradient>
        <radialGradient id="hv-glow"><stop offset="0" stopColor="#FDBA2D" stopOpacity="0.55" /><stop offset="1" stopColor="#FDBA2D" stopOpacity="0" /></radialGradient>
      </defs>
      <g transform={camT(cam)}>
        {PLANETS.map(p => <ellipse key={p.en} cx={CX} cy={CY} rx={p.r} ry={p.r * TILT} fill="none" stroke="#ffffff" strokeOpacity={0.14} strokeWidth={1.4} vectorEffect="non-scaling-stroke" />)}
        <circle cx={CX} cy={CY} r={120} fill="url(#hv-glow)" />
        <circle cx={CX} cy={CY} r={46} fill="url(#hv-sun)" />
        {PLANETS.map((p, i) => {
          const [x, y] = pos(p.r, i);
          return (
            <g key={p.en}>
              {p.ring && <ellipse cx={x} cy={y} rx={p.size * 2} ry={p.size * 0.6} fill="none" stroke="#FDE68A" strokeWidth={3} opacity={0.8} />}
              <circle cx={x} cy={y} r={p.size} fill={p.color} />
              <circle cx={x - p.size * 0.3} cy={y - p.size * 0.35} r={p.size * 0.35} fill="#fff" opacity={0.35} />
            </g>
          );
        })}
        <ellipse cx={E[0]} cy={E[1]} rx={22} ry={19.8} fill="none" stroke="#fff" strokeOpacity={0.25} strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
        <circle cx={moon[0]} cy={moon[1]} r={2.6} fill="#E5E7EB" />
      </g>
      <Txt x={ex} y={ey + 100} size={36} opacity={1 - span(t, 1.4, 2)}>{lang === 'hi' ? '🌍 पृथ्वी' : '🌍 Earth'}</Txt>
      <Txt x={mx + 70} y={my - 40} size={30} color="#D1D5DB" opacity={1 - span(t, 1.4, 2)}>{lang === 'hi' ? 'चाँद' : 'Moon'}</Txt>
      {PLANETS.map((p, i) => {
        const [x, y] = proj(cam, ...pos(p.r, i));
        return <Txt key={p.en} x={x} y={y - 30} size={22} weight={600} color="#C7C7DA" opacity={span(t, 4.9 + i * 0.08, 5.3 + i * 0.08)}>{p[lang]}</Txt>;
      })}
      <Txt x={CX} y={95} size={60} opacity={span(t, 4.6, 5.1)}>{lang === 'hi' ? '☀️ सूरज और 8 ग्रह' : '☀️ The Sun & 8 planets'}</Txt>
    </g>
  );
}

// ── 3. Chemistry: dive into an atom ──────────────────────────────────

function Molecule({ x, y, s, a }: { x: number; y: number; s: number; a: number }) {
  const h = (ang: number) => [x + Math.cos(ang) * 30 * s, y + Math.sin(ang) * 30 * s];
  const [h1x, h1y] = h(a + 0.91), [h2x, h2y] = h(a + Math.PI - 0.91);
  return (
    <g>
      <line x1={x} y1={y} x2={h1x} y2={h1y} stroke="#fff" strokeOpacity={0.6} strokeWidth={6 * s} />
      <line x1={x} y1={y} x2={h2x} y2={h2y} stroke="#fff" strokeOpacity={0.6} strokeWidth={6 * s} />
      <circle cx={x} cy={y} r={22 * s} fill="#EF4444" />
      <circle cx={h1x} cy={h1y} r={13 * s} fill="#E0F2FE" />
      <circle cx={h2x} cy={h2y} r={13 * s} fill="#E0F2FE" />
    </g>
  );
}

function AtomScene({ t, lang }: { t: number; lang: Lang }) {
  // layer A: the drop (zooms past)
  const aZ = 1 + easeIn((t - 0.9) / 1.3) * 9, aO = 1 - span(t, 1.5, 2.2);
  // layer B: molecules (zoom in from far, then past)
  const bZ = t < 2.4 ? lerp(0.3, 1, span(t, 1.5, 2.4)) : 1 + easeIn((t - 2.9) / 0.95) * 8;
  const bO = span(t, 1.5, 2.1) * (1 - span(t, 3.3, 3.85));
  // layer C: the atom
  const cZ = lerp(0.25, 1, span(t, 3.3, 4.3));
  const cO = span(t, 3.3, 3.9);
  const sc = (z: number) => `translate(${CX} ${CY}) scale(${z}) translate(${-CX} ${-CY})`;
  const molecules = Array.from({ length: 26 }, (_, i) => ({
    x: CX + (rand(i) - 0.5) * 1500, y: CY + (rand(i + 7) - 0.5) * 820, s: 0.8 + rand(i + 3) * 0.7, a: rand(i + 11) * 6 + t * (rand(i + 5) - 0.5) * 2,
  }));
  const e1 = [0, Math.PI].map(o => [CX + 150 * Math.cos(t * 2.6 + o), CY + 150 * 0.55 * Math.sin(t * 2.6 + o)]);
  const e2 = Array.from({ length: 6 }, (_, i) => {
    const a = t * 1.6 + (i * Math.PI) / 3;
    const rx = 290, ry = 290 * 0.42;
    const tilt = -0.35;
    const ex = rx * Math.cos(a), ey = ry * Math.sin(a);
    return [CX + ex * Math.cos(tilt) - ey * Math.sin(tilt), CY + ex * Math.sin(tilt) + ey * Math.cos(tilt)];
  });
  const nucleons = Array.from({ length: 16 }, (_, i) => {
    const ang = i * 2.4, rr = 14 * Math.sqrt(i + 0.5);
    return { x: CX + rr * Math.cos(ang), y: CY + rr * Math.sin(ang), proton: i % 2 === 0 };
  });
  return (
    <g>
      <defs>
        <radialGradient id="hv-drop" cx="0.4" cy="0.35"><stop offset="0" stopColor="#BAE6FD" /><stop offset="0.6" stopColor="#38BDF8" /><stop offset="1" stopColor="#0369A1" /></radialGradient>
      </defs>
      {aO > 0.01 && (
        <g transform={sc(aZ)} opacity={aO}>
          <path d={`M${CX} ${CY - 230} C ${CX + 60} ${CY - 120}, ${CX + 170} ${CY - 10}, ${CX + 170} ${CY + 80} A 170 170 0 0 1 ${CX - 170} ${CY + 80} C ${CX - 170} ${CY - 10}, ${CX - 60} ${CY - 120}, ${CX} ${CY - 230} Z`} fill="url(#hv-drop)" />
          <ellipse cx={CX - 60} cy={CY + 20} rx={30} ry={60} fill="#fff" opacity={0.35} transform={`rotate(20 ${CX - 60} ${CY + 20})`} />
        </g>
      )}
      {bO > 0.01 && (
        <g transform={sc(bZ)} opacity={bO}>
          {molecules.map((m, i) => <Molecule key={i} {...m} />)}
          <Molecule x={CX} y={CY} s={1.8} a={t * 0.6} />
        </g>
      )}
      {cO > 0.01 && (
        <g transform={sc(cZ)} opacity={cO}>
          <circle cx={CX} cy={CY} r={150} fill="none" stroke="#6EE7B7" strokeOpacity={0.4} strokeWidth={3} transform={`translate(0 0)`} style={{ transformOrigin: `${CX}px ${CY}px` }} />
          <ellipse cx={CX} cy={CY} rx={150} ry={82.5} fill="none" stroke="#6EE7B7" strokeOpacity={0.45} strokeWidth={3} />
          <ellipse cx={CX} cy={CY} rx={290} ry={121.8} fill="none" stroke="#A5B4FC" strokeOpacity={0.45} strokeWidth={3} transform={`rotate(${-0.35 * 57.3} ${CX} ${CY})`} />
          <circle cx={CX} cy={CY} r={95} fill="#EF444422" />
          {nucleons.map((n, i) => <circle key={i} cx={n.x} cy={n.y} r={17} fill={n.proton ? '#EF4444' : '#9CA3AF'} stroke="#07070E" strokeWidth={2} />)}
          {[...e1, ...e2].map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r={18} fill="#FDE68A" opacity={0.25} /><circle cx={x} cy={y} r={10} fill="#FDE68A" /></g>)}
        </g>
      )}
      <Txt x={CX} y={110} size={44} opacity={(1 - span(t, 1.2, 1.6)) * span(t, 0.1, 0.5)}>{lang === 'hi' ? '💧 पानी की एक बूँद' : '💧 One drop of water'}</Txt>
      <Txt x={CX} y={110} size={44} opacity={span(t, 2.1, 2.5) * (1 - span(t, 3.1, 3.4))}>{lang === 'hi' ? 'अरबों अणु — H₂O' : 'Billions of H₂O molecules'}</Txt>
      <Txt x={CX} y={95} size={52} color="#6EE7B7" opacity={span(t, 4.2, 4.6)}>{lang === 'hi' ? 'ऑक्सीजन परमाणु' : 'An oxygen atom'}</Txt>
      <Callout x={CX + 430} y={CY - 250} ax={CX + 40} ay={CY - 40} k={span(t, 4.7, 5.2)} color="#FCA5A5">{lang === 'hi' ? 'नाभिक: 8 प्रोटॉन + 8 न्यूट्रॉन' : 'Nucleus: 8 protons + 8 neutrons'}</Callout>
      <Callout x={CX - 440} y={CY + 170} ax={e2[2][0]} ay={e2[2][1]} k={span(t, 5.3, 5.8)} color="#FDE68A">{lang === 'hi' ? '8 इलेक्ट्रॉन (2, 6)' : '8 electrons in 2 shells (2, 6)'}</Callout>
    </g>
  );
}

// ── 4. Biology: how a neuron fires ───────────────────────────────────

function NeuronScene({ t, lang }: { t: number; lang: Lang }) {
  const y = 450, axon0 = 360, axon1 = 1700;
  const nodes = Array.from({ length: 10 }, (_, i) => lerp(axon0 + 60, axon1 - 40, i / 9));
  // saltatory pulse: hops node to node
  const hop = clamp01((t - 1.3) / 2.9) * (nodes.length - 1);
  const ni = Math.min(nodes.length - 2, Math.floor(hop));
  const px = t < 1.3 ? axon0 : t > 4.2 ? axon1 : lerp(nodes[ni], nodes[ni + 1], easeInOut(hop - ni));
  const cam = camAt([[0, 330, 450, 1.55], [1.3, 420, 450, 1.35], [4.2, 1650, 450, 1.35], [4.6, 1850, 450, 2.5], [5.5, 1850, 450, 2.5], [6.4, 1180, 450, 0.64]], t);
  const live = t >= 1.3 && t <= 4.25;
  const camFollow = live ? { ...cam, x: px } : cam;
  const c = t > 1.3 && t < 4.2 ? camFollow : cam;
  const nt = clamp01((t - 4.3) / 1.1);
  const nextOn = span(t, 5.1, 5.6);
  const terminals = [380, 450, 520];
  const dend = (x: number, yy: number, dir: number, len: number, depth: number): ReactNode => depth === 0 ? null : (
    <g key={`${x}-${yy}-${depth}-${dir}`}>
      <line x1={x} y1={yy} x2={x + Math.cos(dir) * len} y2={yy + Math.sin(dir) * len} stroke="#F9A8D4" strokeWidth={depth * 3} strokeLinecap="round" />
      {dend(x + Math.cos(dir) * len, yy + Math.sin(dir) * len, dir - 0.5, len * 0.66, depth - 1)}
      {dend(x + Math.cos(dir) * len, yy + Math.sin(dir) * len, dir + 0.45, len * 0.66, depth - 1)}
    </g>
  );
  const lab = (x: number, yy: number, s: ReactNode, k: number, color = '#F9A8D4') => {
    const [lx, ly] = proj(c, x, yy);
    return <Txt x={lx} y={ly} size={32} color={color} weight={700} opacity={k}>{s}</Txt>;
  };
  return (
    <g>
      <g transform={camT(c)}>
        {[-2.4, -3.1, 2.4, 3.0, -2.75].map((d, i) => <g key={i}>{dend(300 + Math.cos(d) * 50, y + Math.sin(d) * 50, d, 120, 3)}</g>)}
        <circle cx={300} cy={y} r={62} fill="#DB2777" />
        <circle cx={292} cy={y - 6} r={24} fill="#831843" />
        <line x1={axon0} y1={y} x2={axon1} y2={y} stroke="#F9A8D4" strokeWidth={10} />
        {nodes.slice(0, -1).map((n, i) => (
          <rect key={i} x={n + 14} y={y - 22} width={nodes[i + 1] - n - 28} height={44} rx={22} fill="#FBCFE8" opacity={0.9} />
        ))}
        {terminals.map(ty => (
          <g key={ty}>
            <path d={`M${axon1} ${y} C ${axon1 + 50} ${y}, ${axon1 + 60} ${ty}, ${axon1 + 110} ${ty}`} stroke="#F9A8D4" strokeWidth={8} fill="none" />
            <circle cx={axon1 + 122} cy={ty} r={16} fill="#EC4899" />
          </g>
        ))}
        {terminals.map((ty, i) => Array.from({ length: 4 }, (_, j) => {
          const k = clamp01(nt * 1.4 - j * 0.12);
          return k > 0 && k < 1 ? <circle key={`${i}-${j}`} cx={lerp(axon1 + 140, axon1 + 205, k)} cy={ty + (j - 1.5) * 8} r={5} fill="#FDE68A" /> : null;
        }))}
        <g opacity={0.45 + 0.55 * nextOn}>
          {[-0.4, 0, 0.4].map((d, i) => <line key={i} x1={axon1 + 215} y1={terminals[i]} x2={axon1 + 330} y2={y + d * 60} stroke="#C4B5FD" strokeWidth={9} strokeLinecap="round" />)}
          <circle cx={axon1 + 360} cy={y} r={58} fill="#7C3AED" />
          <circle cx={axon1 + 360} cy={y} r={58 + nextOn * 40} fill="none" stroke="#C4B5FD" strokeWidth={6 * (1 - nextOn) + 1} opacity={nextOn * (1 - span(t, 5.6, 6.4))} />
          <line x1={axon1 + 418} y1={y} x2={axon1 + 640} y2={y} stroke="#C4B5FD" strokeWidth={10} />
        </g>
        {(t >= 1.3 && t <= 4.3) && (
          <g>
            <circle cx={px} cy={y} r={46} fill="#FDE68A" opacity={0.25} />
            <circle cx={px} cy={y} r={20} fill="#FEF9C3" />
            <line x1={px - 90} y1={y} x2={px - 10} y2={y} stroke="#FDE68A" strokeWidth={14} strokeLinecap="round" opacity={0.6} />
          </g>
        )}
      </g>
      {lab(300, 335, lang === 'hi' ? 'डेंड्राइट' : 'Dendrites', span(t, 0.2, 0.7) * (1 - span(t, 1.6, 2)))}
      {lab(300, 560, lang === 'hi' ? 'कोशिका काय' : 'Cell body', span(t, 0.4, 0.9) * (1 - span(t, 1.6, 2)))}
      {lab(px, 380, lang === 'hi' ? '⚡ 120 m/s तक!' : '⚡ up to 120 m/s!', live ? span(t, 1.8, 2.2) * (1 - span(t, 3.9, 4.2)) : 0, '#FDE68A')}
      {lab(axon1 + 170, 330, lang === 'hi' ? 'सिनैप्स' : 'Synapse', span(t, 4.6, 5) * (1 - span(t, 5.6, 6)), '#FDE68A')}
      {lab(axon1 + 380, 340, lang === 'hi' ? 'अगला न्यूरॉन जगा!' : 'Next neuron fires!', span(t, 5.2, 5.6) * (1 - span(t, 6, 6.3)), '#C4B5FD')}
      <Txt x={CX} y={110} size={50} color="#F9A8D4" opacity={span(t, 6.1, 6.5)}>{lang === 'hi' ? 'दिमाग़ का संदेशवाहक 🧠' : 'The brain’s messenger 🧠'}</Txt>
    </g>
  );
}

// ── 5. History: the Ashoka Chakra ────────────────────────────────────

function ChakraScene({ t, lang }: { t: number; lang: Lang }) {
  const fw = 1200, fh = 800, fx = CX - fw / 2, fy = CY - fh / 2, band = fh / 3, R = 100;
  const cam = camAt([[0, CX, CY, 3.4], [2.8, CX, CY, 3.4], [4.8, CX, CY, 0.92], [7, CX, CY, 0.9]], t);
  const spokes = Math.min(24, Math.max(0, Math.floor((t - 0.35) / 0.085)));
  const spin = t > 2.6 ? (t - 2.6) * 55 : 0;
  const flagK = span(t, 3, 4.2);
  const wave = (x: number) => Math.sin((x - fx) / 190 - t * 3.2) * 16 * ((x - fx) / fw) * flagK;
  const bandPath = (y0: number) => {
    const top: string[] = [], bot: string[] = [];
    for (let x = fx; x <= fx + fw; x += 30) { top.push(`${x},${y0 + wave(x)}`); bot.unshift(`${x},${y0 + band + wave(x)}`); }
    return `M${top.join(' L')} L${bot.join(' L')} Z`;
  };
  return (
    <g>
      <g transform={camT(cam)}>
        <g opacity={flagK}>
          <rect x={fx - 26} y={fy - 40} width={14} height={fh + 260} rx={7} fill="#D6D3D1" />
          <path d={bandPath(fy)} fill="#FF9933" />
          <path d={bandPath(fy + band)} fill="#FFFFFF" />
          <path d={bandPath(fy + 2 * band)} fill="#138808" />
        </g>
        <g transform={`translate(${CX} ${CY + wave(CX)}) rotate(${spin})`}>
          <circle r={R} fill={flagK > 0.5 ? 'none' : '#ffffff08'} stroke="#000080" strokeWidth={9} pathLength={1} strokeDasharray={`${span(t, 0.1, 0.9)} 1`} />
          {Array.from({ length: spokes }, (_, i) => {
            const a = (i * 15 * Math.PI) / 180;
            return (
              <g key={i}>
                <line x1={0} y1={0} x2={Math.cos(a) * (R - 6)} y2={Math.sin(a) * (R - 6)} stroke="#000080" strokeWidth={4} strokeLinecap="round" />
                <circle cx={Math.cos(a + 0.13) * (R - 4)} cy={Math.sin(a + 0.13) * (R - 4)} r={3.5} fill="#000080" />
              </g>
            );
          })}
          <circle r={17} fill="#000080" />
        </g>
      </g>
      <g opacity={span(t, 0.5, 0.9) * (1 - span(t, 2.9, 3.3))}>
        <Txt x={1400} y={400} size={120} color="#FDE68A">{spokes}</Txt>
        <Txt x={1400} y={490} size={36} weight={700} color="#E7E5E4">{lang === 'hi' ? 'तीलियाँ' : 'spokes'}</Txt>
      </g>
      <Txt x={CX} y={70} size={54} opacity={span(t, 4.4, 4.9)}>{lang === 'hi' ? '☸️ अशोक चक्र — 24 तीलियाँ' : '☸️ The Ashoka Chakra — 24 spokes'}</Txt>
      <Txt x={CX} y={128} size={30} weight={600} color="#FFFFFF" opacity={span(t, 5.2, 5.7)}>
        {lang === 'hi' ? 'सारनाथ के अशोक सिंह स्तंभ से · तिरंगा अपनाया: 22 जुलाई 1947' : "From Ashoka's Lion Capital, Sarnath · flag adopted 22 July 1947"}
      </Txt>
    </g>
  );
}

// ── 6. Geography: journey to the Earth's core ─────────────────────────

const LAYERS = [
  { r: 1, color: '#92400E', en: 'Crust · 5–70 km', hi: 'पर्पटी · 5–70 km' },
  { r: 0.96, color: '#EA580C', en: 'Mantle · ~2,900 km thick', hi: 'मेंटल · ~2,900 km मोटा' },
  { r: 0.55, color: '#F59E0B', en: 'Outer core · liquid iron', hi: 'बाहरी कोर · पिघला लोहा' },
  { r: 0.19, color: '#FEF3C7', en: 'Inner core · ~5,200 °C', hi: 'आंतरिक कोर · ~5,200 °C' },
];

function CoreScene({ t, lang }: { t: number; lang: Lang }) {
  const R = 300;
  const open = span(t, 0.9, 1.8, easeInOut);
  const cam = camAt([[0, CX, CY, 1], [1.8, CX, CY, 1], [5, CX + 70, CY - 60, 3.1], [5.6, CX + 70, CY - 60, 3.1], [6.6, CX, CY, 1]], t);
  const ang = -Math.PI / 2 + open * (Math.PI / 2);
  const wedge = `M${CX} ${CY} L${CX} ${CY - R - 20} A ${R + 20} ${R + 20} 0 0 1 ${CX + (R + 20) * Math.cos(ang)} ${CY + (R + 20) * Math.sin(ang)} Z`;
  const drift = (t * 60) % 800;
  const labelK = (i: number) => span(t, 2.2 + i * 0.75, 2.7 + i * 0.75) * (1 - span(t, 5.9, 6.3));
  return (
    <g>
      <Stars t={t} n={70} />
      <defs>
        <radialGradient id="hv-ocean" cx="0.38" cy="0.32"><stop offset="0" stopColor="#60A5FA" /><stop offset="0.7" stopColor="#1D4ED8" /><stop offset="1" stopColor="#1E3A8A" /></radialGradient>
        <radialGradient id="hv-core"><stop offset="0" stopColor="#FFFBEB" /><stop offset="1" stopColor="#FCD34D" /></radialGradient>
        <radialGradient id="hv-atmo"><stop offset="0.86" stopColor="#60A5FA" stopOpacity="0" /><stop offset="0.93" stopColor="#93C5FD" stopOpacity="0.5" /><stop offset="1" stopColor="#93C5FD" stopOpacity="0" /></radialGradient>
        <clipPath id="hv-earth"><circle cx={CX} cy={CY} r={R} /></clipPath>
        <clipPath id="hv-wedge"><path d={wedge} /></clipPath>
        <mask id="hv-cut"><rect x={0} y={0} width={W} height={H} fill="#fff" /><path d={wedge} fill="#000" /></mask>
      </defs>
      <g transform={camT(cam)}>
        <circle cx={CX} cy={CY} r={R + 40} fill="url(#hv-atmo)" />
        <g mask="url(#hv-cut)">
          <circle cx={CX} cy={CY} r={R} fill="url(#hv-ocean)" />
          <g clipPath="url(#hv-earth)" fill="#22C55E" opacity={0.9}>
            {[0, 800].map(o => (
              <g key={o} transform={`translate(${drift - 400 + o - 800} 0)`}>
                <path d={`M${CX - 160} ${CY - 170} q 90 -40 150 20 q 40 60 -20 110 q -80 40 -120 -30 z`} />
                <path d={`M${CX + 60} ${CY - 40} q 110 -30 160 50 q 20 110 -70 140 q -90 10 -110 -80 z`} />
                <path d={`M${CX - 260} ${CY + 60} q 70 -20 110 40 q 10 80 -60 90 q -60 -10 -50 -130 z`} />
                <path d={`M${CX + 280} ${CY - 220} q 60 0 70 50 q -10 50 -60 40 z`} />
              </g>
            ))}
          </g>
          <circle cx={CX - 110} cy={CY - 120} r={140} fill="#fff" opacity={0.1} />
        </g>
        {open > 0.01 && (
          <g clipPath="url(#hv-wedge)">
            {LAYERS.map((l, i) => <circle key={i} cx={CX} cy={CY} r={R * l.r} fill={i === 3 ? 'url(#hv-core)' : l.color} />)}
            <circle cx={CX} cy={CY} r={R * 0.19 + 8 + Math.sin(t * 6) * 4} fill="none" stroke="#FEF3C7" strokeWidth={4} opacity={0.6} />
          </g>
        )}
      </g>
      {LAYERS.map((l, i) => {
        const rr = R * (i === 0 ? 0.98 : (l.r + (LAYERS[i + 1]?.r ?? 0)) / 2);
        const [ax, ay] = proj(cam, CX + rr * Math.cos(-Math.PI / 4), CY + rr * Math.sin(-Math.PI / 4));
        return <Callout key={i} x={Math.min(1380, ax + 260)} y={ay - 70} ax={ax} ay={ay} k={labelK(i)} color={i === 3 ? '#FEF3C7' : '#FDBA74'} size={28}>{l[lang]}</Callout>;
      })}
      <Txt x={CX} y={90} size={50} opacity={span(t, 6.2, 6.6)}>{lang === 'hi' ? '🌍 धरती की परतें' : '🌍 Layers of the Earth'}</Txt>
    </g>
  );
}

// ── segments ────────────────────────────────────────────────────────

interface Segment { subject: T2; topic: T2; emoji: string; color: string; line: T2; Scene: (p: { t: number; lang: Lang }) => ReactNode }

const SEGMENTS: Segment[] = [
  {
    subject: { en: 'Mathematics', hi: 'गणित' }, topic: { en: 'What is π?', hi: 'π क्या है?' }, emoji: '📐', color: '#FF8A3D', Scene: PiScene,
    line: { en: 'Roll a circle once: its edge is a little more than three diameters long. That number is pi.', hi: 'एक वृत्त को एक बार घुमाइए: उसकी परिधि व्यास से तीन गुना से थोड़ी ज़्यादा होती है। यही है पाई।' },
  },
  {
    subject: { en: 'Physics', hi: 'भौतिकी' }, topic: { en: 'From Earth to the Solar System', hi: 'धरती से सौरमंडल तक' }, emoji: '🪐', color: '#818CF8', Scene: SolarScene,
    line: { en: 'Zoom out from the Earth and its Moon, all the way to the Sun and its eight planets.', hi: 'धरती और चाँद से ज़ूम आउट कीजिए — सूरज और उसके आठ ग्रहों तक।' },
  },
  {
    subject: { en: 'Chemistry', hi: 'रसायन' }, topic: { en: 'Inside an atom', hi: 'परमाणु के अंदर' }, emoji: '⚛️', color: '#34D399', Scene: AtomScene,
    line: { en: 'Dive into a drop of water: billions of molecules, and inside each, atoms with a nucleus and electrons.', hi: 'पानी की एक बूँद में डुबकी लगाइए: अरबों अणु, और उनके अंदर नाभिक और इलेक्ट्रॉन वाले परमाणु।' },
  },
  {
    subject: { en: 'Biology', hi: 'जीव विज्ञान' }, topic: { en: 'How a neuron fires', hi: 'न्यूरॉन कैसे काम करता है' }, emoji: '🧠', color: '#F472B6', Scene: NeuronScene,
    line: { en: 'A nerve signal races along the neuron, jumps across the synapse, and wakes up the next cell.', hi: 'तंत्रिका संकेत न्यूरॉन में दौड़ता है, सिनैप्स को पार करता है, और अगली कोशिका को जगा देता है।' },
  },
  {
    subject: { en: 'History', hi: 'इतिहास' }, topic: { en: 'The Ashoka Chakra', hi: 'अशोक चक्र' }, emoji: '🏛️', color: '#FBBF24', Scene: ChakraScene,
    line: { en: "Twenty-four spokes from Ashoka's Lion Capital at Sarnath became the heart of India's flag in 1947.", hi: 'सारनाथ के अशोक स्तंभ से आया चौबीस तीलियों वाला चक्र 1947 में तिरंगे का दिल बना।' },
  },
  {
    subject: { en: 'Geography', hi: 'भूगोल' }, topic: { en: "Journey to the Earth's core", hi: 'धरती के केंद्र की यात्रा' }, emoji: '🌍', color: '#38BDF8', Scene: CoreScene,
    line: { en: "Cut the Earth open: a thin crust, a thick mantle, and an iron core almost as hot as the Sun's surface.", hi: 'धरती को काटकर देखिए: पतली पर्पटी, मोटा मेंटल, और लोहे का कोर — लगभग सूरज की सतह जितना गरम।' },
  },
];

const TOTAL = SEGMENTS.length * SEG_S;
const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// ── player ──────────────────────────────────────────────────────────

export default function HeroVideo() {
  const root = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [lang, setLang] = useState<Lang>('en');
  const [seg, setSeg] = useState(0);
  const [t, setT] = useState(0);
  const spokenDone = useRef(true);
  const { soundOn, toggle: toggleSound, setSound, speak, stop } = usePreviewVoice('hero-video');

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  useEffect(() => { if (!visible) setSound(false); }, [visible, setSound]);

  const running = visible && playing;
  // segment clock: moves on after SEG_S once the voice (if on) has finished its line
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      setT(v => {
        const next = v + dt;
        if (next >= SEG_S && spokenDone.current) { setSeg(s => (s + 1) % SEGMENTS.length); return 0; }
        return Math.min(next, SEG_S + 6);
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  const s = SEGMENTS[seg];
  useEffect(() => {
    if (!soundOn || !running) { spokenDone.current = true; return; }
    spokenDone.current = false;
    speak(s.line[lang], lang === 'hi' ? 'Hindi' : 'English', () => {}, () => { spokenDone.current = true; });
    return () => { stop(); spokenDone.current = true; };
  }, [seg, soundOn, running, lang, s, speak, stop]);

  const jump = (i: number) => { setSeg(i); setT(0); setPlaying(true); };
  const elapsed = seg * SEG_S + Math.min(t, SEG_S);
  const words = useMemo(() => s.line[lang].split(/\s+/), [s, lang]);
  const spoken = Math.floor(clamp01((t - 0.5) / (SEG_S - 1.2)) * words.length);
  const tScene = Math.min(t, SEG_S);
  const chapterK = t < 0.15 ? 0 : 1 - clamp01((t - 2) / 0.45);
  const { Scene } = s;

  return (
    <div ref={root} className="relative">
      <div className="pointer-events-none absolute -inset-8 rounded-[3rem] opacity-80 blur-3xl transition-[background] duration-1000"
        style={{ background: `radial-gradient(55% 60% at 50% 55%, ${s.color}66, transparent 72%)` }} />
      <div className="relative overflow-hidden rounded-2xl bg-[#07070E] shadow-[0_50px_120px_-30px_rgba(7,7,14,0.85)] ring-1 ring-white/10 sm:rounded-[1.75rem]">
        <div className="relative aspect-video select-none" onClick={() => setPlaying(p => !p)} role="button" tabIndex={0}
          aria-label={playing ? 'Pause the sample video' : 'Play the sample video'}
          onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setPlaying(p => !p); } }}>
          <div className="absolute inset-0 transition-[background] duration-1000"
            style={{ background: `radial-gradient(75% 85% at 50% 45%, ${s.color}26, transparent 70%), linear-gradient(180deg, #0E0E1C, #05050A)` }} />

          <svg key={`${seg}-${lang}`} viewBox={`0 0 ${W} ${H}`} className="hero-zoom-in absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid meet" aria-hidden>
            <Scene t={tScene} lang={lang} />
          </svg>
          {/* vignette */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.55))]" />

          {/* chapter lower-third */}
          {chapterK > 0.01 && (
            <div key={`ch-${seg}`} className="pointer-events-none absolute left-[4%] top-[12%] sm:top-[14%]" style={{ opacity: chapterK }}>
              <div className="hero-slide-in flex items-center gap-3 rounded-2xl bg-black/45 py-2 pl-2 pr-4 backdrop-blur-md">
                <span className="h-10 w-1.5 rounded-full sm:h-14" style={{ background: s.color }} />
                <div>
                  <p className="font-heading text-[10px] font-extrabold uppercase tracking-[0.3em] sm:text-sm" style={{ color: s.color }}>
                    {String(seg + 1).padStart(2, '0')} · {s.subject[lang]}
                  </p>
                  <p className="font-heading text-lg font-extrabold leading-tight text-white sm:text-3xl">{s.topic[lang]}</p>
                </div>
              </div>
            </div>
          )}

          {/* top chips */}
          <div className="absolute left-3 top-3 flex items-center gap-2 sm:left-4 sm:top-4">
            <span className="rounded-full border border-white/15 bg-black/40 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur sm:text-xs">
              <span style={{ fontFamily: EMOJI_FONT }}>{s.emoji}</span> {s.subject[lang]}
            </span>
          </div>
          <div className="absolute right-3 top-3 flex items-center gap-2 sm:right-4 sm:top-4">
            <button type="button" onClick={e => { e.stopPropagation(); setLang(l => (l === 'en' ? 'hi' : 'en')); }}
              className="rounded-full border border-white/15 bg-black/40 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur hover:bg-black/60 sm:text-xs"
              aria-label="Switch caption language">{lang === 'en' ? 'EN · हिं' : 'हिं · EN'}</button>
            <button type="button" onClick={e => { e.stopPropagation(); setPlaying(true); toggleSound(); }} aria-pressed={soundOn}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold shadow-lg transition-all sm:text-xs ${soundOn ? 'bg-white text-navy' : 'animate-pulse bg-saffron text-white'}`}>
              {soundOn ? <><Volume2 className="h-3.5 w-3.5" /> Sound on</> : <><VolumeX className="h-3.5 w-3.5" /> Listen</>}
            </button>
          </div>

          {/* caption */}
          <div className="pointer-events-none absolute inset-x-[6%] bottom-[14%] flex justify-center">
            <p key={`${seg}-${lang}`} className="max-w-3xl rounded-xl bg-black/55 px-3 py-1.5 text-center text-[11px] font-medium leading-snug text-white backdrop-blur-md animate-fade-in sm:px-4 sm:py-2 sm:text-base">
              {words.map((w, i) => <span key={i} className="transition-opacity duration-300" style={{ opacity: i <= spoken ? 1 : 0.42 }}>{w} </span>)}
            </p>
          </div>

          {/* controls */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-3 pb-2.5 pt-8 sm:px-4 sm:pb-3">
            <div className="flex gap-1">
              {SEGMENTS.map((x, i) => (
                <button key={i} type="button" onClick={e => { e.stopPropagation(); jump(i); }} aria-label={`Jump to ${x.subject.en}`} className="group relative h-4 flex-1">
                  <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-white/25 transition-all group-hover:h-1.5">
                    <span className="block h-full rounded-full" style={{ background: x.color, width: i < seg ? '100%' : i === seg ? `${(Math.min(t, SEG_S) / SEG_S) * 100}%` : '0%' }} />
                  </span>
                  <span className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-1.5 py-0.5 text-[10px] text-white group-hover:block">{x.emoji} {x.topic[lang]}</span>
                </button>
              ))}
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px] text-white/80 sm:text-xs">
              <span className="flex items-center gap-2">
                <button type="button" onClick={e => { e.stopPropagation(); setPlaying(p => !p); }} aria-label={playing ? 'Pause' : 'Play'} className="text-white">
                  {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white" />}
                </button>
                <span className="tabular-nums">{clock(elapsed)} / {clock(TOTAL)}</span>
              </span>
              <span className="hidden items-center gap-2 sm:flex">
                {SEGMENTS.map((x, i) => <span key={i} className={`transition-all ${i === seg ? 'scale-125 opacity-100' : 'opacity-40'}`} style={{ fontFamily: EMOJI_FONT }}>{x.emoji}</span>)}
              </span>
              <span className="rounded bg-white/15 px-1.5 py-0.5 text-[9px] font-bold tracking-wide sm:text-[10px]">AI · LIVE ANIMATION</span>
            </div>
          </div>

          {!playing && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-xl reel-pop-in"><Play className="ml-1 h-7 w-7 fill-navy text-navy" /></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
