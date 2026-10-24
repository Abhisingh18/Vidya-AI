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
import { api, ErrorNote, inputCls, labelCls, textareaCls } from '@/components/teacher/ui';
import { studioCardCls } from './study-shell';
import { MockPreview } from './study-previews';

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
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
    <form onSubmit={submit} className={`${studioCardCls} space-y-5`}>
      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className={labelCls} htmlFor="mock-subject">Subject</label>
          <input id="mock-subject" className={inputCls} value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Science" maxLength={100} />
        </div>
        <div>
          <label className={labelCls}>Class</label>
          <select className={inputCls} value={grade} onChange={e => setGrade(e.target.value)}>
            {MOCK_CLASSES.map(g => <option key={g} value={g}>Class {g}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Language</label>
          <select className={inputCls} value={language} onChange={e => setLanguage(e.target.value)}>
            {LANGUAGES.map(l => <option key={l.name} value={l.name}>{l.name}{l.native !== l.name ? ` · ${l.native}` : ''}</option>)}
          </select>
        </div>
      </div>

      <div>
        <p className={labelCls}>Test length</p>
        <div role="radiogroup" aria-label="Test length" className="grid grid-cols-3 gap-2">
          {MOCK_LENGTH_LIST.map(l => (
            <button key={l} type="button" role="radio" aria-checked={length === l} onClick={() => setLength(l)}
              className={`rounded-xl border-2 p-3 text-left transition-colors ${length === l ? 'border-saffron bg-saffron/5' : 'border-card-border dark:border-dark-border hover:border-saffron/40'}`}>
              <p className={`font-heading font-semibold ${length === l ? 'text-saffron' : 'text-navy dark:text-dark-text'}`}>{MOCK_LENGTHS[l].label} · {MOCK_LENGTHS[l].minutes} min</p>
              <p className="text-xs text-muted mt-0.5">{lengthSummary(l)} · {lengthMarks(l)} marks</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className={labelCls}>Difficulty</p>
        <div className="flex flex-wrap gap-2">
          {MOCK_DIFFICULTY_LIST.map(d => (
            <button key={d} type="button" onClick={() => setDifficulty(d)} aria-pressed={difficulty === d} title={MOCK_DIFFICULTIES[d].hint}
              className={`px-4 h-10 rounded-xl text-sm font-semibold border-2 transition-colors ${difficulty === d ? 'border-saffron bg-saffron text-white' : 'border-card-border dark:border-dark-border text-navy dark:text-dark-text hover:border-saffron/50'}`}>
              {MOCK_DIFFICULTIES[d].label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div>
          <label className={labelCls} htmlFor="mock-topics">Chapters / topics {sources.length > 0 && <span className="normal-case font-normal">(optional with a syllabus)</span>}</label>
          <textarea id="mock-topics" className={`${textareaCls} min-h-[132px]`} value={topics} onChange={e => setTopics(e.target.value)} maxLength={4000}
            placeholder={'One per line, e.g.\nLight – reflection and refraction\nElectricity\nMagnetic effects of current'} />
        </div>
        <SourceUpload files={sources} onChange={setSources} disabled={busy} topic={`${subject} ${topics}`.trim()}
          hint="Upload your syllabus or notes (PDF, PPTX, DOCX, TXT) — questions will follow it." />
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy || !!missing} className="btn-saffron h-12 whitespace-nowrap px-7 text-base disabled:opacity-60 disabled:cursor-not-allowed">
          {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Writing your test…</> : <><Sparkles className="w-4 h-4" /> Create mock test</>}
        </button>
        <span className="text-xs text-muted">{busy ? 'Usually 30–90 seconds.' : missing}</span>
      </div>
    </form>
    <MockPreview subject={subject} grade={grade} minutes={MOCK_LENGTHS[length].minutes} summary={lengthSummary(length)} marks={lengthMarks(length)} />
    </div>
  );
}
