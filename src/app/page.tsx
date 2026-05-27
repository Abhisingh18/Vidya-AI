'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkles, PenLine, Wand2, Film, Volume2, CheckCircle2 } from 'lucide-react';
import AnimatedPreviews from '@/components/animated-previews';

const PLACEHOLDERS = [
  'Explain Pythagoras Theorem...',
  'What is Integration?',
  "Newton's Laws of Motion...",
  'How does Photosynthesis work?',
  'Trigonometry basics...',
];

const POPULAR = ['Pythagoras', 'Integration', "Newton's Laws", 'DNA', 'Trigonometry'];

const STEPS = [
  { icon: PenLine, title: 'Type your topic',     desc: 'Any subject, any grade level.' },
  { icon: Wand2,   title: 'AI builds the lesson', desc: 'Tailored, step-by-step explanation.' },
  { icon: Film,    title: 'Watch the animation',  desc: 'Beautiful visuals — not boring slides.' },
  { icon: Volume2, title: 'In your language',     desc: '22 Indian languages supported.' },
];

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

export default function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const isLoggedIn = !!session;
  const [phIdx, setPhIdx] = useState(0);
  const [fading, setFading] = useState(false);
  const [topic, setTopic] = useState('');
  const howRef = useInView();

  useEffect(() => {
    const id = setInterval(() => {
      setFading(true);
      setTimeout(() => { setPhIdx(p => (p + 1) % PLACEHOLDERS.length); setFading(false); }, 250);
    }, 2800);
    return () => clearInterval(id);
  }, []);

  const handleGenerate = () => {
    const url = topic.trim() ? `/generate?topic=${encodeURIComponent(topic)}` : '/generate';
    if (!isLoggedIn) {
      router.push(`/login?callbackUrl=${encodeURIComponent(url)}`);
      return;
    }
    router.push(url);
  };

  return (
    <main className="overflow-x-hidden">

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative bg-off-white dark:bg-dark-bg pt-28 pb-20 overflow-hidden">
        {/* Subtle grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04] dark:opacity-[0.06]"
          style={{
            backgroundImage: 'linear-gradient(#3D3BDB 1px,transparent 1px),linear-gradient(90deg,#3D3BDB 1px,transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          }}
        />
        <div className="pointer-events-none absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-saffron/8 rounded-full blur-[120px]" />
        <div className="pointer-events-none absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-indigo-brand/8 rounded-full blur-[120px]" />

        <div className="container-main relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-8">

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-dark-surface border border-card-border dark:border-dark-border text-xs font-medium shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-saffron opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-saffron" />
              </span>
              <span className="text-muted">Now in public beta</span>
            </div>

            <h1 className="text-5xl lg:text-[64px] font-heading font-bold text-navy dark:text-dark-text leading-[1.05] tracking-tight">
              Type any topic.<br />
              <span className="text-saffron">Watch AI teach it.</span>
            </h1>

            <p className="text-lg text-muted max-w-xl mx-auto">
              Professional animated teacher videos in 22 Indian languages — tailored to your grade, on demand.
            </p>

            {/* Search bar */}
            <div className="relative max-w-xl mx-auto">
              <div className="relative flex items-center h-14 rounded-2xl border-2 border-card-border dark:border-dark-border bg-white dark:bg-dark-surface shadow-card focus-within:border-saffron focus-within:shadow-lg transition-all duration-300 overflow-hidden px-2">
                <div className="relative flex-1 h-full flex items-center">
                  <input
                    type="text"
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && topic.trim() && handleGenerate()}
                    className="w-full h-full pl-4 bg-transparent outline-none text-navy dark:text-dark-text text-base placeholder-transparent"
                    aria-label="Topic input"
                  />
                  {!topic && (
                    <span className={`pointer-events-none absolute left-4 text-muted/60 text-base transition-opacity duration-300 ${fading ? 'opacity-0' : 'opacity-100'}`}>
                      {PLACEHOLDERS[phIdx]}
                    </span>
                  )}
                </div>
                <button type="button" onClick={handleGenerate} className="btn-saffron h-10 rounded-xl px-5 text-sm flex-shrink-0">
                  {isLoggedIn ? 'Generate' : 'Sign In'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Popular */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs text-muted">Try:</span>
              {POPULAR.map(t => (
                <button
                  key={t}
                  onClick={() => setTopic(t)}
                  className="px-3 py-1 rounded-full border border-card-border dark:border-dark-border text-xs text-muted hover:border-saffron hover:text-saffron transition-all duration-200"
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Trust line */}
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-muted pt-1">
              <span className="inline-flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-success" /> 100% free</span>
              <span className="inline-flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-success" /> No credit card</span>
              <span className="inline-flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-success" /> Under a minute</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ LIVE PREVIEWS ═══════════════ */}
      <section className="bg-off-white dark:bg-dark-bg pb-24">
        <div className="container-main">
          <div className="text-center mb-8">
            <p className="text-xs font-semibold text-muted uppercase tracking-widest">See it in action</p>
            <p className="text-sm text-muted mt-1">Hover any card to play with narration</p>
          </div>
          <AnimatedPreviews />
        </div>
      </section>

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <section className="py-20 bg-white dark:bg-dark-surface/30 border-y border-card-border dark:border-dark-border" ref={howRef.ref}>
        <div className="container-main">
          <div className="text-center mb-12">
            <p className="text-saffron text-xs font-semibold uppercase tracking-widest mb-2">How it works</p>
            <h2 className="text-3xl lg:text-4xl font-heading font-bold text-navy dark:text-dark-text">Four simple steps</h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={i}
                  className={`p-5 rounded-2xl bg-white dark:bg-dark-surface border border-card-border dark:border-dark-border transition-all duration-700 hover:-translate-y-1 hover:shadow-card-hover ${howRef.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  <div className="w-10 h-10 rounded-xl bg-saffron/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-saffron" />
                  </div>
                  <h3 className="font-heading font-semibold text-navy dark:text-dark-text mb-1">{s.title}</h3>
                  <p className="text-xs text-muted leading-relaxed">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════ CTA ═══════════════ */}
      <section className="py-20 bg-navy dark:bg-[#080812] relative overflow-hidden">
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-saffron/10 rounded-full blur-[100px]" />
        <div className="container-main relative z-10 text-center max-w-xl mx-auto space-y-5">
          <h2 className="text-3xl lg:text-4xl font-heading font-bold text-white leading-tight">
            {isLoggedIn ? 'Generate your first video' : 'Start learning today'}
          </h2>
          <p className="text-gray-400">
            {isLoggedIn ? 'Type a topic, pick a language, hit generate.' : 'Free, no credit card, no setup.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button onClick={handleGenerate} className="btn-saffron text-base px-7 py-3 shadow-saffron">
              {isLoggedIn ? 'Start Generating' : 'Get Started'}
              <ArrowRight className="w-4 h-4" />
            </button>
            <Link href="/vision" className="btn-outline text-base px-7 py-3 !border-white/20 !text-white hover:!border-saffron hover:!text-saffron">
              Our Vision
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
