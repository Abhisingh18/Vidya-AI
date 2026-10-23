import { useId } from 'react';

// The VidyaAI logo: a calligraphic "V" (Vidya — knowledge) whose thin stroke ends
// in a spark (AI), on a saffron-to-rose tile. The same drawing is used for the
// favicon and app icons in /public and src/app.

/** Geometry shared with the static icon files (64×64 design units). */
export const LOGO_V =
  'M13.2 14.6 C15.4 13 18.6 13.6 19.8 16 L32.4 42.6 L39.2 29.6 C39.9 28.3 41.6 27.9 42.8 28.8 C43.8 29.6 44 30.9 43.4 32 L35.2 48.6 C33.6 51.8 29 51.6 27.6 48.3 L12.6 18.6 C12 17.2 12.2 15.5 13.2 14.6 Z';

/** Four-point spark centred on (cx, cy). */
export const spark = (cx: number, cy: number, r: number) =>
  `M${cx} ${cy - r} Q${cx + r * 0.14} ${cy - r * 0.14} ${cx + r} ${cy} Q${cx + r * 0.14} ${cy + r * 0.14} ${cx} ${cy + r} `
  + `Q${cx - r * 0.14} ${cy + r * 0.14} ${cx - r} ${cy} Q${cx - r * 0.14} ${cy - r * 0.14} ${cx} ${cy - r} Z`;

export function LogoMark({ size = 36, className = '' }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${id}g`} x1="6" y1="4" x2="58" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFB347" />
          <stop offset="0.48" stopColor="#FF6B2C" />
          <stop offset="1" stopColor="#E8336D" />
        </linearGradient>
        <radialGradient id={`${id}h`} cx="18" cy="10" r="40" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity="0.42" />
          <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="17" fill={`url(#${id}g)`} />
      <rect x="2" y="2" width="60" height="60" rx="17" fill={`url(#${id}h)`} />
      <rect x="2.5" y="2.5" width="59" height="59" rx="16.5" fill="none" stroke="#fff" strokeOpacity="0.22" />
      <path d={LOGO_V} fill="#fff" />
      <path d={spark(46.4, 20.4, 9.4)} fill="#fff" />
      <path d={spark(53.4, 32.6, 2.5)} fill="#fff" fillOpacity="0.8" />
    </svg>
  );
}

/** Mark + "VidyaAI" wordmark. `onDark` keeps "Vidya" white on dark backgrounds (footer). */
export default function Logo({ size = 36, onDark = false, className = '' }: { size?: number; onDark?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={size} className="shrink-0 drop-shadow-[0_4px_12px_rgba(255,107,44,0.35)] transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105" />
      <span className={`font-heading font-extrabold tracking-tight ${onDark ? 'text-white' : 'text-navy dark:text-dark-text'}`}
        style={{ fontSize: Math.round(size * 0.58) }}>
        Vidya<span className="bg-gradient-to-r from-[#FF8A3D] via-[#FF5A2C] to-[#E8336D] bg-clip-text text-transparent">AI</span>
      </span>
    </span>
  );
}
