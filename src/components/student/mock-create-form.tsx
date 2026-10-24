'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles } from 'lucide-react';
import {
  lengthMarks, lengthSummary, MOCK_CLASSES, MOCK_DIFFICULTIES, MOCK_DIFFICULTY_LIST, MOCK_LENGTH_LIST, MOCK_LENGTHS,
  type MockDifficulty, type MockLength,
} from '@/lib/mock';
import { LANGUAGES } from '@/lib/languages';
import type { SourceFile } from '@/lib/source';
import SourceUpload from '@/components/teacher/source-upload';
import { api, bareFieldCls, ComposerBox, ErrorNote, inputCls, labelCls } from '@/components/teacher/ui';

const LEN_ICON: Record<MockLength, string> = { quick: '⚡', standard: '🎯', full: '🏆' };
const DIFF_ICON: Record<MockDifficulty, string> = { easy: '🌱', balanced: '⚖️', hard: '🔥' };
const STEPS = ['Reading your chapters', 'Writing the questions', 'Building the answer key'];

export default function MockCreateForm({ defaultTopics = '', defaultSubject = '', defaultLength }: { defaultTopics?: string; defaultSubject?: string; defaultLength?: string }) {
  const router = useRouter();
  const [subject, setSubject] = useState(defaultSubject);
  const [grade, setGrade] = useState('10');
  const [language, setLanguage] = useState('English');
  const [length, setLength] = useState<MockLength>(MOCK_LENGTH_LIST.includes(defaultLength as MockLength) ? defaultLength as MockLength : 'standard');
  const [difficulty, setDifficulty] = useState<MockDifficulty>('balanced');
  const [topics, setTopics] = useState(defaultTopics);
  const [sources, setSources] = useState<SourceFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const missing = !subject.trim() ? 'Enter the subject.' : !topics.trim() && !sources.length ? 'Add chapters/topics or upload your syllabus.' : '';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (missing) return;
    setBusy(true); setError(null);
    try {
      const { id } = await api<{ id: string }>('/api/student/mock', { method: 'POST', json: { subject, grade, language, length, difficulty, topics, sources } });
      router.push(`/practice/${id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="ph-stagger mx-auto max-w-2xl space-y-6">
      <div>
        <label className={labelCls} htmlFor="mock-subject">Subject</label>
        <div className="ph-glow"><input id="mock-subject" className={`${inputCls} !h-14 !rounded-2xl text-base`} value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Science" maxLength={100} /></div>
      </div>

      <div>
        <label className={labelCls} htmlFor="mock-topics">Chapters or topics {sources.length > 0 && <span className="normal-case font-normal">(optional)</span>}</label>
        <ComposerBox footer={<SourceUpload compact files={sources} onChange={setSources} disabled={busy} topic={`${subject} ${topics}`.trim()} />}>
          <textarea id="mock-topics" className={`${bareFieldCls} min-h-[96px]`} value={topics} onChange={e => setTopics(e.target.value)} maxLength={4000}
            placeholder={'One per line — e.g. Light, Electricity'} />
        </ComposerBox>
      </div>

      <div>
        <p className={labelCls}>How long?</p>
        <div role="radiogroup" aria-label="Test length" className="grid grid-cols-3 gap-3">
          {MOCK_LENGTH_LIST.map(l => {
            const on = length === l;
            return (
              <button key={l} type="button" role="radio" aria-checked={on} onClick={() => setLength(l)}
                className={`group rounded-2xl border-2 p-3 text-left transition-all hover:-translate-y-0.5 ${on ? 'border-saffron bg-saffron/5 shadow-saffron' : 'border-card-border hover:border-saffron/50 dark:border-dark-border'}`}>
                <span className={`block text-2xl transition-transform group-hover:scale-110 ${on ? 'ph-pop' : ''}`}>{LEN_ICON[l]}</span>
                <span className="mt-1 block font-heading text-lg font-extrabold text-navy dark:text-dark-text">{MOCK_LENGTHS[l].minutes} min</span>
                <span className="block text-[11px] leading-snug text-muted">{lengthSummary(l)} · {lengthMarks(l)} marks</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className={labelCls}>How tough?</p>
        <div role="radiogroup" aria-label="Difficulty" className="grid grid-cols-3 gap-3">
          {MOCK_DIFFICULTY_LIST.map(d => {
            const on = difficulty === d;
            return (
              <button key={d} type="button" role="radio" aria-checked={on} onClick={() => setDifficulty(d)}
                className={`group rounded-2xl border-2 p-3 text-left transition-all hover:-translate-y-0.5 ${on ? 'border-saffron bg-saffron/5 shadow-saffron' : 'border-card-border hover:border-saffron/50 dark:border-dark-border'}`}>
                <span className={`block text-2xl transition-transform group-hover:scale-110 ${on ? 'ph-pop' : ''}`}>{DIFF_ICON[d]}</span>
                <span className="mt-1 block font-heading font-bold text-navy dark:text-dark-text">{MOCK_DIFFICULTIES[d].label}</span>
                <span className="block text-[11px] leading-snug text-muted">{MOCK_DIFFICULTIES[d].hint}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="mock-class">Class</label>
          <select id="mock-class" className={inputCls} value={grade} onChange={e => setGrade(e.target.value)}>
            {MOCK_CLASSES.map(g => <option key={g} value={g}>Class {g}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="mock-language">Language</label>
          <select id="mock-language" className={inputCls} value={language} onChange={e => setLanguage(e.target.value)}>
            {LANGUAGES.map(l => <option key={l.name} value={l.name}>{l.name}{l.native !== l.name ? ` · ${l.native}` : ''}</option>)}
          </select>
        </div>
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}
      <div className="flex flex-col items-center gap-2 pt-1">
        <button type="submit" disabled={busy || !!missing} className="btn-saffron h-12 w-full whitespace-nowrap px-7 text-base disabled:opacity-60 disabled:cursor-not-allowed sm:w-auto sm:min-w-[16rem]">
          {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Writing your test…</> : <><Sparkles className="w-4 h-4" /> Create mock test</>}
        </button>
        {busy ? (
          <div className="w-full max-w-md" aria-live="polite">
            <div className="ph-sweep h-1.5 overflow-hidden rounded-full bg-saffron/15" />
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {STEPS.map((st, i) => (
                <span key={st} className="inline-flex animate-pulse items-center gap-1.5 rounded-full bg-saffron/10 px-3 py-1 text-xs font-semibold text-saffron" style={{ animationDelay: `${i * 0.4}s` }}>
                  <span className="h-1.5 w-1.5 rounded-full bg-saffron" />{st}
                </span>
              ))}
            </div>
            <p className="mt-2 text-center text-xs text-muted">Usually 30–90 seconds.</p>
          </div>
        ) : <span className="min-h-[1rem] text-xs text-muted">{missing}</span>}
      </div>
    </form>
  );
}
