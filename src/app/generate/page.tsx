'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Brain,
  Code,
  Film,
  Mic,
  GitMerge,
  CheckCircle,
  Loader2,
  Play,
  Pause,
  Volume2,
  Maximize,
  Subtitles,
  Download,
  ClipboardCopy,
  Link2,
  RefreshCw,
  Sparkles,
  Clock,
  Triangle,
  ChevronDown,
  Copy,
  Check,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  TYPES & CONSTANTS                                                  */
/* ------------------------------------------------------------------ */

interface Language {
  name: string;
  flag: string;
}

const LANGUAGES: Language[] = [
  { name: 'Hindi', flag: '🇮🇳' },
  { name: 'English', flag: '🇬🇧' },
  { name: 'Tamil', flag: '🏳️' },
  { name: 'Telugu', flag: '🏳️' },
  { name: 'Marathi', flag: '🏳️' },
  { name: 'Bengali', flag: '🏳️' },
  { name: 'Kannada', flag: '🏳️' },
  { name: 'Malayalam', flag: '🏳️' },
  { name: 'Gujarati', flag: '🏳️' },
  { name: 'Punjabi', flag: '🏳️' },
];

const GRADE_LEVELS = ['6-8', '9-10', '11-12', 'College', 'Competitive Exam'];

const POPULAR_TOPICS = ['Pythagoras', 'Derivatives', 'Newton', 'Integration'];

const STEPS = [
  { icon: Brain, text: 'Claude AI script likh raha hai...' },
  { icon: Code, text: 'Manim animation code generate ho raha hai...' },
  { icon: Film, text: 'Animation render ho rahi hai...' },
  { icon: Mic, text: 'AI4Bharat IndicF5 voice add ho rahi hai...' },
  { icon: GitMerge, text: 'FFmpeg se video merge ho rahi hai...' },
  { icon: CheckCircle, text: 'Video taiyaar hai! 🎉' },
];

const SCRIPT_LINES = [
  { time: '0:00', text: 'नमस्ते! आज हम सीखेंगे Pythagoras Theorem...' },
  { time: '0:15', text: 'एक right-angled triangle लो...' },
  {
    time: '0:30',
    text: 'इसमें तीन sides होती हैं — base, perpendicular, और hypotenuse...',
  },
  { time: '0:45', text: 'Pythagoras ne prove kiya ki: a² + b² = c²...' },
  { time: '1:00', text: 'Chalo ek example se samjhte hain...' },
];

const MANIM_CODE = `from manim import *

class PythagorasScene(Scene):
    def construct(self):
        # Create right triangle
        triangle = Polygon(
            ORIGIN, 3 * RIGHT, 3 * RIGHT + 4 * UP,
            color=WHITE, stroke_width=2
        )
        self.play(Create(triangle))

        # Label sides
        a_label = MathTex("a").next_to(triangle, DOWN)
        b_label = MathTex("b").next_to(triangle, RIGHT)
        c_label = MathTex("c").move_to(
            triangle.get_center() + 0.5 * UL
        )
        self.play(Write(a_label), Write(b_label), Write(c_label))

        # Show theorem
        theorem = MathTex("a^2 + b^2 = c^2")
        theorem.to_edge(UP).set_color(YELLOW)
        self.play(Write(theorem))
        self.wait(2)`;

const SAMPLE_VIDEOS = [
  { topic: 'Pythagoras Theorem', lang: 'Hindi', duration: '3:42' },
  { topic: 'Newton Laws', lang: 'English', duration: '4:15' },
  { topic: 'Integration', lang: 'Tamil', duration: '5:01' },
];

/* ------------------------------------------------------------------ */
/*  INNER COMPONENT — needs Suspense boundary for useSearchParams      */
/* ------------------------------------------------------------------ */

function GeneratePageInner() {
  /* ----- state ----- */
  const searchParams = useSearchParams();

  const [topic, setTopic] = useState('');
  const [language, setLanguage] = useState('Hindi');
  const [grade, setGrade] = useState('9-10');
  const [voiceType, setVoiceType] = useState<'male' | 'female'>('female');
  const [videoStyle, setVideoStyle] = useState<'math' | 'concept'>('math');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [activeTab, setActiveTab] = useState<'script' | 'code' | 'details'>('script');
  const [isPlaying, setIsPlaying] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  /* ----- auto-fill from URL params ----- */
  useEffect(() => {
    const urlTopic = searchParams.get('topic');
    if (urlTopic) setTopic(urlTopic);
  }, [searchParams]);

  /* ----- generation simulation ----- */
  const handleGenerate = useCallback(() => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setCurrentStep(0);
  }, [topic]);

  useEffect(() => {
    if (!isGenerating || currentStep >= 6) return;

    const delay = currentStep === 5 ? 1500 : 2000 + Math.random() * 1500;
    const timer = setTimeout(() => setCurrentStep((s) => s + 1), delay);
    return () => clearTimeout(timer);
  }, [isGenerating, currentStep]);

  /* ----- copy helpers ----- */
  const copyToClipboard = async (text: string, type: 'script' | 'code') => {
    await navigator.clipboard.writeText(text);
    if (type === 'script') {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleRegenerate = () => {
    setIsGenerating(false);
    setCurrentStep(0);
    setTimeout(() => {
      setIsGenerating(true);
      setCurrentStep(0);
    }, 300);
  };

  const generationDone = currentStep === 6;

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */

  return (
    <section className="min-h-screen bg-off-white dark:bg-dark-bg transition-colors duration-300">
      {/* ---- subtle bg pattern ---- */}
      <div className="absolute inset-0 rangoli-bg pointer-events-none" />

      <div className="container-main relative py-8 lg:py-12">
        {/* ===== 2-COLUMN LAYOUT ===== */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          {/* ===== LEFT PANEL ===== */}
          <div className="w-full lg:w-2/5 space-y-6">
            {/* --- Header --- */}
            <div>
              <h1 className="text-2xl font-heading font-bold text-navy dark:text-dark-text">
                Apna topic likho
              </h1>
              <p className="text-muted text-sm mt-1">
                Koi bhi subject, koi bhi class
              </p>
            </div>

            {/* --- Topic textarea --- */}
            <div>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Pythagoras Theorem kya hota hai aur iska proof kaise karte hain..."
                className="w-full h-32 rounded-xl border-2 border-card-border dark:border-dark-border 
                           bg-white dark:bg-dark-surface text-navy dark:text-dark-text 
                           focus:border-saffron focus:ring-2 focus:ring-saffron/20 
                           resize-none p-4 text-sm font-body placeholder:text-muted/60 
                           outline-none transition-all duration-300"
              />
            </div>

            {/* --- Language selector --- */}
            <div>
              <label className="block text-sm font-heading font-semibold text-navy dark:text-dark-text mb-2">
                Bhasha chunein
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setLangOpen(!langOpen)}
                  className="w-full flex items-center justify-between rounded-xl border-2 border-card-border dark:border-dark-border 
                             bg-white dark:bg-dark-surface px-4 py-3 text-sm font-body text-navy dark:text-dark-text
                             hover:border-saffron/50 transition-all duration-200"
                >
                  <span>
                    {LANGUAGES.find((l) => l.name === language)?.flag}{' '}
                    {language}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-muted transition-transform duration-200 ${
                      langOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {langOpen && (
                  <div className="absolute z-30 mt-1 w-full rounded-xl border border-card-border dark:border-dark-border 
                                  bg-white dark:bg-dark-surface shadow-card-hover dark:shadow-card-dark-hover 
                                  max-h-60 overflow-y-auto animate-fade-in">
                    {LANGUAGES.map((l) => (
                      <button
                        key={l.name}
                        type="button"
                        onClick={() => {
                          setLanguage(l.name);
                          setLangOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 
                                    hover:bg-saffron/5 dark:hover:bg-saffron/10 transition-colors
                                    ${
                                      language === l.name
                                        ? 'text-saffron font-semibold bg-saffron/5 dark:bg-saffron/10'
                                        : 'text-navy dark:text-dark-text'
                                    }`}
                      >
                        <span className="text-lg">{l.flag}</span>
                        {l.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* --- Grade Level --- */}
            <div>
              <label className="block text-sm font-heading font-semibold text-navy dark:text-dark-text mb-2">
                Class / Level
              </label>
              <div className="flex flex-wrap gap-2">
                {GRADE_LEVELS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGrade(g)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                      ${
                        grade === g
                          ? 'bg-saffron text-white shadow-saffron scale-[1.03]'
                          : 'bg-white dark:bg-dark-surface border border-card-border dark:border-dark-border text-navy dark:text-dark-text hover:border-saffron/40'
                      }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* --- Voice type --- */}
            <div>
              <label className="block text-sm font-heading font-semibold text-navy dark:text-dark-text mb-2">
                Teacher ki awaaz
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    { key: 'male', emoji: '👨‍🏫', label: 'Male teacher' },
                    { key: 'female', emoji: '👩‍🏫', label: 'Female teacher' },
                  ] as const
                ).map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => setVoiceType(v.key)}
                    className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3.5 text-sm font-medium transition-all duration-200
                      ${
                        voiceType === v.key
                          ? 'border-saffron bg-saffron/5 dark:bg-saffron/10 text-saffron shadow-sm'
                          : 'border-card-border dark:border-dark-border bg-white dark:bg-dark-surface text-navy dark:text-dark-text hover:border-saffron/40'
                      }`}
                  >
                    <span className="text-xl">{v.emoji}</span>
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* --- Video / Animation style --- */}
            <div>
              <label className="block text-sm font-heading font-semibold text-navy dark:text-dark-text mb-2">
                Animation style
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    { key: 'math', emoji: '📐', label: 'Math / Diagrams style' },
                    { key: 'concept', emoji: '📝', label: 'Concept explanation style' },
                  ] as const
                ).map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setVideoStyle(s.key)}
                    className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3.5 text-sm font-medium transition-all duration-200
                      ${
                        videoStyle === s.key
                          ? 'border-indigo-brand bg-indigo-brand/5 dark:bg-indigo-brand/10 text-indigo-brand shadow-sm'
                          : 'border-card-border dark:border-dark-border bg-white dark:bg-dark-surface text-navy dark:text-dark-text hover:border-indigo-brand/40'
                      }`}
                  >
                    <span className="text-xl">{s.emoji}</span>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* --- Generate / Progress --- */}
            {!isGenerating ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!topic.trim()}
                  className="w-full h-[52px] btn-saffron disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none text-base"
                >
                  <Sparkles className="w-5 h-5" />
                  Video Generate Karo
                </button>
                <p className="text-sm text-muted text-center flex items-center justify-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Usually 2-3 minutes lagti hai
                </p>
              </div>
            ) : (
              /* ===== PROGRESS STEPPER ===== */
              <div className="space-y-1 animate-fade-in">
                {STEPS.map((step, idx) => {
                  const StepIcon = step.icon;
                  const isDone = idx < currentStep;
                  const isActive = idx === currentStep && currentStep < 6;
                  const isPending = idx > currentStep;

                  return (
                    <div key={idx} className="flex items-start gap-3">
                      {/* vertical line + icon */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-500
                            ${
                              isDone
                                ? 'bg-success/10 dark:bg-success/20 text-success'
                                : isActive
                                ? 'bg-saffron/10 dark:bg-saffron/20 border-2 border-saffron text-saffron'
                                : 'bg-gray-100 dark:bg-dark-border text-muted'
                            }`}
                        >
                          {isDone ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : isActive ? (
                            <Loader2 className="w-4 h-4 animate-spin-slow" />
                          ) : (
                            <StepIcon className="w-4 h-4" />
                          )}
                        </div>
                        {idx < STEPS.length - 1 && (
                          <div
                            className={`w-px h-6 border-l-2 border-dotted transition-colors duration-300
                              ${isDone ? 'border-success' : 'border-card-border dark:border-dark-border'}`}
                          />
                        )}
                      </div>

                      {/* text */}
                      <p
                        className={`text-sm pt-2 transition-all duration-300
                          ${
                            isDone
                              ? 'text-success line-through'
                              : isActive
                              ? 'text-saffron font-semibold'
                              : 'text-muted'
                          }`}
                      >
                        {step.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* --- Popular topics --- */}
            <div>
              <p className="text-sm font-heading font-semibold text-navy dark:text-dark-text mb-2">
                Popular topics:
              </p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_TOPICS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTopic(t)}
                    className="pill-saffron hover:bg-saffron/20 dark:hover:bg-saffron/30 cursor-pointer transition-colors duration-200"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ===== RIGHT PANEL ===== */}
          <div className="w-full lg:w-3/5">
            {!generationDone ? (
              /* ----- Empty / preview state ----- */
              <div className="flex flex-col items-center justify-center h-full min-h-[500px] animate-fade-in">
                {/* geometric illustration area */}
                <div className="w-full max-w-md rounded-2xl bg-gray-50 dark:bg-dark-surface border border-card-border dark:border-dark-border p-10 mb-6 flex items-center justify-center relative overflow-hidden">
                  {/* decorative geometric shapes */}
                  <div className="absolute inset-0 opacity-[0.06] dark:opacity-[0.08]">
                    <svg className="w-full h-full" viewBox="0 0 400 300" fill="none">
                      <circle cx="200" cy="150" r="100" stroke="#3D3BDB" strokeWidth="1.5" strokeDasharray="8 4" />
                      <polygon points="200,50 280,200 120,200" stroke="#FF6B2C" strokeWidth="1.5" fill="none" />
                      <rect x="130" y="100" width="140" height="100" rx="4" stroke="#0F9E75" strokeWidth="1.5" strokeDasharray="6 3" fill="none" />
                      <circle cx="200" cy="150" r="30" stroke="#FF6B2C" strokeWidth="1" fill="none" />
                      <line x1="60" y1="80" x2="340" y2="220" stroke="#3D3BDB" strokeWidth="0.5" strokeDasharray="4 4" />
                      <line x1="340" y1="80" x2="60" y2="220" stroke="#3D3BDB" strokeWidth="0.5" strokeDasharray="4 4" />
                    </svg>
                  </div>
                  <div className="relative z-10 text-center">
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-saffron/20 to-indigo-brand/20 dark:from-saffron/10 dark:to-indigo-brand/10 flex items-center justify-center mb-4">
                      <Film className="w-9 h-9 text-saffron" />
                    </div>
                    <p className="text-lg text-muted font-heading">
                      Topic likhkar video generate karo
                    </p>
                  </div>
                </div>

                {/* sample preview cards */}
                <div className="w-full max-w-md space-y-3">
                  <p className="text-xs font-heading font-semibold text-muted uppercase tracking-wider">
                    Recent examples
                  </p>
                  {SAMPLE_VIDEOS.map((v, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setTopic(v.topic)}
                      className="w-full flex items-center gap-4 p-3 rounded-xl bg-white dark:bg-dark-surface 
                                 border border-card-border dark:border-dark-border 
                                 hover:border-saffron/40 hover:shadow-card transition-all duration-200 text-left"
                    >
                      <div className="w-14 h-10 rounded-lg bg-navy dark:bg-dark-border flex items-center justify-center shrink-0">
                        <Triangle className="w-4 h-4 text-white fill-white rotate-90" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-navy dark:text-dark-text truncate">
                          {v.topic}
                        </p>
                        <p className="text-xs text-muted">
                          {v.lang} • {v.duration}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* ===== COMPLETED STATE — VIDEO PLAYER + TABS ===== */
              <div className="space-y-6 animate-fade-in">
                {/* --- Video Player --- */}
                <div className="rounded-2xl overflow-hidden bg-navy dark:bg-dark-surface shadow-lg">
                  {/* 16:9 wrapper */}
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <div className="absolute inset-0 bg-[#1A1A2E] flex items-center justify-center">
                      {/* subtle grid overlay */}
                      <div className="absolute inset-0 opacity-5">
                        <div
                          className="w-full h-full"
                          style={{
                            backgroundImage:
                              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                            backgroundSize: '40px 40px',
                          }}
                        />
                      </div>

                      {/* center play button */}
                      <button
                        type="button"
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="relative z-10 w-20 h-20 rounded-full bg-saffron/90 hover:bg-saffron flex items-center justify-center 
                                   shadow-saffron hover:scale-110 transition-all duration-300 group"
                      >
                        {isPlaying ? (
                          <Pause className="w-8 h-8 text-white" />
                        ) : (
                          <Play className="w-8 h-8 text-white ml-1" />
                        )}
                        {/* pulse ring */}
                        <span className="absolute inset-0 rounded-full border-2 border-saffron/40 animate-ping" />
                      </button>

                      {/* topic overlay */}
                      <div className="absolute top-4 left-4 z-10">
                        <span className="pill-saffron text-xs backdrop-blur-sm">
                          {topic || 'Pythagoras Theorem'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Timeline bar */}
                  <div className="relative h-1 bg-white/10">
                    <div className="absolute left-0 top-0 h-full w-[30%] bg-saffron rounded-r-full" />
                    <div className="absolute left-[30%] top-1/2 -translate-y-1/2 w-3 h-3 bg-saffron rounded-full shadow-saffron -ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-[#141428]">
                    <button
                      type="button"
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="text-white/80 hover:text-white transition-colors"
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>
                    <span className="text-xs text-white/60 font-mono tabular-nums">
                      1:23 / 4:32
                    </span>
                    <div className="flex-1" />
                    <button type="button" className="text-white/60 hover:text-white transition-colors">
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-white/60 font-mono px-1.5 py-0.5 rounded bg-white/5">
                      1x
                    </span>
                    <button type="button" className="text-white/60 hover:text-white transition-colors">
                      <Subtitles className="w-4 h-4" />
                    </button>
                    <button type="button" className="text-white/60 hover:text-white transition-colors">
                      <Maximize className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* --- Tabs --- */}
                <div>
                  {/* Tab headers */}
                  <div className="flex border-b border-card-border dark:border-dark-border">
                    {(
                      [
                        { key: 'script', label: 'Script 📝' },
                        { key: 'code', label: 'Manim Code 💻' },
                        { key: 'details', label: 'Details ℹ️' },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-5 py-3 text-sm font-heading font-medium transition-all duration-200 relative
                          ${
                            activeTab === tab.key
                              ? 'text-saffron'
                              : 'text-muted hover:text-navy dark:hover:text-dark-text'
                          }`}
                      >
                        {tab.label}
                        {activeTab === tab.key && (
                          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-saffron rounded-t-full" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Tab content */}
                  <div className="mt-4">
                    {/* SCRIPT TAB */}
                    {activeTab === 'script' && (
                      <div className="card relative animate-fade-in">
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(
                              SCRIPT_LINES.map((l) => `[${l.time}] ${l.text}`).join('\n'),
                              'script'
                            )
                          }
                          className="absolute top-4 right-4 flex items-center gap-1.5 text-xs text-muted hover:text-saffron transition-colors bg-gray-50 dark:bg-dark-border px-2.5 py-1.5 rounded-lg"
                        >
                          {copiedScript ? (
                            <>
                              <Check className="w-3 h-3 text-success" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              Copy
                            </>
                          )}
                        </button>
                        <div className="space-y-3 pr-16">
                          {SCRIPT_LINES.map((line, idx) => (
                            <div key={idx} className="flex gap-3">
                              <span className="text-xs text-saffron font-mono font-semibold shrink-0 pt-0.5 w-10">
                                [{line.time}]
                              </span>
                              <p className="text-sm text-navy dark:text-dark-text font-hindi leading-relaxed">
                                {line.text}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* CODE TAB */}
                    {activeTab === 'code' && (
                      <div className="relative rounded-xl overflow-hidden animate-fade-in">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(MANIM_CODE, 'code')}
                          className="absolute top-3 right-3 z-10 flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors bg-white/10 px-2.5 py-1.5 rounded-lg"
                        >
                          {copiedCode ? (
                            <>
                              <Check className="w-3 h-3 text-success" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              Copy
                            </>
                          )}
                        </button>
                        <pre className="bg-[#1E1E2E] rounded-xl p-5 overflow-x-auto">
                          <code className="text-sm font-mono leading-relaxed text-[#CDD6F4] whitespace-pre">
                            {MANIM_CODE.split('\n').map((line, i) => (
                              <span key={i} className="block">
                                <span className="inline-block w-8 text-right mr-4 text-white/20 select-none text-xs">
                                  {i + 1}
                                </span>
                                <span>
                                  {highlightPython(line)}
                                </span>
                              </span>
                            ))}
                          </code>
                        </pre>
                      </div>
                    )}

                    {/* DETAILS TAB */}
                    {activeTab === 'details' && (
                      <div className="card animate-fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {[
                            { label: 'Topic', value: topic || 'Pythagoras Theorem' },
                            { label: 'Language', value: language },
                            {
                              label: 'Voice',
                              value: `AI4Bharat IndicF5 (${voiceType === 'female' ? 'Female' : 'Male'})`,
                            },
                            { label: 'Grade', value: `Class ${grade}` },
                            { label: 'Duration', value: '4:32' },
                            { label: 'Generated', value: 'just now' },
                            {
                              label: 'Model',
                              value: 'Claude Sonnet + Manim + IndicF5',
                            },
                          ].map((item, idx) => (
                            <div
                              key={idx}
                              className="flex flex-col gap-0.5 p-3 rounded-lg bg-gray-50 dark:bg-dark-border/50"
                            >
                              <span className="text-xs text-muted font-heading uppercase tracking-wider">
                                {item.label}
                              </span>
                              <span className="text-sm font-semibold text-navy dark:text-dark-text">
                                {item.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* --- Action buttons --- */}
                <div className="flex flex-wrap gap-3">
                  <button type="button" className="btn-outline text-sm">
                    <Download className="w-4 h-4" />
                    Download MP4
                  </button>
                  <button
                    type="button"
                    className="btn-outline text-sm"
                    onClick={() =>
                      copyToClipboard(
                        SCRIPT_LINES.map((l) => `[${l.time}] ${l.text}`).join('\n'),
                        'script'
                      )
                    }
                  >
                    <ClipboardCopy className="w-4 h-4" />
                    Copy Script
                  </button>
                  <button type="button" className="btn-outline text-sm">
                    <Link2 className="w-4 h-4" />
                    Share Link
                  </button>
                  <button
                    type="button"
                    className="btn-outline text-sm"
                    onClick={handleRegenerate}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Regenerate
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Python syntax highlighting (lightweight)                           */
/* ------------------------------------------------------------------ */

function highlightPython(line: string): JSX.Element {
  const keywords = /\b(from|import|class|def|self|return|if|else|for|in|with|as|and|or|not|True|False|None)\b/g;
  const strings = /(["'])(?:(?=(\\?))\2.)*?\1/g;
  const comments = /#.*/g;

  // Very basic approach: split the line into colored segments
  const segments: { text: string; color: string }[] = [];
  let remaining = line;

  // Find comment first (takes the rest of the line)
  const commentMatch = remaining.match(comments);
  let commentPart = '';
  if (commentMatch && commentMatch[0]) {
    const ci = remaining.indexOf(commentMatch[0]);
    commentPart = remaining.slice(ci);
    remaining = remaining.slice(0, ci);
  }

  // Simple token-by-token coloring
  const tokens = remaining.split(/(\s+|[()\[\]{},.:*=+])/);
  tokens.forEach((token) => {
    if (keywords.test(token)) {
      keywords.lastIndex = 0;
      segments.push({ text: token, color: '#CBA6F7' }); // purple for keywords
    } else if (/^["']/.test(token)) {
      segments.push({ text: token, color: '#A6E3A1' }); // green for strings
    } else if (/^\d+$/.test(token)) {
      segments.push({ text: token, color: '#FAB387' }); // peach for numbers
    } else {
      segments.push({ text: token, color: '' });
    }
  });

  if (commentPart) {
    segments.push({ text: commentPart, color: '#6C7086' }); // dim for comments
  }

  return (
    <>
      {segments.map((s, i) =>
        s.color ? (
          <span key={i} style={{ color: s.color }}>
            {s.text}
          </span>
        ) : (
          <span key={i}>{s.text}</span>
        )
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  PAGE EXPORT with Suspense for useSearchParams                      */
/* ------------------------------------------------------------------ */

export default function GeneratePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-off-white dark:bg-dark-bg">
          <Loader2 className="w-8 h-8 text-saffron animate-spin" />
        </div>
      }
    >
      <GeneratePageInner />
    </Suspense>
  );
}
