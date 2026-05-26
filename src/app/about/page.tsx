'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';
import Link from 'next/link';
import {
  Globe,
  Users,
  Zap,
  Brain,
  PlayCircle,
  Mic,
  GitMerge,
  ArrowDown,
  ExternalLink,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Scroll-reveal wrapper                                              */
/* ------------------------------------------------------------------ */
function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(32px)',
        transition: `opacity 0.7s cubic-bezier(.22,1,.36,1) ${delay}ms, transform 0.7s cubic-bezier(.22,1,.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  About Page                                                         */
/* ------------------------------------------------------------------ */
export default function AboutPage() {
  return (
    <main className="min-h-screen bg-off-white dark:bg-dark-bg overflow-hidden">
      {/* ===== HERO ===== */}
      <section className="pt-28 pb-16 bg-gradient-hero dark:bg-gradient-hero-dark rangoli-bg relative">
        {/* decorative blobs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-saffron/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-indigo-brand/10 rounded-full blur-3xl pointer-events-none" />

        <div className="container-main relative z-10">
          <Reveal>
            <h1 className="text-4xl lg:text-5xl font-heading font-bold text-center text-navy dark:text-dark-text leading-tight">
              Bodhan AI ke sapne ko aage le jaana
            </h1>
          </Reveal>

          <Reveal delay={150}>
            <p className="text-lg text-muted text-center max-w-3xl mx-auto mt-4 leading-relaxed">
              VidyaAI — IIT Madras ki Bodhan AI aur AI4Bharat ke open-source
              mission se inspired ek platform
            </p>
          </Reveal>

          {/* ===== MISSION CARDS ===== */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            {/* Card 1 */}
            <Reveal delay={0}>
              <div className="card text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-saffron/10 flex items-center justify-center mb-4">
                  <Globe className="w-8 h-8 text-saffron" />
                </div>
                <h3 className="text-card-title font-heading text-navy dark:text-dark-text mb-2">
                  Har Bhasha
                </h3>
                <p className="text-body text-muted leading-relaxed">
                  22 Indian languages mein quality education — AI4Bharat IndicF5
                  ki near-human voices ke saath
                </p>
              </div>
            </Reveal>

            {/* Card 2 */}
            <Reveal delay={120}>
              <div className="card text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-indigo-brand/10 flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-indigo-brand" />
                </div>
                <h3 className="text-card-title font-heading text-navy dark:text-dark-text mb-2">
                  Har Student
                </h3>
                <p className="text-body text-muted leading-relaxed">
                  Class 6 se college tak — koi bhi topic, koi bhi subject,
                  bilkul free
                </p>
              </div>
            </Reveal>

            {/* Card 3 */}
            <Reveal delay={240}>
              <div className="card text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-teal/10 flex items-center justify-center mb-4">
                  <Zap className="w-8 h-8 text-teal" />
                </div>
                <h3 className="text-card-title font-heading text-navy dark:text-dark-text mb-2">
                  Har Topic
                </h3>
                <p className="text-body text-muted leading-relaxed">
                  Math, Science, History, Computer Science — AI animated
                  explanation sabke liye
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ===== TECH STACK ===== */}
      <section className="container-main mt-20">
        <Reveal>
          <h2 className="section-heading text-center">
            Kaise bana hai VidyaAI?
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
          {/* Tech Card 1 — Claude */}
          <Reveal delay={0}>
            <div className="card flex gap-5 items-start h-full">
              <div className="shrink-0 w-12 h-12 rounded-full bg-saffron/10 flex items-center justify-center">
                <Brain className="w-6 h-6 text-saffron" />
              </div>
              <div className="min-w-0">
                <h3 className="text-card-title font-heading text-navy dark:text-dark-text">
                  Claude API (Anthropic)
                </h3>
                <p className="text-small text-saffron font-medium mt-0.5">
                  Script + Manim Code Generation
                </p>
                <p className="text-body text-muted mt-2 leading-relaxed">
                  Claude AI topic ko samjhta hai, teacher jaisi explanation
                  script likhta hai, aur Manim animation code generate karta hai
                </p>
                <a
                  href="https://anthropic.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-small text-saffron font-medium mt-3 hover:underline transition-colors"
                >
                  anthropic.com
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </Reveal>

          {/* Tech Card 2 — Manim */}
          <Reveal delay={120}>
            <div className="card flex gap-5 items-start h-full">
              <div className="shrink-0 w-12 h-12 rounded-full bg-indigo-brand/10 flex items-center justify-center">
                <PlayCircle className="w-6 h-6 text-indigo-brand" />
              </div>
              <div className="min-w-0">
                <h3 className="text-card-title font-heading text-navy dark:text-dark-text">
                  Manim Community Edition
                </h3>
                <p className="text-small text-indigo-brand font-medium mt-0.5">
                  Mathematical Animations
                </p>
                <p className="text-body text-muted mt-2 leading-relaxed">
                  3Blue1Brown channel wala engine — equations, shapes, graphs
                  sab smoothly animate karta hai
                </p>
                <a
                  href="https://www.manim.community"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-small text-indigo-brand font-medium mt-3 hover:underline transition-colors"
                >
                  manim.community
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </Reveal>

          {/* Tech Card 3 — IndicF5 */}
          <Reveal delay={240}>
            <div className="card flex gap-5 items-start h-full">
              <div className="shrink-0 w-12 h-12 rounded-full bg-teal/10 flex items-center justify-center">
                <Mic className="w-6 h-6 text-teal" />
              </div>
              <div className="min-w-0">
                <h3 className="text-card-title font-heading text-navy dark:text-dark-text">
                  AI4Bharat IndicF5
                </h3>
                <p className="text-small text-teal font-medium mt-0.5">
                  Indian Language Voice Synthesis
                </p>
                <p className="text-body text-muted mt-2 leading-relaxed">
                  IIT Madras ke AI4Bharat team ka near-human TTS model — 11
                  Indian languages, 1417 hours of training data
                </p>
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  <a
                    href="https://ai4bharat.iitm.ac.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-small text-teal font-medium hover:underline transition-colors"
                  >
                    ai4bharat.iitm.ac.in
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <span className="pill-indigo">IIT Madras Research</span>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Tech Card 4 — FFmpeg */}
          <Reveal delay={360}>
            <div className="card flex gap-5 items-start h-full">
              <div className="shrink-0 w-12 h-12 rounded-full bg-gray-100 dark:bg-dark-border/50 flex items-center justify-center">
                <GitMerge className="w-6 h-6 text-muted" />
              </div>
              <div className="min-w-0">
                <h3 className="text-card-title font-heading text-navy dark:text-dark-text">
                  FFmpeg
                </h3>
                <p className="text-small text-muted font-medium mt-0.5">
                  Audio-Video Synchronization
                </p>
                <p className="text-body text-muted mt-2 leading-relaxed">
                  Animation video aur IndicF5 voice ko perfectly sync karke
                  final MP4 video banata hai
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== CONNECTION DIAGRAM ===== */}
      <section className="container-main mt-20 py-16">
        <Reveal>
          <h2 className="section-heading text-center mb-12">
            VidyaAI ka Journey
          </h2>
        </Reveal>

        <div className="flex flex-col items-center gap-0">
          {/* Box 1 — Bodhan AI */}
          <Reveal delay={0}>
            <div className="px-8 py-4 rounded-2xl border text-center bg-saffron/10 text-saffron border-saffron/30 w-full max-w-sm">
              <p className="font-heading font-semibold text-lg">
                Bodhan AI (IIT Madras)
              </p>
              <p className="text-small mt-1 opacity-80">
                🏫 Education AI mission
              </p>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <ArrowDown className="w-6 h-6 text-muted my-3" />
          </Reveal>

          {/* Box 2 — AI4Bharat */}
          <Reveal delay={200}>
            <div className="px-8 py-4 rounded-2xl border text-center bg-indigo-brand/10 text-indigo-brand border-indigo-brand/30 w-full max-w-sm">
              <p className="font-heading font-semibold text-lg">
                AI4Bharat (IIT Madras)
              </p>
              <p className="text-small mt-1 opacity-80">
                🌐 Open source Indian language models
              </p>
            </div>
          </Reveal>

          <Reveal delay={300}>
            <ArrowDown className="w-6 h-6 text-muted my-3" />
          </Reveal>

          {/* Box 3 — IndicF5 */}
          <Reveal delay={400}>
            <div className="px-8 py-4 rounded-2xl border text-center bg-teal/10 text-teal border-teal/30 w-full max-w-sm">
              <p className="font-heading font-semibold text-lg">
                IndicF5 TTS Model
              </p>
              <p className="text-small mt-1 opacity-80">
                🎙️ Hindi/Indian voice
              </p>
            </div>
          </Reveal>

          <Reveal delay={500}>
            <ArrowDown className="w-6 h-6 text-muted my-3" />
          </Reveal>

          {/* Box 4 — VidyaAI */}
          <Reveal delay={600}>
            <div className="px-8 py-4 rounded-2xl border border-transparent text-center bg-gradient-saffron text-white w-full max-w-sm shadow-saffron">
              <p className="font-heading font-semibold text-lg">
                VidyaAI Platform
              </p>
              <p className="text-small mt-1 opacity-90">
                🎓 Students tak animated education
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== ACKNOWLEDGEMENT ===== */}
      <section className="container-main mt-20">
        <Reveal>
          <div className="bg-gradient-mission dark:bg-gradient-mission-dark py-16 px-6 md:px-12 rounded-3xl relative overflow-hidden">
            {/* subtle decorative circles */}
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-saffron/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-indigo-brand/5 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10">
              <p className="text-xl lg:text-2xl font-heading text-center leading-relaxed text-navy dark:text-dark-text">
                VidyaAI un researchers ke kaam ke upar khada hai jinhoone India
                ke liye AI banaya —
              </p>

              <div className="text-lg text-muted text-center mt-6 space-y-1 leading-relaxed">
                <p>Prof. Mitesh M. Khapra aur AI4Bharat team,</p>
                <p>Bodhan AI Foundation at IIT Madras,</p>
                <p>3Blue1Brown ke Grant Sanderson (Manim ke creator),</p>
                <p>Aur poori open-source community.</p>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ===== CTA ===== */}
      <section className="container-main mt-16 mb-16 text-center">
        <Reveal>
          <h2 className="text-3xl font-heading font-bold text-navy dark:text-dark-text">
            Ready ho? Pehli video banao!
          </h2>
        </Reveal>

        <Reveal delay={150}>
          <Link
            href="/generate"
            className="btn-saffron text-lg px-8 py-4 mt-8 inline-flex shadow-saffron"
          >
            ⚡ Generate Karo →
          </Link>
        </Reveal>
      </section>
    </main>
  );
}
