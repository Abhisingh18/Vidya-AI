'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Volume2 } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────
   Four self-contained looping SVG animations. On hover, each card plays
   a full narrated mini-lesson using the browser's built-in Speech
   Synthesis API — captions sync with the audio.
   ───────────────────────────────────────────────────────────────── */

function PythagorasAnim({ playing }: { playing: boolean }) {
  const dur = playing ? '8s' : '5s';
  return (
    <svg viewBox="0 0 320 200" className="w-full h-full">
      <defs>
        <linearGradient id="pythFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6B2C" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#FF9B6A" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <polygon points="160,28 240,172 80,172" fill="url(#pythFill)" stroke="#FF6B2C" strokeWidth="2" strokeDasharray="500" strokeDashoffset="500">
        <animate attributeName="stroke-dashoffset" values="500;0;0;500" keyTimes="0;0.25;0.85;1" dur={dur} repeatCount="indefinite" />
      </polygon>
      <polyline points="80,172 80,157 95,157" fill="none" stroke="#0F9E75" strokeWidth="1.5" opacity="0">
        <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.3;0.4;0.85;1" dur={dur} repeatCount="indefinite" />
      </polyline>
      <text x="160" y="190" fill="#6F6DE1" fontSize="11" textAnchor="middle" opacity="0">
        a<animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.4;0.5;0.85;1" dur={dur} repeatCount="indefinite" />
      </text>
      <text x="220" y="115" fill="#FF6B2C" fontSize="11" textAnchor="middle" opacity="0">
        b<animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.45;0.55;0.85;1" dur={dur} repeatCount="indefinite" />
      </text>
      <text x="110" y="90" fill="#0F9E75" fontSize="11" textAnchor="middle" opacity="0">
        c<animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.5;0.6;0.85;1" dur={dur} repeatCount="indefinite" />
      </text>
      <text x="160" y="18" fill="#F0F0FF" fontSize="13" textAnchor="middle" opacity="0" fontFamily="serif" fontStyle="italic">
        a² + b² = c²<animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.65;0.75;0.85;1" dur={dur} repeatCount="indefinite" />
      </text>
    </svg>
  );
}

function SineWaveAnim({ playing }: { playing: boolean }) {
  const dur = playing ? '6s' : '4s';
  return (
    <svg viewBox="0 0 320 200" className="w-full h-full">
      <line x1="60" y1="20" x2="60" y2="180" stroke="#3D3BDB" strokeWidth="0.5" opacity="0.3" />
      <line x1="20" y1="100" x2="305" y2="100" stroke="#3D3BDB" strokeWidth="0.5" opacity="0.3" strokeDasharray="2 2" />
      <circle cx="60" cy="100" r="32" fill="none" stroke="#3D3BDB" strokeWidth="1" opacity="0.5" />
      <line x1="60" y1="100" x2="92" y2="100" stroke="#FF6B2C" strokeWidth="1.5" opacity="0.7">
        <animateTransform attributeName="transform" type="rotate" from="0 60 100" to="-360 60 100" dur={dur} repeatCount="indefinite" />
      </line>
      <circle r="4" fill="#FF6B2C">
        <animateMotion path="M 60 68 A 32 32 0 1 0 60 132 A 32 32 0 1 0 60 68 Z" dur={dur} repeatCount="indefinite" />
      </circle>
      <path d="M 92 100 Q 110 50 130 50 T 168 100 Q 186 150 206 150 T 244 100 Q 262 50 282 50 T 305 100" fill="none" stroke="#FF6B2C" strokeWidth="2" strokeDasharray="500" strokeDashoffset="500">
        <animate attributeName="stroke-dashoffset" values="500;0;0;500" keyTimes="0;0.6;0.9;1" dur={dur} repeatCount="indefinite" />
      </path>
      <text x="160" y="18" fill="#F0F0FF" fontSize="13" textAnchor="middle" fontFamily="serif" fontStyle="italic">y = sin(x)</text>
    </svg>
  );
}

function QuadraticAnim({ playing }: { playing: boolean }) {
  const dur = playing ? '7s' : '5s';
  return (
    <svg viewBox="0 0 320 200" className="w-full h-full">
      <line x1="160" y1="25" x2="160" y2="180" stroke="#0F9E75" strokeWidth="0.5" opacity="0.4" />
      <line x1="40" y1="150" x2="280" y2="150" stroke="#0F9E75" strokeWidth="0.5" opacity="0.4" />
      <path d="M 70 150 Q 160 -40 250 150" fill="none" stroke="#0F9E75" strokeWidth="2" strokeDasharray="450" strokeDashoffset="450">
        <animate attributeName="stroke-dashoffset" values="450;0;0;450" keyTimes="0;0.5;0.9;1" dur={dur} repeatCount="indefinite" />
      </path>
      <circle r="4" fill="#FF6B2C">
        <animateMotion path="M 70 150 Q 160 -40 250 150" dur={dur} repeatCount="indefinite" />
      </circle>
      <circle cx="160" cy="60" r="3" fill="#FF6B2C" opacity="0">
        <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.6;0.7;0.9;1" dur={dur} repeatCount="indefinite" />
      </circle>
      <text x="160" y="50" fill="#FF6B2C" fontSize="9" textAnchor="middle" opacity="0">
        vertex (0, 4)<animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.65;0.75;0.9;1" dur={dur} repeatCount="indefinite" />
      </text>
      <text x="160" y="18" fill="#F0F0FF" fontSize="13" textAnchor="middle" fontFamily="serif" fontStyle="italic">y = x² + 4</text>
    </svg>
  );
}

function NewtonAnim({ playing }: { playing: boolean }) {
  const dur = playing ? '6s' : '4s';
  return (
    <svg viewBox="0 0 320 200" className="w-full h-full">
      <line x1="20" y1="160" x2="305" y2="160" stroke="#3D3BDB" strokeWidth="1" opacity="0.5" />
      <g opacity="0.3">
        {[40, 80, 120, 160, 200, 240, 280].map(x => (
          <line key={x} x1={x} y1="160" x2={x - 6} y2="168" stroke="#3D3BDB" strokeWidth="0.6" />
        ))}
      </g>
      <rect width="40" height="32" fill="#FF6B2C" fillOpacity="0.25" stroke="#FF6B2C" strokeWidth="1.5" rx="2">
        <animate attributeName="x" values="50;180;180;50" keyTimes="0;0.5;0.9;1" dur={dur} repeatCount="indefinite" />
        <animate attributeName="y" values="128;128;128;128" dur={dur} repeatCount="indefinite" />
      </rect>
      <g opacity="0">
        <line x1="20" y1="144" x2="48" y2="144" stroke="#FF6B2C" strokeWidth="2" />
        <polygon points="48,140 56,144 48,148" fill="#FF6B2C" />
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.45;0.55" dur={dur} repeatCount="indefinite" />
      </g>
      <text x="32" y="138" fill="#FF6B2C" fontSize="11" opacity="0">
        F<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.45;0.55" dur={dur} repeatCount="indefinite" />
      </text>
      <text x="160" y="18" fill="#F0F0FF" fontSize="13" textAnchor="middle" fontFamily="serif" fontStyle="italic">F = m · a</text>
      <text x="160" y="190" fill="#6F6DE1" fontSize="9" textAnchor="middle" opacity="0.7">Newton&apos;s Second Law</text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────── */

interface Preview {
  topic: string;
  lang: string;       // BCP-47 (hi-IN, en-IN, ta-IN)
  metaLang: string;   // display
  duration: string;
  Anim: React.FC<{ playing: boolean }>;
  narration: string[];
  accent: string;
  accentText: string;
}

const PREVIEWS: Preview[] = [
  {
    topic: 'Pythagoras Theorem',
    lang: 'hi-IN',
    metaLang: 'Hindi',
    duration: '3:42',
    Anim: PythagorasAnim,
    narration: [
      'नमस्ते! आज हम सीखेंगे Pythagoras Theorem।',
      'एक right-angled triangle लीजिए।',
      'इसमें तीन sides होती हैं।',
      'Pythagoras का सिद्धांत कहता है — a square plus b square equals c square।',
      'यानी दोनों छोटी sides के square जोड़ने पर hypotenuse का square मिलता है।',
    ],
    accent: 'bg-saffron',
    accentText: 'text-saffron',
  },
  {
    topic: 'Sine & Cosine',
    lang: 'en-IN',
    metaLang: 'English',
    duration: '4:15',
    Anim: SineWaveAnim,
    narration: [
      'Welcome! Today we learn sine and cosine.',
      'Place a point on a unit circle.',
      'As the point rotates, its vertical position traces a sine curve.',
      'Its horizontal position traces a cosine curve.',
      'Together, sine and cosine describe all circular motion.',
    ],
    accent: 'bg-indigo-brand',
    accentText: 'text-indigo-brand',
  },
  {
    topic: 'Quadratic Functions',
    lang: 'en-IN',
    metaLang: 'English',
    duration: '5:01',
    Anim: QuadraticAnim,
    narration: [
      'Let us understand quadratic functions.',
      'A quadratic function has the form y equals a x squared plus b x plus c.',
      'Its graph is a beautiful curve called a parabola.',
      'The lowest or highest point is called the vertex.',
      'These curves describe gravity, projectiles, and so much more.',
    ],
    accent: 'bg-teal',
    accentText: 'text-teal',
  },
  {
    topic: "Newton's Second Law",
    lang: 'hi-IN',
    metaLang: 'Hindi',
    duration: '3:55',
    Anim: NewtonAnim,
    narration: [
      'चलिए सीखते हैं Newton का Second Law।',
      'यह law कहता है — Force बराबर है mass गुणा acceleration।',
      'इसका formula है F equals m a।',
      'अगर आप किसी object को धक्का देते हैं, उसकी speed कैसे बदलेगी यह इसी से तय होता है।',
      'ज़्यादा force का मतलब ज़्यादा acceleration।',
    ],
    accent: 'bg-saffron',
    accentText: 'text-saffron',
  },
];

/* ─────────────────────────────────────────────────────────────────── */

function PreviewCard({ preview }: { preview: Preview }) {
  const [playing, setPlaying] = useState(false);
  const [captionIdx, setCaptionIdx] = useState(-1);
  const stopRef = useRef(false);
  const totalLines = preview.narration.length;

  const stop = useCallback(() => {
    stopRef.current = true;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setPlaying(false);
    setCaptionIdx(-1);
  }, []);

  const play = useCallback(async () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    if (playing) return;

    // Stop any other card that might be playing
    window.speechSynthesis.cancel();
    stopRef.current = false;
    setPlaying(true);

    // Ensure voices are loaded
    const getVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const base = preview.lang.split('-')[0];
      return (
        voices.find(v => v.lang === preview.lang) ??
        voices.find(v => v.lang.startsWith(base)) ??
        voices.find(v => v.lang.startsWith('en')) ??
        null
      );
    };

    for (let i = 0; i < preview.narration.length; i++) {
      if (stopRef.current) break;
      setCaptionIdx(i);

      await new Promise<void>(resolve => {
        const u = new SpeechSynthesisUtterance(preview.narration[i]);
        u.lang = preview.lang;
        u.rate = 0.95;
        u.pitch = 1;
        const v = getVoice();
        if (v) u.voice = v;
        u.onend = () => resolve();
        u.onerror = () => resolve();
        window.speechSynthesis.speak(u);
      });

      // small pause between lines
      if (!stopRef.current && i < preview.narration.length - 1) {
        await new Promise(r => setTimeout(r, 200));
      }
    }

    if (!stopRef.current) {
      // Finished naturally
      setPlaying(false);
      setCaptionIdx(-1);
    }
  }, [playing, preview]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Preload voices once
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const Anim = preview.Anim;
  const progress = playing && captionIdx >= 0 ? ((captionIdx + 1) / totalLines) * 100 : 0;
  const currentCaption = captionIdx >= 0 ? preview.narration[captionIdx] : null;

  return (
    <div
      onMouseEnter={play}
      onMouseLeave={stop}
      onClick={() => (playing ? stop() : play())}
      className="group relative rounded-2xl bg-navy dark:bg-[#0D0D1A] border border-dark-border overflow-hidden shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 cursor-pointer"
    >
      {/* Animation area */}
      <div className="relative aspect-[16/10] bg-[#0D0D1A] overflow-hidden">
        <Anim playing={playing} />

        {/* Idle play button (visible when not playing) */}
        {!playing && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/30">
            <div className="w-14 h-14 rounded-full bg-saffron flex items-center justify-center shadow-saffron animate-pulse">
              <Play className="w-6 h-6 text-white fill-white ml-0.5" />
            </div>
          </div>
        )}

        {/* Now-playing badge */}
        {playing && (
          <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-saffron/95 shadow-saffron animate-fade-in">
            <Volume2 className="w-3 h-3 text-white animate-pulse" />
            <span className="text-[10px] text-white uppercase tracking-wider font-bold">Playing</span>
          </div>
        )}

        {/* Idle live indicator */}
        {!playing && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-saffron opacity-60" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-saffron" />
            </span>
            <span className="text-[10px] text-white/80 uppercase tracking-wider font-medium">Preview</span>
          </div>
        )}

        {/* Caption overlay (only while playing) */}
        {currentCaption && (
          <div className="absolute bottom-0 left-0 right-0 px-3 py-4 bg-gradient-to-t from-black/85 via-black/55 to-transparent">
            <p className="text-white text-xs text-center leading-snug font-medium animate-fade-in" key={captionIdx}>
              {currentCaption}
            </p>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {playing && (
        <div className="relative h-1 bg-white/10">
          <div className={`absolute left-0 top-0 h-full ${preview.accent} rounded-r-full transition-all duration-500`} style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* Meta bar */}
      <div className="px-3 py-2.5 bg-[#111127] border-t border-white/5">
        <p className="text-white text-sm font-medium truncate">{preview.topic}</p>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-gray-500 text-xs">{preview.metaLang} · {preview.duration}</p>
          <div className="flex items-end gap-[2px] h-3">
            {[0.1, 0.3, 0.5, 0.2, 0.4].map((d, j) => (
              <span key={j} className={`inline-block w-[2px] rounded-full ${preview.accent} ${playing ? 'animate-waveform' : 'animate-waveform opacity-60'}`} style={{ height: '55%', animationDelay: `${d}s` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */

export default function AnimatedPreviews() {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PREVIEWS.map(p => <PreviewCard key={p.topic} preview={p} />)}
      </div>
      <p className="text-center text-xs text-muted mt-4 flex items-center justify-center gap-1.5">
        <Volume2 className="w-3.5 h-3.5" /> Hover over a card to hear the lesson — turn your speakers on
      </p>
    </>
  );
}
