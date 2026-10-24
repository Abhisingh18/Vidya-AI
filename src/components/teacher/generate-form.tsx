'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles } from 'lucide-react';
import { DOC_TYPES, GRADES, LANGUAGES, type GeneratedDocType } from '@/lib/teacher-docs';
import type { SourceFile } from '@/lib/source';
import { api, bareFieldCls, ComposerBox, ErrorNote, inputCls, labelCls, textareaCls } from './ui';
import SourceUpload from './source-upload';

const WAIT_COPY: Record<GeneratedDocType, string> = {
  slides: 'Designing your slides…',
  quiz: 'Writing questions and answers…',
  lesson: 'Planning your class period…',
};

const STEPS: Record<GeneratedDocType, string[]> = {
  slides: ['Reading your topic', 'Designing the slides', 'Adding pictures and diagrams'],
  quiz: ['Reading your topic', 'Writing the questions', 'Building the answer key'],
  lesson: ['Reading your topic', 'Planning each stage', 'Adding activities and homework'],
};

/** A row of pill buttons to pick one number (slide count, questions, period length). */
function Chips({ label, value, options, unit, onChange }: { label: string; value: number; options: number[]; unit: string; onChange: (n: number) => void }) {
  return (
    <div>
      <p className={labelCls}>{label}</p>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {options.map(n => (
          <button key={n} type="button" role="radio" aria-checked={value === n} onClick={() => onChange(n)}
            className={`h-11 min-w-[4.5rem] rounded-xl border-2 px-4 text-sm font-semibold transition-all hover:-translate-y-0.5 ${value === n ? 'ph-pop border-saffron bg-saffron text-white shadow-saffron' : 'border-card-border text-navy hover:border-saffron/50 dark:border-dark-border dark:text-dark-text'}`}>
            {n} <span className={`text-xs font-medium ${value === n ? 'text-white/80' : 'text-muted'}`}>{unit}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function GenerateForm({ type, defaultTopic = '' }: { type: GeneratedDocType; defaultTopic?: string }) {
  const router = useRouter();
  const [topic, setTopic] = useState(defaultTopic);
  const [grade, setGrade] = useState('9');
  const [language, setLanguage] = useState('English');
  const [slideCount, setSlideCount] = useState(10);
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState('medium');
  const [duration, setDuration] = useState(40);
  const [extra, setExtra] = useState('');
  const [sources, setSources] = useState<SourceFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // A topic, an upload, or both: with an upload the topic just narrows it down.
  const ready = !!topic.trim() || sources.length > 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError(null);
    try {
      const { id } = await api<{ id: string }>('/api/teacher/generate', {
        method: 'POST',
        json: { type, topic, grade, language, slideCount, questionCount, difficulty, duration, extra, sources },
      });
      router.push(`${DOC_TYPES[type].path}/${id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="ph-stagger space-y-6">
      <div>
        <label className={labelCls} htmlFor="topic">
          Topic {sources.length > 0 && <span className="normal-case font-normal tracking-normal">(optional with an upload)</span>}
        </label>
        <div className="ph-glow"><ComposerBox footer={<SourceUpload compact files={sources} onChange={setSources} topic={topic} disabled={busy} />}>
          <input id="topic" className={`${bareFieldCls} h-11`} value={topic} onChange={e => setTopic(e.target.value)}
          placeholder={sources.length
            ? 'Optional: narrow it down, e.g. Chapter 3 or Laws of motion'
            : 'e.g. Photosynthesis, Quadratic equations — optional if you upload a file'}
          required={!sources.length} maxLength={200} />
        </ComposerBox></div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Class</label>
          <select className={inputCls} value={grade} onChange={e => setGrade(e.target.value)}>
            {GRADES.map(g => <option key={g} value={g}>{g === 'College' ? 'College' : `Class ${g}`}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Language</label>
          <select className={inputCls} value={language} onChange={e => setLanguage(e.target.value)}>
            {LANGUAGES.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>
      </div>

      {type === 'slides' && <Chips label="How many slides?" value={slideCount} options={[6, 8, 10, 12, 15]} unit="slides" onChange={setSlideCount} />}
      {type === 'quiz' && (
        <>
          <Chips label="How many questions?" value={questionCount} options={[5, 10, 15, 20]} unit="questions" onChange={setQuestionCount} />
          <div>
            <p className={labelCls}>How tough?</p>
            <div role="radiogroup" aria-label="Difficulty" className="grid grid-cols-3 gap-3">
              {([['easy', '🌱', 'Easy'], ['medium', '⚖️', 'Medium'], ['hard', '🔥', 'Hard']] as const).map(([v, e, l]) => (
                <button key={v} type="button" role="radio" aria-checked={difficulty === v} onClick={() => setDifficulty(v)}
                  className={`group rounded-2xl border-2 p-3 text-left transition-all hover:-translate-y-0.5 ${difficulty === v ? 'border-saffron bg-saffron/5 shadow-saffron' : 'border-card-border hover:border-saffron/50 dark:border-dark-border'}`}>
                  <span className={`block text-2xl transition-transform group-hover:scale-110 ${difficulty === v ? 'ph-pop' : ''}`}>{e}</span>
                  <span className="font-heading font-bold text-navy dark:text-dark-text">{l}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
      {type === 'lesson' && <Chips label="Period length" value={duration} options={[30, 35, 40, 45, 60, 90]} unit="min" onChange={setDuration} />}

      <details className="group rounded-xl border border-card-border dark:border-dark-border" open={!!extra}>
        <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-navy dark:text-dark-text">Add notes for the AI <span className="font-normal text-muted">(optional)</span></summary>
        <div className="px-4 pb-4">
          <textarea id="extra" className={textareaCls} value={extra} onChange={e => setExtra(e.target.value)} maxLength={500}
            placeholder="e.g. Focus on numericals, include a lab activity…" />
        </div>
      </details>

      {error && <ErrorNote>{error}</ErrorNote>}

      <button type="submit" disabled={busy || !ready} className="btn-saffron mx-auto flex w-full sm:min-w-[16rem] sm:w-auto disabled:opacity-60 disabled:cursor-not-allowed">
        {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> {WAIT_COPY[type]}</> : <><Sparkles className="w-4 h-4" /> Generate {DOC_TYPES[type].label.toLowerCase()}</>}
      </button>
      {busy && (
        <div aria-live="polite">
          <div className="ph-sweep h-1.5 overflow-hidden rounded-full bg-saffron/15" />
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {STEPS[type].map((st, i) => (
              <span key={st} className="inline-flex animate-pulse items-center gap-1.5 rounded-full bg-saffron/10 px-3 py-1 text-xs font-semibold text-saffron" style={{ animationDelay: `${i * 0.4}s` }}>
                <span className="h-1.5 w-1.5 rounded-full bg-saffron" />{st}
              </span>
            ))}
          </div>
          <p className="mt-2 text-center text-xs text-muted">This usually takes 20–60 seconds.</p>
        </div>
      )}
    </form>
  );
}
