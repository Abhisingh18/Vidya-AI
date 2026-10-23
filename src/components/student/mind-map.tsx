'use client';

// Mind map for revision notes: the topic in the centre with its branches around
// it (wide screens and print), or a simple tree on phones.
import type { MindMap } from '@/lib/notes';

const BRANCH_COLORS = [
  { ring: 'border-saffron/60', bg: 'bg-saffron/10', text: 'text-saffron', line: '#FF6B2C' },
  { ring: 'border-indigo-brand/50', bg: 'bg-indigo-brand/10', text: 'text-indigo-brand', line: '#4F46E5' },
  { ring: 'border-teal/50', bg: 'bg-teal/10', text: 'text-teal', line: '#0F9E75' },
  { ring: 'border-pink-400/60', bg: 'bg-pink-400/10', text: 'text-pink-500', line: '#EC4899' },
  { ring: 'border-amber-400/60', bg: 'bg-amber-400/10', text: 'text-amber-600', line: '#D97706' },
  { ring: 'border-sky-400/60', bg: 'bg-sky-400/10', text: 'text-sky-600', line: '#0284C7' },
];

/** Branch centres on an ellipse around the middle, first branch at the top. */
function positions(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return { x: 50 + 34 * Math.cos(a), y: 50 + 36 * Math.sin(a) };
  });
}

export default function MindMapView({ map }: { map: MindMap }) {
  const branches = map.children.filter(b => b.label || b.children.some(l => l.label));
  const pos = positions(branches.length);

  const root = (
    <div className="rounded-2xl bg-gradient-saffron text-white px-5 py-3 shadow-saffron/40 shadow-lg text-center max-w-[220px]">
      {map.emoji && <div className="text-3xl leading-none mb-1">{map.emoji}</div>}
      <p className="font-heading font-bold leading-tight" dir="auto">{map.label}</p>
    </div>
  );

  return (
    <div>
      {/* Radial layout */}
      <div className="hidden sm:block print:block relative w-full" style={{ height: Math.max(460, 140 + branches.length * 60) }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          {pos.map((p, i) => (
            <line key={i} x1="50" y1="50" x2={p.x} y2={p.y} stroke={BRANCH_COLORS[i % BRANCH_COLORS.length].line}
              strokeOpacity="0.45" strokeWidth="0.6" vectorEffect="non-scaling-stroke" style={{ strokeWidth: 2 }} />
          ))}
        </svg>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">{root}</div>
        {branches.map((b, i) => {
          const c = BRANCH_COLORS[i % BRANCH_COLORS.length];
          return (
            <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2 w-[30%] max-w-[240px]" style={{ left: `${pos[i].x}%`, top: `${pos[i].y}%` }}>
              <div className={`rounded-2xl border-2 ${c.ring} bg-white dark:bg-dark-surface px-3 py-2.5 shadow-card`}>
                <p className={`font-heading font-semibold text-sm flex items-center gap-1.5 ${c.text}`} dir="auto">
                  {b.emoji && <span className="text-lg leading-none">{b.emoji}</span>}{b.label}
                </p>
                {b.children.some(l => l.label) && (
                  <ul className="mt-1.5 flex flex-wrap gap-1">
                    {b.children.filter(l => l.label).map((l, j) => (
                      <li key={j} className={`text-[11px] leading-snug rounded-md px-1.5 py-0.5 ${c.bg} text-navy/80 dark:text-dark-text/80`} dir="auto">{l.label}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Phone: tree */}
      <div className="sm:hidden print:hidden">
        <div className="flex justify-center mb-3">{root}</div>
        <ul className="space-y-2.5 border-l-2 border-saffron/30 ml-3 pl-4">
          {branches.map((b, i) => {
            const c = BRANCH_COLORS[i % BRANCH_COLORS.length];
            return (
              <li key={i} className={`rounded-xl border-2 ${c.ring} bg-white dark:bg-dark-surface px-3 py-2`}>
                <p className={`font-heading font-semibold text-sm flex items-center gap-1.5 ${c.text}`} dir="auto">
                  {b.emoji && <span className="text-lg leading-none">{b.emoji}</span>}{b.label}
                </p>
                {b.children.some(l => l.label) && (
                  <p className="text-xs text-navy/70 dark:text-dark-text/70 mt-1" dir="auto">{b.children.map(l => l.label).filter(Boolean).join(' · ')}</p>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
