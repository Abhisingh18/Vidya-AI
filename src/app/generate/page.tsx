'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Brain, Film, Mic, GitMerge, CheckCircle, Loader2,
  Download, ClipboardCopy, RefreshCw, Sparkles, Clock,
  Copy, Check, AlertCircle, Wand2, Languages,
  GraduationCap, Mic2, PenLine, ScanEye, Save,
  RotateCcw, SkipForward, ExternalLink, Timer, ArrowUp, Paperclip, X, FileText,
} from 'lucide-react';
import GeneratedVideoPlayer from '@/components/generated-video-player';
import ExplainerPlayer from '@/components/explainer-player';
import SlideView from '@/components/teacher/slide-view';
import SourceUpload from '@/components/teacher/source-upload';
import Pill from '@/components/generate/pill';
import { LogoMark } from '@/components/brand/logo';
import { LANGUAGES as ALL_LANGUAGES } from '@/lib/languages';
import { deriveTopic, type SourceFile } from '@/lib/source';
import { takeDoubtVideo } from '@/lib/doubt-video';
import {
  EXPLAINER_FORMAT, TARGET_MINUTES, explainerDuration, explainerToScript,
  type ExplainerContent, type ExplainerOutline, type ExplainerScene,
} from '@/lib/explainer';

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


const GRADE_LEVELS = ['6-8', '9-10', '11-12', 'College', 'Competitive Exam'];

const gradeLabel = (g: string) => (/^\d/.test(g) ? `Class ${g}` : g);

/** What the student asked for (the chat bubble above the answer). */
interface Asked { topic: string; mode: 'explainer' | 'classic'; language: string; grade: string; voiceType: 'male' | 'female'; notes: number }


/* Fake timeline for the classic (single-request) generator. */
const STEPS = [
  { icon: Brain,       text: 'Understanding your topic',          sub: 'AI is analysing the concept'   },
  { icon: Wand2,       text: 'Crafting the lesson plan',          sub: 'Building step-by-step structure' },
  { icon: Film,        text: 'Generating animations',             sub: 'Creating beautiful visuals'    },
  { icon: Mic,         text: 'Adding voice narration',            sub: 'Native-language voice'         },
  { icon: GitMerge,    text: 'Polishing the final video',         sub: 'Almost there...'               },
  { icon: CheckCircle, text: 'Your video is ready!',              sub: '🎉 Watch now'                  },
];


type Mode = 'explainer' | 'classic';

const MODES: { key: Mode; emoji: string; label: string; sub: string }[] = [
  { key: 'explainer', emoji: '🎬', label: 'Visual explainer',  sub: '5–6 min · real pictures, diagrams' },
  { key: 'classic',   emoji: '✏️', label: 'Classic animation', sub: '~1 min · chalkboard drawing' },
];

/* ── Visual explainer pipeline ──────────────────────────────────────
 * outline → scenes (parallel chunks) → visuals (per chunk, as soon as it is
 * written) → save. Everything finished is kept on the job, so Retry resumes
 * at the failed step and never redoes finished chunks. */

type Stage = 'outline' | 'scenes' | 'visuals' | 'save';
type Status = 'idle' | 'running' | 'error';
type Phase = 'running' | 'error' | 'done';

interface Chunk {
  /** outline.scenes[from..to) */
  from: number;
  to: number;
  scenes: ExplainerScene[] | null;
  /** `scenes` with pictures attached. */
  pictured: ExplainerScene[] | null;
  writing: Status;
  picturing: Status;
}

interface Job {
  id: number;
  topic: string;
  grade: string;
  language: string;
  voiceType: 'male' | 'female';
  /** Uploaded notes the video follows (sent with the outline and every scenes request). */
  sources: SourceFile[];
  outline: ExplainerOutline | null;
  chunks: Chunk[];
  /** Student chose to continue without pictures after the picture step failed. */
  skipPictures: boolean;
  content: ExplainerContent | null;
  saving: Status;
  videoId: string | null;
}

interface JobError { stage: Stage; message: string; status: number }

class StepError extends Error {
  constructor(message: string, readonly status = 0, public stage: Stage | null = null) { super(message); }
}

const toStepError = (err: unknown, stage: Stage): StepError => {
  const e = err instanceof StepError
    ? err
    : new StepError(err instanceof Error && err.message ? err.message : 'Something went wrong. Please try again.');
  e.stage = stage;
  return e;
};

/** POST JSON; throws a StepError carrying the server's `{ error }` message verbatim. */
async function postJson<T>(url: string, body: unknown, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (signal?.aborted) throw err;
    throw new StepError('Could not reach the server. Check your internet connection and try again.');
  }
  const data = (await res.json().catch(() => null)) as (T & { error?: unknown }) | null;
  if (!res.ok || !data || typeof data.error === 'string') {
    const message = typeof data?.error === 'string' && data.error.trim()
      ? data.error
      : res.status === 404
        ? 'This step is not available on the server yet (404). Please try again in a little while.'
        : `The server returned an error (${res.status}). Please try again.`;
    throw new StepError(message, res.status);
  }
  return data;
}

/** Split N planned scenes into ~equal chunks of at most 5. */
function makeChunks(n: number): Chunk[] {
  const count = Math.max(1, Math.ceil(n / 5));
  const chunks: Chunk[] = [];
  let from = 0;
  for (let k = 0; k < count; k++) {
    const size = Math.floor(n / count) + (k < n % count ? 1 : 0);
    chunks.push({ from, to: from + size, scenes: null, pictured: null, writing: 'idle', picturing: 'idle' });
    from += size;
  }
  return chunks;
}

const chunkSize = (c: Chunk) => c.to - c.from;

const isQuotaError = (e: JobError) =>
  e.status === 429 || /busy|quota|rate.?limit|daily limit|free.?tier|too many requests/i.test(e.message);

const formatClock = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** Narration grouped by scene, with the legacy script's timestamps. */
function scriptByScene(content: ExplainerContent) {
  const script = explainerToScript(content);
  let k = 0;
  return content.scenes.map(scene => {
    const lines = script.slice(k, k + scene.narration.length);
    k += scene.narration.length;
    return { scene, lines };
  });
}

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

/* ── Explainer progress (left column) ───────────────────────────── */

type StepState = 'pending' | 'active' | 'done' | 'error';
type Segment = 'pending' | 'running' | 'done' | 'error';

const SEGMENT_CLASS: Record<Segment, string> = {
  pending: 'bg-gray-200 dark:bg-dark-border',
  running: 'bg-saffron/40 animate-pulse',
  done:    'bg-success',
  error:   'bg-red-400',
};

const STAGE_FAILED: Record<Stage, string> = {
  outline: 'Planning the lesson failed',
  scenes:  'Some scenes could not be written',
  visuals: 'Picture search failed',
  save:    'Could not save the video',
};

function ProgressStep({ icon: Icon, state, label, sub, counter, segments }: {
  icon: React.ElementType; state: StepState; label: string; sub?: string; counter?: string; segments?: Segment[];
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
        state === 'done' ? 'bg-success text-white'
          : state === 'active' ? 'bg-saffron text-white shadow-saffron/30 shadow-md'
          : state === 'error' ? 'bg-red-500 text-white'
          : 'bg-gray-100 dark:bg-dark-border text-muted'}`}>
        {state === 'done' ? <Check className="w-3.5 h-3.5" />
          : state === 'active' ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : state === 'error' ? <AlertCircle className="w-3.5 h-3.5" />
          : <Icon className="w-3.5 h-3.5" />}
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-baseline justify-between gap-2">
          <p className={`text-sm font-medium transition-colors ${
            state === 'done' ? 'text-success'
              : state === 'error' ? 'text-red-600 dark:text-red-400'
              : state === 'active' ? 'text-navy dark:text-dark-text' : 'text-muted'}`}>{label}</p>
          {counter && <span className="text-[11px] font-mono text-muted tabular-nums shrink-0">{counter}</span>}
        </div>
        {sub && <p className="text-[11px] text-muted mt-0.5">{sub}</p>}
        {segments && segments.length > 0 && (
          <div className="mt-2 flex gap-[3px]" aria-hidden>
            {segments.map((s, i) => (
              <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${SEGMENT_CLASS[s]}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ExplainerProgress({ job, phase, error, elapsed, onRetry, onSkipPictures, onStartOver }: {
  job: Job; phase: Phase; error: JobError | null; elapsed: number;
  onRetry: () => void; onSkipPictures: () => void; onStartOver: () => void;
}) {
  const outline = job.outline;
  const total = outline?.scenes.length ?? 0;
  const running = phase === 'running';
  const written = job.chunks.reduce((n, c) => n + (c.scenes ? chunkSize(c) : 0), 0);
  const pictured = job.chunks.reduce((n, c) => n + (c.pictured ? chunkSize(c) : 0), 0);
  const allWritten = !!outline && written === total;
  const picturesDone = allWritten && (pictured === total || job.skipPictures);
  const writingNow = job.chunks.filter(c => c.writing === 'running').length;
  const writeFailed = job.chunks.filter(c => c.writing === 'error');
  const pictureFailed = job.chunks.some(c => c.picturing === 'error');
  const picturingNow = job.chunks.some(c => c.picturing === 'running');

  const segments = (pick: (c: Chunk) => Segment) =>
    job.chunks.flatMap(c => Array.from({ length: chunkSize(c) }, () => pick(c)));

  const outlineState: StepState = outline ? 'done' : error?.stage === 'outline' ? 'error' : running ? 'active' : 'pending';
  const scenesState: StepState = !outline ? 'pending'
    : allWritten ? 'done'
    : writeFailed.length ? 'error'
    : running ? 'active' : 'pending';
  const visualsState: StepState = !outline || (!written && !picturingNow) ? 'pending'
    : picturesDone ? 'done'
    : pictureFailed ? 'error'
    : picturingNow || (running && allWritten) ? 'active' : 'pending';
  const saveState: StepState = job.videoId ? 'done'
    : job.saving === 'error' ? 'error'
    : job.saving === 'running' ? 'active' : 'pending';

  const failedScenes = writeFailed.reduce((n, c) => n + chunkSize(c), 0);
  const resumeNote: Record<Stage, string> = {
    outline: 'Retry plans the lesson again.',
    scenes:  `Finished scenes are kept — Retry only rewrites the ${failedScenes || 'failed'} scene${failedScenes === 1 ? '' : 's'} that failed.`,
    visuals: 'Your scenes are kept — Retry only looks for the missing pictures, or skip them and use emoji & diagrams.',
    save:    'Your lesson is ready and kept — Retry only saves it to your library.',
  };

  return (
    <div className="card bg-gradient-to-br from-saffron/5 to-indigo-brand/5 dark:from-saffron/10 dark:to-indigo-brand/10 border-saffron/20 hover:!translate-y-0">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          {phase === 'done' ? <CheckCircle className="w-4 h-4 text-success" />
            : phase === 'error' ? <AlertCircle className="w-4 h-4 text-red-500" />
            : <Loader2 className="w-4 h-4 text-saffron animate-spin" />}
          <p className={`text-xs font-semibold uppercase tracking-wider ${phase === 'done' ? 'text-success' : phase === 'error' ? 'text-red-500' : 'text-saffron'}`}>
            {phase === 'done' ? 'Ready' : phase === 'error' ? 'Paused' : 'Generating'}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-mono text-muted tabular-nums" title="Time elapsed">
          <Timer className="w-3.5 h-3.5" />{formatClock(elapsed)}
        </span>
      </div>
      <p className="text-[11px] text-muted mb-4">
        {phase === 'done'
          ? `Built in ${formatClock(elapsed)}. Press play!`
          : phase === 'error'
          ? 'Generation paused. Everything already finished is kept — see below.'
          : 'A full 5–6 minute visual lesson takes about 2–4 minutes to build. Keep this tab open — scenes appear on the right as they’re written.'}
      </p>

      <div className="space-y-3.5">
        <ProgressStep icon={Brain} state={outlineState} label="Planning the lesson"
          sub={outline ? `“${outline.title}” · ${total} scenes` : outlineState === 'active' ? 'Designing the storyline, pictures and diagrams' : undefined} />
        <ProgressStep icon={PenLine} state={scenesState}
          label={allWritten ? `${total} scenes written`
            : scenesState === 'error' && !writingNow ? `${written} of ${total} scenes written`
            : total ? `Writing scene ${Math.min(written + 1, total)} of ${total}` : 'Writing the scenes'}
          sub={!outline ? undefined
            : allWritten ? 'Narration and visuals for every scene'
            : writeFailed.length ? (writingNow ? `A batch failed — waiting for the other ${writingNow}…` : `${failedScenes} scene${failedScenes === 1 ? '' : 's'} failed`)
            : writingNow > 1 ? `${writingNow} batches writing in parallel`
            : running ? 'Writing narration and visuals' : undefined}
          segments={outline ? segments(c => c.scenes ? 'done' : c.writing === 'error' ? 'error' : c.writing === 'running' ? 'running' : 'pending') : undefined} />
        <ProgressStep icon={ScanEye} state={visualsState} label="Picking pictures with vision AI"
          counter={outline && visualsState !== 'done' && visualsState !== 'pending' ? `${pictured}/${total}` : undefined}
          sub={visualsState === 'done'
            ? (job.skipPictures && pictured < total ? 'Skipped — those scenes use emoji and diagrams' : 'Real pictures from Wikimedia Commons')
            : visualsState === 'active' ? 'Searching Wikimedia Commons and checking each picture'
            : visualsState === 'error' ? 'Some pictures could not be picked' : undefined}
          segments={outline && written > 0 ? segments(c => c.pictured ? 'done' : c.picturing === 'error' ? 'error' : c.picturing === 'running' ? 'running' : 'pending') : undefined} />
        <ProgressStep icon={Save} state={saveState} label="Saving"
          sub={saveState === 'done' ? 'Saved to your library' : saveState === 'active' ? 'Adding it to your library' : saveState === 'error' ? 'Not saved yet' : undefined} />
      </div>

      {error && phase === 'error' && (
        <div role="alert" className="mt-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
          <div className="flex items-start gap-2 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold">{STAGE_FAILED[error.stage]}</p>
              <p className="text-xs opacity-90 mt-0.5 break-words">{error.message}</p>
            </div>
          </div>
          {isQuotaError(error) && (
            <p className="mt-2.5 flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
              <Clock className="w-3.5 h-3.5 mt-px shrink-0" />
              Free AI quota may be used up for today — try again later.
            </p>
          )}
          <p className="mt-2 text-[11px] text-muted">{resumeNote[error.stage]}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" onClick={onRetry} className="btn-saffron !px-4 !py-2 text-sm">
              <RotateCcw className="w-4 h-4" /> Retry
            </button>
            {error.stage === 'visuals' && (
              <button type="button" onClick={onSkipPictures} className="btn-outline !px-4 !py-2 text-sm">
                <SkipForward className="w-4 h-4" /> Skip pictures
              </button>
            )}
            <button type="button" onClick={onStartOver} className="px-2 py-2 text-xs text-muted hover:text-saffron hover:underline underline-offset-2 transition-colors">
              Start over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Explainer live preview (right column, while building) ───────── */

function ExplainerPreview({ job, phase }: { job: Job; phase: Phase }) {
  const outline = job.outline;
  const paused = phase === 'error';
  return (
    <div className="card h-full min-h-[600px] hover:!translate-y-0">
      <p className="text-[10px] font-semibold text-muted uppercase tracking-widest">Lesson preview</p>
      <h2 className="text-2xl font-heading font-bold text-navy dark:text-dark-text mt-1 leading-tight">
        {outline?.title ?? (paused ? 'Lesson plan not ready yet' : 'Planning your lesson…')}
      </h2>
      <p className="text-sm text-muted mt-1">
        {outline
          ? `${outline.scenes.length} scenes · about ${TARGET_MINUTES} minutes · ${job.language}`
          : paused
            ? `Planning “${job.topic}” was interrupted — press Retry to try again.`
            : `AI is choosing the storyline, pictures and diagrams for “${job.topic}”.`}
      </p>

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {!outline
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`aspect-video rounded-lg ${paused ? 'border-2 border-dashed border-card-border dark:border-dark-border' : 'skeleton !rounded-lg'}`} />
            ))
          : outline.scenes.map((planned, i) => {
              const chunk = job.chunks.find(c => i >= c.from && i < c.to);
              const k = chunk ? i - chunk.from : -1;
              const scene = chunk?.pictured?.[k] ?? chunk?.scenes?.[k];
              const caption = (
                <p className="text-[11px] text-muted mt-1.5 truncate">
                  <span className="font-mono text-saffron/80 mr-1">{i + 1}</span>{scene?.slide.title || planned.title}
                </p>
              );
              if (scene) {
                return (
                  <div key={i} className="animate-fade-in">
                    <div className="relative pointer-events-none rounded-lg ring-1 ring-card-border dark:ring-dark-border">
                      <SlideView slide={scene.slide} theme="saffron" />
                      {chunk?.picturing === 'running' && (
                        <span className="absolute top-1.5 right-1.5 inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-sm">
                          <Loader2 className="w-2.5 h-2.5 animate-spin" /> picture
                        </span>
                      )}
                    </div>
                    {caption}
                  </div>
                );
              }
              const failed = chunk?.writing === 'error';
              const busy = chunk?.writing === 'running';
              return (
                <div key={i}>
                  <div className={`relative aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-center px-2 overflow-hidden ${
                    failed ? 'border-red-300 dark:border-red-500/40 bg-red-50/60 dark:bg-red-500/5' : 'border-card-border dark:border-dark-border bg-off-white dark:bg-dark-bg'}`}>
                    {busy && <div className="absolute inset-0 skeleton !rounded-none opacity-70" />}
                    <span className="relative text-2xl leading-none">{planned.emoji || '🎬'}</span>
                    <span className={`relative text-[10px] mt-1.5 ${failed ? 'text-red-500' : 'text-muted'}`}>
                      {failed ? 'Not written yet' : busy ? 'Writing…' : 'Waiting'}
                    </span>
                  </div>
                  {caption}
                </div>
              );
            })}
      </div>
    </div>
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
  const [mode, setMode]             = useState<Mode>('explainer');
  const [sources, setSources]       = useState<SourceFile[]>([]);
  const [notesOpen, setNotesOpen]   = useState(false);
  const [asked, setAsked]           = useState<Asked | null>(null);
  const [autoRun, setAutoRun]       = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Classic generator
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep]   = useState(0);
  const [result, setResult]             = useState<GenerationResult | null>(null);
  const [genError, setGenError]         = useState<string | null>(null);

  // Visual explainer
  const [job, setJob]           = useState<Job | null>(null);
  const jobRef                  = useRef<Job | null>(null);
  const jobSeq                  = useRef(0);
  const abortRef                = useRef<AbortController | null>(null);
  const [phase, setPhase]       = useState<Phase | null>(null);
  const [jobError, setJobError] = useState<JobError | null>(null);
  const [clock, setClock]       = useState<{ base: number; since: number | null }>({ base: 0, since: null });
  const [now, setNow]           = useState(0);

  const [activeTab, setActiveTab]   = useState<'script' | 'code' | 'details'>('script');
  const [explainerTab, setExplainerTab] = useState<'script' | 'scenes' | 'details'>('script');
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedCode, setCopiedCode]     = useState(false);

  useEffect(() => {
    const t = searchParams.get('topic');
    if (t) setTopic(t);
  }, [searchParams]);

  // Elapsed-time ticker while the explainer is building.
  useEffect(() => {
    if (clock.since === null) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [clock.since]);

  // Stop in-flight generation requests when leaving the page.
  useEffect(() => () => abortRef.current?.abort(), []);

  const elapsed = clock.base + (clock.since !== null ? Math.max(0, now - clock.since) : 0);

  // On small screens the result sits below the form — bring the player into view once it's ready.
  const resultRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(220, el.scrollHeight)}px`;
  }, [topic]);
  const hasContent = !!job?.content;
  useEffect(() => {
    if (hasContent && window.innerWidth < 1024) resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [hasContent]);

  /* ── Classic generator (single /api/generate call) ── */
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
        scene: apiResult.scene ?? null,
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

  /* ── Visual explainer pipeline ── */
  const updateJob = useCallback((id: number, fn: (j: Job) => Job) => {
    const cur = jobRef.current;
    if (!cur || cur.id !== id) return;
    const next = fn(cur);
    jobRef.current = next;
    setJob(next);
  }, []);

  const runJob = useCallback(async (id: number) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const { signal } = ctrl;
    const live = () => jobRef.current?.id === id && !signal.aborted;
    const current = () => jobRef.current as Job;
    const patchChunk = (i: number, patch: Partial<Chunk>) =>
      updateJob(id, j => ({ ...j, chunks: j.chunks.map((c, k) => (k === i ? { ...c, ...patch } : c)) }));

    setPhase('running');
    setJobError(null);
    setClock(c => (c.since === null ? { base: c.base, since: Date.now() } : c));
    const stopClock = () => setClock(c => (c.since === null ? c : { base: c.base + (Date.now() - c.since), since: null }));
    const fail = (err: StepError) => {
      if (!live()) return;
      setJobError({ stage: err.stage ?? 'outline', message: err.message, status: err.status });
      setPhase('error');
      stopClock();
    };

    // 1 — Plan the lesson
    if (!current().outline) {
      try {
        const { topic: t, grade: g, language: l, sources: src } = current();
        const data = await postJson<{ outline?: ExplainerOutline }>('/api/explainer/outline', { topic: t, grade: g, language: l, sources: src }, signal);
        const outline = data.outline;
        if (!outline || !Array.isArray(outline.scenes) || outline.scenes.length === 0) {
          throw new StepError('The lesson plan came back empty. Please try again.');
        }
        updateJob(id, j => ({ ...j, outline, chunks: makeChunks(outline.scenes.length) }));
      } catch (err) {
        return fail(toStepError(err, 'outline'));
      }
    }
    if (!live()) return;

    // 2 + 3 — Write the scenes in parallel chunks; each chunk gets its pictures as soon as it is written.
    const runChunk = async (i: number) => {
      const j = current();
      const chunk = j.chunks[i];
      let scenes = chunk.scenes;
      if (!scenes) {
        patchChunk(i, { writing: 'running' });
        try {
          const data = await postJson<{ scenes?: ExplainerScene[] }>('/api/explainer/scenes', {
            topic: j.topic, grade: j.grade, language: j.language, sources: j.sources, outline: j.outline, from: chunk.from, to: chunk.to,
          }, signal);
          if (!Array.isArray(data.scenes) || data.scenes.length === 0) {
            throw new StepError('Some scenes came back empty. Please try again.');
          }
          scenes = data.scenes;
          patchChunk(i, { scenes, writing: 'idle' });
        } catch (err) {
          patchChunk(i, { writing: 'error' });
          throw toStepError(err, 'scenes');
        }
      }
      if (current().chunks[i].pictured || current().skipPictures) return;
      patchChunk(i, { picturing: 'running' });
      try {
        const data = await postJson<{ scenes?: ExplainerScene[] }>('/api/explainer/visuals', {
          topic: j.topic, grade: j.grade, scenes,
        }, signal);
        const pictured = Array.isArray(data.scenes) && data.scenes.length === scenes.length ? data.scenes : scenes;
        patchChunk(i, { pictured, picturing: 'idle' });
      } catch (err) {
        patchChunk(i, { picturing: 'error' });
        throw toStepError(err, 'visuals');
      }
    };

    const failures: StepError[] = [];
    await Promise.all(current().chunks.map((_, i) => runChunk(i).catch((err: unknown) => {
      failures.push(err instanceof StepError ? err : toStepError(err, 'scenes'));
    })));
    if (!live()) return;
    if (failures.length) return fail(failures.find(f => f.stage === 'scenes') ?? failures[0]);

    // 4 — Assemble and save
    let content = current().content;
    if (!content) {
      const j = current();
      const assembled: ExplainerContent = {
        format: EXPLAINER_FORMAT,
        title: j.outline?.title || j.topic,
        topic: j.topic,
        grade: j.grade,
        language: j.language,
        theme: 'saffron',
        scenes: j.chunks.flatMap(c => c.pictured ?? c.scenes ?? []),
      };
      content = assembled;
      updateJob(id, x => ({ ...x, content: assembled }));
    }
    if (!current().videoId) {
      const j = current();
      updateJob(id, x => ({ ...x, saving: 'running' }));
      try {
        const data = await postJson<{ id?: string }>('/api/videos', {
          topic: j.topic,
          language: j.language,
          grade: j.grade,
          voiceType: j.voiceType,
          videoStyle: 'explainer',
          script: explainerToScript(content),
          scene: content,
          duration: explainerDuration(content),
        }, signal);
        if (!data.id) throw new StepError('The server did not return a video id. Please try saving again.');
        const videoId = data.id;
        updateJob(id, x => ({ ...x, saving: 'idle', videoId }));
      } catch (err) {
        updateJob(id, x => ({ ...x, saving: 'error' }));
        return fail(toStepError(err, 'save'));
      }
    }
    if (!live()) return;
    setPhase('done');
    stopClock();
  }, [updateJob]);

  const startExplainer = useCallback(() => {
    // With uploaded notes the topic is optional: the notes' title stands in for it.
    const t = topic.trim() || deriveTopic(sources);
    if (!t) return;
    const id = ++jobSeq.current;
    const fresh: Job = {
      id, topic: t, grade, language, voiceType, sources,
      outline: null, chunks: [], skipPictures: false, content: null, saving: 'idle', videoId: null,
    };
    jobRef.current = fresh;
    setJob(fresh);
    setExplainerTab('script');
    setClock({ base: 0, since: null });
    void runJob(id);
  }, [topic, grade, language, voiceType, sources, runJob]);

  const retryExplainer = () => { if (jobRef.current) void runJob(jobRef.current.id); };

  const skipPictures = () => {
    const cur = jobRef.current;
    if (!cur) return;
    updateJob(cur.id, j => ({ ...j, skipPictures: true, chunks: j.chunks.map(c => ({ ...c, picturing: 'idle' })) }));
    void runJob(cur.id);
  };

  const copyToClipboard = async (text: string, type: 'script' | 'code') => {
    await navigator.clipboard.writeText(text);
    if (type === 'script') { setCopiedScript(true); setTimeout(() => setCopiedScript(false), 2000); }
    else { setCopiedCode(true); setTimeout(() => setCopiedCode(false), 2000); }
  };

  const generationDone = currentStep === 6 && !!result;
  const scriptText = result?.script.map(l => `[${l.time}] ${l.text}`).join('\n') ?? '';

  const explainerRunning = phase === 'running';
  const content = job?.content ?? null;
  const narration = content ? scriptByScene(content) : [];
  const explainerScriptText = narration
    .map(({ scene, lines }, i) => [`Scene ${i + 1}: ${scene.slide.title}`, ...lines.map(l => `[${l.time}] ${l.text}`)].join('\n'))
    .join('\n\n');
  const busy = explainerRunning || (isGenerating && !generationDone);
  // Visual explainers can be made from uploaded notes alone; classic videos need a topic.
  const canGenerate = !!topic.trim() || (mode === 'explainer' && sources.length > 0);

  const downloadExplainerNotes = () => {
    if (!content || !job) return;
    if (job.videoId) fetch(`/api/videos/${job.videoId}/download`, { method: 'POST' }).catch(() => {});
    const text = [
      `VidyaAI — ${content.title}`,
      `Topic: ${content.topic}  |  Language: ${content.language}  |  Grade: ${content.grade}`,
      '',
      explainerScriptText,
    ].join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${content.topic.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'lesson'}-notes.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const submit = () => {
    if (!canGenerate || busy) return;
    setNotesOpen(false);
    setAsked({ topic: topic.trim() || deriveTopic(sources), mode, language, grade, voiceType, notes: mode === 'explainer' ? sources.length : 0 });
    if (mode === 'explainer') startExplainer(); else handleGenerate();
  };
  // A solved doubt sent here ("Video" in Ask a doubt): fill in its question and solution, then start.
  useEffect(() => {
    const h = takeDoubtVideo();
    if (!h) return;
    setMode('explainer');
    setTopic(h.topic); setSources(h.sources); setGrade(h.grade); setLanguage(h.language);
    setAutoRun(true);
  }, []);
  useEffect(() => {
    if (!autoRun || !topic || !sources.length) return;
    setAutoRun(false);
    submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun, topic, sources]);
  // Nothing asked yet (or the last request was in the other mode): show the start screen.
  const idle = mode === 'explainer' ? !job : !isGenerating && !generationDone;

  const composer = (docked: boolean) => (
    <div className={`relative rounded-[28px] border border-card-border bg-white/95 p-2.5 text-left shadow-[0_24px_60px_-24px_rgba(26,26,46,0.35)] backdrop-blur-xl transition-colors focus-within:border-saffron/60 dark:border-dark-border dark:bg-dark-surface/95 ${docked ? '' : 'sm:p-3'}`}>
      {notesOpen && mode === 'explainer' && (
        <div className="mb-2 rounded-2xl border border-card-border bg-off-white p-3 dark:border-dark-border dark:bg-dark-bg">
          <SourceUpload files={sources} onChange={setSources} topic={topic} disabled={busy} label="Your notes"
            hint="Upload your class notes, a textbook chapter or your teacher's PPT — the video will follow it." />
        </div>
      )}
      {!notesOpen && mode === 'explainer' && sources.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-1.5 pt-1">
          {sources.map((f, i) => (
            <span key={`${f.name}-${i}`} className="inline-flex max-w-[15rem] items-center gap-1.5 rounded-full bg-saffron/10 px-2.5 py-1 text-[11px] font-medium text-saffron">
              <FileText className="h-3 w-3 shrink-0" /><span className="truncate">{f.name}</span>
              <button type="button" onClick={() => setSources(sources.filter((_, j) => j !== i))} disabled={busy} aria-label={`Remove ${f.name}`} className="hover:text-navy dark:hover:text-white"><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
      )}
      <textarea ref={inputRef} rows={1} value={topic} onChange={e => setTopic(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit(); } }}
        placeholder={mode === 'explainer' && sources.length
          ? 'Optional with your notes — e.g. just the part about Newton’s second law…'
          : 'Ask for any lesson — e.g. Explain Newton’s third law with rockets…'}
        aria-label="What do you want to learn?"
        className="block max-h-[220px] min-h-[52px] w-full resize-none bg-transparent px-3 py-3 text-base text-navy outline-none placeholder:text-muted/60 dark:text-dark-text" />
      <div className="flex flex-wrap items-center gap-1.5 px-1">
        {mode === 'explainer' && (
          <button type="button" onClick={() => setNotesOpen(o => !o)} disabled={busy} title="Attach your notes, chapter or PPT" aria-pressed={notesOpen}
            className={`relative flex h-9 w-9 items-center justify-center rounded-full border transition-all disabled:opacity-50 ${notesOpen ? 'border-saffron bg-saffron/10 text-saffron' : 'border-card-border text-muted hover:border-saffron/50 hover:text-saffron dark:border-dark-border'}`}>
            <Paperclip className="h-4 w-4" />
            {sources.length > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-saffron px-1 text-[9px] font-bold text-white">{sources.length}</span>}
          </button>
        )}
        <Pill icon={<Film className="h-3.5 w-3.5" />} title="Video type" up={docked} disabled={busy}
          label={MODES.find(m => m.key === mode)?.label ?? ''} value={mode} onChange={setMode}
          options={MODES.map(m => ({ value: m.key, label: m.label, hint: m.sub, icon: m.emoji }))} />
        <Pill icon={<Languages className="h-3.5 w-3.5" />} title="Language" up={docked} wide
          label={language} value={language} onChange={setLanguage}
          options={ALL_LANGUAGES.map(l => ({ value: l.name, label: l.name, hint: l.native }))} />
        <Pill icon={<GraduationCap className="h-3.5 w-3.5" />} title="Class" up={docked}
          label={gradeLabel(grade)} value={grade} onChange={setGrade}
          options={GRADE_LEVELS.map(g => ({ value: g, label: gradeLabel(g) }))} />
        <Pill icon={<Mic2 className="h-3.5 w-3.5" />} title="Voice" up={docked}
          label={voiceType === 'female' ? 'Female' : 'Male'} value={voiceType} onChange={setVoiceType}
          options={[{ value: 'female', label: 'Female teacher', icon: '👩‍🏫' }, { value: 'male', label: 'Male teacher', icon: '👨‍🏫' }]} />
        {mode === 'classic' && (
          <Pill icon={<PenLine className="h-3.5 w-3.5" />} title="Style" up={docked}
            label={videoStyle === 'math' ? 'Math' : 'Concept'} value={videoStyle} onChange={setVideoStyle}
            options={[{ value: 'math', label: 'Math / diagrams', icon: '📐' }, { value: 'concept', label: 'Concept', icon: '📝' }]} />
        )}
        <button type="button" onClick={submit} disabled={!canGenerate || busy} aria-label="Generate video" title="Generate video (Enter)"
          className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-saffron text-white shadow-saffron transition-all hover:scale-105 disabled:cursor-not-allowed disabled:bg-card-border disabled:text-muted disabled:shadow-none dark:disabled:bg-dark-border">
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowUp className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );

  const timing = (
    <p className="mt-2.5 text-center text-[11px] text-muted">
      {mode === 'explainer' ? '🎬 5–6 min narrated video · ready in about 2–4 minutes' : '✏️ ~1 min animation · ready in under a minute'} · Free · Enter to send, Shift + Enter for a new line
    </p>
  );

  const classicError = mode === 'classic' && genError && (
    <div className="mb-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <div><p className="font-semibold">Generation failed</p><p className="mt-0.5 text-xs opacity-80">{genError}</p></div>
    </div>
  );

  return (
    <main className="min-h-screen bg-off-white px-3 pb-3 pt-20 sm:px-5 lg:pt-5 dark:bg-dark-bg">
      {/* the whole generator sits in one box that fills the screen */}
      <div className="relative mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-6xl flex-col rounded-3xl border border-card-border bg-white shadow-card lg:min-h-[calc(100vh-2.5rem)] dark:border-dark-border dark:bg-dark-surface dark:shadow-card-dark">
      <div className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 pt-12 sm:px-6">
        {idle ? (
          <section className="flex flex-1 flex-col items-center justify-center pb-16 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-saffron/20 bg-white/80 px-3 py-1 text-xs font-medium text-saffron backdrop-blur dark:bg-dark-surface/80">
              <Sparkles className="h-3 w-3" /> AI video generator
            </div>
            <h1 className="mt-5 font-heading text-4xl font-extrabold tracking-tight text-navy sm:text-5xl dark:text-dark-text">
              What should we <span className="text-gradient-saffron">learn</span> today?
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-muted">
              Type any topic or attach your notes — VidyaAI makes a narrated video lesson with real pictures, animations and captions.
            </p>
            <div className="relative z-20 mt-8 w-full max-w-3xl">
              {classicError}
              {composer(false)}
              {timing}
            </div>
          </section>
        ) : (
          <>
            <div className="space-y-6 pb-6">
              {asked && (
                <div className="flex justify-end animate-fade-in">
                  <div className="max-w-[85%] rounded-3xl rounded-br-md bg-navy px-5 py-3 text-white shadow-card dark:bg-dark-surface">
                    <p className="text-sm font-medium" dir="auto">{asked.topic}</p>
                    <p className="mt-1.5 text-[11px] text-white/70">
                      {asked.mode === 'explainer' ? '🎬 Visual explainer' : '✏️ Classic animation'} · 🌐 {asked.language} · 🎓 {gradeLabel(asked.grade)} · {asked.voiceType === 'female' ? '👩‍🏫 Female' : '👨‍🏫 Male'}
                      {asked.notes > 0 && ` · 📎 ${asked.notes} file${asked.notes > 1 ? 's' : ''}`}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <LogoMark size={36} className="mt-1 hidden shrink-0 sm:block" />
                <div className="min-w-0 flex-1 space-y-5">
                  {mode === 'explainer' ? (
                    <>
                      {job && phase && (
                        <ExplainerProgress job={job} phase={phase} error={jobError} elapsed={elapsed}
                          onRetry={retryExplainer} onSkipPictures={skipPictures} onStartOver={startExplainer} />
                      )}
                      {job && content ? (
              <div ref={resultRef} className="space-y-5 animate-fade-in scroll-mt-20">
                {!job.videoId && phase === 'error' && jobError?.stage === 'save' && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="flex-1">You can watch it now, but it isn’t saved to your library yet.</span>
                    <button type="button" onClick={retryExplainer} className="shrink-0 font-semibold hover:underline">Retry saving</button>
                  </div>
                )}

                <ExplainerPlayer
                  content={content}
                  onWatchTracked={() => {
                    const videoId = jobRef.current?.videoId;
                    if (videoId) {
                      fetch(`/api/videos/${videoId}/watch`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ duration: 10, completed: false }),
                      }).catch(() => {});
                    }
                  }}
                />

                {/* Tabs */}
                <div className="card !p-0 overflow-hidden hover:!translate-y-0">
                  <div className="flex border-b border-card-border dark:border-dark-border overflow-x-auto">
                    {([{ key: 'script', label: 'Narration', emoji: '📝' }, { key: 'scenes', label: 'Scenes', emoji: '🎞️' }, { key: 'details', label: 'Details', emoji: 'ℹ️' }] as const).map(tab => (
                      <button key={tab.key} type="button" onClick={() => setExplainerTab(tab.key)}
                        className={`flex items-center gap-2 px-5 py-3.5 text-sm font-heading font-medium relative transition-all shrink-0 ${explainerTab === tab.key ? 'text-saffron' : 'text-muted hover:text-navy dark:hover:text-dark-text'}`}>
                        <span>{tab.emoji}</span>
                        {tab.label}
                        {tabCount(tab.key, content)}
                        {explainerTab === tab.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-saffron rounded-t-full" />}
                      </button>
                    ))}
                  </div>

                  <div className="p-5">
                    {explainerTab === 'script' && (
                      <div className="relative">
                        <button type="button" onClick={() => copyToClipboard(explainerScriptText, 'script')}
                          className="absolute top-0 right-0 flex items-center gap-1.5 text-xs text-muted hover:text-saffron bg-gray-50 dark:bg-dark-border px-2.5 py-1.5 rounded-lg transition-colors">
                          {copiedScript ? <><Check className="w-3 h-3 text-success" />Copied!</> : <><Copy className="w-3 h-3" />Copy</>}
                        </button>
                        <div className="space-y-5 pr-16 max-h-96 overflow-y-auto">
                          {narration.map(({ scene, lines }, si) => (
                            <div key={si}>
                              <p className="text-[11px] font-heading font-semibold uppercase tracking-wider text-muted mb-2">
                                <span className="text-saffron mr-1">Scene {si + 1}</span>· {scene.slide.emoji && `${scene.slide.emoji} `}{scene.slide.title}
                              </p>
                              <div className="space-y-2">
                                {lines.map((line, idx) => (
                                  <div key={idx} className="flex gap-3">
                                    <span className="text-xs text-saffron font-mono font-semibold shrink-0 pt-0.5 w-10">[{line.time}]</span>
                                    <p className="text-sm text-navy dark:text-dark-text leading-relaxed">{line.text}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {explainerTab === 'scenes' && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[480px] overflow-y-auto pr-1">
                        {content.scenes.map((scene, i) => (
                          <div key={i}>
                            <div className="pointer-events-none rounded-lg ring-1 ring-card-border dark:ring-dark-border">
                              <SlideView slide={scene.slide} theme={content.theme} />
                            </div>
                            <p className="text-[11px] text-muted mt-1.5 truncate">
                              <span className="font-mono text-saffron/80 mr-1">{i + 1}</span>{scene.slide.title}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {explainerTab === 'details' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { label: 'Title',     value: content.title },
                          { label: 'Topic',     value: content.topic },
                          { label: 'Language',  value: content.language },
                          { label: 'Voice',     value: job.voiceType === 'female' ? 'Female Teacher' : 'Male Teacher' },
                          { label: 'Grade',     value: `Class ${content.grade}` },
                          { label: 'Length',    value: `≈ ${formatClock(explainerDuration(content) * 1000)} min` },
                          { label: 'Scenes',    value: `${content.scenes.length} scenes · ${content.scenes.filter(s => s.slide.image).length} with pictures` },
                          { label: 'Status',    value: job.videoId ? '✓ Saved to library' : phase === 'running' ? 'Saving…' : 'Not saved yet' },
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
                  {job.videoId && (
                    <Link href={`/library/${job.videoId}`} className="btn-saffron !px-5 text-sm">
                      <ExternalLink className="w-4 h-4" />Open in library
                    </Link>
                  )}
                  <button type="button" className="btn-outline !px-5 text-sm" onClick={downloadExplainerNotes}>
                    <Download className="w-4 h-4" />Download notes
                  </button>
                  <button type="button" className="btn-outline !px-5 text-sm" onClick={() => copyToClipboard(explainerScriptText, 'script')}>
                    <ClipboardCopy className="w-4 h-4" />Copy Script
                  </button>
                  <button type="button" className="btn-outline !px-5 text-sm disabled:opacity-50" onClick={startExplainer} disabled={explainerRunning || !canGenerate}>
                    <RefreshCw className="w-4 h-4" />Regenerate
                  </button>
                </div>
              </div>
                      ) : job && phase ? <ExplainerPreview job={job} phase={phase} /> : null}
                    </>
                  ) : (
                    <>
                      {isGenerating && !generationDone && (
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
                      {generationDone && result && (
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
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 z-30 -mx-4 mt-auto bg-gradient-to-t from-white via-white/95 to-transparent px-4 pb-4 pt-10 sm:-mx-6 sm:px-6 dark:from-dark-surface dark:via-dark-surface/95">
              {classicError}
              {composer(true)}
              <p className="mt-2 text-center text-[11px] text-muted">VidyaAI can make mistakes — check important facts with your textbook.</p>
            </div>
          </>
        )}
      </div>
      </div>
    </main>
  );
}

/** Small count next to the explainer tab labels. */
function tabCount(tab: 'script' | 'scenes' | 'details', content: ExplainerContent) {
  if (tab === 'details') return null;
  const n = tab === 'scenes' ? content.scenes.length : content.scenes.reduce((k, s) => k + s.narration.length, 0);
  return <span className="text-[10px] font-mono px-1.5 py-px rounded-full bg-gray-100 dark:bg-dark-border text-muted">{n}</span>;
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
