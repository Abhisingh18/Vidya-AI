'use client';

import { useEffect, useRef, useState } from 'react';

const PARTICLE_POOL = 16;
const SPAWN_INTERVAL_MS = 55;
const PARTICLE_LIFE_FRAMES = 22;

interface ParticleState {
  el: HTMLSpanElement;
  active: boolean;
  x: number;
  y: number;
  life: number;
  size: number;
  hue: number;
}

export default function CursorEffect() {
  const rootRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: -100, y: -100 });
  const ring = useRef({ x: -100, y: -100 });
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ hovering: false, clicked: false, lastSpawn: 0 });
  const particlesRef = useRef<ParticleState[]>([]);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setEnabled(!isTouch && !reduce);
  }, []);

  useEffect(() => {
    if (!enabled || !rootRef.current) return;
    const root = rootRef.current;

    // Pre-create a pool of particle DOM nodes. Reuse them — no React renders.
    const pool: ParticleState[] = [];
    for (let i = 0; i < PARTICLE_POOL; i++) {
      const el = document.createElement('span');
      el.style.cssText =
        'position:absolute;top:0;left:0;border-radius:50%;pointer-events:none;will-change:transform,opacity;opacity:0;filter:blur(0.5px);transform:translate3d(-100px,-100px,0)';
      root.appendChild(el);
      pool.push({ el, active: false, x: 0, y: 0, life: 0, size: 6, hue: 24 });
    }
    particlesRef.current = pool;

    const onMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;

      const t = e.target as HTMLElement | null;
      const interactive = !!t?.closest('a, button, input, textarea, select, [role="button"], [data-cursor-hover]');
      if (interactive !== stateRef.current.hovering) {
        stateRef.current.hovering = interactive;
        applyHoverStyle(interactive);
      }
    };

    const applyHoverStyle = (hovering: boolean) => {
      if (!ringRef.current || !dotRef.current) return;
      ringRef.current.style.width = hovering ? '56px' : stateRef.current.clicked ? '24px' : '36px';
      ringRef.current.style.height = ringRef.current.style.width;
      ringRef.current.style.borderColor = hovering ? 'rgba(61,59,219,0.55)' : 'rgba(255,107,44,0.55)';
      ringRef.current.style.backgroundColor = hovering ? 'rgba(61,59,219,0.08)' : 'transparent';
      ringRef.current.style.boxShadow = hovering
        ? '0 0 24px rgba(61,59,219,0.35)'
        : '0 0 18px rgba(255,107,44,0.35)';
      dotRef.current.style.backgroundColor = hovering ? '#3D3BDB' : '#FF6B2C';
    };

    const applyClickStyle = (clicked: boolean) => {
      if (!ringRef.current || !dotRef.current) return;
      dotRef.current.style.width = clicked ? '14px' : '8px';
      dotRef.current.style.height = dotRef.current.style.width;
      ringRef.current.style.width = stateRef.current.hovering ? '56px' : clicked ? '24px' : '36px';
      ringRef.current.style.height = ringRef.current.style.width;
    };

    const onDown = () => {
      stateRef.current.clicked = true;
      applyClickStyle(true);
    };
    const onUp = () => {
      stateRef.current.clicked = false;
      applyClickStyle(false);
    };
    const onLeave = () => {
      mouse.current.x = -200;
      mouse.current.y = -200;
    };

    // Initial styles
    applyHoverStyle(false);
    applyClickStyle(false);

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mousedown', onDown, { passive: true });
    window.addEventListener('mouseup', onUp, { passive: true });
    document.addEventListener('mouseleave', onLeave);

    const tick = () => {
      // Smooth lerp ring follow
      ring.current.x += (mouse.current.x - ring.current.x) * 0.18;
      ring.current.y += (mouse.current.y - ring.current.y) * 0.18;

      if (dotRef.current) {
        dotRef.current.style.transform =
          `translate3d(${mouse.current.x}px, ${mouse.current.y}px, 0) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform =
          `translate3d(${ring.current.x}px, ${ring.current.y}px, 0) translate(-50%, -50%)`;
      }

      // Spawn a particle at most every SPAWN_INTERVAL_MS, and only when mouse is on-screen
      const now = performance.now();
      if (
        mouse.current.x > -50 &&
        now - stateRef.current.lastSpawn > SPAWN_INTERVAL_MS
      ) {
        stateRef.current.lastSpawn = now;
        const idle = pool.find(p => !p.active);
        if (idle) {
          idle.active = true;
          idle.life = PARTICLE_LIFE_FRAMES;
          idle.size = 4 + Math.random() * 5;
          idle.hue = 18 + Math.random() * 20;
          idle.x = mouse.current.x + (Math.random() - 0.5) * 6;
          idle.y = mouse.current.y + (Math.random() - 0.5) * 6;
          idle.el.style.width = `${idle.size}px`;
          idle.el.style.height = `${idle.size}px`;
          idle.el.style.background = `radial-gradient(circle, hsl(${idle.hue},100%,60%) 0%, hsla(${idle.hue},100%,55%,0.4) 50%, transparent 70%)`;
        }
      }

      // Step every active particle
      for (let i = 0; i < pool.length; i++) {
        const p = pool[i];
        if (!p.active) continue;
        p.life -= 1;
        p.y -= 0.5;
        if (p.life <= 0) {
          p.active = false;
          p.el.style.opacity = '0';
          continue;
        }
        const alpha = p.life / PARTICLE_LIFE_FRAMES;
        p.el.style.opacity = String(alpha);
        p.el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) translate(-50%, -50%)`;
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      document.removeEventListener('mouseleave', onLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      pool.forEach(p => p.el.remove());
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div ref={rootRef} className="pointer-events-none fixed inset-0 z-[9999]" aria-hidden>
      <div
        ref={ringRef}
        className="absolute top-0 left-0 rounded-full border-2 will-change-transform"
        style={{ transition: 'width 180ms ease-out, height 180ms ease-out, border-color 180ms, background-color 180ms, box-shadow 180ms' }}
      />
      <div
        ref={dotRef}
        className="absolute top-0 left-0 rounded-full will-change-transform"
        style={{
          width: 8,
          height: 8,
          backgroundColor: '#FF6B2C',
          boxShadow: '0 0 10px currentColor',
          transition: 'width 150ms ease-out, height 150ms ease-out, background-color 150ms',
        }}
      />
    </div>
  );
}
