'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Brain, Code, Film, Mic, GitMerge, CheckCircle, Loader2,
  Download, ClipboardCopy, RefreshCw, Sparkles, Clock, Triangle,
  ChevronDown, Copy, Check, AlertCircle, Wand2, Languages,
  GraduationCap, ArrowRight, Mic2,
} from 'lucide-react';
import GeneratedVideoPlayer from '@/components/generated-video-player';

interface Language { name: string; flag: string; }
interface ScriptLine { time: string; text: string; }
interface SceneStep {
  at: number; type: string; text?: string;
  cx?: number; cy?: number; r?: number;
  x?: number; y?: number; w?: number; h?: number;
  points?: [number, number][]; from?: [number, number]; to?: [number, number];
  d?: string; color?: string; fill?: boolean; label?: string; size?: 'sm' | 'md' | 'lg' | 'xl';
}
interface SceneData { title: string; subtitle?: string; duration: number; steps: SceneStep[] }
interface GenerationResult { script: ScriptLine[]; manim_code: string; scene?: SceneData | null; videoId?: string; fallback?: boolean }

const LANGUAGES: Language[] = [
  { name: 'Hindi',     flag: '🇮🇳' }, { name: 'English',   flag: '🇬🇧' },
  { name: 'Tamil',     flag: '🇮🇳' }, { name: 'Telugu',    flag: '🇮🇳' },
  { name: 'Marathi',   flag: '🇮🇳' }, { name: 'Bengali',   flag: '🇮🇳' },
  { name: 'Kannada',   flag: '🇮🇳' }, { name: 'Malayalam', flag: '🇮🇳' },
  { name: 'Gujarati',  flag: '🇮🇳' }, { name: 'Punjabi',   flag: '🇮🇳' },
];

const GRADE_LEVELS = ['6-8', '9-10', '11-12', 'College', 'Competitive Exam'];

const POPULAR_TOPICS = [
  { name: 'Pythagoras Theorem', emoji: '📐' },
  { name: 'Integration',        emoji: '∫' },
  { name: "Newton's Laws",      emoji: '🍎' },
  { name: 'DNA Structure',      emoji: '🧬' },
  { name: 'Photosynthesis',     emoji: '🌱' },
  { name: 'Quadratic Equations',emoji: '𝑥²' },
];

const STEPS = [
  { icon: Brain,       text: 'Understanding your topic',          sub: 'AI is analysing the concept'   },
  { icon: Wand2,       text: 'Crafting the lesson plan',          sub: 'Building step-by-step structure' },
  { icon: Film,        text: 'Generating animations',             sub: 'Creating beautiful visuals'    },
  { icon: Mic,         text: 'Adding voice narration',            sub: 'Native-language voice'         },
  { icon: GitMerge,    text: 'Polishing the final video',         sub: 'Almost there...'               },
  { icon: CheckCircle, text: 'Your video is ready!',              sub: '🎉 Watch now'                  },
];

const SAMPLE_VIDEOS = [
  { topic: 'Pythagoras Theorem',     lang: 'Hindi',    duration: '3:42', color: 'bg-gradient-saffron' },
  { topic: "Newton's Laws of Motion", lang: 'English', duration: '4:15', color: 'bg-gradient-teal' },
  { topic: 'Integration Basics',      lang: 'Tamil',   duration: '5:01', color: 'bg-gradient-indigo' },
];

/* ── Python syntax highlight ── */
function highlightPython(line: string): React.ReactElement {
  const keywords = /\b(from|import|class|def|self|return|if|else|for|in|with|as|and|or|not|True|False|None|lambda)\b/g;
  const segments: { text: string; color: string }[] = [];
  let remaining = line;
  const commentMatch = remaining.match(/#.*/);
  let commentPart = '';
  if (commentMatch?.[0]) {
    const ci = remaining.indexOf(commentMatch[0]);
    commentPart = remaining.slice(ci);
    remaining = remaining.slice(0, ci);
  }
  remaining.split(/(\s+|[()\[\]{},.:*=+])/).forEach(tok => {
    if (keywords.test(tok)) { keywords.lastIndex = 0; segments.push({ text: tok, color: '#CBA6F7' }); }
    else if (/^["']/.test(tok)) segments.push({ text: tok, color: '#A6E3A1' });
    else if (/^\d+(\.\d+)?$/.test(tok)) segments.push({ text: tok, color: '#FAB387' });
    else segments.push({ text: tok, color: '' });
  });
  if (commentPart) segments.push({ text: commentPart, color: '#6C7086' });
  return (
    <>
      {segments.map((s, i) => s.color
        ? <span key={i} style={{ color: s.color }}>{s.text}</span>
        : <span key={i}>{s.text}</span>
      )}
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────── */

function GeneratePageInner() {
  const searchParams = useSearchParams();

  const [topic, setTopic]           = useState('');
  const [language, setLanguage]     = useState('Hindi');
  const [grade, setGrade]           = useState('9-10');
  const [voiceType, setVoiceType]   = useState<'male' | 'female'>('female');
  const [videoStyle, setVideoStyle] = useState<'math' | 'concept'>('math');
  const [langOpen, setLangOpen]     = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep]   = useState(0);
  const [result, setResult]             = useState<GenerationResult | null>(null);
  const [genError, setGenError]         = useState<string | null>(null);

  const [activeTab, setActiveTab]   = useState<'script' | 'code' | 'details'>('script');
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedCode, setCopiedCode]     = useState(false);

  useEffect(() => {
    const t = searchParams.get('topic');
    if (t) setTopic(t);
  }, [searchParams]);

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setCurrentStep(0);
    setResult(null);
    setGenError(null);

    const simulateSteps = async () => {
      const delays = [2500, 2800, 3000, 2500, 2000];
      for (let i = 0; i < delays.length; i++) {
        await new Promise<void>(r => setTimeout(r, delays[i]));
        setCurrentStep(i + 1);
      }
    };

    const callApi = async () => {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, language, grade, voiceType, videoStyle }),
      });
      return res.json() as Promise<GenerationResult & { error?: string }>;
    };

    const [, apiResult] = await Promise.all([simulateSteps(), callApi()]);

    if (apiResult.error) {
      setGenError(apiResult.error);
      setIsGenerating(false);
      setCurrentStep(0);
      return;
    }

    fetch('/api/videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic, language, grade, voiceType, videoStyle,
        script: apiResult.script,
        manimCode: apiResult.manim_code,
        duration: apiResult.script.length * 30,
      }),
    })
      .then(r => r.json())
      .then(d => setResult(prev => prev ? { ...prev, videoId: d.id } : prev))
      .catch(() => {});

    setResult(apiResult);
    setCurrentStep(6);
  }, [topic, language, grade, voiceType, videoStyle]);

  const handleRegenerate = () => {
    setIsGenerating(false);
    setCurrentStep(0);
    setResult(null);
    setTimeout(handleGenerate, 200);
  };

  const copyToClipboard = async (text: string, type: 'script' | 'code') => {
    await navigator.clipboard.writeText(text);
    if (type === 'script') { setCopiedScript(true); setTimeout(() => setCopiedScript(false), 2000); }
    else { setCopiedCode(true); setTimeout(() => setCopiedCode(false), 2000); }
  };

  const generationDone = currentStep === 6 && !!result;
  const scriptText = result?.script.map(l => `[${l.time}] ${l.text}`).join('\n') ?? '';

  return (
    <main className="min-h-screen bg-off-white dark:bg-dark-bg">
      <div className="container-main pt-24 pb-16">

        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-saffron/10 border border-saffron/20 text-saffron text-xs font-medium mb-3">
              <Sparkles className="w-3 h-3" /> AI Video Generator
            </div>
            <h1 className="text-3xl lg:text-4xl font-heading font-bold text-navy dark:text-dark-text leading-tight">
              Generate your animated lesson
            </h1>
            <p className="text-muted mt-2 text-sm">Type any topic, pick a language, and watch AI build your video.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ════════════════ LEFT — 2/5 ════════════════ */}
          <div className="lg:col-span-2 space-y-5">

            {/* Topic card */}
            <div className="card">
              <label className="flex items-center gap-2 text-sm font-heading font-semibold text-navy dark:text-dark-text mb-3">
                <span className="w-6 h-6 rounded-md bg-saffron/10 flex items-center justify-center text-saffron text-xs font-bold">1</span>
                What do you want to learn?
              </label>
              <textarea
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Explain the Pythagoras Theorem with a clear visual proof..."
                className="w-full h-28 rounded-xl border-2 border-card-border dark:border-dark-border bg-off-white dark:bg-dark-bg text-navy dark:text-dark-text focus:border-saffron focus:ring-2 focus:ring-saffron/15 resize-none p-4 text-sm font-body placeholder:text-muted/60 outline-none transition-all"
              />
              {/* Popular topic chips */}
              <div className="mt-3 flex flex-wrap gap-2">
                {POPULAR_TOPICS.map(t => (
                  <button
                    key={t.name}
                    onClick={() => setTopic(t.name)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-card-border dark:border-dark-border bg-white dark:bg-dark-surface hover:border-saffron hover:bg-saffron/5 text-xs text-navy dark:text-dark-text transition-all"
                  >
                    <span className="text-sm">{t.emoji}</span>
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Settings card */}
            <div className="card">
              <label className="flex items-center gap-2 text-sm font-heading font-semibold text-navy dark:text-dark-text mb-4">
                <span className="w-6 h-6 rounded-md bg-indigo-brand/10 flex items-center justify-center text-indigo-brand text-xs font-bold">2</span>
                Personalise the lesson
              </label>

              <div className="space-y-5">
                {/* Language */}
                <div>
                  <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Languages className="w-3 h-3" /> Language
                  </p>
                  <div className="relative">
                    <button type="button" onClick={() => setLangOpen(!langOpen)}
                      className="w-full flex items-center justify-between rounded-xl border-2 border-card-border dark:border-dark-border bg-off-white dark:bg-dark-bg px-4 py-2.5 text-sm text-navy dark:text-dark-text hover:border-saffron/50 transition-all">
                      <span className="flex items-center gap-2">
                        <span className="text-lg">{LANGUAGES.find(l => l.name === language)?.flag}</span>
                        {language}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-muted transition-transform ${langOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {langOpen && (
                      <div className="absolute z-30 mt-1 w-full rounded-xl border border-card-border dark:border-dark-border bg-white dark:bg-dark-surface shadow-card-hover max-h-60 overflow-y-auto animate-fade-in">
                        {LANGUAGES.map(l => (
                          <button key={l.name} type="button" onClick={() => { setLanguage(l.name); setLangOpen(false); }}
                            className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-saffron/5 transition-colors ${language === l.name ? 'text-saffron font-semibold bg-saffron/5' : 'text-navy dark:text-dark-text'}`}>
                            <span className="text-lg">{l.flag}</span>{l.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Grade */}
                <div>
                  <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <GraduationCap className="w-3 h-3" /> Grade level
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {GRADE_LEVELS.map(g => (
                      <button key={g} type="button" onClick={() => setGrade(g)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${grade === g ? 'bg-saffron text-white shadow-saffron' : 'bg-off-white dark:bg-dark-bg border border-card-border dark:border-dark-border text-navy dark:text-dark-text hover:border-saffron/40'}`}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Voice + Style two-column */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Mic2 className="w-3 h-3" /> Voice
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {([{ key: 'female', emoji: '👩‍🏫' }, { key: 'male', emoji: '👨‍🏫' }] as const).map(v => (
                        <button key={v.key} type="button" onClick={() => setVoiceType(v.key)}
                          className={`flex items-center justify-center gap-1.5 rounded-lg border-2 py-2 text-xs font-medium transition-all ${voiceType === v.key ? 'border-saffron bg-saffron/5 text-saffron' : 'border-card-border dark:border-dark-border bg-off-white dark:bg-dark-bg text-navy dark:text-dark-text'}`}>
                          <span className="text-base">{v.emoji}</span>
                          {v.key === 'female' ? 'Female' : 'Male'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Film className="w-3 h-3" /> Style
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {([{ key: 'math', emoji: '📐' }, { key: 'concept', emoji: '📝' }] as const).map(s => (
                        <button key={s.key} type="button" onClick={() => setVideoStyle(s.key)}
                          className={`flex items-center justify-center gap-1.5 rounded-lg border-2 py-2 text-xs font-medium transition-all ${videoStyle === s.key ? 'border-indigo-brand bg-indigo-brand/5 text-indigo-brand' : 'border-card-border dark:border-dark-border bg-off-white dark:bg-dark-bg text-navy dark:text-dark-text'}`}>
                          <span className="text-base">{s.emoji}</span>
                          {s.key === 'math' ? 'Math' : 'Concept'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Generate Button (sticky on mobile, in flow on desktop) */}
            {!isGenerating ? (
              <div className="space-y-3">
                {genError && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold">Generation failed</p>
                      <p className="text-xs opacity-80 mt-0.5">{genError}</p>
                    </div>
                  </div>
                )}
                <button type="button" onClick={handleGenerate} disabled={!topic.trim()}
                  className="group relative w-full h-14 btn-saffron disabled:opacity-50 disabled:cursor-not-allowed text-base overflow-hidden">
                  <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  Generate Video
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <p className="text-xs text-muted text-center flex items-center justify-center gap-1.5">
                  <Clock className="w-3 h-3" /> Usually 30–60 seconds · Free
                </p>
              </div>
            ) : (
              <div className="card bg-gradient-to-br from-saffron/5 to-indigo-brand/5 dark:from-saffron/10 dark:to-indigo-brand/10 border-saffron/20">
                <div className="flex items-center gap-2 mb-4">
                  <Loader2 className="w-4 h-4 text-saffron animate-spin" />
                  <p className="text-xs font-semibold text-saffron uppercase tracking-wider">Generating</p>
                </div>
                <div className="space-y-2.5">
                  {STEPS.map((step, idx) => {
                    const StepIcon = step.icon;
                    const isDone   = idx < currentStep;
                    const isActive = idx === currentStep && currentStep < 6;
                    return (
                      <div key={idx} className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${isDone ? 'bg-success text-white' : isActive ? 'bg-saffron text-white shadow-saffron/30 shadow-md' : 'bg-gray-100 dark:bg-dark-border text-muted'}`}>
                          {isDone ? <Check className="w-3.5 h-3.5" /> : isActive ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <StepIcon className="w-3.5 h-3.5" />}
                        </div>
                        <div className="flex-1 pt-0.5">
                          <p className={`text-sm font-medium transition-colors ${isDone ? 'text-success' : isActive ? 'text-navy dark:text-dark-text' : 'text-muted'}`}>{step.text}</p>
                          {(isActive || isDone) && <p className="text-[11px] text-muted mt-0.5">{step.sub}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ════════════════ RIGHT — 3/5 ════════════════ */}
          <div className="lg:col-span-3">
            {!generationDone ? (
              <div className="card h-full min-h-[600px] flex flex-col items-center justify-center text-center p-10">

                {/* Decorative geometric bg */}
                <div className="relative w-full max-w-md mb-8">
                  <div className="absolute inset-0 flex items-center justify-center opacity-10 dark:opacity-20">
                    <svg className="w-full h-full max-h-64" viewBox="0 0 400 300" fill="none">
                      <circle cx="200" cy="150" r="100" stroke="#3D3BDB" strokeWidth="1.5" strokeDasharray="8 4" className="animate-spin-slow" style={{ transformOrigin: '200px 150px' }}/>
                      <polygon points="200,50 280,200 120,200" stroke="#FF6B2C" strokeWidth="1.5" fill="none" />
                      <rect x="130" y="100" width="140" height="100" rx="4" stroke="#0F9E75" strokeWidth="1.5" strokeDasharray="6 3" fill="none" />
                    </svg>
                  </div>
                  <div className="relative flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-saffron to-indigo-brand p-[2px] shadow-2xl">
                      <div className="w-full h-full rounded-full bg-white dark:bg-dark-surface flex items-center justify-center">
                        {isGenerating
                          ? <Loader2 className="w-10 h-10 text-saffron animate-spin" />
                          : <Film className="w-10 h-10 text-saffron" />
                        }
                      </div>
                    </div>
                  </div>
                </div>

                <h2 className="text-2xl font-heading font-bold text-navy dark:text-dark-text mb-2">
                  {isGenerating ? 'Building your video...' : 'Your video will appear here'}
                </h2>
                <p className="text-sm text-muted max-w-md mb-8">
                  {isGenerating
                    ? 'AI is generating a beautiful animated explanation just for you. Hang tight!'
                    : 'Enter a topic on the left and click Generate. We\'ll build a complete animated lesson — usually in under a minute.'}
                </p>

                {!isGenerating && (
                  <div className="w-full max-w-md">
                    <p className="text-[10px] font-semibold text-muted uppercase tracking-widest mb-3">Quick start examples</p>
                    <div className="space-y-2">
                      {SAMPLE_VIDEOS.map((v, i) => (
                        <button key={i} type="button" onClick={() => setTopic(v.topic)}
                          className="group w-full flex items-center gap-3 p-3 rounded-xl bg-off-white dark:bg-dark-bg border border-card-border dark:border-dark-border hover:border-saffron/40 hover:shadow-card transition-all text-left">
                          <div className={`w-12 h-9 rounded-lg ${v.color} flex items-center justify-center shrink-0`}>
                            <Triangle className="w-3.5 h-3.5 text-white fill-white rotate-90" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-navy dark:text-dark-text truncate group-hover:text-saffron transition-colors">{v.topic}</p>
                            <p className="text-[11px] text-muted">{v.lang} · {v.duration}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted group-hover:text-saffron group-hover:translate-x-0.5 transition-all" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ── RESULT VIEW ── */
              <div className="space-y-5 animate-fade-in">
                {result.fallback && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>AI is temporarily unavailable — showing a template lesson. Try regenerating in a moment.</span>
                  </div>
                )}

                {/* Animated video player with TTS narration */}
                <GeneratedVideoPlayer
                  topic={topic}
                  script={result.script}
                  language={language}
                  scene={result.scene as never}
                  onWatchTracked={() => {
                    if (result.videoId) {
                      fetch(`/api/videos/${result.videoId}/watch`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ duration: 10, completed: false }),
                      }).catch(() => {});
                    }
                  }}
                />

                {/* Tabs */}
                <div className="card !p-0 overflow-hidden">
                  <div className="flex border-b border-card-border dark:border-dark-border">
                    {([{ key: 'script', label: 'Script', emoji: '📝' }, { key: 'code', label: 'Source', emoji: '💻' }, { key: 'details', label: 'Details', emoji: 'ℹ️' }] as const).map(tab => (
                      <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 px-5 py-3.5 text-sm font-heading font-medium relative transition-all ${activeTab === tab.key ? 'text-saffron' : 'text-muted hover:text-navy dark:hover:text-dark-text'}`}>
                        <span>{tab.emoji}</span>
                        {tab.label}
                        {activeTab === tab.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-saffron rounded-t-full" />}
                      </button>
                    ))}
                  </div>

                  <div className="p-5">
                    {activeTab === 'script' && (
                      <div className="relative">
                        <button type="button" onClick={() => copyToClipboard(scriptText, 'script')}
                          className="absolute top-0 right-0 flex items-center gap-1.5 text-xs text-muted hover:text-saffron bg-gray-50 dark:bg-dark-border px-2.5 py-1.5 rounded-lg transition-colors">
                          {copiedScript ? <><Check className="w-3 h-3 text-success" />Copied!</> : <><Copy className="w-3 h-3" />Copy</>}
                        </button>
                        <div className="space-y-3 pr-16 max-h-96 overflow-y-auto">
                          {result.script.map((line, idx) => (
                            <div key={idx} className="flex gap-3">
                              <span className="text-xs text-saffron font-mono font-semibold shrink-0 pt-0.5 w-10">[{line.time}]</span>
                              <p className="text-sm text-navy dark:text-dark-text leading-relaxed">{line.text}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTab === 'code' && (
                      <div className="relative rounded-xl overflow-hidden">
                        <button type="button" onClick={() => copyToClipboard(result.manim_code, 'code')}
                          className="absolute top-3 right-3 z-10 flex items-center gap-1.5 text-xs text-white/50 hover:text-white bg-white/10 px-2.5 py-1.5 rounded-lg transition-colors">
                          {copiedCode ? <><Check className="w-3 h-3 text-success" />Copied!</> : <><Copy className="w-3 h-3" />Copy</>}
                        </button>
                        <pre className="bg-[#1E1E2E] rounded-xl p-5 overflow-auto max-h-[480px]">
                          <code className="text-sm font-mono leading-relaxed text-[#CDD6F4] whitespace-pre">
                            {result.manim_code.split('\n').map((line, i) => (
                              <span key={i} className="block">
                                <span className="inline-block w-8 text-right mr-4 text-white/20 select-none text-xs">{i + 1}</span>
                                <span>{highlightPython(line)}</span>
                              </span>
                            ))}
                          </code>
                        </pre>
                      </div>
                    )}

                    {activeTab === 'details' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { label: 'Topic',         value: topic },
                          { label: 'Language',      value: language },
                          { label: 'Voice',         value: voiceType === 'female' ? 'Female Teacher' : 'Male Teacher' },
                          { label: 'Grade',         value: `Class ${grade}` },
                          { label: 'Script Lines',  value: `${result.script.length} lines` },
                          { label: 'Generated',     value: 'just now' },
                          { label: 'Style',         value: videoStyle === 'math' ? 'Math / Diagrams' : 'Concept' },
                          { label: 'Status',        value: '✓ Ready to play' },
                        ].map((item, idx) => (
                          <div key={idx} className="flex flex-col gap-0.5 p-3 rounded-lg bg-off-white dark:bg-dark-border/50">
                            <span className="text-[10px] text-muted font-heading uppercase tracking-wider">{item.label}</span>
                            <span className="text-sm font-semibold text-navy dark:text-dark-text">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <button type="button" className="btn-outline text-sm" onClick={() => {
                    if (result.videoId) fetch(`/api/videos/${result.videoId}/download`, { method: 'POST' });
                    const blob = new Blob([result.manim_code], { type: 'text/x-python' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = `${topic.replace(/\s+/g, '_')}_scene.py`; a.click();
                    URL.revokeObjectURL(url);
                  }}>
                    <Download className="w-4 h-4" />Download
                  </button>
                  <button type="button" className="btn-outline text-sm" onClick={() => copyToClipboard(scriptText, 'script')}>
                    <ClipboardCopy className="w-4 h-4" />Copy Script
                  </button>
                  <button type="button" className="btn-outline text-sm" onClick={handleRegenerate}>
                    <RefreshCw className="w-4 h-4" />Regenerate
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-off-white dark:bg-dark-bg">
        <Loader2 className="w-8 h-8 text-saffron animate-spin" />
      </div>
    }>
      <GeneratePageInner />
    </Suspense>
  );
}
