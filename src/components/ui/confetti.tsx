// A burst of saffron-and-friends confetti for a win (finished a deck, a great test score).
// Pure CSS (globals.css, ph-confetti); pieces are fixed-position and clean themselves up.

const COLORS = ['#FF6B1A', '#F43F5E', '#FFB27A', '#FBBF24', '#6366F1', '#14B8A6'];
const r = (i: number, k: number) => { const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return s - Math.floor(s); };

export default function Confetti({ pieces = 70 }: { pieces?: number }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {Array.from({ length: pieces }, (_, i) => (
        <span key={i} className="ph-confetti"
          style={{
            left: `${r(i, 1) * 100}%`, background: COLORS[i % COLORS.length],
            ['--dx' as string]: `${(r(i, 2) - 0.5) * 220}px`, ['--rot' as string]: `${(r(i, 3) - 0.5) * 1080}deg`,
            ['--dur' as string]: `${2.4 + r(i, 4) * 2}s`, ['--delay' as string]: `${r(i, 5) * 0.6}s`,
            width: `${6 + r(i, 6) * 6}px`, height: `${10 + r(i, 7) * 8}px`,
          }} />
      ))}
    </div>
  );
}
