'use client';

import { useEffect, useRef, useState } from 'react';

type Particle = {
  id: number;
  x: number;
  y: number;
  size: number;
  hue: number;
  life: number;
};

export default function CursorEffect() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: -100, y: -100 });
  const ring = useRef({ x: -100, y: -100 });
  const rafRef = useRef<number | null>(null);
  const particleId = useRef(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [clicked, setClicked] = useState(false);

  // Disable on touch devices / reduced motion
  useEffect(() => {
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setEnabled(!isTouch && !reduce);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let lastSpawn = 0;

    const onMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;

      // Spawn a spark particle every ~40ms while moving
      const now = performance.now();
      if (now - lastSpawn > 40) {
        lastSpawn = now;
        const id = particleId.current++;
        setParticles(prev => [
          ...prev.slice(-18),
          {
            id,
            x: e.clientX + (Math.random() - 0.5) * 6,
            y: e.clientY + (Math.random() - 0.5) * 6,
            size: 4 + Math.random() * 5,
            hue: 18 + Math.random() * 20, // saffron-ish range
            life: 1,
          },
        ]);
      }

      // Detect interactive hover target
      const t = e.target as HTMLElement | null;
      const interactive = !!t?.closest('a, button, input, textarea, select, [role="button"], [data-cursor-hover]');
      setHovering(interactive);
    };

    const onDown = () => setClicked(true);
    const onUp = () => setClicked(false);
    const onLeave = () => {
      mouse.current.x = -100;
      mouse.current.y = -100;
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    document.addEventListener('mouseleave', onLeave);

    const tick = () => {
      // Smooth ring follow (lerp)
      ring.current.x += (mouse.current.x - ring.current.x) * 0.18;
      ring.current.y += (mouse.current.y - ring.current.y) * 0.18;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouse.current.x}px, ${mouse.current.y}px, 0) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ring.current.x}px, ${ring.current.y}px, 0) translate(-50%, -50%)`;
      }

      // Fade particles
      setParticles(prev =>
        prev
          .map(p => ({ ...p, life: p.life - 0.04, y: p.y - 0.4 }))
          .filter(p => p.life > 0),
      );

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      document.removeEventListener('mouseleave', onLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="cursor-effect-root pointer-events-none fixed inset-0 z-[9999]" aria-hidden>
      {/* Sparkle trail */}
      {particles.map(p => (
        <span
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(circle, hsla(${p.hue}, 100%, 60%, ${p.life}) 0%, hsla(${p.hue}, 100%, 55%, ${p.life * 0.4}) 50%, transparent 70%)`,
            filter: 'blur(0.5px)',
            opacity: p.life,
          }}
        />
      ))}

      {/* Outer ring */}
      <div
        ref={ringRef}
        className="absolute top-0 left-0 rounded-full border-2 transition-[width,height,border-color,background-color] duration-200 ease-out will-change-transform"
        style={{
          width: hovering ? 56 : clicked ? 24 : 36,
          height: hovering ? 56 : clicked ? 24 : 36,
          borderColor: hovering ? 'rgba(61, 59, 219, 0.55)' : 'rgba(255, 107, 44, 0.55)',
          backgroundColor: hovering ? 'rgba(61, 59, 219, 0.08)' : 'transparent',
          boxShadow: hovering
            ? '0 0 24px rgba(61, 59, 219, 0.35)'
            : '0 0 18px rgba(255, 107, 44, 0.35)',
        }}
      />

      {/* Inner dot */}
      <div
        ref={dotRef}
        className="absolute top-0 left-0 rounded-full transition-[width,height,background-color] duration-150 ease-out will-change-transform"
        style={{
          width: clicked ? 14 : 8,
          height: clicked ? 14 : 8,
          backgroundColor: hovering ? '#3D3BDB' : '#FF6B2C',
          boxShadow: '0 0 10px currentColor',
        }}
      />
    </div>
  );
}
