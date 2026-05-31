'use client';

// Animated visual "stage" for a reel. Renders a topic-appropriate diagram
// that reveals step-by-step as the beat index advances — pure SVG + CSS/SMIL.

interface Props {
  viz: string;
  beat: number;        // current beat index (0-based)
  accent: 'saffron' | 'indigo' | 'teal';
}

const HEX: Record<string, { a: string; b: string; c: string }> = {
  saffron: { a: '#FF8A4C', b: '#FFB088', c: '#FFD9C2' },
  indigo: { a: '#8482F0', b: '#B3B2F7', c: '#D9D8FB' },
  teal: { a: '#34D399', b: '#6EE7B7', c: '#A7F3D0' },
};

// Map a short to one of the visual archetypes (no per-short data needed).
export function pickViz(id: string, subject: string): string {
  const k = id.toLowerCase();
  if (/(pythagoras|trig)/.test(k)) return 'triangle';
  if (/(circle|pi-day)/.test(k)) return 'circle';
  if (/(gravity|solar|relativity|seasons|black-hole)/.test(k)) return 'orbit';
  if (/(newton|momentum|pressure|friction|work|electricity)/.test(k)) return 'force';
  if (/(wave|sound|fourier|speed-light|electromagnet)/.test(k)) return 'wave';
  if (/(atom|water-molecule|ph|noble|combustion|mole|redox|bond|ohm)/.test(k)) return 'atom';
  if (/(dna|cell|photosynth|heart|brain|immune|evolution|bacteria|ecosystem|water-cycle)/.test(k)) return 'cell';
  if (/(neural|transformer|binary|recursion|big-o|encryption|internet|linked|how-)/.test(k)) return 'network';
  if (/(mean|gdp|inflation|supply|percentage|compound)/.test(k)) return 'bars';
  if (/(prime|fibonacci|bodmas|log|infinity|golden|derivative|quadratic|vector|permut|probab|density)/.test(k)) return 'math';
  // fall back by subject
  switch (subject) {
    case 'Mathematics': return 'math';
    case 'Physics': return 'orbit';
    case 'Chemistry': return 'atom';
    case 'Biology': return 'cell';
    case 'Computer Science': return 'network';
    default: return 'pulse';
  }
}

export default function ReelScene({ viz, beat, accent }: Props) {
  const c = HEX[accent] ?? HEX.saffron;
  const show = (n: number) => beat >= n;

  return (
    <svg viewBox="0 0 300 300" className="w-full h-full" fill="none">
      {viz === 'triangle' && (
        <>
          {/* right triangle */}
          <polyline points="70,220 230,220 70,90 70,220" stroke={c.a} strokeWidth="4" fill={c.a + '12'} className="reel-draw" strokeLinejoin="round" />
          <rect x="70" y="206" width="14" height="14" stroke={c.b} strokeWidth="2.5" fill="none" />
          {show(1) && (<g className="reel-pop"><text x="50" y="160" fill={c.c} fontSize="20" fontWeight="700">a</text><text x="145" y="245" fill={c.c} fontSize="20" fontWeight="700">b</text><text x="158" y="150" fill={c.c} fontSize="20" fontWeight="700">c</text></g>)}
          {show(2) && (<g className="reel-grow"><rect x="70" y="222" width="160" height="40" fill={c.a + '33'} stroke={c.a} strokeWidth="2" /><text x="150" y="248" fill="#fff" fontSize="16" textAnchor="middle" fontWeight="700">b²</text></g>)}
          {show(3) && (<g className="reel-grow"><rect x="20" y="90" width="48" height="130" fill={c.b + '33'} stroke={c.b} strokeWidth="2" /><text x="44" y="160" fill="#fff" fontSize="16" textAnchor="middle" fontWeight="700">a²</text></g>)}
          {show(4) && (<g className="reel-pop"><rect x="80" y="30" width="140" height="34" rx="10" fill="#000" opacity="0.45" /><text x="150" y="53" fill="#fff" fontSize="18" textAnchor="middle" fontWeight="800">a² + b² = c²</text></g>)}
        </>
      )}

      {viz === 'circle' && (
        <>
          <circle cx="150" cy="155" r="80" stroke={c.a} strokeWidth="4" fill={c.a + '10'} className="reel-draw" />
          <circle cx="150" cy="155" r="5" fill={c.a} />
          {show(1) && (<g className="reel-pop"><line x1="150" y1="155" x2="230" y2="155" stroke={c.b} strokeWidth="3" /><text x="185" y="148" fill={c.c} fontSize="18" fontWeight="700">r</text></g>)}
          {show(1) && (
            <g>
              <line x1="150" y1="155" x2="230" y2="155" stroke={c.c} strokeWidth="2" opacity="0.5" />
              <animateTransform attributeName="transform" type="rotate" from="0 150 155" to="360 150 155" dur="5s" repeatCount="indefinite" />
            </g>
          )}
          {show(2) && <circle cx="150" cy="155" r="80" fill={c.a + '20'} className="reel-pop" />}
          {show(3) && (<g className="reel-pop"><rect x="95" y="34" width="110" height="34" rx="10" fill="#000" opacity="0.45" /><text x="150" y="57" fill="#fff" fontSize="19" textAnchor="middle" fontWeight="800">A = πr²</text></g>)}
        </>
      )}

      {viz === 'orbit' && (
        <>
          <circle cx="150" cy="155" r="22" fill={c.a} className="reel-pulsering" opacity="0.5" />
          <circle cx="150" cy="155" r="20" fill={c.a} />
          <ellipse cx="150" cy="155" rx="105" ry="70" stroke={c.b} strokeWidth="2.5" className="reel-draw" opacity="0.7" />
          {show(0) && (
            <g>
              <circle cx="255" cy="155" r="11" fill={c.c} />
              <animateTransform attributeName="transform" type="rotate" from="0 150 155" to="360 150 155" dur="6s" repeatCount="indefinite" />
            </g>
          )}
          {show(2) && (
            <g className="reel-pop">
              <line x1="230" y1="155" x2="175" y2="155" stroke="#fff" strokeWidth="2.5" markerEnd="url(#arrowW)" />
              <text x="200" y="145" fill="#fff" fontSize="15" textAnchor="middle" fontWeight="700">F</text>
            </g>
          )}
          {show(3) && (
            <g>
              <ellipse cx="150" cy="155" rx="135" ry="100" stroke={c.c} strokeWidth="1.5" opacity="0.4" />
              <g><circle cx="285" cy="155" r="7" fill={c.b} /><animateTransform attributeName="transform" type="rotate" from="360 150 155" to="0 150 155" dur="9s" repeatCount="indefinite" /></g>
            </g>
          )}
          <defs><marker id="arrowW" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#fff" /></marker></defs>
        </>
      )}

      {viz === 'force' && (
        <>
          <line x1="30" y1="210" x2="270" y2="210" stroke={c.c} strokeWidth="2" opacity="0.5" />
          <rect x="120" y="160" width="60" height="50" rx="6" fill={c.a} className="reel-pop" />
          <text x="150" y="192" fill="#fff" fontSize="18" textAnchor="middle" fontWeight="800">m</text>
          {show(1) && (<g className="reel-pop"><line x1="55" y1="185" x2="115" y2="185" stroke="#fff" strokeWidth="3.5" markerEnd="url(#arrowF)" /><text x="80" y="172" fill="#fff" fontSize="16" fontWeight="700">F</text></g>)}
          {show(2) && (<g className="reel-pop"><line x1="185" y1="135" x2="245" y2="135" stroke={c.b} strokeWidth="3" markerEnd="url(#arrowF2)" /><text x="215" y="125" fill={c.c} fontSize="14" fontWeight="700">a</text></g>)}
          {show(3) && (<g className="reel-pop"><line x1="245" y1="200" x2="185" y2="200" stroke={c.c} strokeWidth="3" markerEnd="url(#arrowF3)" /><text x="225" y="225" fill={c.c} fontSize="13" fontWeight="600">reaction</text></g>)}
          {show(4) && (<g className="reel-pop"><rect x="95" y="34" width="110" height="34" rx="10" fill="#000" opacity="0.45" /><text x="150" y="57" fill="#fff" fontSize="19" textAnchor="middle" fontWeight="800">F = m·a</text></g>)}
          <defs>
            <marker id="arrowF" markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto"><path d="M0,0 L9,4 L0,8 Z" fill="#fff" /></marker>
            <marker id="arrowF2" markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto"><path d="M0,0 L9,4 L0,8 Z" fill={c.b} /></marker>
            <marker id="arrowF3" markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto"><path d="M0,0 L9,4 L0,8 Z" fill={c.c} /></marker>
          </defs>
        </>
      )}

      {viz === 'wave' && (
        <>
          <line x1="20" y1="155" x2="280" y2="155" stroke={c.c} strokeWidth="2" opacity="0.4" />
          <g className="reel-wavemove">
            <path d="M0,155 Q37.5,75 75,155 T150,155 T225,155 T300,155 T375,155 T450,155" stroke={c.a} strokeWidth="4" fill="none" />
          </g>
          {show(1) && (<g className="reel-pop"><line x1="40" y1="155" x2="40" y2="95" stroke={c.b} strokeWidth="2" /><text x="48" y="120" fill={c.c} fontSize="15" fontWeight="700">A</text></g>)}
          {show(2) && (<g className="reel-pop"><line x1="75" y1="240" x2="150" y2="240" stroke={c.b} strokeWidth="2" /><text x="105" y="258" fill={c.c} fontSize="15" fontWeight="700">λ</text></g>)}
          {show(3) && (<g className="reel-pop"><rect x="95" y="34" width="110" height="34" rx="10" fill="#000" opacity="0.45" /><text x="150" y="57" fill="#fff" fontSize="18" textAnchor="middle" fontWeight="800">v = f λ</text></g>)}
        </>
      )}

      {viz === 'atom' && (
        <>
          <circle cx="150" cy="150" r="26" fill={c.a} className="reel-pulsering" opacity="0.5" />
          <circle cx="150" cy="150" r="20" fill={c.a} />
          <text x="150" y="156" fill="#fff" fontSize="14" textAnchor="middle" fontWeight="800">+</text>
          {show(0) && (
            <g>
              <ellipse cx="150" cy="150" rx="95" ry="40" stroke={c.b} strokeWidth="2" opacity="0.7" />
              <g><circle cx="245" cy="150" r="8" fill={c.c} /><animateTransform attributeName="transform" type="rotate" from="0 150 150" to="360 150 150" dur="4s" repeatCount="indefinite" /></g>
            </g>
          )}
          {show(1) && (
            <g transform="rotate(60 150 150)">
              <ellipse cx="150" cy="150" rx="95" ry="40" stroke={c.b} strokeWidth="2" opacity="0.6" />
              <g><circle cx="55" cy="150" r="8" fill={c.c} /><animateTransform attributeName="transform" type="rotate" from="0 150 150" to="360 150 150" dur="5.5s" repeatCount="indefinite" /></g>
            </g>
          )}
          {show(2) && (
            <g transform="rotate(120 150 150)">
              <ellipse cx="150" cy="150" rx="95" ry="40" stroke={c.b} strokeWidth="2" opacity="0.5" />
              <g><circle cx="245" cy="150" r="7" fill={c.c} /><animateTransform attributeName="transform" type="rotate" from="0 150 150" to="360 150 150" dur="7s" repeatCount="indefinite" /></g>
            </g>
          )}
        </>
      )}

      {viz === 'cell' && (
        <>
          <path d="M150,60 C220,60 245,120 240,160 C235,210 200,245 150,245 C95,245 60,205 60,150 C60,100 90,60 150,60 Z" fill={c.a + '22'} stroke={c.a} strokeWidth="4" className="reel-draw" />
          {show(0) && (<g className="reel-pop"><circle cx="150" cy="150" r="30" fill={c.b} /><circle cx="150" cy="150" r="12" fill={c.a} className="reel-pulsering" /></g>)}
          {show(1) && (<g className="reel-pop reel-float"><circle cx="100" cy="110" r="10" fill={c.c} /><circle cx="200" cy="120" r="8" fill={c.c} /><circle cx="110" cy="195" r="9" fill={c.c} /></g>)}
          {show(2) && (<g className="reel-pop"><line x1="20" y1="90" x2="70" y2="120" stroke="#fff" strokeWidth="2.5" markerEnd="url(#arrowC)" /><text x="20" y="80" fill="#fff" fontSize="13" fontWeight="700">in</text></g>)}
          {show(3) && (<g className="reel-pop"><line x1="235" y1="180" x2="285" y2="210" stroke={c.c} strokeWidth="2.5" markerEnd="url(#arrowC2)" /><text x="262" y="200" fill={c.c} fontSize="13" fontWeight="700">out</text></g>)}
          <defs>
            <marker id="arrowC" markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto"><path d="M0,0 L9,4 L0,8 Z" fill="#fff" /></marker>
            <marker id="arrowC2" markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto"><path d="M0,0 L9,4 L0,8 Z" fill={c.c} /></marker>
          </defs>
        </>
      )}

      {viz === 'network' && (
        <>
          {/* input layer */}
          {[90, 150, 210].map((y, i) => <circle key={`i${i}`} cx="60" cy={y} r="13" fill={c.a} className="reel-pop" />)}
          {show(1) && [70, 120, 180, 230].map((y, i) => <circle key={`h${i}`} cx="150" cy={y} r="12" fill={c.b} className="reel-pop" />)}
          {show(1) && [90, 150, 210].flatMap((y1) => [70, 120, 180, 230].map((y2, j) => (
            <line key={`e${y1}-${j}`} x1="73" y1={y1} x2="138" y2={y2} stroke={c.c} strokeWidth="1.2" opacity="0.4" className="reel-draw" />
          )))}
          {show(2) && [120, 180].map((y, i) => <circle key={`o${i}`} cx="240" cy={y} r="13" fill={c.c} className="reel-pop" />)}
          {show(2) && [70, 120, 180, 230].flatMap((y1) => [120, 180].map((y2, j) => (
            <line key={`e2${y1}-${j}`} x1="162" y1={y1} x2="227" y2={y2} stroke={c.c} strokeWidth="1.2" opacity="0.4" />
          )))}
          {show(3) && [90, 150, 210].map((y, i) => <circle key={`s${i}`} cx="60" cy={y} r="13" fill="#fff" className="reel-blink2" opacity="0.6" />)}
        </>
      )}

      {viz === 'bars' && (
        <>
          <line x1="50" y1="240" x2="260" y2="240" stroke={c.c} strokeWidth="2" opacity="0.5" />
          {[
            { x: 70, h: 70 }, { x: 120, h: 120 }, { x: 170, h: 90 }, { x: 220, h: 160 },
          ].map((bar, i) => show(i) && (
            <rect key={i} x={bar.x} y={240 - bar.h} width="34" height={bar.h} rx="4" fill={i % 2 ? c.b : c.a} className="reel-grow" />
          ))}
          {show(3) && (<polyline points="87,170 137,120 187,150 237,80" stroke="#fff" strokeWidth="2.5" fill="none" className="reel-draw" markerEnd="url(#arrowB)" />)}
          <defs><marker id="arrowB" markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto"><path d="M0,0 L9,4 L0,8 Z" fill="#fff" /></marker></defs>
        </>
      )}

      {viz === 'math' && (
        <>
          {['+', '−', '×', '÷', 'π', '√', 'Σ', '%'].map((s, i) => {
            const angle = (i / 8) * Math.PI * 2;
            const x = 150 + Math.cos(angle) * 100;
            const y = 150 + Math.sin(angle) * 100;
            return show(Math.min(i, 4) - 0) && (
              <text key={i} x={x} y={y} fill={i % 2 ? c.a : c.b} fontSize="26" textAnchor="middle" fontWeight="800" className="reel-float" style={{ animationDelay: `${i * 0.2}s` }}>{s}</text>
            );
          })}
          <circle cx="150" cy="150" r="46" fill="none" stroke={c.a} strokeWidth="2.5" strokeDasharray="6 6" className="reel-spin" opacity="0.6" />
          <circle cx="150" cy="150" r="30" fill={c.a + '22'} className="reel-pulsering" />
        </>
      )}

      {viz === 'pulse' && (
        <>
          <circle cx="150" cy="150" r="40" fill={c.a + '30'} className="reel-pulsering" />
          <circle cx="150" cy="150" r="40" fill={c.b + '30'} className="reel-pulsering" style={{ animationDelay: '0.8s' }} />
          <circle cx="150" cy="150" r="40" fill={c.c + '30'} className="reel-pulsering" style={{ animationDelay: '1.6s' }} />
          <circle cx="150" cy="150" r="34" fill={c.a} opacity="0.9" />
        </>
      )}
    </svg>
  );
}
