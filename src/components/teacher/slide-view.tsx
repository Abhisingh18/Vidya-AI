'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { Slide, SlideImage, SlideTheme } from '@/lib/teacher-docs';
import SlideDiagramView, { EMOJI_FONT, revealAttrs, slidePalette, type Palette, type Reveal } from './slide-diagram';

const clamp = (lines: number): CSSProperties => ({
  display: '-webkit-box', WebkitLineClamp: lines, WebkitBoxOrient: 'vertical', overflow: 'hidden',
});

/**
 * A 16:9 slide drawn with container-relative units (cqw), so the same component
 * works as a thumbnail, the editor preview and full-screen present mode.
 * Layouts follow the visual contract in teacher-docs.ts.
 *
 * `reveal`: how many items (in REVEAL ORDER: bullets, `right`, diagram items) are
 * visible; hidden ones keep their space so nothing shifts. Undefined shows all.
 * `animate` (present mode): newly revealed items pop in and the image slowly zooms.
 */
export default function SlideView({ slide, theme, index, total, reveal, animate = false }: {
  slide: Slide; theme: SlideTheme; index?: number; total?: number; reveal?: number; animate?: boolean;
}) {
  const p = slidePalette(theme);
  const layout = slide.layout;
  const bullets = (slide.bullets ?? []).filter(Boolean);
  const right = layout === 'two-column' ? (slide.right ?? []).filter(Boolean) : [];
  const emoji = (slide.emoji ?? '').trim();

  // Only items revealed since the previous render pop in — not on step back or re-render.
  const last = useRef<{ slide: Slide; reveal: number } | null>(null);
  const popFrom = animate && reveal !== undefined && last.current?.slide === slide ? last.current.reveal : Infinity;
  useEffect(() => { last.current = reveal === undefined ? null : { slide, reveal }; });
  const at = (k: number): Reveal => ({
    hidden: reveal !== undefined && k >= reveal,
    pop: reveal !== undefined && k >= popFrom && k < reveal,
  });

  // A broken image falls back to the emoji.
  const [broken, setBroken] = useState<string | null>(null);
  const image = slide.image && slide.image.url !== broken && layout !== 'two-column' && layout !== 'diagram' ? slide.image : null;
  const brokenUrl = slide.image?.url ?? null;
  const onBroken = useCallback(() => setBroken(brokenUrl), [brokenUrl]);

  const visual = <Visual image={image} emoji={emoji} title={slide.title} p={p} animate={animate} onBroken={onBroken} />;
  const hasVisual = !!(image || emoji);
  const hint = !hasVisual && !slide.diagram && slide.visual
    ? <p className="truncate italic" style={{ fontSize: '1.35cqw', color: p.muted, marginTop: '1.5cqw' }}>🖼 {slide.visual}</p>
    : null;

  let body: ReactNode;
  if (layout === 'title') {
    body = image ? (
      <div className="absolute inset-0 flex items-center" style={{ padding: '5cqw 5cqw 5cqw 7cqw', gap: '4.5cqw' }}>
        <div className="flex-1 min-w-0">
          {emoji && <Emoji emoji={emoji} size={6.5} />}
          <TitleText slide={slide} p={p} size={slide.title.length > 40 ? 4.2 : 5} lines={3} />
        </div>
        <div className="h-full shrink-0" style={{ width: '45%' }}>
          <ImageFrame image={image} title={slide.title} p={p} animate={animate} onBroken={onBroken} tilt />
        </div>
      </div>
    ) : (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center" style={{ padding: '5cqw 10cqw' }}>
        {emoji && <EmojiBubble emoji={emoji} p={p} size={15} animate={animate} />}
        <TitleText slide={slide} p={p} size={slide.title.length > 40 ? 4.6 : 5.6} lines={3} center />
        {hint}
      </div>
    );
  } else if (layout === 'diagram') {
    const items = slide.diagram?.items ?? [];
    const captions = bullets.slice(0, 2);
    body = (
      <div className="absolute inset-0 flex flex-col" style={{ padding: '3.8cqw 5cqw 4cqw' }}>
        <Heading slide={slide} p={p} emoji={items.length ? emoji : ''} size={3.3} />
        <div className="flex-1 min-h-0 flex flex-col" style={{ marginTop: '2cqw' }}>
          {slide.diagram && items.length
            ? <SlideDiagramView diagram={slide.diagram} p={p} at={i => at(bullets.length + i)} />
            : emoji && <div className="m-auto"><EmojiBubble emoji={emoji} p={p} size={22} animate={animate} /></div>}
        </div>
        {captions.length > 0 && (
          <div className="flex justify-center" style={{ gap: '1.6cqw', marginTop: '1.8cqw' }}>
            {captions.map((b, i) => {
              const { className, style } = revealAttrs(at(i));
              return (
                <p key={i} className={`flex items-center min-w-0 ${className}`}
                  style={{ ...style, maxWidth: captions.length > 1 ? '49%' : '80%', gap: '1cqw', fontSize: '1.85cqw', lineHeight: 1.35,
                    background: p.a(p.dark ? 0.14 : 0.08), borderRadius: 999, padding: '0.7cqw 2cqw 0.7cqw 1.4cqw' }}>
                  <Marker kind="dot" p={p} size={1.85} />
                  <span className="truncate">{b}</span>
                </p>
              );
            })}
          </div>
        )}
      </div>
    );
  } else if (layout === 'two-column') {
    const n = Math.max(bullets.length, right.length);
    const size = n <= 2 ? 2.6 : n === 3 ? 2.4 : n === 4 ? 2.2 : n <= 6 ? 1.9 : 1.7;
    body = (
      <div className="absolute inset-0 flex flex-col" style={{ padding: '4.2cqw 5cqw 4.5cqw' }}>
        <Heading slide={slide} p={p} emoji={emoji} />
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden" style={{ paddingTop: '2.2cqw' }}>
          <div className="my-auto grid grid-cols-2 items-stretch" style={{ gap: '2.6cqw' }}>
            {[{ list: bullets, color: p.accent, tint: p.a(p.dark ? 0.12 : 0.07), offset: 0 },
              { list: right, color: p.alt, tint: p.t(p.dark ? 0.12 : 0.08), offset: bullets.length }].map((col, ci) => (
              <div key={ci} className="min-w-0"
                style={{ background: col.tint, borderRadius: '2.2cqw', borderTop: `0.8cqw solid ${col.color}`, padding: `${size}cqw`, minHeight: '20cqw' }}>
                <ul className="flex flex-col" style={{ gap: `${size * 0.45}cqw` }}>
                  {col.list.map((b, i) => (
                    <Bullet key={i} text={b} kind="dot" color={col.color} p={p} size={size} r={at(col.offset + i)} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  } else if (layout === 'image') {
    const size = bullets.length <= 2 ? 2.4 : bullets.length <= 4 ? 2.1 : 1.8;
    body = (
      <div className="absolute inset-0 flex" style={{ padding: '4cqw 4.5cqw', gap: '3.5cqw' }}>
        {hasVisual && <div className="h-full shrink-0 flex flex-col items-center justify-center" style={{ width: '58%' }}>{visual}</div>}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <div className="my-auto">
            <Heading slide={slide} p={p} emoji={image ? emoji : ''} size={3.2} />
            <ul className="flex flex-col" style={{ gap: `${size * 0.5}cqw`, padding: '2.6cqw 0.6cqw 0.8cqw 0.2cqw' }}>
              {bullets.map((b, i) => <Bullet key={i} text={b} kind="dot" p={p} size={size} r={at(i)} />)}
            </ul>
            {hint}
          </div>
        </div>
      </div>
    );
  } else if (layout === 'quote') {
    const quote = slide.subtitle || bullets[0] || '';
    const rest = bullets.slice(slide.subtitle ? 0 : 1);
    body = (
      <div className="absolute inset-0 flex items-center" style={{ padding: '4.5cqw 5cqw 4.5cqw 6cqw', gap: '4cqw' }}>
        <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
          <p className="font-heading font-bold self-start truncate max-w-full"
            style={{ fontSize: '1.9cqw', color: p.accent, background: p.a(0.12), borderRadius: 999, padding: '0.5cqw 1.8cqw', letterSpacing: '0.04em' }}>
            {slide.title}
          </p>
          <div className="relative" style={{ marginTop: '2.6cqw', background: p.a(p.dark ? 0.12 : 0.07), border: `0.2cqw solid ${p.a(0.2)}`, borderRadius: '2.6cqw', padding: '3.4cqw 3.6cqw 3.2cqw 3.6cqw' }}>
            <span aria-hidden className="absolute flex items-center justify-center rounded-full font-heading font-extrabold text-white"
              style={{ left: '-1.6cqw', top: '-1.9cqw', width: '4.4cqw', height: '4.4cqw', fontSize: '4.4cqw', paddingTop: '2.2cqw', lineHeight: 1, background: p.accent }}>“</span>
            <p className="font-heading font-bold" style={{ fontSize: quote.length > 90 ? '2.6cqw' : '3.2cqw', lineHeight: 1.4, ...clamp(5) }}>{quote}</p>
          </div>
          {rest.length > 0 && (
            <p style={{ fontSize: '1.9cqw', color: p.muted, marginTop: '2cqw', lineHeight: 1.4, ...clamp(2) }}>{rest.join(' · ')}</p>
          )}
          {hint}
        </div>
        {hasVisual && <div className="h-full shrink-0 flex flex-col items-center justify-center" style={{ width: image ? '38%' : '28%' }}>{visual}</div>}
      </div>
    );
  } else {
    // bullets / summary (and any unknown layout)
    const n = bullets.length;
    const size = n <= 3 ? 2.6 : n === 4 ? 2.35 : n === 5 ? 2.1 : n === 6 ? 1.95 : 1.75;
    // Many bullets beside a picture: drop the pill boxes and give the text more room.
    const dense = !!image && n >= 5;
    body = (
      <div className="absolute inset-0 flex" style={{ padding: '4.5cqw 5cqw 4.5cqw 5.5cqw', gap: '3.5cqw' }}>
        <div className="flex-1 min-w-0 flex flex-col">
          <Heading slide={slide} p={p} emoji={image ? emoji : ''} />
          <TextList bullets={bullets} kind={layout === 'summary' ? 'check' : 'dot'} p={p} size={dense ? 1.9 : size} at={at} plain={dense} />
          {hint}
        </div>
        {hasVisual && <div className="h-full shrink-0 flex flex-col items-center justify-center" style={{ width: image ? (dense ? '36%' : '40%') : '27%' }}>{visual}</div>}
      </div>
    );
  }

  return (
    <div data-slide-view="" className="relative w-full aspect-video overflow-hidden rounded-lg select-none"
      style={{ background: p.bg, color: p.fg, containerType: 'inline-size' }}>
      {/* soft decorative blobs */}
      <div aria-hidden className="absolute rounded-full" style={{ width: '34cqw', height: '34cqw', right: '-11cqw', top: '-16cqw', background: p.a(p.dark ? 0.1 : 0.07) }} />
      <div aria-hidden className="absolute rounded-full" style={{ width: '17cqw', height: '17cqw', left: '-6cqw', bottom: '-8cqw', background: p.a(p.dark ? 0.08 : 0.06) }} />
      {body}
      {index !== undefined && total !== undefined && (
        <p className="absolute tabular-nums" style={{ right: '2.4cqw', bottom: '1.6cqw', fontSize: '1.25cqw', color: p.muted }}>{index + 1} / {total}</p>
      )}
    </div>
  );
}

// ── text ────────────────────────────────────────────────────────────

function TitleText({ slide, p, size, lines, center }: { slide: Slide; p: Palette; size: number; lines: number; center?: boolean }) {
  return (
    <>
      <p className="font-heading font-extrabold" style={{ fontSize: `${size}cqw`, lineHeight: 1.25, paddingTop: '0.3cqw', ...clamp(lines) }}>{slide.title}</p>
      <div style={{ width: '10cqw', height: '0.7cqw', background: p.accent, borderRadius: 99, margin: center ? '1.8cqw auto 0' : '1.8cqw 0 0' }} />
      {slide.subtitle && (
        <p style={{ fontSize: '2.3cqw', color: p.muted, marginTop: '1.8cqw', lineHeight: 1.4, ...clamp(3) }}>{slide.subtitle}</p>
      )}
    </>
  );
}

/** Slide heading: optional emoji chip + title (≤2 lines) + subtitle. */
function Heading({ slide, p, emoji, size = 3.5 }: { slide: Slide; p: Palette; emoji: string; size?: number }) {
  const s = slide.title.length > 45 ? size * 0.84 : size;
  return (
    <div className="flex items-start shrink-0" style={{ gap: '1.5cqw' }}>
      {emoji && (
        <span className="shrink-0 flex items-center justify-center"
          style={{ width: `${s * 1.7}cqw`, height: `${s * 1.7}cqw`, borderRadius: `${s * 0.45}cqw`, background: p.a(p.dark ? 0.18 : 0.12) }}>
          <span style={{ fontSize: `${s}cqw`, lineHeight: 1, fontFamily: EMOJI_FONT }}>{emoji}</span>
        </span>
      )}
      <div className="min-w-0 flex-1" style={{ paddingTop: emoji ? `${s * 0.12}cqw` : 0 }}>
        <p className="font-heading font-extrabold" style={{ fontSize: `${s}cqw`, lineHeight: 1.3, ...clamp(2) }}>{slide.title}</p>
        {slide.subtitle && (
          <p style={{ fontSize: '1.85cqw', color: p.muted, marginTop: '0.5cqw', lineHeight: 1.4, ...clamp(2) }}>{slide.subtitle}</p>
        )}
      </div>
    </div>
  );
}

function Marker({ kind, p, size, color }: { kind: 'dot' | 'check'; p: Palette; size: number; color?: string }) {
  const c = color ?? p.accent;
  if (kind === 'check') {
    return (
      <span className="shrink-0 rounded-full flex items-center justify-center text-white font-extrabold"
        style={{ width: `${size * 1.2}cqw`, height: `${size * 1.2}cqw`, background: c, fontSize: `${size * 0.7}cqw`, lineHeight: 1 }}>✓</span>
    );
  }
  return (
    <span className="shrink-0 rounded-full" style={{ width: `${size * 0.55}cqw`, height: `${size * 0.55}cqw`, background: c, boxShadow: `0 0 0 ${size * 0.2}cqw ${c}33` }} />
  );
}

function Bullet({ text, kind, color, p, size, r, plain }: { text: string; kind: 'dot' | 'check'; color?: string; p: Palette; size: number; r: Reveal; plain?: boolean }) {
  const { className, style } = revealAttrs(r);
  return (
    <li className={`flex items-center ${className}`}
      style={{ ...style, gap: `${size * 0.75}cqw`, ...(plain ? {} : {
        background: p.dark ? '#FFFFFF0D' : p.surface, borderRadius: `${size * 0.75}cqw`, padding: `${size * 0.42}cqw ${size * 0.8}cqw`,
        boxShadow: p.dark ? undefined : `0 0.25cqw 0.9cqw ${p.f(0.07)}`, border: `0.15cqw solid ${p.a(0.16)}`,
      }) }}>
      <Marker kind={kind} p={p} size={size} color={color} />
      <span className="min-w-0" style={{ fontSize: `${size}cqw`, lineHeight: 1.38, ...clamp(2) }}>{text}</span>
    </li>
  );
}

/** Bullets centred in the remaining height (auto margins: overflow clips at the bottom, never the top). */
function TextList({ bullets, kind, p, size, at, plain }: { bullets: string[]; kind: 'dot' | 'check'; p: Palette; size: number; at: (k: number) => Reveal; plain?: boolean }) {
  if (!bullets.length) return <div className="flex-1" />;
  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden" style={{ paddingTop: '2cqw' }}>
      <ul className="my-auto flex flex-col" style={{ gap: `${size * (plain ? 0.65 : 0.5)}cqw`, padding: '0.4cqw 0.6cqw 0.8cqw 0.2cqw' }}>
        {bullets.map((b, i) => <Bullet key={i} text={b} kind={kind} p={p} size={size} r={at(i)} plain={plain} />)}
      </ul>
    </div>
  );
}

// ── visuals ─────────────────────────────────────────────────────────

function Emoji({ emoji, size }: { emoji: string; size: number }) {
  return <span className="block" style={{ fontSize: `${size}cqw`, lineHeight: 1.1, marginBottom: '1.2cqw', fontFamily: EMOJI_FONT }}>{emoji}</span>;
}

/** The slide emoji as a large, friendly decorative icon. */
function EmojiBubble({ emoji, p, size, animate }: { emoji: string; p: Palette; size: number; animate: boolean }) {
  return (
    <div aria-hidden className="relative shrink-0 flex items-center justify-center" style={{ width: `${size}cqw`, height: `${size}cqw`, maxWidth: '100%', marginBottom: `${size * 0.06}cqw` }}>
      <div className="absolute inset-0 rounded-full" style={{ background: p.a(p.dark ? 0.12 : 0.09) }} />
      <div className="absolute rounded-full" style={{ inset: `${size * 0.12}cqw`, background: p.a(p.dark ? 0.14 : 0.1) }} />
      <span className={`relative ${animate ? 'vs-float' : ''}`} style={{ fontSize: `${size * 0.5}cqw`, lineHeight: 1, fontFamily: EMOJI_FONT }}>{emoji}</span>
    </div>
  );
}

/** Image if we have one, otherwise the emoji bubble. */
function Visual({ image, emoji, title, p, animate, onBroken }: { image: SlideImage | null; emoji: string; title: string; p: Palette; animate: boolean; onBroken: () => void }) {
  if (image) return <ImageFrame image={image} title={title} p={p} animate={animate} onBroken={onBroken} />;
  if (emoji) return <EmojiBubble emoji={emoji} p={p} size={24} animate={animate} />;
  return null;
}

/**
 * Commons image in a rounded white card (so transparent diagrams read on every theme).
 * The frame is a size container, so the card hugs the image's aspect ratio.
 */
function ImageFrame({ image, title, p, animate, onBroken, tilt }: { image: SlideImage; title: string; p: Palette; animate: boolean; onBroken: () => void; tilt?: boolean }) {
  const ref = useRef<HTMLImageElement>(null);
  const ratio = Math.min(2.4, Math.max(0.55, (image.width || 4) / (image.height || 3)));
  const credit = [image.credit, image.license, 'Wikimedia Commons'].filter(Boolean).join(' · ');
  // An error can fire before hydration attaches onError — catch that case too.
  useEffect(() => {
    const el = ref.current;
    if (el?.complete && el.naturalWidth === 0) onBroken();
  }, [image.url, onBroken]);

  return (
    <div className="h-full w-full min-h-0 flex flex-col">
      <div className="flex-1 min-h-0 flex items-center justify-center" style={{ containerType: 'size' }}>
        <div className="bg-white" style={{
          width: `min(100cqw, 100cqh * ${ratio})`, height: `min(100cqh, 100cqw / ${ratio})`,
          padding: '2.2cqmin', borderRadius: '5cqmin', transform: tilt ? 'rotate(2deg)' : undefined,
          boxShadow: `0 1.6cqmin 5cqmin ${p.dark ? '#00000080' : '#1A1A2E2E'}, 0 0 0 0.6cqmin ${p.a(0.18)}`,
        }}>
          <div className="w-full h-full overflow-hidden" style={{ borderRadius: '3.4cqmin' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img ref={ref} src={image.url} alt={title} loading="lazy" decoding="async" draggable={false} onError={onBroken}
              className={`w-full h-full object-contain ${animate ? 'vs-kenburns' : ''}`} />
          </div>
        </div>
      </div>
      <p className="truncate text-center shrink-0" title={credit} style={{ fontSize: '0.95cqw', color: p.muted, marginTop: '1cqw', opacity: 0.85 }}>📷 {credit}</p>
    </div>
  );
}
