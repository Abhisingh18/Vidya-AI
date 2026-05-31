'use client';

// Animated AI tutor avatar — a friendly humanoid assistant that "talks"
// (mouth animates while narrating), blinks, and gently bobs.
// Pure SVG + CSS, no images or external assets.

interface Props {
  speaking: boolean;
  accent: 'saffron' | 'indigo' | 'teal';
  size?: number;
}

const ACCENT_HEX: Record<string, { a: string; b: string }> = {
  saffron: { a: '#FF8A4C', b: '#FF6B2C' },
  indigo: { a: '#6F6DE1', b: '#3D3BDB' },
  teal: { a: '#34D399', b: '#0F9E75' },
};

export default function AvatarTeacher({ speaking, accent, size = 120 }: Props) {
  const c = ACCENT_HEX[accent] ?? ACCENT_HEX.saffron;
  const uid = accent; // unique-ish gradient id per accent

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Glowing halo */}
      <div
        className={`absolute inset-0 rounded-full blur-xl ${speaking ? 'avatar-halo' : ''}`}
        style={{ background: `radial-gradient(circle, ${c.a}88, transparent 70%)` }}
      />

      {/* Speaking ring */}
      {speaking && (
        <div className="absolute inset-[-6px] rounded-full border-2 avatar-halo" style={{ borderColor: `${c.a}aa` }} />
      )}

      <div className={`relative ${speaking ? '' : 'avatar-bob'}`}>
        <svg viewBox="0 0 200 200" width={size} height={size} fill="none">
          <defs>
            <linearGradient id={`face-${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={c.a} />
              <stop offset="1" stopColor={c.b} />
            </linearGradient>
            <linearGradient id={`visor-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#1A1A2E" />
              <stop offset="1" stopColor="#0A0A14" />
            </linearGradient>
          </defs>

          {/* Head */}
          <rect x="44" y="40" width="112" height="118" rx="40" fill={`url(#face-${uid})`} />
          {/* Subtle cheek shading */}
          <rect x="44" y="40" width="112" height="118" rx="40" fill="#000" opacity="0.05" />

          {/* Antenna — AI vibe */}
          <line x1="100" y1="40" x2="100" y2="22" stroke={c.b} strokeWidth="4" strokeLinecap="round" />
          <circle cx="100" cy="18" r="6" fill="#fff" />
          <circle cx="100" cy="18" r="6" fill={c.a} opacity={speaking ? 0.9 : 0.5}>
            {speaking && <animate attributeName="opacity" values="0.4;1;0.4" dur="1s" repeatCount="indefinite" />}
          </circle>

          {/* Visor / face screen */}
          <rect x="60" y="66" width="80" height="56" rx="26" fill={`url(#visor-${uid})`} />

          {/* Eyes (blink) */}
          <g className="avatar-blink">
            <circle cx="84" cy="90" r="8" fill="#fff" />
            <circle cx="116" cy="90" r="8" fill="#fff" />
            <circle cx="85" cy="91" r="3.5" fill={c.b} />
            <circle cx="117" cy="91" r="3.5" fill={c.b} />
          </g>

          {/* Mouth — animates while speaking, gentle smile when idle */}
          {speaking ? (
            <g className="avatar-talk">
              <rect x="90" y="104" width="20" height="12" rx="6" fill={c.a} />
            </g>
          ) : (
            <path d="M88 108 Q100 116 112 108" stroke={c.a} strokeWidth="3.5" strokeLinecap="round" fill="none" />
          )}

          {/* Headphones — AI tutor look */}
          <path d="M44 96 Q44 64 100 64 Q156 64 156 96" stroke={c.b} strokeWidth="7" fill="none" strokeLinecap="round" />
          <rect x="34" y="92" width="16" height="34" rx="8" fill={c.b} />
          <rect x="150" y="92" width="16" height="34" rx="8" fill={c.b} />

          {/* Little graduation cap accent */}
          <path d="M70 50 L100 38 L130 50 L100 62 Z" fill="#1A1A2E" opacity="0.9" />
          <rect x="98" y="50" width="4" height="14" fill="#1A1A2E" opacity="0.9" />
          <circle cx="100" cy="66" r="3" fill={c.a} />
        </svg>
      </div>

      {/* Talking waveform */}
      {speaking && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-end gap-0.5 h-4">
          {[0, 1, 2, 3, 4].map(i => (
            <span
              key={i}
              className="w-1 rounded-full"
              style={{ background: c.a, animation: `waveBar 0.6s ease-in-out ${i * 0.1}s infinite` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
