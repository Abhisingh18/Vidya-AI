'use client';

// Landing-page sample of an explainer video: real motion scenes (the same
// templates generated videos use) stepping through their animation with the
// narration line under each step. Animates only while on screen.

import { useEffect, useRef, useState } from 'react';
import { emptySlide, type SlideTheme } from '@/lib/teacher-docs';
import { motionSteps, type SceneMotion } from '@/lib/motion';
import MotionSlide from '@/components/motion/motion-stage';

interface Demo { title: string; emoji: string; language: string; theme: SlideTheme; motion: SceneMotion; lines: string[] }

const DEMOS: Demo[] = [
  {
    title: "Newton's third law", emoji: '🚀', language: 'English', theme: 'saffron',
    motion: { kind: 'force-pair', axis: 'y', items: [
      { emoji: '🚀', label: 'Rocket' }, { emoji: '🔥', label: 'Hot gas' },
      { emoji: '⬇️', label: 'Rocket pushes gas down' }, { emoji: '⬆️', label: 'Gas pushes rocket up' },
    ] },
    lines: [
      'Look at this rocket on the launch pad, with hot gas beneath it.',
      'When the engine fires, the rocket pushes the gas downwards.',
      'At the same moment, the gas pushes the rocket upwards, with an equal force.',
      'The two forces act on different things, so the rocket shoots up!',
    ],
  },
  {
    title: 'जल चक्र', emoji: '🌧️', language: 'हिंदी', theme: 'indigo',
    motion: { kind: 'cycle', items: [
      { emoji: '☀️', label: 'वाष्पीकरण' }, { emoji: '☁️', label: 'संघनन' }, { emoji: '🌧️', label: 'वर्षा' }, { emoji: '🌊', label: 'संग्रहण' },
    ] },
    lines: [
      'पानी कभी ख़त्म नहीं होता, बस घूमता रहता है।',
      'धूप से समुद्र का पानी भाप बनकर ऊपर उठता है।',
      'ऊपर ठंडी हवा में भाप छोटी बूँदें बनकर बादल बनती है।',
      'बूँदें भारी होकर बारिश बनकर गिरती हैं।',
      'नदियाँ पानी वापस समुद्र तक ले जाती हैं — और चक्र फिर शुरू!',
    ],
  },
  {
    title: 'Earth around the Sun', emoji: '🌍', language: 'English', theme: 'midnight',
    motion: { kind: 'orbit', items: [
      { emoji: '☀️', label: 'Sun' }, { emoji: '🌍', label: 'Earth' }, { emoji: '', label: 'Gravity' }, { emoji: '', label: 'Moves forward' },
    ] },
    lines: [
      'Here is the Sun, and our Earth.',
      'The Earth keeps travelling around the Sun, once every year.',
      "The Sun's gravity pulls the Earth towards it, all the time.",
      'But the Earth is also moving forward, so it falls around the Sun instead of into it.',
    ],
  },
  {
    title: 'विद्युत परिपथ', emoji: '💡', language: 'हिंदी', theme: 'saffron',
    motion: { kind: 'flow', items: [
      { emoji: '🔋', label: 'बैटरी' }, { emoji: '🔌', label: 'तार' }, { emoji: '💡', label: 'बल्ब' }, { emoji: '🎚️', label: 'स्विच' },
    ] },
    lines: [
      'एक बंद रास्ता बनाइए — इसे परिपथ कहते हैं।',
      'बैटरी इलेक्ट्रॉनों को धकेलती है।',
      'तार उन्हें आगे ले जाते हैं।',
      'बल्ब से गुज़रते ही वह जल उठता है।',
      'स्विच खोलते ही रास्ता टूटता है और बल्ब बुझ जाता है।',
    ],
  },
  {
    title: 'States of matter', emoji: '🧊', language: 'English', theme: 'indigo',
    motion: { kind: 'particles', items: [{ emoji: '🧊', label: 'Solid' }, { emoji: '💧', label: 'Liquid' }, { emoji: '♨️', label: 'Gas' }] },
    lines: [
      'Everything is made of tiny particles.',
      'In a solid, they are packed tight and only vibrate.',
      'Heat it, and they slide past each other: a liquid.',
      'Heat it more, and they fly freely in every direction: a gas!',
    ],
  },
];

const STEP_MS = 2300;
const END_HOLD_MS = 2600;

export default function VideoPreview() {
  const root = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [demo, setDemo] = useState(0);
  const [beat, setBeat] = useState(0);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const d = DEMOS[demo];
  const steps = motionSteps(d.motion);
  useEffect(() => {
    if (!visible) return;
    const id = window.setTimeout(() => {
      if (beat < steps) setBeat(b => b + 1);
      else { setBeat(0); setDemo(x => (x + 1) % DEMOS.length); }
    }, beat < steps ? STEP_MS : END_HOLD_MS);
    return () => window.clearTimeout(id);
  }, [visible, beat, steps]);

  const slide = { ...emptySlide('image'), title: d.title, emoji: d.emoji, bullets: [] };
  const line = d.lines[Math.min(beat, d.lines.length - 1)];

  return (
    <div ref={root} className="rounded-2xl border border-card-border bg-white shadow-[0_30px_80px_-30px_rgba(26,26,46,0.45)] dark:border-dark-border dark:bg-dark-surface">
      {/* window bar */}
      <div className="flex items-center gap-2 border-b border-card-border px-4 py-2.5 dark:border-dark-border">
        <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" /><span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" /><span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
        <span className="ml-3 truncate rounded-md bg-off-white px-3 py-0.5 text-[11px] text-muted dark:bg-dark-bg">vidya.ai/library · Visual explainer</span>
        <span className="ml-auto rounded-full bg-saffron/10 px-2 py-0.5 text-[10px] font-semibold text-saffron">🔊 {d.language}</span>
      </div>
      <div className="relative p-3 sm:p-4">
        <div key={demo} className="overflow-hidden rounded-xl animate-fade-in">
          <MotionSlide slide={slide} motion={d.motion} theme={d.theme} beat={beat} />
        </div>
        <p key={`${demo}-${beat}`} className="mx-auto mt-3 min-h-[2.75rem] max-w-2xl rounded-xl bg-navy px-4 py-2.5 text-center text-sm font-medium text-white animate-fade-in dark:bg-black/60">
          {line}
        </p>
        <div className="mt-3 flex justify-center gap-1.5" aria-hidden>
          {DEMOS.map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all ${i === demo ? 'w-6 bg-saffron' : 'w-1.5 bg-card-border dark:bg-dark-border'}`} />)}
        </div>
      </div>
    </div>
  );
}
