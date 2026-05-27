'use client';

import { useEffect, useMemo, useState } from 'react';

export interface SceneStep {
  at: number;
  duration?: number;
  type: 'title' | 'subtitle' | 'text' | 'equation' | 'circle' | 'rectangle'
      | 'polygon' | 'line' | 'arrow' | 'curve' | 'axes' | 'point' | 'clear';
  text?: string;
  cx?: number; cy?: number; r?: number;
  x?: number; y?: number; w?: number; h?: number;
  points?: [number, number][];
  from?: [number, number]; to?: [number, number];
  d?: string;
  color?: string;
  fill?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface Scene {
  title: string;
  subtitle?: string;
  duration: number;
  steps: SceneStep[];
}

const COLOR_MAP: Record<string, string> = {
  saffron: '#FF6B2C',
  indigo:  '#6F6DE1',
  teal:    '#34D399',
  white:   '#F0F0FF',
  muted:   '#9CA3AF',
  red:     '#F87171',
  yellow:  '#FBBF24',
  green:   '#22C55E',
};

const SIZE_MAP: Record<string, number> = {
  sm: 11,
  md: 14,
  lg: 20,
  xl: 28,
};

function resolveColor(c?: string): string {
  if (!c) return '#F0F0FF';
  return COLOR_MAP[c.toLowerCase()] ?? c;
}

/* ── Render a single step at current playhead time ── */
function StepElement({ step, elapsed }: { step: SceneStep; elapsed: number }) {
  const sinceStart = elapsed - step.at;
  if (sinceStart < 0) return null;

  // entrance animation (0–600ms after step time)
  const fadeProgress = Math.min(1, sinceStart / 0.6);
  const opacity = fadeProgress;
  const scale = 0.92 + 0.08 * fadeProgress;
  const color = resolveColor(step.color);
  const fontSize = SIZE_MAP[step.size ?? 'md'];

  const animStyle: React.CSSProperties = {
    opacity,
    transform: `scale(${scale})`,
    transformOrigin: 'center',
    transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
  };

  switch (step.type) {
    case 'title':
      return (
        <text x={160} y={28} fill={color} fontSize={22} fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight="bold" textAnchor="middle" style={animStyle}>
          {step.text}
        </text>
      );
    case 'subtitle':
      return (
        <text x={160} y={50} fill={color} fontSize={13} fontFamily="sans-serif" textAnchor="middle" style={animStyle}>
          {step.text}
        </text>
      );
    case 'text':
      return (
        <text x={step.x ?? 160} y={step.y ?? 100} fill={color} fontSize={fontSize} fontFamily="sans-serif" textAnchor="middle" style={animStyle}>
          {step.text}
        </text>
      );
    case 'equation':
      return (
        <text x={step.x ?? 160} y={step.y ?? 100} fill={color} fontSize={fontSize + 4} fontFamily="'Cambria Math', 'Times New Roman', serif" fontStyle="italic" textAnchor="middle" style={animStyle}>
          {step.text}
        </text>
      );
    case 'circle': {
      const r = step.r ?? 30;
      const circumference = 2 * Math.PI * r;
      const drawProgress = Math.min(1, sinceStart / 0.8);
      const dashOffset = circumference * (1 - drawProgress);
      return (
        <circle
          cx={step.cx ?? 160}
          cy={step.cy ?? 100}
          r={r}
          fill={step.fill ? color + '20' : 'none'}
          stroke={color}
          strokeWidth={2}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ opacity, transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
      );
    }
    case 'rectangle':
      return (
        <rect
          x={step.x ?? 100} y={step.y ?? 70}
          width={step.w ?? 100} height={step.h ?? 60}
          fill={step.fill ? color + '20' : 'none'}
          stroke={color} strokeWidth={2}
          style={animStyle}
        />
      );
    case 'polygon': {
      if (!step.points || step.points.length < 3) return null;
      const pts = step.points.map(p => p.join(',')).join(' ');
      // Calculate perimeter for draw effect
      let perim = 0;
      for (let i = 0; i < step.points.length; i++) {
        const a = step.points[i];
        const b = step.points[(i + 1) % step.points.length];
        perim += Math.hypot(b[0] - a[0], b[1] - a[1]);
      }
      const drawProgress = Math.min(1, sinceStart / 1.2);
      return (
        <polygon
          points={pts}
          fill={step.fill ? color + '25' : 'none'}
          stroke={color} strokeWidth={2}
          strokeDasharray={perim}
          strokeDashoffset={perim * (1 - drawProgress)}
          style={{ opacity, transition: 'stroke-dashoffset 1.2s ease-out' }}
        />
      );
    }
    case 'line': {
      if (!step.from || !step.to) return null;
      const len = Math.hypot(step.to[0] - step.from[0], step.to[1] - step.from[1]);
      const drawProgress = Math.min(1, sinceStart / 0.8);
      return (
        <>
          <line
            x1={step.from[0]} y1={step.from[1]}
            x2={step.to[0]} y2={step.to[1]}
            stroke={color} strokeWidth={2}
            strokeDasharray={len}
            strokeDashoffset={len * (1 - drawProgress)}
            style={{ opacity, transition: 'stroke-dashoffset 0.8s ease-out' }}
          />
          {step.label && (
            <text
              x={(step.from[0] + step.to[0]) / 2}
              y={(step.from[1] + step.to[1]) / 2 - 5}
              fill={color} fontSize={10} textAnchor="middle"
              style={animStyle}
            >
              {step.label}
            </text>
          )}
        </>
      );
    }
    case 'arrow': {
      if (!step.from || !step.to) return null;
      const dx = step.to[0] - step.from[0];
      const dy = step.to[1] - step.from[1];
      const len = Math.hypot(dx, dy);
      const ux = dx / len, uy = dy / len;
      const arrowSize = 8;
      const baseX = step.to[0] - ux * arrowSize;
      const baseY = step.to[1] - uy * arrowSize;
      const perpX = -uy * (arrowSize / 2);
      const perpY = ux * (arrowSize / 2);
      return (
        <g style={animStyle}>
          <line x1={step.from[0]} y1={step.from[1]} x2={baseX} y2={baseY} stroke={color} strokeWidth={2.5} />
          <polygon points={`${step.to[0]},${step.to[1]} ${baseX + perpX},${baseY + perpY} ${baseX - perpX},${baseY - perpY}`} fill={color} />
          {step.label && (
            <text x={(step.from[0] + step.to[0]) / 2} y={(step.from[1] + step.to[1]) / 2 - 6} fill={color} fontSize={11} textAnchor="middle" fontWeight="bold">
              {step.label}
            </text>
          )}
        </g>
      );
    }
    case 'curve': {
      if (!step.d) return null;
      // Approximate the path length by counting characters — good enough for drawing effect
      const approxLen = Math.max(200, step.d.length * 3);
      const drawProgress = Math.min(1, sinceStart / 1.5);
      return (
        <path
          d={step.d}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeDasharray={approxLen}
          strokeDashoffset={approxLen * (1 - drawProgress)}
          style={{ opacity, transition: 'stroke-dashoffset 1.5s ease-out' }}
        />
      );
    }
    case 'axes': {
      return (
        <g style={animStyle}>
          <line x1={20} y1={170} x2={300} y2={170} stroke={color} strokeWidth={1} opacity={0.5} />
          <line x1={160} y1={20} x2={160} y2={180} stroke={color} strokeWidth={1} opacity={0.5} />
          <text x={302} y={172} fill={color} fontSize={10} opacity={0.7}>x</text>
          <text x={154} y={20} fill={color} fontSize={10} opacity={0.7}>y</text>
        </g>
      );
    }
    case 'point': {
      const drawProgress = Math.min(1, sinceStart / 0.4);
      return (
        <g>
          <circle cx={step.cx ?? 160} cy={step.cy ?? 100} r={5 * drawProgress} fill={color} style={{ opacity }} />
          {step.label && (
            <text x={(step.cx ?? 160) + 8} y={(step.cy ?? 100) - 4} fill={color} fontSize={11} fontWeight="bold" style={animStyle}>
              {step.label}
            </text>
          )}
        </g>
      );
    }
    default:
      return null;
  }
}

/* ── Main scene renderer ── */
export default function SceneRenderer({ scene, currentTime }: { scene: Scene | null; currentTime: number }) {
  const segments = useMemo(() => {
    if (!scene) return [{ from: 0, to: Infinity, steps: [] as SceneStep[] }];
    // Split scene into segments by `clear` markers
    const sorted = [...scene.steps].sort((a, b) => a.at - b.at);
    const segments: { from: number; to: number; steps: SceneStep[] }[] = [];
    let buffer: SceneStep[] = [];
    let segStart = 0;
    for (const step of sorted) {
      if (step.type === 'clear') {
        segments.push({ from: segStart, to: step.at, steps: buffer });
        buffer = [];
        segStart = step.at;
      } else {
        buffer.push(step);
      }
    }
    segments.push({ from: segStart, to: Infinity, steps: buffer });
    return segments;
  }, [scene]);

  if (!scene) return null;

  // Pick the active segment
  const active = segments.find(s => currentTime >= s.from && currentTime < s.to) ?? segments[segments.length - 1];

  // Only render steps whose 'at' time has come
  const visibleSteps = active.steps.filter(s => currentTime >= s.at);

  return (
    <svg viewBox="0 0 320 200" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <pattern id="bggrid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="320" height="200" fill="url(#bggrid)" />
      {visibleSteps.map((step, i) => (
        <StepElement key={`${active.from}-${i}-${step.at}`} step={step} elapsed={currentTime} />
      ))}
    </svg>
  );
}
