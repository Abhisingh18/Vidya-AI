'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';
import Link from 'next/link';
import { Globe, Users, Zap, Heart, Sparkles, ArrowRight, Target, Code2 } from 'lucide-react';

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

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-off-white dark:bg-dark-bg overflow-hidden">

      {/* Hero */}
      <section className="pt-28 pb-20 relative">
        <div className="pointer-events-none absolute top-20 -left-20 w-96 h-96 bg-saffron/10 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 -right-20 w-96 h-96 bg-indigo-brand/10 rounded-full blur-3xl" />

        <div className="container-main relative z-10 max-w-3xl mx-auto text-center">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-saffron/10 border border-saffron/20 text-saffron text-sm font-medium mb-8">
              <Heart className="w-4 h-4" />
              About VidyaAI
            </div>
          </Reveal>

          <Reveal delay={100}>
            <h1 className="text-5xl lg:text-6xl font-heading font-bold text-navy dark:text-dark-text leading-[1.1] tracking-tight">
              Education,<br />
              <span className="text-saffron">unbounded by language</span>
            </h1>
          </Reveal>

          <Reveal delay={200}>
            <p className="text-lg text-muted max-w-2xl mx-auto mt-8 leading-relaxed">
              VidyaAI is on a mission to bring world-class animated education to every Indian student — in the language they think in.
            </p>
          </Reveal>
        </div>
      </section>

      {/* The Story */}
      <section className="py-20">
        <div className="container-main max-w-3xl">
          <Reveal>
            <p className="text-saffron text-sm font-semibold uppercase tracking-widest mb-3">Our story</p>
            <h2 className="text-3xl lg:text-4xl font-heading font-bold text-navy dark:text-dark-text mb-8">Why we built VidyaAI</h2>
          </Reveal>

          <div className="space-y-6 text-lg text-muted leading-relaxed">
            <Reveal delay={100}>
              <p>
                India has 260 million students and 22 official languages — but the best educational videos on the internet are almost entirely in English.
                That gap costs millions of kids the chance to truly understand what they&apos;re learning.
              </p>
            </Reveal>
            <Reveal delay={200}>
              <p>
                We built VidyaAI because a student in a small town in Bihar should have access to the same quality of explanation as one in a metro city —
                and they should hear it in <span className="text-navy dark:text-dark-text font-medium">their</span> language, not someone else&apos;s.
              </p>
            </Reveal>
            <Reveal delay={300}>
              <p>
                Our platform turns any topic into a beautifully animated, personalised teacher video in under a minute. No subscriptions. No paywalls.
                Just learning, in your own tongue.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-white dark:bg-dark-surface/30 border-y border-card-border dark:border-dark-border">
        <div className="container-main">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <Reveal>
              <p className="text-indigo-brand text-sm font-semibold uppercase tracking-widest mb-3">What we stand for</p>
              <h2 className="text-3xl lg:text-4xl font-heading font-bold text-navy dark:text-dark-text">Our values</h2>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { icon: Globe, title: 'Language First', desc: 'Every student deserves to learn in the language they understand best. No exceptions.' },
              { icon: Target, title: 'Quality Without Compromise', desc: 'Professional animation, accurate explanations, native-sounding narration — the same standard for every learner.' },
              { icon: Users, title: 'Free for Students', desc: 'Education is a right. Core video generation will remain free for every student, always.' },
            ].map((v, i) => {
              const Icon = v.icon;
              return (
                <Reveal key={i} delay={i * 120}>
                  <div className="card h-full text-center">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-saffron/10 flex items-center justify-center mb-5">
                      <Icon className="w-6 h-6 text-saffron" />
                    </div>
                    <h3 className="text-xl font-heading font-semibold text-navy dark:text-dark-text mb-3">{v.title}</h3>
                    <p className="text-sm text-muted leading-relaxed">{v.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* What we do */}
      <section className="py-20">
        <div className="container-main">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-6xl mx-auto">
            <Reveal>
              <p className="text-teal text-sm font-semibold uppercase tracking-widest mb-3">What we do</p>
              <h2 className="text-3xl lg:text-4xl font-heading font-bold text-navy dark:text-dark-text mb-6 leading-tight">
                A teacher for every topic, in every language
              </h2>
              <div className="space-y-4 text-muted leading-relaxed">
                <p>
                  VidyaAI takes any topic a student types — from the Pythagoras Theorem to photosynthesis — and produces a complete animated explanation video.
                </p>
                <p>
                  The script is tailored to the student&apos;s grade level. The animation is cinema-quality. The narration is in one of 22 Indian languages, sounding as natural as a real teacher.
                </p>
                <p className="text-navy dark:text-dark-text font-medium">
                  All of it generated on demand. In under a minute. For free.
                </p>
              </div>
            </Reveal>

            <Reveal delay={200}>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Zap, label: '< 60 sec', sub: 'to generate' },
                  { icon: Globe, label: '22', sub: 'languages' },
                  { icon: Sparkles, label: '10k+', sub: 'topics' },
                  { icon: Code2, label: 'Open', sub: 'source' },
                ].map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <div key={i} className="card text-center group hover:-translate-y-1 transition-transform">
                      <Icon className="w-6 h-6 text-saffron mx-auto mb-3 group-hover:scale-110 transition-transform" />
                      <p className="text-2xl font-bold font-heading text-navy dark:text-dark-text">{s.label}</p>
                      <p className="text-xs text-muted mt-1">{s.sub}</p>
                    </div>
                  );
                })}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Acknowledgement */}
      <section className="py-20">
        <div className="container-main max-w-4xl">
          <Reveal>
            <div className="bg-gradient-mission dark:bg-gradient-mission-dark py-12 px-8 lg:px-12 rounded-3xl relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-saffron/5 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-indigo-brand/5 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10 text-center">
                <Heart className="w-8 h-8 text-saffron mx-auto mb-5" />
                <p className="text-lg lg:text-xl font-heading text-navy dark:text-dark-text leading-relaxed">
                  VidyaAI is built with love by a small team that believes every Indian student deserves the best teacher in the world — speaking the language they grew up with.
                </p>
                <p className="text-sm text-muted mt-5">Made in India, for Bharat 🇮🇳</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center">
        <div className="container-main max-w-2xl mx-auto space-y-6">
          <Reveal>
            <h2 className="text-3xl lg:text-4xl font-heading font-bold text-navy dark:text-dark-text">Want to be a part of this?</h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="text-muted">Get in touch — we&apos;d love to hear from students, teachers, and supporters.</p>
          </Reveal>
          <Reveal delay={200}>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link href="/contact" className="btn-saffron text-base px-8 py-4">Get in Touch <ArrowRight className="w-5 h-5" /></Link>
              <Link href="/vision" className="btn-outline text-base px-8 py-4">Our Vision</Link>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
