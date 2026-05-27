'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';
import Link from 'next/link';
import { Target, Globe, Heart, BookOpen, Users, TrendingUp, ArrowRight, Sparkles } from 'lucide-react';

function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={className} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(28px)', transition: `opacity .7s cubic-bezier(.22,1,.36,1) ${delay}ms, transform .7s cubic-bezier(.22,1,.36,1) ${delay}ms` }}>
      {children}
    </div>
  );
}

const PILLARS = [
  { icon: Globe,    title: 'Language equality',          desc: 'No student should be left behind because their first language isn\'t English. Quality education in every Indian language.' },
  { icon: Heart,    title: 'Always free for students',   desc: 'Education is a right, not a privilege. Core video generation will remain free for every student, forever.' },
  { icon: BookOpen, title: 'Teacher-led, AI-assisted',   desc: 'AI is a tool, not a replacement. We empower teachers with AI to scale their reach, not replace them.' },
  { icon: Users,    title: 'Open source',                desc: 'Built in the open. The community can contribute, audit, and adapt the platform for their region or need.' },
];

const ROADMAP = [
  { year: '2026', title: 'Foundation',  items: ['Launch public beta', 'Hindi + English support', 'Real-time AI generation', 'Onboard first 1,000 students'] },
  { year: '2027', title: 'Expansion',   items: ['All 22 Indian languages live', 'Mobile apps (Android-first)', 'Offline video downloads', '100,000 monthly active students'] },
  { year: '2028', title: 'Empowerment', items: ['Teacher toolkit + classroom mode', 'State-board curriculum alignment', 'Partnership with public schools', '1 million students reached'] },
];

export default function VisionPage() {
  return (
    <main className="min-h-screen bg-off-white dark:bg-dark-bg">

      {/* Hero */}
      <section className="pt-28 pb-20 bg-gradient-hero dark:bg-gradient-hero-dark relative overflow-hidden">
        <div className="pointer-events-none absolute top-20 -left-20 w-96 h-96 bg-saffron/10 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 -right-20 w-96 h-96 bg-indigo-brand/10 rounded-full blur-3xl" />

        <div className="container-main relative z-10 max-w-4xl mx-auto text-center">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-saffron/10 border border-saffron/20 text-saffron text-sm font-medium mb-8">
              <Target className="w-4 h-4" />
              Our Vision
            </div>
          </Reveal>

          <Reveal delay={100}>
            <h1 className="text-5xl lg:text-6xl font-heading font-bold text-navy dark:text-dark-text leading-[1.1] tracking-tight">
              Quality education<br />
              in <span className="text-saffron">every language</span>,<br />
              for every student
            </h1>
          </Reveal>

          <Reveal delay={200}>
            <p className="text-lg text-muted max-w-2xl mx-auto mt-8 leading-relaxed">
              260 million students in India. 22 official languages. Most quality educational content exists in English alone.
              VidyaAI is built to close that gap — one animated video at a time.
            </p>
          </Reveal>
        </div>
      </section>

      {/* The Why */}
      <section className="py-24">
        <div className="container-main max-w-4xl">
          <Reveal>
            <p className="text-saffron text-sm font-semibold uppercase tracking-widest mb-3">Why we exist</p>
            <h2 className="text-4xl font-heading font-bold text-navy dark:text-dark-text mb-8">The problem we&apos;re solving</h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {[
              { stat: '74%', label: 'of Indian students learn in their regional language, not English' },
              { stat: '< 5%', label: 'of high-quality animated educational content is in Indian languages' },
              { stat: '260M', label: 'students in India deserve cinematic-quality teaching, in their own tongue' },
            ].map((s, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="card text-center">
                  <p className="text-5xl font-heading font-bold text-saffron mb-2">{s.stat}</p>
                  <p className="text-sm text-muted leading-relaxed">{s.label}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={400}>
            <div className="mt-16 p-8 lg:p-10 rounded-3xl bg-gradient-mission dark:bg-gradient-mission-dark border border-card-border dark:border-dark-border">
              <p className="text-xl lg:text-2xl font-heading text-navy dark:text-dark-text leading-relaxed text-center italic">
                &ldquo;The best teachers explain concepts with stories, drawings, and animations. We&apos;re building an AI that can do the same — in any Indian language, on demand, for any student who asks.&rdquo;
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Pillars */}
      <section className="py-24 bg-white dark:bg-dark-surface/30 border-y border-card-border dark:border-dark-border">
        <div className="container-main">
          <div className="text-center mb-16">
            <Reveal>
              <p className="text-indigo-brand text-sm font-semibold uppercase tracking-widest mb-3">What we believe</p>
              <h2 className="text-4xl font-heading font-bold text-navy dark:text-dark-text">Our four pillars</h2>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {PILLARS.map((p, i) => {
              const Icon = p.icon;
              return (
                <Reveal key={i} delay={i * 100}>
                  <div className="card h-full">
                    <div className="w-12 h-12 rounded-xl bg-saffron/10 flex items-center justify-center mb-5">
                      <Icon className="w-6 h-6 text-saffron" />
                    </div>
                    <h3 className="text-xl font-heading font-semibold text-navy dark:text-dark-text mb-2">{p.title}</h3>
                    <p className="text-sm text-muted leading-relaxed">{p.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="py-24">
        <div className="container-main">
          <div className="text-center mb-16">
            <Reveal>
              <p className="text-teal text-sm font-semibold uppercase tracking-widest mb-3">Where we&apos;re going</p>
              <h2 className="text-4xl font-heading font-bold text-navy dark:text-dark-text">2026 — 2028 Roadmap</h2>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {ROADMAP.map((r, i) => (
              <Reveal key={i} delay={i * 150}>
                <div className="card h-full relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-saffron opacity-5 rounded-full -translate-y-12 translate-x-12" />
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                      <TrendingUp className="w-5 h-5 text-saffron" />
                      <span className="text-xs font-semibold text-saffron uppercase tracking-widest">{r.year}</span>
                    </div>
                    <h3 className="text-2xl font-heading font-bold text-navy dark:text-dark-text mb-4">{r.title}</h3>
                    <ul className="space-y-2.5">
                      {r.items.map((item, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-muted leading-relaxed">
                          <Sparkles className="w-3.5 h-3.5 text-saffron mt-0.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-navy dark:bg-[#080812] relative overflow-hidden">
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-saffron/10 rounded-full blur-[100px]" />
        <div className="container-main relative z-10 text-center max-w-2xl mx-auto space-y-6">
          <h2 className="text-4xl lg:text-5xl font-heading font-bold text-white leading-tight">Join us on this journey</h2>
          <p className="text-gray-400 text-lg">If our vision resonates with you — as a student, teacher, contributor, or supporter — we&apos;d love to hear from you.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link href="/contact" className="btn-saffron text-base px-8 py-4 shadow-saffron">Get in Touch <ArrowRight className="w-5 h-5" /></Link>
            <Link href="/about" className="btn-outline text-base px-8 py-4 !border-white/20 !text-white hover:!border-saffron hover:!text-saffron">Read About Us</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
