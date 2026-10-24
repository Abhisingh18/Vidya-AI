'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles } from 'lucide-react';
import { DOC_TYPES, GRADES, LANGUAGES, type GeneratedDocType } from '@/lib/teacher-docs';
import type { SourceFile } from '@/lib/source';
import { api, ErrorNote, inputCls, labelCls, textareaCls } from './ui';
import SourceUpload from './source-upload';

const WAIT_COPY: Record<GeneratedDocType, string> = {
  slides: 'Designing your slides…',
  quiz: 'Writing questions and answers…',
  lesson: 'Planning your class period…',
};

const SOURCE_HINT: Record<GeneratedDocType, string> = {
  slides: 'Upload your syllabus, notes, a textbook chapter or an old PPT — the slides will follow it.',
  quiz: 'Upload the chapter or your notes — every question will come from this material.',
  lesson: 'Upload the syllabus or chapter — the plan will follow its sequence and examples.',
};

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
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-5">
      <div>
        <label className={labelCls} htmlFor="topic">
          Topic {sources.length > 0 && <span className="normal-case font-normal tracking-normal">(optional with an upload)</span>}
        </label>
        <input id="topic" className={inputCls} value={topic} onChange={e => setTopic(e.target.value)}
          placeholder={sources.length
            ? 'Optional: narrow it down, e.g. Chapter 3 or Laws of motion'
            : 'e.g. Photosynthesis, Quadratic equations — optional if you upload a file'}
          required={!sources.length} maxLength={200} />
      </div>

      <SourceUpload files={sources} onChange={setSources} topic={topic} hint={SOURCE_HINT[type]} disabled={busy} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
        {type === 'slides' && (
          <div>
            <label className={labelCls}>Slides</label>
            <select className={inputCls} value={slideCount} onChange={e => setSlideCount(+e.target.value)}>
              {[6, 8, 10, 12, 15].map(n => <option key={n} value={n}>{n} slides</option>)}
            </select>
          </div>
        )}
        {type === 'quiz' && (
          <>
            <div>
              <label className={labelCls}>Questions</label>
              <select className={inputCls} value={questionCount} onChange={e => setQuestionCount(+e.target.value)}>
                {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n} questions</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Difficulty</label>
              <select className={inputCls} value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
              </select>
            </div>
          </>
        )}
        {type === 'lesson' && (
          <div>
            <label className={labelCls}>Period length</label>
            <select className={inputCls} value={duration} onChange={e => setDuration(+e.target.value)}>
              {[30, 35, 40, 45, 60, 90].map(n => <option key={n} value={n}>{n} minutes</option>)}
            </select>
          </div>
        )}
      </div>

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
      {busy && <p className="text-center text-xs text-muted">This usually takes 20–60 seconds.</p>}
    </form>
  );
}
