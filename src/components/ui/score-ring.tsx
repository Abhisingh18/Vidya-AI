// Circular score that draws itself in (ph-ring). Colour follows the score.

export default function ScoreRing({ pct, size = 128, label }: { pct: number; size?: number; label?: string }) {
  const stroke = Math.round(size / 11);
  const r = (size - stroke) / 2;
  const len = 2 * Math.PI * r;
  const off = len * (1 - Math.max(0, Math.min(100, pct)) / 100);
  const tone = pct >= 75 ? '#14B8A6' : pct >= 50 ? '#FBBF24' : '#F43F5E';
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }} role="img" aria-label={`${pct} percent`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-card-border dark:text-dark-border" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tone} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={len} className="ph-ring" style={{ ['--len' as string]: len, ['--off' as string]: off, strokeDashoffset: off }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading text-3xl font-extrabold text-navy dark:text-dark-text">{pct}%</span>
        {label && <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</span>}
      </div>
    </div>
  );
}
