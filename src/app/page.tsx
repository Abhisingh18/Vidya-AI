'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Keyboard,
  Brain,
  Play,
  Mic,
  Globe,
  Zap,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Star,
  Quote,
  Users,
  BookOpen,
  GraduationCap,
} from 'lucide-react';

/* ──────────────────────────── constants ──────────────────────────── */

const PLACEHOLDER_TOPICS = [
  'Pythagoras Theorem likhiye...',
  'Integration kya hota hai...',
  'Newton ke Laws...',
  'Trigonometry basics...',
  'Photosynthesis explain karo...',
];

const POPULAR_CHIPS = ['Pythagoras', 'Integration', "Newton's Laws", 'DNA', 'Trigonometry'];

const SAMPLE_TOPICS = [
  'Pythagoras Theorem',
  'Integration',
  "Newton's Laws",
  'DNA Structure',
  'Photosynthesis',
  'Binomial Theorem',
  "Ohm's Law",
  'Trigonometry',
  'Cell Division',
  'Quadratic Equations',
  'Gravitation',
  'French Revolution',
  'Periodic Table',
  'Probability',
  'Human Heart',
];

const STEPS = [
  {
    icon: Keyboard,
    color: 'bg-saffron',
    title: 'Topic likho',
    desc: 'Koi bhi subject — Math, Science, History, Class 6 se College tak',
  },
  {
    icon: Brain,
    color: 'bg-indigo-brand',
    title: 'Claude AI script banata hai',
    desc: 'Anthropic ke Claude API se detailed explanation + Manim animation code generate hota hai',
  },
  {
    icon: Play,
    color: 'bg-teal',
    title: 'Manim animation render hoti hai',
    desc: '3Blue1Brown style professional math animations automatically create hoti hain',
  },
  {
    icon: Mic,
    color: 'bg-saffron',
    title: 'AI4Bharat voice add hoti hai',
    desc: 'IndicF5 model se near-human Hindi/Indian language voice — bilkul real teacher jaisi',
  },
];

const FEATURES = [
  {
    icon: Globe,
    iconBg: 'bg-indigo-brand/10 dark:bg-indigo-brand/20',
    iconColor: 'text-indigo-brand',
    title: '22 Indian Languages',
    desc: 'Hindi se Tamil, Telugu se Bengali — AI4Bharat ke IndicF5 model se 22 Indian languages mein near-human voice synthesis. Har student apni language mein seekhe.',
    pill: 'pill-teal',
    pillLabel: 'Powered by AI4Bharat',
  },
  {
    icon: Play,
    iconBg: 'bg-saffron/10 dark:bg-saffron/20',
    iconColor: 'text-saffron',
    title: '3Blue1Brown Style Animations',
    desc: 'Manim Community engine se stunning mathematical & scientific animations. Complex concepts ko beautiful visuals mein convert karta hai — just like 3Blue1Brown.',
    pill: 'pill-indigo',
    pillLabel: 'Powered by Manim',
  },
  {
    icon: Zap,
    iconBg: 'bg-teal/10 dark:bg-teal/20',
    iconColor: 'text-teal',
    title: 'Real Teacher Jaisi Explanation',
    desc: 'Claude AI se detailed, step-by-step script generation. Ek real teacher ki tarah — concepts ko simple language mein todke explain karta hai, examples ke saath.',
    pill: 'pill-saffron',
    pillLabel: 'Powered by Claude API',
  },
];

const TESTIMONIALS = [
  {
    quote: 'Pehli baar Integration samjh aaya — Hindi mein animation dekh ke!',
    name: 'Rahul',
    class: 'Class 12',
    state: 'Bihar',
  },
  {
    quote: 'Teacher se better explain kiya IndicF5 voice ne!',
    name: 'Priya',
    class: 'Class 10',
    state: 'Tamil Nadu',
  },
  {
    quote: "Mera favourite — Newton's Laws wali video!",
    name: 'Arjun',
    class: 'Class 9',
    state: 'Maharashtra',
  },
];

/* ──────────────────────── helper: useInView ──────────────────────── */

function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, inView };
}

/* ──────────────────── helper: animated counter ──────────────────── */

function useCountUp(target: number, inView: boolean, duration = 2000) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const id = setInterval(() => {
      start += step;
      if (start >= target) {
        setValue(target);
        clearInterval(id);
      } else {
        setValue(start);
      }
    }, 16);
    return () => clearInterval(id);
  }, [inView, target, duration]);
  return value;
}

/* ═══════════════════════════════════════════════════════════════════ *
 *  PAGE COMPONENT                                                    *
 * ═══════════════════════════════════════════════════════════════════ */

export default function HomePage() {
  /* ── cycling placeholder state ── */
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setPlaceholderIdx((prev) => (prev + 1) % PLACEHOLDER_TOPICS.length);
        setIsFading(false);
      }, 300);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  /* ── stats section observer ── */
  const stats = useInView(0.3);
  const langCount = useCountUp(22, stats.inView);
  const voiceCount = useCountUp(13, stats.inView);

  /* ── how-it-works observer ── */
  const howRef = useInView(0.15);

  return (
    <main className="overflow-x-hidden">
      {/* ───────────────── 1. HERO SECTION ───────────────── */}
      <section className="relative min-h-screen rangoli-bg bg-gradient-hero dark:bg-gradient-hero-dark pt-28 pb-16 lg:pb-24">
        {/* decorative blobs */}
        <div className="pointer-events-none absolute top-20 left-[-120px] w-[360px] h-[360px] rounded-full bg-saffron/10 blur-[100px]" />
        <div className="pointer-events-none absolute bottom-10 right-[-80px] w-[280px] h-[280px] rounded-full bg-indigo-brand/10 blur-[100px]" />

        <div className="container-main relative z-10 grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-8 items-center">
          {/* LEFT — 3 cols */}
          <div className="lg:col-span-3 space-y-6">
            {/* pill */}
            <span className="pill-indigo">
              <GraduationCap className="w-3.5 h-3.5" />
              🎓 Bodhan AI Mission ke saath
            </span>

            {/* heading */}
            <h1 className="text-5xl lg:text-hero font-heading font-bold text-navy dark:text-dark-text leading-tight">
              Koi bhi topic likho —
              <br />
              AI teacher video
              <br />
              <span className="text-saffron">bana dega</span>
            </h1>

            {/* sub-heading */}
            <p className="text-lg text-muted max-w-xl">
              Hindi, Tamil, Telugu aur 19 aur Indian languages mein — bilkul real teacher jaisi
              animated explanation
            </p>

            {/* animated search bar */}
            <div className="relative max-w-xl group">
              <div className="flex items-center h-14 rounded-full border-2 border-card-border dark:border-dark-border bg-white dark:bg-dark-surface focus-within:border-saffron transition-colors duration-300 shadow-card dark:shadow-card-dark overflow-hidden">
                <div className="relative flex-1 h-full">
                  <input
                    type="text"
                    className="w-full h-full pl-5 pr-2 bg-transparent outline-none text-navy dark:text-dark-text font-body placeholder:text-muted/60"
                    aria-label="Topic input"
                  />
                  {/* cycling placeholder overlay */}
                  <span
                    className={`pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-muted/60 transition-opacity duration-300 ${
                      isFading ? 'opacity-0' : 'opacity-100'
                    }`}
                  >
                    {PLACEHOLDER_TOPICS[placeholderIdx]}
                  </span>
                </div>
                <button className="btn-saffron h-10 mr-2 rounded-full text-sm px-5 flex-shrink-0">
                  Generate <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* popular chips */}
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-xs text-muted mr-1 self-center">Popular:</span>
              {POPULAR_CHIPS.map((t) => (
                <button
                  key={t}
                  className="rounded-full border border-card-border dark:border-dark-border px-3.5 py-1.5 text-xs font-medium text-navy dark:text-dark-text hover:border-saffron hover:text-saffron transition-all duration-200 cursor-pointer"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT — 2 cols — floating video mock */}
          <div className="lg:col-span-2 flex justify-center lg:justify-end">
            <div className="animate-float w-full max-w-sm">
              <div className="rounded-2xl bg-navy dark:bg-dark-surface border border-dark-border overflow-hidden shadow-xl">
                {/* mock video area */}
                <div className="relative h-52 bg-[#12122a] flex items-center justify-center overflow-hidden">
                  {/* geometric shapes */}
                  <svg
                    viewBox="0 0 200 200"
                    className="absolute inset-0 w-full h-full opacity-80"
                  >
                    {/* large triangle */}
                    <polygon
                      points="100,30 170,160 30,160"
                      fill="none"
                      stroke="#FF6B2C"
                      strokeWidth="2"
                      className="animate-pulse"
                    />
                    {/* right-angle marker */}
                    <polyline
                      points="30,160 30,145 45,145"
                      fill="none"
                      stroke="#0F9E75"
                      strokeWidth="1.5"
                    />
                    {/* labels */}
                    <text x="55" y="170" fill="#6F6DE1" fontSize="10" fontFamily="sans-serif">
                      a
                    </text>
                    <text x="140" y="110" fill="#FF6B2C" fontSize="10" fontFamily="sans-serif">
                      b
                    </text>
                    <text x="75" y="90" fill="#0F9E75" fontSize="10" fontFamily="sans-serif">
                      c
                    </text>
                    {/* formula */}
                    <text
                      x="100"
                      y="190"
                      fill="#F0F0FF"
                      fontSize="11"
                      fontFamily="sans-serif"
                      textAnchor="middle"
                      opacity="0.9"
                    >
                      a² + b² = c²
                    </text>
                    {/* decorative circle */}
                    <circle
                      cx="100"
                      cy="110"
                      r="55"
                      fill="none"
                      stroke="#3D3BDB"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                      className="animate-spin-slow"
                    />
                    {/* small dots */}
                    <circle cx="100" cy="30" r="3" fill="#FF6B2C" />
                    <circle cx="170" cy="160" r="3" fill="#FF6B2C" />
                    <circle cx="30" cy="160" r="3" fill="#FF6B2C" />
                  </svg>

                  {/* play icon overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-saffron/20 flex items-center justify-center backdrop-blur-sm animate-pulse-glow">
                      <Play className="w-6 h-6 text-saffron fill-saffron" />
                    </div>
                  </div>
                </div>

                {/* bottom bar */}
                <div className="px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-gray-400 truncate">
                    ▶ Playing: Pythagoras Theorem — Hindi
                  </span>
                  {/* waveform bars */}
                  <div className="flex items-end gap-[3px] h-4">
                    {[0, 0.2, 0.4, 0.15, 0.35, 0.1].map((d, i) => (
                      <span
                        key={i}
                        className="inline-block w-[3px] rounded-full bg-saffron animate-waveform"
                        style={{
                          height: '60%',
                          animationDelay: `${d}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────── 2. STATS BAR ───────────────── */}
      <section ref={stats.ref} className="bg-indigo-brand py-8">
        <div className="container-main grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
          {[
            { value: langCount, suffix: '', label: 'Indian Languages' },
            { value: voiceCount, suffix: '', label: 'Voice Models (AI4Bharat)' },
            { value: stats.inView ? 1 : 0, suffix: 'M+', label: 'Teachers Mission (Bodhan AI)' },
            { value: stats.inView ? 100 : 0, suffix: '%', label: 'Open Source' },
          ].map((s, i) => (
            <div key={i} className="space-y-1">
              <p className="text-3xl md:text-4xl font-bold font-heading">
                {s.value}
                {s.suffix}
              </p>
              <p className="text-sm opacity-80">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────── 3. HOW IT WORKS ───────────────── */}
      <section className="py-20 lg:py-28 bg-off-white dark:bg-dark-bg" ref={howRef.ref}>
        <div className="container-main">
          <div className="text-center mb-14">
            <h2 className="section-heading">Kaise kaam karta hai?</h2>
            <p className="section-subheading mx-auto">
              Sirf 4 steps mein — topic likho, AI teacher video tayyar
            </p>
          </div>

          {/* steps grid + connecting line */}
          <div className="relative">
            {/* dotted connector (desktop only) */}
            <div className="hidden lg:block absolute top-12 left-[12%] right-[12%] border-t-2 border-dashed border-card-border dark:border-dark-border z-0" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div
                    key={i}
                    className={`flex flex-col items-center text-center space-y-4 transition-all duration-700 ${
                      howRef.inView
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-8'
                    }`}
                    style={{ transitionDelay: `${i * 150}ms` }}
                  >
                    <div
                      className={`w-12 h-12 rounded-full ${s.color} text-white flex items-center justify-center shadow-lg`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="card w-full text-center">
                      <p className="text-sm font-bold text-muted/50 mb-1">Step {i + 1}</p>
                      <h3 className="text-card-title font-heading font-semibold text-navy dark:text-dark-text mb-2">
                        {s.title}
                      </h3>
                      <p className="text-sm text-muted">{s.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────── 4. FEATURES SECTION ───────────────── */}
      <section className="py-20 lg:py-28 bg-white dark:bg-dark-surface/40">
        <div className="container-main">
          <div className="text-center mb-14">
            <h2 className="section-heading">VidyaAI kyun special hai?</h2>
            <p className="section-subheading mx-auto">
              AI + Indian languages + stunning animations = next-level learning
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="card group flex flex-col justify-between">
                  <div>
                    <div
                      className={`w-12 h-12 rounded-xl ${f.iconBg} ${f.iconColor} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-card-title font-heading font-semibold text-navy dark:text-dark-text mb-2">
                      {f.title}
                    </h3>
                    <p className="text-sm text-muted leading-relaxed mb-5">{f.desc}</p>
                  </div>
                  <span className={f.pill}>{f.pillLabel}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────────────── 5. MISSION SECTION ───────────────── */}
      <section className="py-16 lg:py-24 bg-gradient-mission dark:bg-gradient-mission-dark">
        <div className="container-main max-w-3xl text-center space-y-8">
          <Sparkles className="w-8 h-8 text-saffron mx-auto animate-bounce-gentle" />

          <blockquote className="text-xl lg:text-2xl font-heading text-navy dark:text-dark-text italic leading-relaxed">
            &ldquo;Bodhan AI ka sapna hai ki 2027 tak 10 lakh teachers ko AI se empower kiya jaaye.
            VidyaAI us mission ka ek hissa hai — students ke haath mein AI teacher de do.&rdquo;
          </blockquote>

          {/* partner badges */}
          <div className="flex items-center justify-center gap-6 flex-wrap pt-2">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-brand/10 dark:bg-indigo-brand/20 text-indigo-brand font-heading font-semibold text-sm">
              <BookOpen className="w-4 h-4" /> Bodhan AI
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal/10 dark:bg-teal/20 text-teal font-heading font-semibold text-sm">
              <Globe className="w-4 h-4" /> AI4Bharat
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-saffron/10 dark:bg-saffron/20 text-saffron font-heading font-semibold text-sm">
              <GraduationCap className="w-4 h-4" /> IIT Madras
            </span>
          </div>
        </div>
      </section>

      {/* ───────────────── 6. SAMPLE TOPICS STRIP ───────────────── */}
      <section className="py-20 lg:py-28 bg-off-white dark:bg-dark-bg">
        <div className="container-main text-center mb-10">
          <h2 className="section-heading">In topics pe try karo</h2>
          <p className="section-subheading mx-auto">
            Click karo aur dekho AI kaise video banata hai
          </p>
        </div>

        <div className="overflow-hidden">
          <div className="flex animate-marquee w-max">
            {[...SAMPLE_TOPICS, ...SAMPLE_TOPICS].map((t, i) => (
              <span
                key={i}
                className="flex-shrink-0 rounded-full border border-card-border dark:border-dark-border px-4 py-2 text-sm text-navy dark:text-dark-text hover:border-saffron hover:text-saffron cursor-pointer transition-all duration-200 mx-2 whitespace-nowrap"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* reverse row */}
        <div className="overflow-hidden mt-4">
          <div className="flex animate-marquee-reverse w-max">
            {[...SAMPLE_TOPICS.slice().reverse(), ...SAMPLE_TOPICS.slice().reverse()].map(
              (t, i) => (
                <span
                  key={i}
                  className="flex-shrink-0 rounded-full border border-card-border dark:border-dark-border px-4 py-2 text-sm text-navy dark:text-dark-text hover:border-indigo-brand hover:text-indigo-brand cursor-pointer transition-all duration-200 mx-2 whitespace-nowrap"
                >
                  {t}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* ───────────────── 7. TESTIMONIALS ───────────────── */}
      <section className="py-20 lg:py-28 bg-white dark:bg-dark-surface/40">
        <div className="container-main">
          <div className="text-center mb-14">
            <h2 className="section-heading">Students kya keh rahe hain?</h2>
            <p className="section-subheading mx-auto">
              Real feedback from real students across India
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="card flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, s) => (
                      <Star
                        key={s}
                        className="w-4 h-4 text-saffron fill-saffron"
                      />
                    ))}
                  </div>
                  <Quote className="w-6 h-6 text-saffron/40 mb-2" />
                  <p className="text-sm italic text-navy dark:text-dark-text leading-relaxed">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>
                <div className="mt-5 pt-4 border-t border-card-border dark:border-dark-border">
                  <p className="text-sm font-semibold text-navy dark:text-dark-text">{t.name}</p>
                  <p className="text-xs text-muted">
                    {t.class}, {t.state}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────── FINAL CTA ───────────────── */}
      <section className="py-20 lg:py-28 bg-gradient-hero dark:bg-gradient-hero-dark rangoli-bg text-center">
        <div className="container-main max-w-2xl space-y-6">
          <h2 className="section-heading">Pehla video abhi banao — Free hai!</h2>
          <p className="section-subheading mx-auto">
            Koi sign-up nahi, koi payment nahi. Topic likho, video dekho.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button className="btn-saffron text-base px-8 py-4 shadow-saffron">
              Start Generating <ArrowRight className="w-5 h-5" />
            </button>
            <button className="btn-outline text-base px-8 py-4">
              <BookOpen className="w-5 h-5" /> See Demo Videos
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
