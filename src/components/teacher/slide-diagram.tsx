'use client';

import { Fragment, type CSSProperties } from 'react';
import { SLIDE_THEMES, type DiagramItem, type SlideDiagram, type SlideTheme } from '@/lib/teacher-docs';

// Shared by slide-view.tsx: theme palette + reveal helpers. All sizes are in
// cqw so diagrams scale with the slide (thumbnail → full screen).

export const EMOJI_FONT = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

export interface Palette {
  bg: string; fg: string; accent: string; muted: string;
  /** Second colour for comparisons (two-column right side). */
  alt: string;
  /** Card surface: white on light themes, a lifted navy on dark ones. */
  surface: string;
  dark: boolean;
  /** accent / fg / alt with an alpha (0–1). */
  a: (alpha: number) => string;
  f: (alpha: number) => string;
  t: (alpha: number) => string;
}

const withAlpha = (hex: string, alpha: number) =>
  `#${hex}${Math.round(Math.min(1, Math.max(0, alpha)) * 255).toString(16).padStart(2, '0')}`;

export function slidePalette(theme: SlideTheme): Palette {
  const t = SLIDE_THEMES[theme] ?? SLIDE_THEMES.saffron;
  const n = parseInt(t.bg, 16);
  const dark = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 < 0.5;
  const alt = dark ? '34D399' : '0F9E75';
  return {
    bg: `#${t.bg}`, fg: `#${t.fg}`, accent: `#${t.accent}`, muted: `#${t.muted}`, alt: `#${alt}`,
    surface: dark ? '#1E1E34' : '#FFFFFF', dark,
    a: x => withAlpha(t.accent, x), f: x => withAlpha(t.fg, x), t: x => withAlpha(alt, x),
  };
}

/** Present-mode state of one reveal item. */
export interface Reveal { hidden: boolean; pop: boolean }

/** Hidden items keep their space (no layout shift); newly revealed ones play `anim`. */
export function revealAttrs(r: Reveal, anim = 'vs-pop'): { className: string; style: CSSProperties } {
  if (r.hidden) return { className: '', style: { opacity: 0, visibility: 'hidden' } };
  return { className: r.pop ? anim : '', style: {} };
}

const clamp = (lines: number): CSSProperties => ({
  display: '-webkit-box', WebkitLineClamp: lines, WebkitBoxOrient: 'vertical', overflow: 'hidden',
});

type ItemAt = (i: number) => Reveal;

/** The diagram hero of a 'diagram' slide. `at(i)` is the reveal state of item i. */
export default function SlideDiagramView({ diagram, p, at }: { diagram: SlideDiagram; p: Palette; at: ItemAt }) {
  const items = Array.isArray(diagram.items) ? diagram.items : [];
  if (!items.length) return null;
  if (diagram.kind === 'cycle' && items.length >= 2) return <Cycle items={items} p={p} at={at} />;
  if (diagram.kind === 'cards') return <Cards items={items} p={p} at={at} />;
  return <Flow items={items} p={p} at={at} />;
}

// ── pieces ──────────────────────────────────────────────────────────

function EmojiDot({ emoji, n, size, bg, ring }: { emoji: string; n: number; size: number; bg: string; ring?: string }) {
  return (
    <span className="shrink-0 rounded-full flex items-center justify-center"
      style={{ width: `${size}cqw`, height: `${size}cqw`, background: bg, boxShadow: ring ? `0 0 0 ${size * 0.05}cqw ${ring}` : undefined }}>
      {emoji
        ? <span style={{ fontSize: `${size * 0.55}cqw`, lineHeight: 1, fontFamily: EMOJI_FONT }}>{emoji}</span>
        : <span className="font-heading font-extrabold" style={{ fontSize: `${size * 0.42}cqw`, lineHeight: 1 }}>{n}</span>}
    </span>
  );
}

function Badge({ n, p, size }: { n: number; p: Palette; size: number }) {
  return (
    <span className="absolute rounded-full flex items-center justify-center font-heading font-extrabold text-white"
      style={{ top: `${-size * 0.38}cqw`, left: `${-size * 0.3}cqw`, width: `${size}cqw`, height: `${size}cqw`, fontSize: `${size * 0.5}cqw`,
        background: p.accent, boxShadow: `0 0 0 ${size * 0.12}cqw ${p.bg}` }}>
      {n}
    </span>
  );
}

function ItemText({ it, label, detail, center, p }: { it: DiagramItem; label: number; detail: number; center?: boolean; p: Palette }) {
  return (
    <div className="min-w-0" style={{ textAlign: center ? 'center' : 'left' }}>
      <p className="font-heading font-bold" style={{ fontSize: `${label}cqw`, lineHeight: 1.3, overflowWrap: 'break-word', ...clamp(2) }}>{it.label}</p>
      {it.detail && (
        <p style={{ fontSize: `${detail}cqw`, lineHeight: 1.38, color: p.muted, marginTop: `${detail * 0.3}cqw`, ...clamp(center ? 3 : 2) }}>{it.detail}</p>
      )}
    </div>
  );
}

const ARROWS = {
  right: { box: '0 0 40 24', d: 'M3 12 H31 M24 4 L34 12 L24 20', anim: 'vs-wipe-r' },
  left: { box: '0 0 40 24', d: 'M37 12 H9 M16 4 L6 12 L16 20', anim: 'vs-wipe-l' },
  down: { box: '0 0 24 40', d: 'M12 3 V31 M4 24 L12 34 L20 24', anim: 'vs-wipe-d' },
};

function Arrow({ dir, p, r, size = 3.6 }: { dir: keyof typeof ARROWS; p: Palette; r: Reveal; size?: number }) {
  const a = ARROWS[dir];
  const { className, style } = revealAttrs(r, a.anim);
  return (
    <svg viewBox={a.box} aria-hidden className={`shrink-0 self-center ${className}`}
      style={{ ...style, width: dir === 'down' ? `${size * 0.6}cqw` : `${size}cqw`, overflow: 'visible' }}>
      <path d={a.d} fill="none" stroke={p.accent} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const cardBox = (p: Palette, radius = 2): CSSProperties => ({
  background: p.surface,
  border: `0.22cqw solid ${p.a(0.35)}`,
  borderRadius: `${radius}cqw`,
  boxShadow: `0 0.5cqw 1.4cqw ${p.dark ? '#00000059' : p.f(0.08)}`,
});

// ── flow: steps left → right (5–6 steps snake onto a second row) ──────

function FlowCard({ it, i, p, r, wide, big }: { it: DiagramItem; i: number; p: Palette; r: Reveal; wide?: boolean; big?: boolean }) {
  const { className, style } = revealAttrs(r);
  return (
    <div className={`relative flex ${wide ? 'items-center' : 'flex-col items-center'} ${className}`}
      style={{ ...cardBox(p), ...style, gap: wide ? '1.2cqw' : '1cqw', padding: wide ? '1.2cqw 1.4cqw 1.2cqw 1.6cqw' : '2.6cqw 1.4cqw 2cqw', height: '100%' }}>
      <Badge n={i + 1} p={p} size={wide ? 2.6 : 3.2} />
      <EmojiDot emoji={it.emoji} n={i + 1} size={wide ? 6.8 : big ? 10.5 : 9} bg={p.a(0.13)} />
      <ItemText it={it} label={wide ? 2.05 : big ? 2.6 : 2.3} detail={wide ? 1.42 : big ? 1.75 : 1.55} center={!wide} p={p} />
    </div>
  );
}

function Flow({ items, p, at }: { items: DiagramItem[]; p: Palette; at: ItemAt }) {
  const n = items.length;
  if (n <= 4) {
    const w = n <= 2 ? 28 : n === 3 ? 24.5 : 18.8;
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-stretch justify-center max-h-full" style={{ gap: '1.1cqw' }}>
          {items.map((it, i) => (
            <Fragment key={i}>
              {i > 0 && <Arrow dir="right" p={p} r={at(i)} />}
              <div style={{ width: `${w}cqw` }}><FlowCard it={it} i={i} p={p} r={at(i)} big={n <= 3} /></div>
            </Fragment>
          ))}
        </div>
      </div>
    );
  }
  // Snake: 1 → 2 → 3, down, 6 ← 5 ← 4 (numbered badges keep the order obvious).
  const cell = (col: number, row: number): CSSProperties => ({ gridColumn: col, gridRow: row });
  const slot = [[1, 1], [3, 1], [5, 1], [5, 3], [3, 3], [1, 3]];
  return (
    <div className="h-full flex items-center">
      <div className="grid w-full items-stretch" style={{ gridTemplateColumns: '1fr 3.6cqw 1fr 3.6cqw 1fr', columnGap: '1cqw', rowGap: '0.5cqw' }}>
        {items.map((it, i) => (
          <Fragment key={i}>
            <div style={cell(slot[i][0], slot[i][1])}><FlowCard it={it} i={i} p={p} r={at(i)} wide /></div>
            {i > 0 && (
              <div className="flex items-center justify-center" style={i === 3 ? cell(5, 2) : cell(i < 3 ? slot[i][0] - 1 : slot[i][0] + 1, slot[i][1])}>
                <Arrow dir={i < 3 ? 'right' : i === 3 ? 'down' : 'left'} p={p} r={at(i)} size={i === 3 ? 4.2 : 3.6} />
              </div>
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

// ── cards: a grid of related ideas (2–3 per row) ─────────────────────

function Cards({ items, p, at }: { items: DiagramItem[]; p: Palette; at: ItemAt }) {
  const n = items.length;
  const cols = n === 1 ? 1 : n === 2 || n === 4 ? 2 : 3;
  const oneRow = n <= cols;
  const w = cols === 1 ? 40 : cols === 2 ? (oneRow ? 33 : 37) : 27.5;
  return (
    <div className="h-full flex items-center justify-center">
      <div className="flex flex-wrap justify-center items-stretch w-full" style={{ gap: oneRow ? '2.2cqw' : '1.6cqw 2cqw' }}>
        {items.map((it, i) => {
          const { className, style } = revealAttrs(at(i));
          return (
            <div key={i} className={`relative flex ${oneRow ? 'flex-col items-center' : 'items-center'} ${className}`}
              style={{ ...style, width: `${w}cqw`, background: p.a(p.dark ? 0.14 : 0.08), borderRadius: '2.2cqw',
                border: `0.22cqw solid ${p.a(0.18)}`, gap: oneRow ? '1.1cqw' : '1.3cqw', padding: oneRow ? '3cqw 2cqw 2.6cqw' : '1.5cqw 1.8cqw' }}>
              <EmojiDot emoji={it.emoji} n={i + 1} size={oneRow ? 11 : 7} bg={p.surface} ring={p.a(0.25)} />
              <ItemText it={it} label={oneRow ? 2.7 : 2.15} detail={oneRow ? 1.8 : 1.45} center={oneRow} p={p} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── cycle: items around a loop with curved arrows ────────────────────

/**
 * Item angles (degrees, clockwise from 3 o'clock) and card widths, chosen (by a small
 * search) so cards never overlap and every arc between them stays clearly visible.
 */
const CYCLE_ANGLES: Record<number, number[]> = {
  2: [180, 360],
  3: [-90, 30, 150],
  4: [-90, 0, 90, 180],
  5: [-90, -30, 60, 120, 210],
  6: [-90, -45, 45, 90, 135, 225],
};

function Cycle({ items, p, at }: { items: DiagramItem[]; p: Palette; at: ItemAt }) {
  const n = items.length;
  // The loop lives in a fixed-aspect box (a size container), so inside it 1cqw = 1% of the
  // box width and the SVG viewBox (0 0 100 H) maps 1:1 onto the absolutely placed cards.
  const A = 2.6;
  const H = 100 / A;
  const cw = n <= 3 ? 27 : n === 4 ? 25 : n === 5 ? 21 : 19;
  const ch = 12.6;
  const cx = 50, cy = H / 2, rx = 50 - cw / 2 - 0.4, ry = H / 2 - ch / 2 - 0.3;
  const deg = CYCLE_ANGLES[n] ?? items.map((_, i) => -90 + (360 / n) * i);
  const rad = (i: number) => ((i === n ? deg[0] + 360 : deg[i]) * Math.PI) / 180;
  const pt = (t: number): [number, number] => [cx + rx * Math.cos(t), cy + ry * Math.sin(t)];
  const centers = items.map((_, i) => pt(rad(i)));
  const inCard = ([x, y]: [number, number], c: number, m: number) =>
    Math.abs(x - centers[c][0]) <= cw / 2 + m && Math.abs(y - centers[c][1]) <= ch / 2 + m;

  // Arc from card i to card i+1, trimmed to the gap between the cards; arrowhead at its end.
  const seg = (i: number) => {
    const t0 = rad(i), t1 = rad(i + 1), next = (i + 1) % n, N = 240;
    const at = (k: number) => t0 + ((t1 - t0) * k) / N;
    let a = 0, b = N;
    while (a < N && inCard(pt(at(a)), i, 0.7)) a++;
    while (b > 0 && inCard(pt(at(b)), next, 1.3)) b--;
    if (b - a < 4) return null;
    const [ex, ey] = pt(at(b));
    let e = b; // stop the line under the arrowhead so its round cap doesn't poke out
    while (e > a && Math.hypot(pt(at(e))[0] - ex, pt(at(e))[1] - ey) < 1.3) e--;
    const pts = Array.from({ length: 33 }, (_, k) => pt(at(a + ((e - a) * k) / 32)));
    const tb = at(b);
    const angle = (Math.atan2(ry * Math.cos(tb), -rx * Math.sin(tb)) * 180) / Math.PI;
    return { d: 'M' + pts.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(' L'), ex, ey, angle };
  };
  // Arc i (item i → i+1) appears with item i+1; the closing arc with the last item.
  const segAt = (i: number) => at(Math.min(i + 1, n - 1));

  return (
    <div className="h-full w-full flex items-center justify-center" style={{ containerType: 'size' }}>
      <div className="relative" style={{ width: `min(100cqw, 100cqh * ${A})`, height: `min(100cqh, 100cqw / ${A})`, containerType: 'size' }}>
        <svg viewBox={`0 0 100 ${H.toFixed(3)}`} className="absolute inset-0 w-full h-full" aria-hidden style={{ overflow: 'visible' }}>
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={p.a(p.dark ? 0.08 : 0.05)} stroke={p.a(0.3)} strokeWidth={0.45} strokeDasharray="1 1.4" />
          {items.map((_, i) => {
            const s = seg(i);
            if (!s) return null;
            const r = segAt(i);
            const delay = i === n - 1 && n > 2 ? 0.35 : 0;
            const line = revealAttrs(r, 'vs-draw');
            const head = revealAttrs(r, 'vs-zoom');
            return (
              <g key={i}>
                <path d={s.d} pathLength={1} fill="none" stroke={p.accent} strokeWidth={0.95} strokeLinecap="round"
                  className={line.className} style={{ ...line.style, animationDelay: line.className ? `${delay}s` : undefined }} />
                <g transform={`translate(${s.ex.toFixed(2)} ${s.ey.toFixed(2)}) rotate(${s.angle.toFixed(1)})`}>
                  <path d="M-2.1 -1.45 L0 0 L-2.1 1.45 Z" fill={p.accent} stroke={p.accent} strokeWidth={0.8} strokeLinejoin="round"
                    className={head.className} style={{ ...head.style, animationDelay: head.className ? `${delay + 0.45}s` : undefined }} />
                </g>
              </g>
            );
          })}
        </svg>
        {items.map((it, i) => {
          const [x, y] = centers[i];
          const { className, style } = revealAttrs(at(i));
          return (
            <div key={i} className="absolute" style={{ left: `${x}%`, top: `${(y / H) * 100}%`, width: `${cw}cqw`, height: `${ch}cqw`, transform: 'translate(-50%, -50%)' }}>
              <div className={`relative h-full flex items-center overflow-hidden ${className}`}
                style={{ ...cardBox(p, 3), ...style, gap: n >= 6 ? '1cqw' : '1.3cqw', padding: n >= 6 ? '1cqw 1.1cqw 1cqw 1cqw' : '1cqw 1.4cqw 1cqw 1.2cqw' }}>
                <EmojiDot emoji={it.emoji} n={i + 1} size={n >= 6 ? 5.8 : n === 5 ? 6.4 : 7.4} bg={p.a(0.13)} />
                <ItemText it={it} label={n >= 6 ? 2.05 : n === 5 ? 2.2 : 2.4} detail={n >= 5 ? 1.4 : 1.55} p={p} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
