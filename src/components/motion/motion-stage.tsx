'use client';

// Animated "motion" scenes for explainer videos (see lib/motion.ts): a template
// draws its items (emoji + label) moving — forces, orbits, waves, flows, particles —
// and `beat` (the narration step) decides how far the story has got. Everything
// runs off one requestAnimationFrame clock; positions are computed per frame in a
// 1600×760 SVG, so it scales with the slide.

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { EMOJI_FONT, slidePalette, type Palette } from '@/components/teacher/slide-diagram';
import type { Slide, SlideTheme } from '@/lib/teacher-docs';
import type { MotionItem, SceneMotion } from '@/lib/motion';

const W = 1600;
const H = 760;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ease = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
const easeInOut = (x: number) => { const v = clamp01(x); return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2; };
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
/** 0→1→0 triangle wave, period 2. */
const tri = (z: number) => 1 - Math.abs((((z % 2) + 2) % 2) - 1);

/** Seconds since mount, updated every animation frame. */
function useClock(): number {
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const loop = (now: number) => { setT((now - t0) / 1000); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return t;
}

/** Seconds since `beat` last changed. */
function useSince(beat: number, t: number): number {
  const ref = useRef({ beat, at: t });
  if (ref.current.beat !== beat) ref.current = { beat, at: t };
  return t - ref.current.at;
}

/** Clock time at which `on` first became true (null before). */
function useStartedAt(on: boolean, t: number): number | null {
  const ref = useRef<number | null>(null);
  if (on && ref.current === null) ref.current = t;
  if (!on) ref.current = null;
  return ref.current;
}

interface Ctx { beat: number; since: number; t: number; p: Palette }

/** Size multiplier for emoji, labels and nodes (tall reel frames show the stage smaller). */
const Boost = createContext(1);

/** 0→1 as step `step` starts (1 once it has passed). */
const shown = ({ beat, since }: Ctx, step: number, dur = 0.6) => (beat > step ? 1 : beat === step ? ease(since / dur) : 0);

// ── drawing helpers ─────────────────────────────────────────────────

function Em({ x, y, size, children, opacity = 1, scale = 1, rotate = 0 }: {
  x: number; y: number; size: number; children: ReactNode; opacity?: number; scale?: number; rotate?: number;
}) {
  const boost = useContext(Boost);
  if (opacity <= 0.01 || scale <= 0.01) return null;
  return (
    <text transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`} fontSize={size * boost} textAnchor="middle"
      dominantBaseline="central" opacity={opacity} style={{ fontFamily: EMOJI_FONT }}>{children}</text>
  );
}

/** Font size that keeps `text` within `max` units (Indic scripts run wide). */
const fit = (text: string, max: number, base = 46) => Math.max(26, Math.min(base, max / Math.max(1, Array.from(text).length * 0.56)));

function Label({ x, y, text, p, size, max = 560, color, opacity = 1, anchor = 'middle', weight = 800 }: {
  x: number; y: number; text: string; p: Palette; size?: number; max?: number; color?: string; opacity?: number;
  anchor?: 'start' | 'middle' | 'end'; weight?: number;
}) {
  const boost = useContext(Boost);
  if (!text || opacity <= 0.01) return null;
  const s = (size ?? fit(text, max)) * boost;
  return (
    <text x={x} y={y} fontSize={s} fontWeight={weight} fill={color ?? p.fg} textAnchor={anchor} dominantBaseline="central"
      opacity={opacity} stroke={p.bg} strokeWidth={s * 0.24} strokeLinejoin="round" paintOrder="stroke" className="font-heading">
      {text}
    </text>
  );
}

function Arrow({ x1, y1, x2, y2, color, k = 1, w = 15, head = 36, opacity = 1 }: {
  x1: number; y1: number; x2: number; y2: number; color: string; k?: number; w?: number; head?: number; opacity?: number;
}) {
  if (k <= 0.02 || opacity <= 0.01) return null;
  const x = lerp(x1, x2, k), y = lerp(y1, y2, k);
  const ang = Math.atan2(y - y1, x - x1);
  const h = Math.min(head, Math.hypot(x - x1, y - y1) * 0.6);
  const bx = x - Math.cos(ang) * h, by = y - Math.sin(ang) * h;
  const px = -Math.sin(ang) * h * 0.62, py = Math.cos(ang) * h * 0.62;
  return (
    <g opacity={opacity}>
      <line x1={x1} y1={y1} x2={bx} y2={by} stroke={color} strokeWidth={w} strokeLinecap="round" />
      <polygon points={`${x},${y} ${bx + px},${by + py} ${bx - px},${by - py}`} fill={color} strokeLinejoin="round" stroke={color} strokeWidth={4} />
    </g>
  );
}

/** Expanding, fading ring (impacts, arrivals). */
function Burst({ x, y, k, color, r = 120 }: { x: number; y: number; k: number; color: string; r?: number }) {
  if (k <= 0 || k >= 1) return null;
  return <circle cx={x} cy={y} r={r * (0.3 + k)} fill="none" stroke={color} strokeWidth={14 * (1 - k)} opacity={1 - k} />;
}

/** Item bubble: soft disc, emoji, label below. */
function Node({ x, y, item, p, k = 1, lit = false, pulse = 0, r = 74, labelAt = 'below' }: {
  x: number; y: number; item: MotionItem; p: Palette; k?: number; lit?: boolean; pulse?: number; r?: number;
  labelAt?: 'below' | 'above' | 'left' | 'right';
}) {
  const boost = useContext(Boost);
  if (k <= 0.01) return null;
  const s = (0.55 + 0.45 * k + pulse * 0.06) * boost;
  const off = r * boost + 44 * boost;
  const [lx, ly, anchor] = labelAt === 'below' ? [x, y + off, 'middle' as const]
    : labelAt === 'above' ? [x, y - off, 'middle' as const]
    : labelAt === 'left' ? [x - (r + 24) * boost, y, 'end' as const] : [x + (r + 24) * boost, y, 'start' as const];
  return (
    <g opacity={k}>
      <g transform={`translate(${x} ${y}) scale(${s})`}>
        {lit && <circle r={r + 22} fill={p.a(0.18 + pulse * 0.12)} />}
        <circle r={r} fill={p.surface} stroke={lit ? p.accent : p.f(0.14)} strokeWidth={lit ? 8 : 5} />
        <Em x={0} y={4} size={(r * 1.05) / boost}>{item.emoji}</Em>
      </g>
      <Label x={lx} y={ly} text={item.label} p={p} anchor={anchor} max={labelAt === 'left' || labelAt === 'right' ? 420 : 380} />
    </g>
  );
}

// ── templates ───────────────────────────────────────────────────────

function ForcePair({ m, c }: { m: SceneMotion; c: Ctx }) {
  const { beat, since, t, p } = c;
  const [A, B, act, rea] = m.items;
  const vertical = m.axis === 'y';
  const mid = vertical ? 360 : 800;
  const touch = vertical ? 135 : 165;
  const apart = vertical ? 245 : 390;
  const xy = (u: number, v: number): [number, number] => (vertical ? [800 + v, u] : [u, 360 + v]);

  let d = apart;         // half the distance between A and B
  let fade = 1;          // loop fade (step 3)
  let actK = 0, reaK = 0, flash = -1, speed = 0;
  if (beat === 1) {
    d = lerp(apart, touch, easeInOut(since / 0.9));
    flash = (since - 0.9) / 0.5;
    actK = ease((since - 0.9) / 0.6);
  } else if (beat === 2) {
    d = touch; actK = 1; reaK = ease(since / 0.6);
  } else if (beat >= 3) {
    const tau = since % 3.2;
    if (tau < 0.55) { d = touch; actK = reaK = 1; flash = tau / 0.5; }
    else if (tau < 2.3) {
      const k = easeInOut((tau - 0.55) / 1.75);
      d = lerp(touch, apart + 40, k);
      actK = reaK = 1 - clamp01((tau - 0.55) / 0.45);
      speed = 1 - k;
    } else if (tau < 2.75) { d = apart + 40; fade = 1 - (tau - 2.3) / 0.45; }
    else { d = touch; fade = (tau - 2.75) / 0.45; }
  }
  const au = mid - d, bu = mid + d;
  const shake = beat >= 1 && actK > 0 && actK < 1 ? Math.sin(t * 60) * 5 * (1 - actK) : 0;
  const size = vertical ? 170 : 190;
  const rocketUp = vertical && A.emoji === '🚀' ? -45 : 0;
  const [ax, ay] = xy(au, 0);
  const [bx, by] = xy(bu + shake, 0);
  const lane = vertical ? 175 : -150;     // arrows run beside (vertical) or above (horizontal) the objects
  const [a1x, a1y] = xy(bu - 20, lane), [a2x, a2y] = xy(bu + 250, lane);
  const [r1x, r1y] = xy(au + 20, lane), [r2x, r2y] = xy(au - 250, lane);
  const [cx, cy] = xy(mid, 0);
  const labelSide = vertical ? 230 : -225;
  const [alx, aly] = xy(bu + 115, labelSide), [rlx, rly] = xy(au - 115, labelSide);
  const nameOff = vertical ? -170 : 150;
  const [anx, any] = xy(au, nameOff), [bnx, bny] = xy(bu, nameOff);
  const lines = (x: number, y: number, dir: number) => speed > 0.05 && (
    <g opacity={speed * 0.7} stroke={p.f(0.35)} strokeWidth={8} strokeLinecap="round">
      {[-40, 0, 40].map(o => {
        const [x1, y1] = vertical ? [x + o, y - dir * 110] : [x - dir * 120, y + o];
        const [x2, y2] = vertical ? [x + o, y - dir * 200] : [x - dir * 220, y + o];
        return <line key={o} x1={x1} y1={y1} x2={x2} y2={y2} />;
      })}
    </g>
  );
  return (
    <g opacity={fade}>
      {lines(ax, ay, -1)}
      {lines(bx, by, 1)}
      <Burst x={cx} y={cy} k={flash} color={p.accent} r={110} />
      <Em x={ax} y={ay} size={size} rotate={rocketUp}>{A.emoji}</Em>
      <Em x={bx} y={by} size={size}>{B.emoji}</Em>
      <Label x={anx} y={any} text={A.label} p={p} anchor={vertical ? 'end' : 'middle'} max={420} />
      <Label x={bnx} y={bny} text={B.label} p={p} anchor={vertical ? 'end' : 'middle'} max={420} />
      <Arrow x1={a1x} y1={a1y} x2={a2x} y2={a2y} color={p.accent} k={actK} />
      <Arrow x1={r1x} y1={r1y} x2={r2x} y2={r2y} color={p.alt} k={reaK} />
      <Label x={alx} y={aly} text={act?.label ?? ''} p={p} color={p.accent} opacity={actK} anchor={vertical ? 'start' : 'middle'} max={vertical ? 520 : 600} />
      <Label x={rlx} y={rly} text={rea?.label ?? ''} p={p} color={p.alt} opacity={reaK} anchor={vertical ? 'start' : 'middle'} max={vertical ? 520 : 600} />
    </g>
  );
}

function Orbit({ m, c }: { m: SceneMotion; c: Ctx }) {
  const { beat, t, p } = c;
  const [center, body, pull, move] = m.items;
  const cx = 800, cy = 370, rx = 560, ry = 235;
  const started = useStartedAt(beat >= 1, t);
  const theta = -Math.PI / 2 + (started === null ? 0 : (t - started) * ((2 * Math.PI) / 7));
  const pos = (a: number): [number, number] => [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
  const [ox, oy] = pos(theta);
  const depth = Math.sin(theta);           // < 0: behind the centre
  const scale = 0.85 + 0.2 * (depth + 1) / 2;
  const path = shown(c, 1, 1.1);
  const toC = Math.hypot(cx - ox, cy - oy) || 1;
  const gx = ox + ((cx - ox) / toC) * 165, gy = oy + ((cy - oy) / toC) * 165;
  const tx = -rx * Math.sin(theta), ty = ry * Math.cos(theta);
  const tl = Math.hypot(tx, ty) || 1;
  const vx = ox + (tx / tl) * 190, vy = oy + (ty / tl) * 190;
  const orbiter = (
    <g>
      {started !== null && Array.from({ length: 12 }, (_, j) => {
        const [x, y] = pos(theta - (j + 1) * 0.07);
        return <circle key={j} cx={x} cy={y} r={14 - j} fill={p.accent} opacity={0.32 * (1 - j / 12)} />;
      })}
      <Em x={ox} y={oy} size={96} scale={scale}>{body.emoji}</Em>
      <Label x={ox} y={oy + 78 * scale} text={body.label} p={p} max={360} size={38} />
    </g>
  );
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={p.f(0.22)} strokeWidth={5} strokeDasharray="0.9 1.1"
        pathLength={100} opacity={path} />
      {depth < 0 && orbiter}
      <circle cx={cx} cy={cy} r={125 + Math.sin(t * 2.4) * 8} fill={p.a(0.14)} />
      <Em x={cx} y={cy} size={155}>{center.emoji}</Em>
      <Label x={cx} y={cy + 128} text={center.label} p={p} max={420} />
      {depth >= 0 && orbiter}
      {pull && <Arrow x1={ox} y1={oy} x2={gx} y2={gy} color={p.alt} k={shown(c, 2)} w={13} head={30} />}
      {pull && <Label x={gx + ((cx - ox) / toC) * 70} y={gy + ((cy - oy) / toC) * 50} text={pull.label} p={p} color={p.alt} size={38} opacity={shown(c, 2)} max={380} />}
      {move && <Arrow x1={ox} y1={oy} x2={vx} y2={vy} color={p.accent} k={shown(c, 3)} w={13} head={30} />}
      {move && <Label x={vx + (tx / tl) * 120} y={vy + (ty / tl) * 70} text={move.label} p={p} color={p.accent} size={38} opacity={shown(c, 3)} max={380} />}
    </g>
  );
}

function Wave({ m, c }: { m: SceneMotion; c: Ctx }) {
  const { beat, t, p } = c;
  const [source, lambda, amp, receiver] = m.items;
  const x0 = 290, y0 = 400, A = 115, L = 330, v = 280;
  const xEnd = receiver ? 1330 : 1500;
  const started = useStartedAt(beat >= 1, t);
  const run = started === null ? 0 : t - started;
  const phase = run * v;
  const front = Math.min(xEnd, x0 + run * v * 1.4);
  const yAt = (x: number) => y0 - A * Math.sin((2 * Math.PI * (x - x0 - phase)) / L);
  const pts: string[] = [];
  for (let x = x0; x <= front; x += 8) pts.push(`${x},${yAt(x).toFixed(1)}`);
  // crests move with the wave: x = x0 + phase + L(1/4 + n)
  const crestNear = (target: number) => {
    const n = Math.round((target - x0 - phase) / L - 0.25);
    return x0 + phase + L * (0.25 + n);
  };
  const c1 = crestNear(640);
  const ca = crestNear(1060);
  const kL = shown(c, 2), kA = shown(c, 3), kR = shown(c, 4);
  const arrived = front >= xEnd - 4;
  const pulse = 1 + 0.07 * Math.sin(t * 9);
  return (
    <g>
      <line x1={x0} y1={y0} x2={xEnd} y2={y0} stroke={p.f(0.18)} strokeWidth={4} strokeDasharray="10 14" />
      {pts.length > 1 && <polyline points={pts.join(' ')} fill="none" stroke={p.accent} strokeWidth={11} strokeLinejoin="round" strokeLinecap="round" />}
      <Em x={175} y={y0} size={130} scale={beat >= 1 ? pulse : 1}>{source.emoji}</Em>
      <Label x={175} y={y0 + 120} text={source.label} p={p} max={300} size={36} />
      {kL > 0 && c1 + L <= front && (
        <g opacity={kL}>
          <Arrow x1={c1 + L / 2} y1={y0 - A - 55} x2={c1} y2={y0 - A - 55} color={p.alt} w={9} head={26} />
          <Arrow x1={c1 + L / 2} y1={y0 - A - 55} x2={c1 + L} y2={y0 - A - 55} color={p.alt} w={9} head={26} />
          <line x1={c1} y1={y0 - A - 85} x2={c1} y2={y0 - A - 10} stroke={p.alt} strokeWidth={5} />
          <line x1={c1 + L} y1={y0 - A - 85} x2={c1 + L} y2={y0 - A - 10} stroke={p.alt} strokeWidth={5} />
          <Label x={c1 + L / 2} y={y0 - A - 112} text={lambda?.label ?? ''} p={p} color={p.alt} size={38} max={420} />
        </g>
      )}
      {kA > 0 && ca <= front && (
        <g opacity={kA}>
          <Arrow x1={ca} y1={y0 - A / 2} x2={ca} y2={y0 - A + 4} color={p.fg} w={8} head={22} />
          <Arrow x1={ca} y1={y0 - A / 2} x2={ca} y2={y0 - 4} color={p.fg} w={8} head={22} />
          <Label x={ca + 26} y={y0 + 70} text={amp?.label ?? ''} p={p} size={36} anchor="start" max={360} />
        </g>
      )}
      {receiver && (
        <g opacity={kR}>
          <Em x={1440 + (arrived ? Math.sin(t * 34) * 6 : 0)} y={y0} size={120}>{receiver.emoji}</Em>
          <Label x={1440} y={y0 + 115} text={receiver.label} p={p} size={36} max={300} />
        </g>
      )}
    </g>
  );
}

/** Point at fraction s (0–1, clockwise from the top-left corner) along a rounded rectangle. */
function roundedRectPoint(x0: number, y0: number, x1: number, y1: number, r: number, s: number): [number, number] {
  const w = x1 - x0 - 2 * r, h = y1 - y0 - 2 * r, arc = (Math.PI * r) / 2;
  const segs = [w, arc, h, arc, w, arc, h, arc];
  let d = (((s % 1) + 1) % 1) * segs.reduce((a, b) => a + b, 0);
  for (let i = 0; i < 8; i++) {
    if (d <= segs[i]) {
      const k = segs[i] ? d / segs[i] : 0;
      switch (i) {
        case 0: return [x0 + r + w * k, y0];
        case 1: { const a = -Math.PI / 2 + (Math.PI / 2) * k; return [x1 - r + r * Math.cos(a), y0 + r + r * Math.sin(a)]; }
        case 2: return [x1, y0 + r + h * k];
        case 3: { const a = (Math.PI / 2) * k; return [x1 - r + r * Math.cos(a), y1 - r + r * Math.sin(a)]; }
        case 4: return [x1 - r - w * k, y1];
        case 5: { const a = Math.PI / 2 + (Math.PI / 2) * k; return [x0 + r + r * Math.cos(a), y1 - r + r * Math.sin(a)]; }
        case 6: return [x0, y1 - r - h * k];
        default: { const a = Math.PI + (Math.PI / 2) * k; return [x0 + r + r * Math.cos(a), y0 + r + r * Math.sin(a)]; }
      }
    }
    d -= segs[i];
  }
  return [x0 + r, y0];
}

function Flow({ m, c }: { m: SceneMotion; c: Ctx }) {
  const { beat, t, p } = c;
  const n = m.items.length;
  const box = [330, 150, 1270, 600] as const;
  const r = 110;
  const at = (s: number) => roundedRectPoint(box[0], box[1], box[2], box[3], r, s);
  const started = useStartedAt(beat >= 1, t);
  const flowT = started === null ? 0 : t - started;
  const draw = clamp01(c.since / 1.2 + (beat > 0 ? 1 : 0));
  const dots = 26;
  const centre = [(box[0] + box[2]) / 2, (box[1] + box[3]) / 2];
  return (
    <g>
      <rect x={box[0]} y={box[1]} width={box[2] - box[0]} height={box[3] - box[1]} rx={r} fill="none" stroke={p.f(0.16)} strokeWidth={22}
        pathLength={100} strokeDasharray="100" style={{ strokeDashoffset: (1 - draw) * 100 }} />
      {started !== null && Array.from({ length: dots }, (_, j) => {
        const [x, y] = at(j / dots + flowT * 0.055);
        return <circle key={j} cx={x} cy={y} r={10} fill={p.accent} opacity={0.9} />;
      })}
      {started !== null && Array.from({ length: 4 }, (_, j) => {
        const s = j / 4 + 0.125 + flowT * 0.055;
        const [x, y] = at(s), [x2, y2] = at(s + 0.012);
        const a = (Math.atan2(y2 - y, x2 - x) * 180) / Math.PI;
        return <polygon key={j} points="-18,-16 16,0 -18,16" fill={p.accent} transform={`translate(${x} ${y}) rotate(${a})`} />;
      })}
      {m.items.map((item, i) => {
        const s = (0.06 + i / n) % 1;
        const [x, y] = at(s);
        const dy = y - centre[1];
        // labels above/below the parts, so they stay inside a cropped (reel) frame
        const labelAt = dy < 0 ? 'above' : 'below';
        const k = shown(c, i + 1);
        const current = beat === i + 1 || beat >= n;
        return <Node key={i} x={x} y={y} item={item} p={p} k={k} lit={current}
          pulse={current ? (Math.sin(t * 5) + 1) / 2 : 0} labelAt={labelAt} r={72} />;
      })}
    </g>
  );
}

function Cycle({ m, c }: { m: SceneMotion; c: Ctx }) {
  const { beat, t, p } = c;
  const n = m.items.length;
  const cx = 800, cy = 392, rx = 440, ry = 232;
  const ang = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const pos = (a: number): [number, number] => [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
  const arc = (i: number) => {
    const a0 = ang(i) + 0.36, a1 = ang(i + 1) - 0.36;
    const pts: string[] = [];
    for (let k = 0; k <= 24; k++) { const [x, y] = pos(lerp(a0, a1, k / 24)); pts.push(`${x},${y}`); }
    const [ex, ey] = pos(a1), [px, py] = pos(a1 - 0.04);
    return { pts: pts.join(' '), ex, ey, rot: (Math.atan2(ey - py, ex - px) * 180) / Math.PI };
  };
  const loop = useStartedAt(beat >= 2, t);
  const token = loop === null ? null : pos(-Math.PI / 2 + ((t - loop) * 2 * Math.PI) / 6);
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={p.f(0.07)} strokeWidth={40} />
      {Array.from({ length: n }, (_, i) => {
        // arc i joins stage i to the next one, drawn when that stage appears (the closing arc with the last stage)
        const show = shown(c, i === n - 1 ? n : i + 2, 0.8);
        if (show <= 0) return null;
        const a = arc(i);
        return (
          <g key={i} opacity={show}>
            <polyline points={a.pts} fill="none" stroke={p.accent} strokeWidth={10} strokeLinecap="round" pathLength={100}
              strokeDasharray="100" style={{ strokeDashoffset: (1 - show) * 100 }} />
            <polygon points="-22,-18 18,0 -22,18" fill={p.accent} transform={`translate(${a.ex} ${a.ey}) rotate(${a.rot})`} />
          </g>
        );
      })}
      {token && <g><circle cx={token[0]} cy={token[1]} r={30} fill={p.a(0.25)} /><circle cx={token[0]} cy={token[1]} r={15} fill={p.accent} /></g>}
      {m.items.map((item, i) => {
        const [x, y] = pos(ang(i));
        const dx = x - cx, dy = y - cy;
        const labelAt = Math.abs(dy) > ry * 0.6 ? (dy < 0 ? 'above' : 'below') : Math.abs(dx) > rx * 0.8 ? 'below' : dx < 0 ? 'left' : 'right';
        const lit = beat === i + 1 || beat >= n;
        return <Node key={i} x={x} y={y} item={item} p={p} k={shown(c, i + 1)} lit={lit} pulse={beat === i + 1 ? (Math.sin(t * 5) + 1) / 2 : 0} labelAt={labelAt} r={70} />;
      })}
    </g>
  );
}

type Phase = 'solid' | 'liquid' | 'gas';
const PHASE_WORDS: [Phase, RegExp][] = [
  ['solid', /🧊|🪨|solid|ठोस|ice|बर्फ़?|frozen/i],
  ['gas', /♨️|💨|☁️|gas|गैस|vapou?r|वाष्प|भाप|steam|hot|गरम|गर्म/i],
  ['liquid', /💧|🌊|liquid|द्रव|तरल|water|पानी|melt/i],
];

function phasesFor(items: MotionItem[]): Phase[] {
  const fallback: Phase[] = items.length === 2 ? ['liquid', 'gas'] : ['solid', 'liquid', 'gas'];
  return items.map((it, i) => PHASE_WORDS.find(([, re]) => re.test(`${it.emoji} ${it.label}`))?.[0] ?? fallback[i] ?? 'gas');
}

function Particles({ m, c }: { m: SceneMotion; c: Ctx }) {
  const { beat, since, t, p } = c;
  const phases = phasesFor(m.items);
  const state = Math.max(0, Math.min(phases.length - 1, beat - 1));
  const prev = Math.max(0, Math.min(phases.length - 1, beat - 2));
  const blend = beat <= 1 ? 1 : easeInOut(since / 1.1);
  const box = { x: 470, y: 120, w: 640, h: 430 };
  const N = 30, cols = 6;
  const posFor = (ph: Phase, i: number): [number, number] => {
    const col = i % cols, row = Math.floor(i / cols);
    const seed = Math.sin(i * 12.9898) * 43758.5453, r1 = seed - Math.floor(seed);
    const seed2 = Math.sin(i * 78.233) * 12543.11, r2 = seed2 - Math.floor(seed2);
    if (ph === 'solid') {
      const s = beat === 0 ? 1.5 : 6;
      return [box.x + 120 + col * 80 + Math.sin(t * 19 + i * 1.7) * s, box.y + 70 + row * 72 + Math.cos(t * 17 + i * 2.3) * s];
    }
    if (ph === 'liquid') {
      const x = box.x + 60 + ((col * 92 + row * 40 + Math.sin(t * 1.3 + i) * 34 + t * 22) % (box.w - 110));
      return [x, box.y + box.h - 52 - row * 58 + Math.sin(t * 3 + i * 1.3) * 9];
    }
    const vx = 0.25 + r1 * 0.35, vy = 0.2 + r2 * 0.35;
    return [box.x + 30 + tri(r1 * 2 + t * vx) * (box.w - 60), box.y + 30 + tri(r2 * 2 + t * vy) * (box.h - 60)];
  };
  const heat = phases.length > 1 ? state / (phases.length - 1) : 0;
  const label = m.items[state];
  return (
    <g>
      <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={36} fill={p.f(0.04)} stroke={p.f(0.25)} strokeWidth={7} />
      {Array.from({ length: N }, (_, i) => {
        const [x1, y1] = posFor(phases[prev], i);
        const [x2, y2] = posFor(phases[state], i);
        return <circle key={i} cx={lerp(x1, x2, blend)} cy={lerp(y1, y2, blend)} r={19} fill={i % 3 ? p.accent : p.alt} opacity={0.92} />;
      })}
      {beat >= 1 && <Em x={box.x + box.w / 2} y={box.y + box.h + 85} size={70 + heat * 50} scale={1 + Math.sin(t * 12) * 0.05}>🔥</Em>}
      <g transform={`translate(${box.x + box.w + 120} ${box.y + 20})`}>
        <rect x={-22} y={0} width={44} height={330} rx={22} fill={p.f(0.08)} stroke={p.f(0.25)} strokeWidth={5} />
        <rect x={-14} y={8 + (1 - (0.15 + heat * 0.85)) * 314} width={28} height={(0.15 + heat * 0.85) * 314} rx={14} fill="#EF4444" />
        <circle cx={0} cy={360} r={40} fill="#EF4444" />
      </g>
      <g key={state}>
        <Em x={box.x - 120} y={box.y + 110} size={110}>{label.emoji}</Em>
        <Label x={box.x - 120} y={box.y + 215} text={label.label} p={p} color={p.accent} size={48} max={300} />
      </g>
      <g>
        {m.items.map((it, i) => (
          <circle key={i} cx={box.x - 160 + i * 40} cy={box.y + 300} r={11} fill={i === state && beat >= 1 ? p.accent : p.f(0.18)} />
        ))}
      </g>
    </g>
  );
}

function Reaction({ m, c }: { m: SceneMotion; c: Ctx }) {
  const { beat, since, t, p } = c;
  const [r1, r2, ...products] = m.items;
  let x1 = 420, x2 = 1180, mix = 0, flash = -1, prodK = 0, fade = 1;
  if (beat === 1) { const k = easeInOut(since / 1.3); x1 = lerp(420, 650, k); x2 = lerp(1180, 950, k); }
  if (beat >= 2) {
    const tau = since % 4.4;
    if (tau < 0.9) { const k = easeInOut(tau / 0.9); x1 = lerp(560, 760, k); x2 = lerp(1040, 840, k); }
    else { x1 = 760; x2 = 840; mix = 1; flash = (tau - 0.9) / 0.6; prodK = ease((tau - 1) / 0.6); }
    if (tau > 3.9) fade = 1 - (tau - 3.9) / 0.5;
  }
  const y = 380;
  const px = products.length === 1 ? [800] : [610, 990];
  return (
    <g opacity={fade}>
      {!mix && (
        <g>
          <circle cx={x1} cy={y} r={118} fill={p.a(0.12)} />
          <circle cx={x2} cy={y} r={118} fill={p.t(0.14)} />
          <Em x={x1} y={y} size={150} rotate={beat === 1 ? Math.sin(t * 8) * 6 : 0}>{r1.emoji}</Em>
          <Em x={x2} y={y} size={150} rotate={beat === 1 ? -Math.sin(t * 8) * 6 : 0}>{r2.emoji}</Em>
          <Label x={x1} y={y + 160} text={r1.label} p={p} max={360} />
          <Label x={x2} y={y + 160} text={r2.label} p={p} max={360} />
          <Label x={(x1 + x2) / 2} y={y} text="+" p={p} size={96} color={p.accent} opacity={beat >= 1 ? 1 - clamp01((x2 - x1 < 320 ? 1 : 0)) : 1} />
        </g>
      )}
      <Burst x={800} y={y} k={flash} color={p.accent} r={170} />
      {mix > 0 && products.map((pr, i) => (
        <g key={i}>
          <circle cx={px[i]} cy={y} r={120 * prodK} fill={p.a(0.16)} />
          <Em x={px[i]} y={y} size={150} scale={prodK}>{pr.emoji}</Em>
          <Label x={px[i]} y={y + 165} text={pr.label} p={p} opacity={prodK} max={380} />
          {Array.from({ length: 6 }, (_, k) => {
            const a = (k / 6) * Math.PI * 2 + t;
            return <Em key={k} x={px[i] + Math.cos(a) * 170 * prodK} y={y + Math.sin(a) * 120 * prodK} size={34} opacity={prodK * 0.8}>✨</Em>;
          })}
        </g>
      ))}
      <g opacity={0.9}>
        <Em x={630} y={70} size={56}>{r1.emoji}</Em>
        <Label x={700} y={70} text="+" p={p} size={50} color={p.muted} />
        <Em x={770} y={70} size={56}>{r2.emoji}</Em>
        <Label x={850} y={70} text="→" p={p} size={54} color={p.accent} />
        {products.map((pr, i) => <Em key={i} x={940 + i * 80} y={70} size={56}>{pr.emoji}</Em>)}
      </g>
    </g>
  );
}

function Fall({ m, c }: { m: SceneMotion; c: Ctx }) {
  const { beat, since, p } = c;
  const [obj, ground, force, speedUp] = m.items;
  const top = 110, floor = 600, x = 860, size = 110;
  const drop = floor - top - size / 2;
  const T = 1.05;
  let y = top, fade = 1, squash = 1;
  if (beat >= 1) {
    const tau = since % 2.6;
    if (tau < T) y = top + drop * (tau / T) ** 2;
    else if (tau < T + 0.3) { const k = (tau - T) / 0.3; y = top + drop - Math.sin(k * Math.PI) * 40; squash = 1 - 0.15 * Math.sin(k * Math.PI); }
    else y = top + drop;
    if (tau > 2.2) fade = 1 - (tau - 2.2) / 0.4;
  }
  const ghosts = Array.from({ length: 6 }, (_, i) => top + drop * ((i * 0.2) / T) ** 2).filter(g => g <= top + drop + 1);
  const kG = shown(c, 2), kS = shown(c, 3);
  return (
    <g>
      <line x1={330} y1={floor + 8} x2={1290} y2={floor + 8} stroke={p.f(0.45)} strokeWidth={10} strokeLinecap="round" />
      {Array.from({ length: 16 }, (_, i) => <line key={i} x1={350 + i * 60} y1={floor + 14} x2={330 + i * 60} y2={floor + 40} stroke={p.f(0.22)} strokeWidth={5} />)}
      <Label x={810} y={floor + 85} text={ground?.label ?? ''} p={p} size={38} color={p.muted} max={700} />
      {kS > 0 && (
        <g opacity={kS}>
          {ghosts.map((g, i) => (
            <g key={i}>
              <Em x={560} y={g} size={70} opacity={0.55}>{obj.emoji}</Em>
              <line x1={505} y1={g} x2={470} y2={g} stroke={p.accent} strokeWidth={5} />
              {(i === 0 || g - ghosts[i - 1] > 36) && i !== 1 && <Label x={455} y={g} text={`${(i * 0.2).toFixed(1)}s`} p={p} size={28} anchor="end" color={p.muted} />}
            </g>
          ))}
          <Label x={560} y={top - 62} text={speedUp?.label ?? ''} p={p} color={p.accent} size={36} max={420} />
        </g>
      )}
      <g opacity={fade}>
        <Em x={x} y={y} size={size} scale={squash}>{obj.emoji}</Em>
        {force && <Arrow x1={x + 110} y1={y - 30} x2={x + 110} y2={y + 140} color={p.alt} k={kG} w={13} head={30} />}
        {force && <Label x={x + 145} y={y + 60} text={force.label} p={p} color={p.alt} size={40} anchor="start" opacity={kG} max={420} />}
      </g>
      <Label x={x} y={top - 70 < 20 ? 30 : top - 70} text={beat === 0 ? obj.label : ''} p={p} size={40} max={500} />
    </g>
  );
}

const SPLIT_COLORS = ['#8B5CF6', '#4F46E5', '#2563EB', '#16A34A', '#EAB308', '#F97316', '#EF4444'];

function Split({ m, c }: { m: SceneMotion; c: Ctx }) {
  const { beat, since, t, p } = c;
  const [input, ...outs] = m.items;
  const hub = [720, 380] as const;
  const ys = outs.map((_, i) => (outs.length === 1 ? 380 : lerp(130, 630, i / (outs.length - 1))));
  const go = beat >= 1 ? (beat === 1 ? ease(since / 1.1) : 1) : 0;
  const glow = beat >= 2 ? (Math.sin(t * 4) + 1) / 2 : 0;
  const inX = beat === 0 ? 330 : beat === 1 ? lerp(330, hub[0] - 130, ease(since / 0.6)) : hub[0] - 130;
  return (
    <g>
      <line x1={180} y1={hub[1]} x2={hub[0]} y2={hub[1]} stroke={p.f(0.5)} strokeWidth={16} strokeLinecap="round" opacity={beat >= 1 ? 1 : 0.25} />
      <circle cx={hub[0]} cy={hub[1]} r={46 + glow * 8} fill={p.a(0.25)} />
      {outs.map((o, i) => {
        const col = outs.length >= 3 ? SPLIT_COLORS[Math.round((i * (SPLIT_COLORS.length - 1)) / Math.max(1, outs.length - 1))] : [p.accent, p.alt][i % 2];
        const ex = 1170, ey = ys[i];
        const x = lerp(hub[0], ex, go), y = lerp(hub[1], ey, go);
        return (
          <g key={i}>
            <line x1={hub[0]} y1={hub[1]} x2={x} y2={y} stroke={col} strokeWidth={12} strokeLinecap="round" opacity={0.85}
              strokeDasharray={beat >= 2 ? '30 16' : undefined} style={beat >= 2 ? { strokeDashoffset: -t * 80 } : undefined} />
            {go > 0.05 && (
              <g>
                <circle cx={x} cy={y} r={56 + glow * 10} fill={`${col}33`} />
                <Em x={x} y={y} size={80} scale={0.4 + 0.6 * go}>{o.emoji}</Em>
                <Label x={x + 85} y={y} text={o.label} p={p} anchor="start" color={beat >= 2 ? col : p.fg} opacity={go} size={outs.length > 4 ? 34 : 42} max={360} />
              </g>
            )}
          </g>
        );
      })}
      <Em x={inX} y={hub[1]} size={150} scale={beat >= 1 ? 0.8 : 1 + Math.sin(t * 3) * 0.04}>{input.emoji}</Em>
      <Label x={inX} y={hub[1] + 125} text={input.label} p={p} max={360} />
    </g>
  );
}

function Zoom({ m, c }: { m: SceneMotion; c: Ctx }) {
  const { beat, since, t, p } = c;
  const levels = m.items;
  const cur = Math.min(levels.length - 1, beat);
  const k = beat === 0 ? 1 : easeInOut(since / 1.1);
  const cx = 760, cy = 360, R = 255;
  const next = levels[cur + 1];
  const prev = beat > 0 ? levels[cur - 1] : null;
  const small = { x: cx + 175, y: cy - 150, r: 64 };
  const curX = lerp(small.x, cx, k), curY = lerp(small.y, cy, k), curR = lerp(small.r, R, k);
  return (
    <g>
      {prev && k < 1 && (
        <g opacity={1 - k} transform={`translate(${cx} ${cy}) scale(${1 + k * 2.2}) translate(${-cx} ${-cy})`}>
          <circle cx={cx} cy={cy} r={R} fill={p.a(0.1)} stroke={p.f(0.2)} strokeWidth={6} />
          <Em x={cx} y={cy} size={230}>{prev.emoji}</Em>
        </g>
      )}
      <circle cx={curX} cy={curY} r={curR} fill={p.surface} stroke={p.accent} strokeWidth={8} />
      <Em x={curX} y={curY} size={230 * (curR / R)}>{levels[cur].emoji}</Em>
      {next && k >= 1 && (
        <g>
          <circle cx={small.x} cy={small.y} r={small.r + 4 * Math.sin(t * 4)} fill={p.surface} stroke={p.alt} strokeWidth={6} strokeDasharray="12 10" />
          <Em x={small.x} y={small.y} size={62}>{next.emoji}</Em>
          <line x1={small.x + small.r * 0.75} y1={small.y + small.r * 0.75} x2={small.x + small.r * 1.45} y2={small.y + small.r * 1.45}
            stroke={p.alt} strokeWidth={12} strokeLinecap="round" />
        </g>
      )}
      <Label x={cx} y={cy + R + 60} text={levels[cur].label} p={p} color={p.accent} size={50} opacity={k} max={700} />
      <g>
        {levels.map((l, i) => (
          <g key={i} opacity={i <= cur ? 1 : 0.35}>
            <Em x={1230} y={120 + i * 125} size={i === cur ? 78 : 58}>{l.emoji}</Em>
            {i < levels.length - 1 && <Label x={1230} y={182 + i * 125} text="↓" p={p} size={34} color={p.muted} />}
            <Label x={1300} y={120 + i * 125} text={l.label} p={p} size={i === cur ? 36 : 30} anchor="start" color={i === cur ? p.accent : p.muted} max={260} />
          </g>
        ))}
      </g>
    </g>
  );
}

const TEMPLATES: Record<SceneMotion['kind'], (props: { m: SceneMotion; c: Ctx }) => JSX.Element> = {
  'force-pair': ForcePair, orbit: Orbit, wave: Wave, flow: Flow, cycle: Cycle,
  particles: Particles, reaction: Reaction, fall: Fall, split: Split, zoom: Zoom,
};

/** Where each template draws, for tall frames (reels) that crop to the content. */
const FRAMES: Record<SceneMotion['kind'], string> = {
  'force-pair': '140 90 1320 500', orbit: '220 100 1160 590', wave: '90 200 1460 360', flow: '170 40 1260 680',
  cycle: '190 70 1220 690', particles: '300 60 1000 640', reaction: '240 20 1120 610', fall: '260 30 1080 720',
  split: '160 90 1360 590', zoom: '450 50 1060 680',
};
const frameFor = (m: SceneMotion) => (m.kind === 'force-pair' && m.axis === 'y' ? '360 40 1140 690' : FRAMES[m.kind]);

/** The animation alone, filling its box (1600×760 design units; `fit` crops to the drawing). */
export function MotionStage({ motion, beat, p, fit = false, boost = 1 }: { motion: SceneMotion; beat: number; p: Palette; fit?: boolean; boost?: number }) {
  const t = useClock();
  const since = useSince(beat, t);
  const Template = TEMPLATES[motion.kind];
  return (
    <svg viewBox={fit ? frameFor(motion) : `0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet" aria-hidden>
      <Boost.Provider value={boost}>
        <Template m={motion} c={{ beat, since, t, p }} />
      </Boost.Provider>
    </svg>
  );
}

/** A 16:9 explainer scene: heading, the animation, up to two caption chips. */
export default function MotionSlide({ slide, motion, theme, beat }: { slide: Slide; motion: SceneMotion; theme: SlideTheme; beat: number }) {
  const p = slidePalette(theme);
  const captions = (slide.bullets ?? []).filter(Boolean).slice(0, 2);
  const emoji = (slide.emoji ?? '').trim();
  return (
    <div data-slide-view="" className="relative w-full aspect-video overflow-hidden rounded-lg select-none"
      style={{ background: p.bg, color: p.fg, containerType: 'inline-size' }}>
      <div aria-hidden className="absolute rounded-full" style={{ width: '34cqw', height: '34cqw', right: '-11cqw', top: '-16cqw', background: p.a(p.dark ? 0.1 : 0.07) }} />
      <div aria-hidden className="absolute rounded-full" style={{ width: '17cqw', height: '17cqw', left: '-6cqw', bottom: '-8cqw', background: p.a(p.dark ? 0.08 : 0.06) }} />
      <div className="absolute inset-0 flex flex-col" style={{ padding: '3.2cqw 4.5cqw 2.6cqw' }}>
        <div className="flex items-center shrink-0" style={{ gap: '1.4cqw' }}>
          {emoji && (
            <span className="shrink-0 flex items-center justify-center"
              style={{ width: '5.4cqw', height: '5.4cqw', borderRadius: '1.4cqw', background: p.a(p.dark ? 0.18 : 0.12) }}>
              <span style={{ fontSize: '3.1cqw', lineHeight: 1, fontFamily: EMOJI_FONT }}>{emoji}</span>
            </span>
          )}
          <p className="font-heading font-extrabold min-w-0" style={{ fontSize: slide.title.length > 45 ? '2.7cqw' : '3.2cqw', lineHeight: 1.25 }}>{slide.title}</p>
        </div>
        <div className="relative flex-1 min-h-0" style={{ marginTop: '0.8cqw' }}>
          <MotionStage motion={motion} beat={beat} p={p} />
        </div>
        {captions.length > 0 && (
          <div className="flex flex-wrap justify-center shrink-0" style={{ gap: '1cqw', marginTop: '0.6cqw' }}>
            {captions.map((b, i) => (
              <span key={i} className="font-semibold" style={{ fontSize: '1.7cqw', padding: '0.5cqw 1.4cqw', borderRadius: 99, background: p.a(p.dark ? 0.2 : 0.1), color: p.fg }}>{b}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
