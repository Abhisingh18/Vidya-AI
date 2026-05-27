'use client';

import type { SceneStep } from './scene-renderer';

const COLOR: Record<string, string> = {
  saffron: '#FF6B2C',
  indigo:  '#6F6DE1',
  teal:    '#34D399',
  white:   '#F0F0FF',
  muted:   '#9CA3AF',
  red:     '#F87171',
  yellow:  '#FBBF24',
  green:   '#22C55E',
};

const SIZE: Record<string, number> = { sm: 11, md: 14, lg: 20, xl: 28 };

function c(color?: string) {
  if (!color) return '#F0F0FF';
  return COLOR[color.toLowerCase()] ?? color;
}

/**
 * Static (non-animated) preview of a scene. Renders every visual step at once,
 * fully drawn — ideal for library cards & social-share thumbnails.
 */
export default function SceneThumbnail({ steps: rawSteps }: { steps: SceneStep[] }) {
  if (!rawSteps || rawSteps.length === 0) return null;

  // De-overlap text by position bucket — only the latest text wins each slot.
  const TEXT_TYPES = new Set(['title', 'subtitle', 'text', 'equation']);
  const posKey = (s: SceneStep): string | null => {
    if (!TEXT_TYPES.has(s.type)) return null;
    const x = s.type === 'title' || s.type === 'subtitle' ? 160 : (s.x ?? 160);
    const y = s.type === 'title' ? 28
      : s.type === 'subtitle' ? 50
      : (s.y ?? 100);
    return `${Math.round(x / 60)}:${Math.round(y / 18)}`;
  };
  const latestAt = new Map<string, number>();
  for (const s of rawSteps) {
    const k = posKey(s);
    if (k === null) continue;
    const prev = latestAt.get(k);
    if (prev === undefined || s.at > prev) latestAt.set(k, s.at);
  }
  const steps = rawSteps.filter(s => {
    const k = posKey(s);
    if (k === null) return true;
    return latestAt.get(k) === s.at;
  });

  return (
    <svg viewBox="0 0 320 200" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="bg-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1A1A2E" />
          <stop offset="100%" stopColor="#0F0F1A" />
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#FF6B2C" stopOpacity="0.12" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width="320" height="200" fill="url(#bg-grad)" />
      <rect x="0" y="0" width="320" height="200" fill="url(#glow)" />

      {steps.map((step, i) => {
        const color = c(step.color);
        const fontSize = SIZE[step.size ?? 'md'];

        switch (step.type) {
          case 'title':
            return (
              <text key={i} x={160} y={28} fill={color} fontSize={20} fontWeight="700"
                    fontFamily="'Plus Jakarta Sans', sans-serif" textAnchor="middle">
                {String(step.text ?? '').slice(0, 28)}
              </text>
            );
          case 'text':
            return (
              <text key={i} x={step.x ?? 160} y={step.y ?? 100} fill={color}
                    fontSize={fontSize} textAnchor="middle" fontFamily="sans-serif">
                {String(step.text ?? '').slice(0, 22)}
              </text>
            );
          case 'equation':
            return (
              <text key={i} x={step.x ?? 160} y={step.y ?? 100} fill={color}
                    fontSize={fontSize + 4} fontStyle="italic" textAnchor="middle"
                    fontFamily="'Cambria Math', 'Times New Roman', serif">
                {String(step.text ?? '').slice(0, 22)}
              </text>
            );
          case 'circle':
            return (
              <circle key={i} cx={step.cx ?? 160} cy={step.cy ?? 100} r={step.r ?? 30}
                      fill={step.fill ? color + '33' : 'none'} stroke={color} strokeWidth={2} />
            );
          case 'rectangle':
            return (
              <rect key={i} x={step.x ?? 100} y={step.y ?? 70} width={step.w ?? 100} height={step.h ?? 60}
                    fill={step.fill ? color + '33' : 'none'} stroke={color} strokeWidth={2} />
            );
          case 'polygon': {
            if (!step.points || step.points.length < 3) return null;
            const pts = step.points.map(p => p.join(',')).join(' ');
            return (
              <polygon key={i} points={pts} fill={step.fill ? color + '30' : color + '18'} stroke={color} strokeWidth={2} />
            );
          }
          case 'line':
            if (!step.from || !step.to) return null;
            return (
              <line key={i} x1={step.from[0]} y1={step.from[1]} x2={step.to[0]} y2={step.to[1]}
                    stroke={color} strokeWidth={2} />
            );
          case 'arrow': {
            if (!step.from || !step.to) return null;
            const [fx, fy] = step.from;
            const [tx, ty] = step.to;
            const dx = tx - fx, dy = ty - fy;
            const len = Math.hypot(dx, dy) || 1;
            const ux = dx / len, uy = dy / len;
            const baseX = tx - ux * 8;
            const baseY = ty - uy * 8;
            const pX = -uy * 4, pY = ux * 4;
            return (
              <g key={i}>
                <line x1={fx} y1={fy} x2={baseX} y2={baseY} stroke={color} strokeWidth={2.5} />
                <polygon points={`${tx},${ty} ${baseX + pX},${baseY + pY} ${baseX - pX},${baseY - pY}`} fill={color} />
              </g>
            );
          }
          case 'curve':
            if (!step.d) return null;
            return <path key={i} d={step.d} fill="none" stroke={color} strokeWidth={2.5} />;
          case 'axes':
            return (
              <g key={i} opacity={0.5}>
                <line x1={20} y1={170} x2={300} y2={170} stroke={color} strokeWidth={1} />
                <line x1={160} y1={20} x2={160} y2={180} stroke={color} strokeWidth={1} />
              </g>
            );
          case 'point':
            return (
              <circle key={i} cx={step.cx ?? 160} cy={step.cy ?? 100} r={4} fill={color} />
            );
          default:
            return null;
        }
      })}
    </svg>
  );
}
