'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight, BookOpen, CalendarDays, Camera, CheckCircle2, ChevronDown, Clapperboard, FileText, Film, GraduationCap,
  Languages, Layers, ListChecks, NotebookPen, Presentation, School, Sparkles, Timer, Trophy, Upload, Users, Volume2, Wand2, Wrench,
} from 'lucide-react';
import { LANGUAGES } from '@/lib/languages';
import { homeForRole, parseRole } from '@/lib/roles';
import ReelPreview from '@/components/landing/reel-preview';
import VideoPreview from '@/components/landing/video-preview';
import HeroVideo from '@/components/landing/hero-video';
import FeatureDemo, { type FeatureDemoId } from '@/components/landing/feature-demos';

const PLACEHOLDERS = [
  "Newton's third law of motion…",
  'प्रकाश संश्लेषण कैसे होता है?',
  'How does the human heart work?',
  'Pythagoras theorem with examples…',
  'জলচক্র কী?',
];
const POPULAR = ["Newton's laws", 'Photosynthesis', 'Human heart', 'Pythagoras', 'Water cycle'];

interface Feature { icon: typeof Film; title: string; desc: string; tags: string[]; href: string; demo?: FeatureDemoId }

const STUDENT_FEATURES: Feature[] = [
  { icon: Film, title: 'Visual explainer videos', demo: 'video', href: '/generate', tags: ['5–6 min', 'Real voice', '23 languages'],
    desc: 'Type a topic and get a narrated lesson with real photos, diagrams and animations that move with the teacher’s voice.' },
  { icon: Clapperboard, title: '60-second reels', demo: 'reels', href: '/shorts', tags: ['Swipe to learn', 'Hindi + English'],
    desc: 'Short visual reels on science, maths and geography — perfect for a quick revision on the bus.' },
  { icon: Camera, title: 'Ask a doubt', demo: 'doubt', href: '/doubts', tags: ['Photo', 'Voice', 'Step-by-step'],
    desc: 'Snap a photo of a question or just ask by voice, and get a clear step-by-step explanation.' },
  { icon: Layers, title: 'Flashcards', demo: 'flashcards', href: '/flashcards', tags: ['Spaced repetition'],
    desc: 'Smart flashcards from any topic or your own notes, shown again right before you would forget them.' },
  { icon: NotebookPen, title: 'Revision notes', demo: 'notes', href: '/notes', tags: ['Mind map', 'Printable'],
    desc: 'One-page notes with key points, formulas and a mind map of the whole chapter.' },
  { icon: Timer, title: 'Mock tests', demo: 'mock', href: '/practice', tags: ['Timed', 'AI-graded answers'],
    desc: 'Exam-style tests with MCQs and written answers graded by AI, plus a chapter-wise report.' },
  { icon: CalendarDays, title: 'Study planner', demo: 'planner', href: '/planner', tags: ['Day-by-day', 'Auto re-plan'],
    desc: 'A daily plan up to your exam date that re-plans itself when you fall behind.' },
  { icon: Trophy, title: 'XP, streaks & badges', demo: 'xp', href: '/achievements', tags: ['Leaderboard'],
    desc: 'Earn XP for every lesson, test and task, keep your streak alive and climb the class leaderboard.' },
];

const TEACHER_FEATURES: Feature[] = [
  { icon: Presentation, title: 'AI slide decks', demo: 'slides', href: '/teacher/slides', tags: ['Real images', 'Diagrams', 'PPTX export'],
    desc: 'Visual decks with photos picked by a vision model, labelled diagrams and a present mode that reveals ideas step by step.' },
  { icon: ListChecks, title: 'Quiz builder', demo: 'quiz', href: '/teacher/quizzes', tags: ['MCQ', 'True/false', 'Short answer'],
    desc: 'Ready-to-use quizzes for any chapter, with answer keys — edit, assign and track scores.' },
  { icon: BookOpen, title: 'Lesson plans', demo: 'lesson', href: '/teacher/lesson-plans', tags: ['Objectives', 'Activities'],
    desc: 'Period-by-period lesson plans with objectives, activities, homework and assessment.' },
  { icon: FileText, title: 'Exam paper generator', demo: 'exam', href: '/teacher/exams', tags: ['Unit test → Annual', 'Answer key'],
    desc: 'Mid-sem, half-yearly or annual papers with marks-wise sections, from topics or your syllabus PDF.' },
  { icon: Users, title: 'Classrooms', demo: 'classroom', href: '/teacher/classes', tags: ['Class code', 'Assignments'],
    desc: 'Create a class, share a code, assign quizzes and videos, and see how every student is doing.' },
  { icon: Wrench, title: 'Teacher toolkit', demo: 'toolkit', href: '/teacher/toolkit', tags: ['Rubrics', 'NCERT alignment', 'Translate'],
    desc: 'Rubric generator, NCERT/CBSE alignment check, material translation and parent messages in seconds.' },
  { icon: Upload, title: 'Your material, your way', demo: 'upload', href: '/teacher/slides', tags: ['PDF', 'PPT', 'Notes'],
    desc: 'Upload your chapter, notes or syllabus — slides, quizzes, exams and videos follow exactly what you teach.' },
];

const STATS = [
  { value: '23', label: 'Indian languages' },
  { value: '15+', label: 'student & teacher tools' },
  { value: '10', label: 'animation types' },
  { value: '₹0', label: 'for students & teachers' },
];

const FAQ = [
  { q: 'Is VidyaAI really free?', a: 'Yes — free for students and teachers, no credit card. It runs on free AI models, so at very busy times there can be a short daily limit on new generations.' },
  { q: 'Which languages are supported?', a: `${LANGUAGES.length} Indian languages including English, Hindi, Bengali, Marathi, Telugu, Tamil, Gujarati, Urdu, Kannada, Odia, Malayalam and Punjabi. Hindi, English, Bengali, Marathi, Telugu, Malayalam, Urdu and Nepali have a natural built-in voice; other languages use the best voice available plus captions.` },
  { q: 'Can it follow my own notes or syllabus?', a: 'Yes. Upload a PDF, PPT or your notes and videos, slides, quizzes and exam papers are built from that material.' },
  { q: 'Is the content at my class level?', a: 'Everything is written for your class at CBSE/NCERT level, with Indian examples. Like any AI, it can make mistakes — check important answers with your textbook or teacher.' },
  { q: 'Does it work on a phone?', a: 'Yes. VidyaAI runs in any phone browser — no app to install — and you can add it to your home screen.' },
];

function useInView<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${inView ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-saffron">{children}</p>;
}

function FloatChip({ children, className }: { children: ReactNode; className: string }) {
  return (
    <div className={`absolute z-20 hidden items-center gap-2 rounded-2xl border border-card-border bg-white/95 px-3 py-2 text-xs font-semibold text-navy shadow-card backdrop-blur sm:flex dark:border-dark-border dark:bg-dark-surface/95 dark:text-dark-text ${className}`}>
      {children}
    </div>
  );
}

export default function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const isLoggedIn = !!session;
  const home = homeForRole(parseRole((session?.user as { role?: string } | undefined)?.role));
  const [phIdx, setPhIdx] = useState(0);
  const [fading, setFading] = useState(false);
  const [topic, setTopic] = useState('');
  const [tab, setTab] = useState<'students' | 'teachers'>('students');
  const features = tab === 'students' ? STUDENT_FEATURES : TEACHER_FEATURES;

  useEffect(() => {
    const id = setInterval(() => {
      setFading(true);
      setTimeout(() => { setPhIdx(p => (p + 1) % PLACEHOLDERS.length); setFading(false); }, 250);
    }, 2800);
    return () => clearInterval(id);
  }, []);

  const handleGenerate = () => {
    const url = topic.trim() ? `/generate?topic=${encodeURIComponent(topic)}` : '/generate';
    router.push(isLoggedIn ? url : `/login?callbackUrl=${encodeURIComponent(url)}`);
  };

  return (
    <main className="overflow-x-hidden bg-off-white dark:bg-dark-bg">

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative overflow-hidden pt-28 pb-16 lg:pb-24">
        <div className="pointer-events-none absolute inset-0 opacity-[0.05] dark:opacity-[0.07]"
          style={{
            backgroundImage: 'linear-gradient(#3D3BDB 1px,transparent 1px),linear-gradient(90deg,#3D3BDB 1px,transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse at 60% 40%, black 25%, transparent 72%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 60% 40%, black 25%, transparent 72%)',
          }} />
        <div className="pointer-events-none absolute -top-24 right-[-10%] h-[520px] w-[520px] rounded-full bg-saffron/15 blur-[130px]" />
        <div className="pointer-events-none absolute bottom-[-20%] left-[-10%] h-[480px] w-[480px] rounded-full bg-indigo-brand/12 blur-[130px]" />

        <div className="container-main relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-card-border bg-white px-4 py-1.5 text-xs font-medium shadow-sm dark:border-dark-border dark:bg-dark-surface">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-saffron opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-saffron" />
              </span>
              <span className="text-muted">Free for every student &amp; teacher · {LANGUAGES.length} Indian languages</span>
            </div>

            <h1 className="mt-6 font-heading text-[2.6rem] font-extrabold leading-[1.05] tracking-tight text-navy sm:text-5xl lg:text-[68px] dark:text-dark-text">
              Every lesson, explained like your{' '}
              <span className="text-gradient-saffron">best teacher.</span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted">
              Animated video lessons with a real voice, 60-second visual reels, instant doubt solving, mock tests —
              and a complete AI toolkit for teachers. In Hindi, Tamil, Bengali and {LANGUAGES.length - 3} more languages.
            </p>

            <div className="relative mx-auto mt-8 max-w-xl">
              <div className="relative flex h-14 items-center overflow-hidden rounded-2xl border-2 border-card-border bg-white px-2 shadow-card transition-all duration-300 focus-within:border-saffron focus-within:shadow-lg dark:border-dark-border dark:bg-dark-surface">
                <Wand2 className="ml-2 h-5 w-5 shrink-0 text-saffron" />
                <div className="relative flex h-full flex-1 items-center">
                  <input type="text" value={topic} onChange={e => setTopic(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && topic.trim() && handleGenerate()}
                    className="h-full w-full bg-transparent pl-3 text-base text-navy placeholder-transparent outline-none dark:text-dark-text"
                    aria-label="Topic to learn" />
                  {!topic && (
                    <span className={`pointer-events-none absolute left-3 right-2 truncate text-base text-muted/60 transition-opacity duration-300 ${fading ? 'opacity-0' : 'opacity-100'}`}>
                      {PLACEHOLDERS[phIdx]}
                    </span>
                  )}
                </div>
                <button type="button" onClick={handleGenerate} className="btn-saffron h-10 flex-shrink-0 rounded-xl px-5 text-sm">
                  Make my video <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <span className="text-xs text-muted">Try:</span>
                {POPULAR.map(t => (
                  <button key={t} onClick={() => setTopic(t)}
                    className="rounded-full border border-card-border px-3 py-1 text-xs text-muted transition-all hover:border-saffron hover:text-saffron dark:border-dark-border">
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              {isLoggedIn ? (
                <Link href={home} className="btn-saffron px-6 py-3 text-base shadow-saffron">Go to dashboard <ArrowRight className="h-4 w-4" /></Link>
              ) : (
                <>
                  <Link href="/login?mode=signup" className="btn-saffron px-6 py-3 text-base shadow-saffron">
                    <GraduationCap className="h-5 w-5" /> I’m a student
                  </Link>
                  <Link href="/login?mode=signup&as=teacher" className="btn-outline px-6 py-3 text-base">
                    <School className="h-5 w-5" /> I’m a teacher
                  </Link>
                </>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-muted">
              <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> Free, no credit card</span>
              <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> Works on any phone</span>
              <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> Real voice — no app needed</span>
            </div>
          </div>

          {/* the hero video: six subjects, live animation */}
          <div className="relative mx-auto mt-14 max-w-5xl">
            <HeroVideo />
            <p className="mt-4 text-center text-xs text-muted">
              Every frame above is drawn live by VidyaAI — six subjects, seven seconds each. Tap <b>Listen</b> to hear the teacher.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════ LANGUAGES ═══════════════ */}
      <section className="border-y border-card-border bg-white py-5 dark:border-dark-border dark:bg-dark-surface/40" aria-label="Supported languages">
        <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
          <div className="flex w-max animate-marquee gap-3 hover:[animation-play-state:paused]">
            {[...LANGUAGES, ...LANGUAGES].map((l, i) => (
              <span key={i} className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-card-border bg-off-white px-4 py-1.5 text-sm dark:border-dark-border dark:bg-dark-bg">
                <span className="font-semibold text-navy dark:text-dark-text">{l.native}</span>
                <span className="text-xs text-muted">{l.name}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ PHONE REEL ═══════════════ */}
      <section className="relative overflow-hidden py-20 lg:py-28">
        <div className="pointer-events-none absolute right-[-10%] top-10 h-[420px] w-[420px] rounded-full bg-indigo-brand/10 blur-[120px]" />
        <div className="container-main relative grid items-center gap-14 lg:grid-cols-2">
          <Reveal className="relative mx-auto w-[min(78vw,300px)]">
            <div className="pointer-events-none absolute inset-[-12%] rounded-full bg-gradient-to-tr from-saffron/25 via-transparent to-indigo-brand/25 blur-3xl" />
            <ReelPreview id="heart" lang="hi" className="relative" />
            <FloatChip className="-left-28 top-[16%] animate-float"><Volume2 className="h-4 w-4 text-saffron" /> Teacher’s voice · हिंदी</FloatChip>
            <FloatChip className="-right-24 top-[46%] animate-float [animation-delay:1.2s]"><Sparkles className="h-4 w-4 text-indigo-brand" /> Animates as it explains</FloatChip>
            <FloatChip className="-left-20 bottom-[14%] animate-float [animation-delay:2.1s]"><Trophy className="h-4 w-4 text-amber-500" /> +20 XP earned</FloatChip>
          </Reveal>
          <Reveal delay={120} className="text-center lg:text-left">
            <Eyebrow>Learn on your phone</Eyebrow>
            <h2 className="font-heading text-3xl font-bold leading-tight text-navy lg:text-[2.6rem] dark:text-dark-text">
              A minute on the bus. <span className="text-gradient-saffron">A concept for life.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl leading-relaxed text-muted lg:mx-0">
              Swipe through visual reels where a teacher’s voice explains every step — in Hindi, English or your own language.
              Tap the phone to hear it.
            </p>
            <ul className="mx-auto mt-6 max-w-md space-y-3 text-left text-sm text-navy lg:mx-0 dark:text-dark-text">
              {['Real photos, moving diagrams and kinetic captions', 'A natural teacher’s voice — no app or login needed', 'Every reel links to a full lesson, quiz and notes'].map(x => (
                <li key={x} className="flex items-start gap-2.5"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />{x}</li>
              ))}
            </ul>
            <Link href="/shorts" className="btn-saffron mt-8 px-6 py-3">Watch reels <ArrowRight className="h-4 w-4" /></Link>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ VIDEO SAMPLE ═══════════════ */}
      <section className="border-t border-card-border py-20 lg:py-28 dark:border-dark-border">
        <div className="container-main grid items-center gap-12 lg:grid-cols-[1.25fr_0.75fr]">
          <Reveal><VideoPreview /></Reveal>
          <Reveal delay={120}>
            <Eyebrow>Visual explainer videos</Eyebrow>
            <h2 className="font-heading text-3xl font-bold leading-tight text-navy lg:text-[2.6rem] dark:text-dark-text">
              Not slides. A teacher who <span className="text-gradient-saffron">shows</span> it happening.
            </h2>
            <p className="mt-4 leading-relaxed text-muted">
              Type any topic — or upload your chapter — and VidyaAI builds a 5–6 minute lesson in your language. Forces push,
              planets orbit, current flows and water cycles, step by step with the narration.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-navy dark:text-dark-text">
              {[
                'Real photos and labelled diagrams, picked by a vision AI',
                '10 kinds of animation that move in sync with the voice',
                'Natural narration and word-by-word captions',
                'Quiz, doubt chat and notes right after the video',
              ].map(t => (
                <li key={t} className="flex items-start gap-2.5"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />{t}</li>
              ))}
            </ul>
            <button onClick={handleGenerate} className="btn-saffron mt-8 px-6 py-3">Generate a video <ArrowRight className="h-4 w-4" /></button>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ REELS ═══════════════ */}
      <section className="relative overflow-hidden bg-navy py-20 lg:py-28 dark:bg-[#080812]">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[360px] w-[720px] -translate-x-1/2 rounded-full bg-saffron/15 blur-[120px]" />
        <div className="container-main relative">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Eyebrow>Shorts</Eyebrow>
            <h2 className="font-heading text-3xl font-bold leading-tight text-white lg:text-[2.6rem]">Reels that actually teach.</h2>
            <p className="mt-4 text-gray-400">
              60-second visual stories — real photos, moving diagrams and a voice that explains every step. Swipe, learn, repeat.
            </p>
          </Reveal>
          <div className="no-scrollbar -mx-4 mt-12 flex snap-x snap-mandatory gap-6 overflow-x-auto px-4 pb-4 md:mx-0 md:justify-center md:overflow-visible md:px-0">
            {([['photosynthesis', 'en'], ['black-hole', 'hi'], ['pythagoras', 'en']] as const).map(([id, lang], i) => (
              <Reveal key={id} delay={i * 120} className={`w-[230px] shrink-0 snap-center ${i === 1 ? 'md:-translate-y-6' : ''}`}>
                <ReelPreview id={id} lang={lang} />
              </Reveal>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/shorts" className="btn-saffron px-7 py-3 shadow-saffron">Open Shorts <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      {/* ═══════════════ FEATURES ═══════════════ */}
      <section className="py-20 lg:py-28" id="features">
        <div className="container-main">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Eyebrow>Everything in one place</Eyebrow>
            <h2 className="font-heading text-3xl font-bold leading-tight text-navy lg:text-[2.6rem] dark:text-dark-text">
              Built for the student <span className="text-muted">and</span> the teacher.
            </h2>
          </Reveal>

          <div className="mx-auto mt-10 flex w-fit rounded-2xl border border-card-border bg-white p-1.5 shadow-sm dark:border-dark-border dark:bg-dark-surface" role="tablist">
            {([['students', GraduationCap, 'For students'], ['teachers', School, 'For teachers']] as const).map(([key, Icon, label]) => (
              <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)}
                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${tab === key ? 'bg-navy text-white shadow dark:bg-saffron' : 'text-muted hover:text-navy dark:hover:text-dark-text'}`}>
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>

          <div key={tab} className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <Link key={f.title} href={f.href}
                  className="group flex animate-fade-in-up flex-col rounded-2xl border border-card-border bg-white p-5 opacity-0 transition-all duration-300 hover:-translate-y-1 hover:border-saffron/40 hover:shadow-card-hover dark:border-dark-border dark:bg-dark-surface"
                  style={{ animationDelay: `${i * 60}ms` }}>
                  {f.demo && <FeatureDemo id={f.demo} />}
                  {f.demo ? (
                    <h3 className="flex items-center gap-2 font-heading font-semibold text-navy dark:text-dark-text">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-saffron/15 to-indigo-brand/15 text-saffron">
                        <Icon className="h-4 w-4" />
                      </span>
                      {f.title}
                    </h3>
                  ) : (
                    <>
                      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-saffron/15 to-indigo-brand/15 text-saffron transition-transform group-hover:scale-110">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="font-heading font-semibold text-navy dark:text-dark-text">{f.title}</h3>
                    </>
                  )}
                  <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted">{f.desc}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {f.tags.map(t => <span key={t} className="rounded-full bg-off-white px-2 py-0.5 text-[11px] font-medium text-muted dark:bg-dark-bg">{t}</span>)}
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-saffron">
                    Try it <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════ STATS ═══════════════ */}
      <section className="border-y border-card-border bg-white py-14 dark:border-dark-border dark:bg-dark-surface/40">
        <div className="container-main grid grid-cols-2 gap-8 text-center lg:grid-cols-4">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 80}>
              <p className="font-heading text-4xl font-extrabold text-navy lg:text-5xl dark:text-dark-text">{s.value}</p>
              <p className="mt-1 text-sm text-muted">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <section className="py-20 lg:py-28">
        <div className="container-main">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Eyebrow>How it works</Eyebrow>
            <h2 className="font-heading text-3xl font-bold text-navy lg:text-[2.6rem] dark:text-dark-text">From a question to a lesson in a minute.</h2>
          </Reveal>
          <div className="relative mx-auto mt-14 grid max-w-5xl gap-6 md:grid-cols-3">
            <div className="pointer-events-none absolute left-[16%] right-[16%] top-7 hidden h-px bg-gradient-to-r from-saffron/0 via-saffron/50 to-saffron/0 md:block" />
            {[
              { icon: Wand2, title: 'Ask or upload', desc: 'Type a topic, snap a question, or upload your chapter or syllabus.' },
              { icon: Languages, title: 'Pick your language', desc: `Choose your class and any of ${LANGUAGES.length} Indian languages.` },
              { icon: Film, title: 'Learn your way', desc: 'Watch, swipe reels, revise with flashcards and test yourself.' },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <Reveal key={s.title} delay={i * 120} className="relative text-center">
                  <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-saffron text-white shadow-saffron">
                    <Icon className="h-6 w-6" />
                    <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-navy text-xs font-bold text-white dark:bg-dark-surface">{i + 1}</span>
                  </div>
                  <h3 className="mt-5 font-heading text-lg font-semibold text-navy dark:text-dark-text">{s.title}</h3>
                  <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-muted">{s.desc}</p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════ FAQ ═══════════════ */}
      <section className="pb-20 lg:pb-28">
        <div className="container-main max-w-3xl">
          <Reveal className="text-center">
            <Eyebrow>Questions</Eyebrow>
            <h2 className="font-heading text-3xl font-bold text-navy dark:text-dark-text">Good to know</h2>
          </Reveal>
          <div className="mt-10 space-y-3">
            {FAQ.map(f => (
              <details key={f.q} className="group rounded-2xl border border-card-border bg-white px-5 py-4 dark:border-dark-border dark:bg-dark-surface">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-heading font-semibold text-navy dark:text-dark-text">
                  {f.q}
                  <ChevronDown className="h-5 w-5 shrink-0 text-muted transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ CTA ═══════════════ */}
      <section className="relative overflow-hidden bg-navy py-20 dark:bg-[#080812]">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-[640px] -translate-x-1/2 rounded-full bg-saffron/15 blur-[100px]" />
        <div className="container-main relative z-10 mx-auto max-w-2xl space-y-5 text-center">
          <h2 className="font-heading text-3xl font-bold leading-tight text-white lg:text-[2.6rem]">
            Learning that speaks your language.
          </h2>
          <p className="text-gray-400">Join free in under a minute — as a student or a teacher.</p>
          <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row">
            {isLoggedIn ? (
              <Link href={home} className="btn-saffron px-7 py-3 text-base shadow-saffron">Go to dashboard <ArrowRight className="h-4 w-4" /></Link>
            ) : (
              <>
                <Link href="/login?mode=signup" className="btn-saffron px-7 py-3 text-base shadow-saffron">Start as a student <ArrowRight className="h-4 w-4" /></Link>
                <Link href="/login?mode=signup&as=teacher" className="btn-outline px-7 py-3 text-base !border-white/20 !text-white hover:!border-saffron hover:!text-saffron">Start as a teacher</Link>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
