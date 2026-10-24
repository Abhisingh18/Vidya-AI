'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Paperclip, Sparkles } from 'lucide-react';
import {
  lengthMarks, lengthSummary, MOCK_CLASSES, MOCK_DIFFICULTIES, MOCK_DIFFICULTY_LIST, MOCK_LENGTH_LIST, MOCK_LENGTHS,
  type MockDifficulty, type MockLength,
} from '@/lib/mock';
import { LANGUAGES } from '@/lib/languages';
import type { SourceFile } from '@/lib/source';
import SourceUpload from '@/components/teacher/source-upload';
import { api, ErrorNote, inputCls, labelCls, textareaCls } from '@/components/teacher/ui';

export default function MockCreateForm({ defaultTopics = '', defaultSubject = '', defaultLength }: { defaultTopics?: string; defaultSubject?: string; defaultLength?: string }) {
  const router = useRouter();
  const [subject, setSubject] = useState(defaultSubject);
  const [grade, setGrade] = useState('10');
  const [language, setLanguage] = useState('English');
  const [length, setLength] = useState<MockLength>(MOCK_LENGTH_LIST.includes(defaultLength as MockLength) ? defaultLength as MockLength : 'standard');
  const [difficulty, setDifficulty] = useState<MockDifficulty>('balanced');
  const [topics, setTopics] = useState(defaultTopics);
  const [sources, setSources] = useState<SourceFile[]>([]);
  const [attach, setAttach] = useState(false);
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

  const seg = (on: boolean) => `h-10 flex-1 rounded-lg px-3 text-sm font-semibold transition-all ${on ? 'bg-white text-saffron shadow-sm dark:bg-dark-surface' : 'text-muted hover:text-navy dark:hover:text-dark-text'}`;
  const track = 'flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-dark-bg';

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-6">
      <div>
        <label className={labelCls} htmlFor="mock-subject">Subject</label>
        <input id="mock-subject" className={`${inputCls} !h-12 text-base`} value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Science" maxLength={100} />
      </div>

      <div>
        <label className={labelCls} htmlFor="mock-topics">Chapters or topics {sources.length > 0 && <span className="normal-case font-normal">(optional)</span>}</label>
        <textarea id="mock-topics" className={`${textareaCls} min-h-[104px]`} value={topics} onChange={e => setTopics(e.target.value)} maxLength={4000}
          placeholder={'One per line — e.g. Light, Electricity'} />
        <button type="button" onClick={() => setAttach(a => !a)} className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-saffron hover:underline">
          <Paperclip className="h-4 w-4" /> {attach || sources.length ? 'Syllabus or notes' : 'Attach syllabus or notes'}{sources.length ? ` · ${sources.length}` : ''}
        </button>
        {(attach || sources.length > 0) && (
          <div className="mt-3 rounded-2xl border border-card-border bg-off-white/70 p-3 dark:border-dark-border dark:bg-dark-bg/60">
            <SourceUpload files={sources} onChange={setSources} disabled={busy} topic={`${subject} ${topics}`.trim()} hint="" />
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className={labelCls}>Length</p>
          <div role="radiogroup" aria-label="Test length" className={track}>
            {MOCK_LENGTH_LIST.map(l => (
              <button key={l} type="button" role="radio" aria-checked={length === l} onClick={() => setLength(l)} className={seg(length === l)}>{MOCK_LENGTHS[l].minutes} min</button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-muted">{lengthSummary(length)} · {lengthMarks(length)} marks</p>
        </div>
        <div>
          <p className={labelCls}>Difficulty</p>
          <div role="radiogroup" aria-label="Difficulty" className={track}>
            {MOCK_DIFFICULTY_LIST.map(d => (
              <button key={d} type="button" role="radio" aria-checked={difficulty === d} onClick={() => setDifficulty(d)} title={MOCK_DIFFICULTIES[d].hint} className={seg(difficulty === d)}>{MOCK_DIFFICULTIES[d].label}</button>
            ))}
          </div>
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
        <span className="min-h-[1rem] text-xs text-muted">{busy ? 'Usually 30–90 seconds.' : missing}</span>
      </div>
    </form>
  );
}
