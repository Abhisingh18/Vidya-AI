'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Camera, Loader2, Sparkles, X } from 'lucide-react';
import type { Doubt, DoubtSummary } from '@/app/api/student/doubt/solver';
import { LANGUAGES } from '@/lib/languages';
import { speechCode } from '@/lib/speak';
import { api, ErrorNote, inputCls, labelCls, PageHeader, panelCls, Spinner, textareaCls } from '@/components/teacher/ui';
import DoubtPhoto, { type PhotoData } from './doubt-photo';
import DoubtResult from './doubt-result';
import DoubtHistory, { SubjectPill } from './doubt-history';
import VoiceInput from './voice-input';

const GRADES = ['3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'College'];
const LANG_KEY = 'vidyaai-doubt-language';
const GRADE_KEY = 'vidyaai-doubt-grade';
const MAX_TEXT = 2000;

const PHASES_PHOTO = ['Reading your photo…', 'Understanding the question…', 'Working out the steps…', 'Writing hints and a practice question…'];
const PHASES_TEXT = ['Reading your question…', 'Understanding the question…', 'Working out the steps…', 'Writing hints and a practice question…'];
const phaseAt = (s: number) => (s < 5 ? 0 : s < 14 ? 1 : s < 30 ? 2 : 3);

const store = {
  get(key: string) { try { return window.localStorage.getItem(key); } catch { return null; } },
  set(key: string, value: string) { try { window.localStorage.setItem(key, value); } catch { /* private mode */ } },
};

interface Current { id: string; doubt: Doubt }
type SolveError = { message: string; unreadable?: boolean };

export default function DoubtSolver({ initialId }: { initialId?: string }) {
  const [language, setLanguage] = useState('English');
  const [grade, setGrade] = useState('9');
  const [photo, setPhoto] = useState<PhotoData | null>(null);
  const [text, setText] = useState('');
  const [interim, setInterim] = useState('');
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<SolveError | null>(null);
  const [current, setCurrent] = useState<Current | null>(null);
  const [opening, setOpening] = useState<string | null>(initialId ?? null);
  const [history, setHistory] = useState<DoubtSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [xp, setXp] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  // Remembered language & class.
  useEffect(() => {
    const l = store.get(LANG_KEY);
    if (l && LANGUAGES.some(x => x.name === l)) setLanguage(l);
    const g = store.get(GRADE_KEY);
    if (g && GRADES.includes(g)) setGrade(g);
  }, []);
  const chooseLanguage = (l: string) => { setLanguage(l); store.set(LANG_KEY, l); };
  const chooseGrade = (g: string) => { setGrade(g); store.set(GRADE_KEY, g); };

  useEffect(() => {
    api<{ doubts: DoubtSummary[] }>('/api/student/doubt')
      .then(d => setHistory(d.doubts))
      .catch(err => setHistoryError((err as Error).message))
      .finally(() => setHistoryLoading(false));
  }, []);

  useEffect(() => {
    if (!busy) return;
    const started = Date.now();
    setElapsed(0);
    const t = window.setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => window.clearInterval(t);
  }, [busy]);

  useEffect(() => {
    if (!xp) return;
    const t = window.setTimeout(() => setXp(0), 4000);
    return () => window.clearTimeout(t);
  }, [xp]);

  const setUrl = (id: string | null) => {
    try { window.history.replaceState(window.history.state, '', id ? `/doubts?id=${encodeURIComponent(id)}` : '/doubts'); } catch { /* ignore */ }
  };
  const scrollTop = () => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const open = useCallback(async (id: string) => {
    setOpening(id);
    setError(null);
    try {
      const d = await api<{ id: string; doubt: Doubt }>(`/api/student/doubt/${encodeURIComponent(id)}`);
      setCurrent({ id: d.id, doubt: d.doubt });
      setUrl(d.id);
      scrollTop();
    } catch (err) {
      setError({ message: (err as Error).message });
      setUrl(null);
    } finally {
      setOpening(null);
    }
  }, []);

  useEffect(() => { if (initialId) open(initialId); }, [initialId, open]);

  const remove = async (id: string) => {
    try {
      await api(`/api/student/doubt/${encodeURIComponent(id)}`, { method: 'DELETE' });
      setHistory(h => h.filter(d => d.id !== id));
      if (current?.id === id) { setCurrent(null); setUrl(null); }
    } catch (err) {
      setHistoryError((err as Error).message);
    }
  };

  const fullText = [text.trim(), interim.trim()].filter(Boolean).join(' ');
  const ready = !!photo || text.replace(/\s/g, '').length >= 4;

  const solve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready || busy || listening) return;
    setBusy(true);
    setError(null);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch('/api/student/doubt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: photo?.dataUrl, text: text.trim(), language, grade }),
        signal: ctrl.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError({ message: data.error ?? 'Something went wrong. Please try again.', unreadable: data.code === 'unreadable' });
        return;
      }
      const { id, doubt, xp: gained } = data as { id: string; doubt: Doubt; xp?: number };
      setCurrent({ id, doubt });
      setHistory(h => [{
        id, title: doubt.question.split('\n')[0].slice(0, 90), subject: doubt.subject, topic: doubt.topic,
        grade: doubt.grade, language: doubt.language, createdAt: new Date().toISOString(),
      }, ...h.filter(d => d.id !== id)]);
      setXp(gained ?? 0);
      setPhoto(null);
      setText('');
      setUrl(id);
      scrollTop();
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setError({ message: 'Network error — check your internet and try again.' });
    } finally {
      abortRef.current = null;
      setBusy(false);
    }
  };

  const cancel = () => abortRef.current?.abort();
  const newDoubt = () => { setCurrent(null); setError(null); setUrl(null); scrollTop(); };

  const phases = photo ? PHASES_PHOTO : PHASES_TEXT;

  return (
    <div ref={topRef} className="scroll-mt-24">
      <PageHeader
        icon={<Camera className="w-5 h-5" />}
        title="Doubt Solver"
        subtitle="Snap a photo of any question — get hints first, then the full solution, in your language."
        action={current ? (
          <button type="button" onClick={newDoubt} className="btn-saffron !px-5 !py-2.5 text-sm self-start sm:self-auto">
            <Camera className="w-4 h-4" /> Ask another doubt
          </button>
        ) : undefined}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
        <div className="min-w-0">
          {xp > 0 && (
            <div role="status" className="mb-4 flex items-center gap-2 rounded-xl bg-teal/10 border border-teal/20 px-4 py-2.5 text-sm font-semibold text-teal-700 dark:text-teal-300 animate-fade-in">
              <Sparkles className="w-4 h-4" /> +{xp} XP — doubt solved!
            </div>
          )}

          {opening ? (
            <div className={panelCls}><Spinner label="Opening your doubt…" /></div>
          ) : current ? (
            <>
              <button type="button" onClick={newDoubt} className="lg:hidden mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-saffron">
                <ArrowLeft className="w-4 h-4" /> New doubt
              </button>
              <DoubtResult key={current.id} id={current.id} doubt={current.doubt} />
            </>
          ) : (
            <form onSubmit={solve} className={`${panelCls} p-4 sm:p-6 space-y-5`}>
              <DoubtPhoto photo={photo} onChange={p => { setPhoto(p); setError(null); }} disabled={busy} />

              <div>
                <label htmlFor="doubt-text" className={labelCls}>
                  {photo ? <>What are you stuck on? <span className="normal-case font-normal tracking-normal">(optional)</span></> : <>Or type / speak your question</>}
                </label>
                <div className="relative">
                  <textarea
                    id="doubt-text"
                    value={listening && interim ? fullText : text}
                    onChange={e => setText(e.target.value.slice(0, MAX_TEXT))}
                    readOnly={listening}
                    rows={3}
                    maxLength={MAX_TEXT}
                    disabled={busy}
                    placeholder={photo
                      ? 'e.g. I don’t understand how to find the second root'
                      : 'e.g. A train covers 240 km in 3 hours. Find its speed in m/s.'}
                    className={`${textareaCls} pr-16 ${listening ? 'border-red-300 dark:border-red-500/40' : ''}`}
                  />
                  <div className="absolute right-2 bottom-2.5">
                    <VoiceInput
                      lang={speechCode(language)}
                      onText={t => setText(v => (v.trim() ? `${v.trim()} ${t}` : t).slice(0, MAX_TEXT))}
                      onInterim={setInterim}
                      onListeningChange={setListening}
                      disabled={busy}
                      title={`Speak your doubt in ${language}`}
                    />
                  </div>
                </div>
                <p className="mt-1 text-[11px] text-muted text-right">{text.length}/{MAX_TEXT}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="doubt-language" className={labelCls}>Answer in</label>
                  <select id="doubt-language" className={inputCls} value={language} onChange={e => chooseLanguage(e.target.value)} disabled={busy}>
                    {LANGUAGES.map(l => (
                      <option key={l.name} value={l.name}>{l.name === 'English' ? 'English' : `${l.native} · ${l.name}`}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="doubt-grade" className={labelCls}>Class</label>
                  <select id="doubt-grade" className={inputCls} value={grade} onChange={e => chooseGrade(e.target.value)} disabled={busy}>
                    {GRADES.map(g => <option key={g} value={g}>{g === 'College' ? 'College' : `Class ${g}`}</option>)}
                  </select>
                </div>
              </div>

              {error && (
                <ErrorNote>
                  <p className="font-semibold">{error.message}</p>
                  {error.unreadable && (
                    <ul className="mt-1.5 list-disc pl-4 space-y-0.5 text-xs">
                      <li>Use good light and avoid shadows on the page.</li>
                      <li>Hold the phone steady, straight above the page.</li>
                      <li>Fit just one question in the photo — or type it instead.</li>
                    </ul>
                  )}
                </ErrorNote>
              )}

              {busy ? (
                <div className="rounded-xl bg-saffron/5 dark:bg-saffron/10 border border-saffron/20 p-4" role="status" aria-live="polite">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-saffron shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-navy dark:text-dark-text">{phases[phaseAt(elapsed)]}</p>
                      <p className="text-xs text-muted">{elapsed}s · usually 15–40 seconds. Keep this page open.</p>
                    </div>
                    <button type="button" onClick={cancel} className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-red-500">
                      <X className="w-3.5 h-3.5" /> Cancel
                    </button>
                  </div>
                  <div className="mt-3 h-1.5 rounded-full bg-saffron/10 overflow-hidden">
                    <div className="h-full bg-saffron rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(92, 8 + elapsed * 2.2)}%` }} />
                  </div>
                </div>
              ) : (
                <button type="submit" disabled={!ready || listening} className="btn-saffron w-full sm:w-auto disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100">
                  <Sparkles className="w-4 h-4" /> Solve my doubt
                </button>
              )}
              {!busy && !ready && (
                <p className="text-xs text-muted -mt-2">Add a photo, or type at least a few words of your question.</p>
              )}
            </form>
          )}

          {!current && !opening && history[0] && (
            <p className="mt-3 text-xs text-muted flex flex-wrap items-center gap-1.5">
              Last solved: <button type="button" onClick={() => open(history[0].id)} className="font-semibold text-saffron hover:underline truncate max-w-[60vw] sm:max-w-xs">{history[0].title}</button>
              <SubjectPill subject={history[0].subject} />
            </p>
          )}
        </div>

        <aside className="lg:sticky lg:top-8">
          <DoubtHistory
            items={history}
            loading={historyLoading}
            error={historyError}
            activeId={current?.id ?? null}
            onOpen={open}
            onDelete={remove}
          />
        </aside>
      </div>
    </div>
  );
}
