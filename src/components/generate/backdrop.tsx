// Ambient backdrop for the generate page: slow aurora light and formulas from
// every subject drifting around the edges, kept clear of the centre where the
// composer sits. Pure CSS animation (globals.css, gen-*); `quiet` dims it while a
// lesson is being made or watched.

const GLYPHS = [
  'π', 'E = mc²', 'a² + b² = c²', 'H₂O', '∫ f(x) dx', 'F = ma', '√2', 'λ', 'CO₂', '∞', 'Δx', 'sin θ',
  '🧬', '⚛️', '🪐', '🌍', '📐', '🌱', '🧪', '🔭', '🦠', '⚡', '🏛️', '🗺️',
];

const rand = (i: number) => { const s = Math.sin(i * 91.7 + 17.3) * 43758.5453; return s - Math.floor(s); };

export default function GenerateBackdrop({ quiet = false }: { quiet?: boolean }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden transition-opacity duration-700 ${quiet ? 'opacity-40' : 'opacity-100'}`}>
      <div className="gen-aurora absolute -left-[10%] top-[8%] h-[46vh] w-[46vh] rounded-full bg-saffron/20 blur-[110px]" />
      <div className="gen-aurora absolute -right-[8%] top-[30%] h-[52vh] w-[52vh] rounded-full bg-indigo-brand/20 blur-[120px] [animation-delay:-6s]" />
      <div className="gen-aurora absolute bottom-[-12%] left-[30%] h-[44vh] w-[44vh] rounded-full bg-teal/15 blur-[110px] [animation-delay:-12s]" />
      <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.07]"
        style={{ backgroundImage: 'linear-gradient(#3D3BDB 1px,transparent 1px),linear-gradient(90deg,#3D3BDB 1px,transparent 1px)', backgroundSize: '56px 56px' }} />
      {/* glyphs, faded out around the centre column */}
      <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,transparent_28%,black_62%)]">
        {GLYPHS.map((g, i) => {
          const emoji = (g.codePointAt(0) ?? 0) >= 0x2600;
          return (
            <span key={i} className="gen-float absolute select-none font-heading font-bold text-navy/25 dark:text-white/20"
              style={{
                left: `${4 + rand(i) * 88}%`, top: `${6 + rand(i + 40) * 82}%`,
                fontSize: emoji ? `${26 + rand(i + 7) * 22}px` : `${16 + rand(i + 7) * 18}px`,
                opacity: emoji ? 0.55 : 1,
                animationDuration: `${14 + rand(i + 3) * 12}s`, animationDelay: `${-rand(i + 5) * 20}s`,
                filter: rand(i + 11) > 0.7 ? 'blur(1.5px)' : undefined,
              }}>
              {g}
            </span>
          );
        })}
      </div>
    </div>
  );
}
