'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUp, Camera, GraduationCap, History, ImagePlus, Languages, Loader2, Sparkles, X } from 'lucide-react';
import type { Doubt, DoubtSummary } from '@/app/api/student/doubt/solver';
import { LANGUAGES } from '@/lib/languages';
import { speechCode } from '@/lib/speak';
import { api, ErrorNote, panelCls, Spinner } from '@/components/teacher/ui';
import Pill from '@/components/generate/pill';
import { LogoMark } from '@/components/brand/logo';
import { compressImage, type PhotoData } from './doubt-photo';
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
/** What the student sent (the chat bubble above the answer). */
interface Sent { text: string; photo: string | null }

const gradeName = (g: string) => (g === 'College' ? 'College' : `Class ${g}`);
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
  const [pending, setPending] = useState<Sent | null>(null);
  const [sent, setSent] = useState<Record<string, Sent>>({});
  const [historyOpen, setHistoryOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

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
    const asked: Sent = { text: text.trim(), photo: photo?.dataUrl ?? null };
    setPending(asked);
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
      setSent(m => ({ ...m, [id]: asked }));
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
      setPending(null);
    }
  };

  const cancel = () => abortRef.current?.abort();
  const newDoubt = () => { setCurrent(null); setError(null); setUrl(null); scrollTop(); };

  const phases = pending?.photo ? PHASES_PHOTO : PHASES_TEXT;
  const idle = !current && !opening && !busy;

  // grow the input with its text
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(200, el.scrollHeight)}px`;
  }, [text, interim]);

  const takeFile = async (file: File | undefined | null) => {
    if (!file) return;
    try { setPhoto(await compressImage(file)); setError(null); }
    catch (err) { setError({ message: (err as Error).message }); }
  };

  const composer = (docked: boolean) => (
    <form ref={formRef} onSubmit={solve}
      onDragOver={e => { if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); setDragging(true); } }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); void takeFile(e.dataTransfer.files?.[0]); }}
      className={`relative rounded-[28px] border bg-white/95 p-2.5 text-left shadow-[0_24px_60px_-24px_rgba(26,26,46,0.35)] backdrop-blur-xl transition-colors focus-within:border-saffron/60 dark:bg-dark-surface/95 ${
        dragging ? 'border-saffron ring-4 ring-saffron/15' : 'border-card-border dark:border-dark-border'} ${docked ? '' : 'sm:p-3'}`}>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { void takeFile(e.target.files?.[0]); e.target.value = ''; }} />
      <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={e => { void takeFile(e.target.files?.[0]); e.target.value = ''; }} />
      {photo && (
        <div className="flex items-center gap-3 px-2 pt-1">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.dataUrl} alt="Your question" className="h-16 w-16 rounded-xl object-cover ring-1 ring-card-border dark:ring-dark-border" />
            <button type="button" onClick={() => setPhoto(null)} disabled={busy} aria-label="Remove photo"
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-navy text-white shadow dark:bg-white dark:text-navy"><X className="h-3 w-3" /></button>
          </div>
          <p className="text-xs text-muted">Photo ready · {Math.round(photo.bytes / 1024)} KB<br />Add what you’re stuck on (optional)</p>
        </div>
      )}
      <textarea ref={inputRef} rows={1} id="doubt-text"
        value={listening && interim ? fullText : text}
        onChange={e => setText(e.target.value.slice(0, MAX_TEXT))}
        onPaste={e => {
          const file = Array.from(e.clipboardData.files ?? []).find(f => f.type.startsWith('image/'));
          if (file) { e.preventDefault(); void takeFile(file); }
        }}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); formRef.current?.requestSubmit(); } }}
        readOnly={listening} maxLength={MAX_TEXT} disabled={busy}
        placeholder={photo ? 'e.g. I don’t understand how to find the second root' : 'Type your question, or snap / paste a photo of it…'}
        aria-label="Your question"
        className={`block max-h-[200px] min-h-[52px] w-full resize-none bg-transparent px-3 py-3 text-base text-navy outline-none placeholder:text-muted/60 dark:text-dark-text ${listening ? 'text-red-500' : ''}`} />
      <div className="flex flex-wrap items-center gap-1.5 px-1">
        <button type="button" onClick={() => cameraRef.current?.click()} disabled={busy} title="Take a photo of the question"
          className="flex h-9 items-center gap-1.5 rounded-full border border-card-border px-3 text-xs font-semibold text-navy transition-all hover:border-saffron/50 hover:text-saffron disabled:opacity-50 dark:border-dark-border dark:text-dark-text">
          <Camera className="h-4 w-4 text-saffron" /> <span className="hidden sm:inline">Photo</span>
        </button>
        <button type="button" onClick={() => uploadRef.current?.click()} disabled={busy} title="Upload an image"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-card-border text-muted transition-all hover:border-saffron/50 hover:text-saffron disabled:opacity-50 dark:border-dark-border">
          <ImagePlus className="h-4 w-4" />
        </button>
        <VoiceInput compact lang={speechCode(language)} disabled={busy} title={`Speak your doubt in ${language}`}
          onText={t => setText(v => (v.trim() ? `${v.trim()} ${t}` : t).slice(0, MAX_TEXT))}
          onInterim={setInterim} onListeningChange={setListening} />
        <Pill icon={<Languages className="h-3.5 w-3.5" />} title="Answer in" up={docked} wide disabled={busy}
          label={language} value={language} onChange={chooseLanguage}
          options={LANGUAGES.map(l => ({ value: l.name, label: l.name, hint: l.native }))} />
        <Pill icon={<GraduationCap className="h-3.5 w-3.5" />} title="Class" up={docked} disabled={busy}
          label={gradeName(grade)} value={grade} onChange={chooseGrade}
          options={GRADES.map(g => ({ value: g, label: gradeName(g) }))} />
        <button type="submit" disabled={!ready || busy || listening} aria-label="Solve my doubt" title="Solve (Enter)"
          className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-saffron text-white shadow-saffron transition-all hover:scale-105 disabled:cursor-not-allowed disabled:bg-card-border disabled:text-muted disabled:shadow-none dark:disabled:bg-dark-border">
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowUp className="h-5 w-5" />}
        </button>
      </div>
      {dragging && <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-[28px] bg-saffron/10 text-sm font-semibold text-saffron">Drop the photo here</div>}
    </form>
  );

  const errorNote = error && (
    <div className="mb-3">
      <ErrorNote>
        <p className="font-semibold">{error.message}</p>
        {error.unreadable && (
          <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-xs">
            <li>Use good light and avoid shadows on the page.</li>
            <li>Hold the phone steady, straight above the page.</li>
            <li>Fit just one question in the photo — or type it instead.</li>
          </ul>
        )}
      </ErrorNote>
    </div>
  );

  const bubble = (q: Sent) => (
    <div className="flex justify-end animate-fade-in">
      <div className="max-w-[85%] space-y-2 rounded-3xl rounded-br-md bg-navy px-4 py-3 text-white shadow-card dark:bg-dark-surface">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {q.photo && <img src={q.photo} alt="Your question" className="max-h-56 rounded-2xl object-contain" />}
        {q.text && <p className="whitespace-pre-line text-sm font-medium" dir="auto">{q.text}</p>}
        <p className="text-[11px] text-white/60">🌐 {language} · 🎓 {gradeName(grade)}</p>
      </div>
    </div>
  );

  return (
    <main ref={topRef} className="min-h-screen scroll-mt-24 bg-off-white px-3 pb-3 pt-20 sm:px-5 lg:pt-5 dark:bg-dark-bg">
      {/* the whole doubt solver sits in one box that fills the screen */}
      <div className="relative mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-6xl flex-col rounded-3xl border border-card-border bg-white shadow-card lg:min-h-[calc(100vh-2.5rem)] dark:border-dark-border dark:bg-dark-surface dark:shadow-card-dark">
      {xp > 0 && (
        <div role="status" className="fixed left-1/2 top-6 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white shadow-lg animate-fade-in">
          <Sparkles className="h-4 w-4 text-saffron" /> +{xp} XP — doubt solved!
        </div>
      )}

      {/* history */}
      <div className="absolute right-4 top-4 z-30 sm:right-6">
        <button type="button" onClick={() => setHistoryOpen(o => !o)} aria-expanded={historyOpen}
          className="inline-flex items-center gap-1.5 rounded-full border border-card-border bg-white/90 px-3.5 py-2 text-xs font-semibold text-navy shadow-sm backdrop-blur transition-colors hover:border-saffron/50 hover:text-saffron dark:border-dark-border dark:bg-dark-surface/90 dark:text-dark-text">
          <History className="h-4 w-4" /> My doubts{history.length ? ` · ${history.length}` : ''}
        </button>
      </div>
      {historyOpen && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <button type="button" aria-label="Close history" className="absolute inset-0 bg-navy/30 backdrop-blur-[2px]" onClick={() => setHistoryOpen(false)} />
          <div className="relative h-full w-[min(92vw,380px)] overflow-y-auto bg-off-white p-4 pt-20 shadow-2xl animate-fade-in dark:bg-dark-bg lg:pt-6">
            <button type="button" onClick={() => setHistoryOpen(false)} aria-label="Close" className="absolute right-4 top-4 rounded-full p-1.5 text-muted hover:bg-white hover:text-navy dark:hover:bg-dark-surface"><X className="h-5 w-5" /></button>
            <DoubtHistory items={history} loading={historyLoading} error={historyError} activeId={current?.id ?? null}
              onOpen={id => { setHistoryOpen(false); void open(id); }} onDelete={remove} />
          </div>
        </div>
      )}

      <div className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 pt-16 sm:px-6">
        {idle ? (
          <section className="flex flex-1 flex-col items-center justify-center pb-16 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-saffron/20 bg-white/80 px-3 py-1 text-xs font-medium text-saffron backdrop-blur dark:bg-dark-surface/80">
              <Camera className="h-3 w-3" /> Doubt solver
            </div>
            <h1 className="mt-5 font-heading text-4xl font-extrabold tracking-tight text-navy sm:text-5xl dark:text-dark-text">
              Stuck on a <span className="text-gradient-saffron">question</span>?
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-muted">
              Snap a photo, paste a screenshot, type it or just say it — get hints first, then the full solution, in your language.
            </p>
            <div className="relative z-20 mt-8 w-full max-w-3xl">
              {errorNote}
              {composer(false)}
              <p className="mt-2.5 text-center text-[11px] text-muted">📷 One question per photo works best · Enter to send, Shift + Enter for a new line · drag & drop or Ctrl/⌘ + V a picture</p>
            </div>
            {history.length > 0 && (
              <div className="mt-6 flex w-full max-w-3xl flex-wrap items-center justify-center gap-2 text-xs text-muted">
                <span>Recent:</span>
                {history.slice(0, 3).map(h => (
                  <button key={h.id} type="button" onClick={() => void open(h.id)}
                    className="inline-flex max-w-[16rem] items-center gap-1.5 rounded-full border border-card-border bg-white/80 px-3 py-1 text-navy hover:border-saffron/40 hover:text-saffron dark:border-dark-border dark:bg-dark-surface/80 dark:text-dark-text">
                    <SubjectPill subject={h.subject} /><span className="truncate">{h.title}</span>
                  </button>
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            <div className="space-y-6 pb-6">
              {busy && pending && bubble(pending)}
              {!busy && current && sent[current.id] && bubble(sent[current.id])}
              <div className="flex gap-3">
                <LogoMark size={36} className="mt-1 hidden shrink-0 sm:block" />
                <div className="min-w-0 flex-1">
                  {opening ? (
                    <div className={panelCls}><Spinner label="Opening your doubt…" /></div>
                  ) : busy ? (
                    <div className={`${panelCls} p-4`} role="status" aria-live="polite">
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 shrink-0 animate-spin text-saffron" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-navy dark:text-dark-text">{phases[phaseAt(elapsed)]}</p>
                          <p className="text-xs text-muted">{elapsed}s · usually 15–40 seconds. Keep this page open.</p>
                        </div>
                        <button type="button" onClick={cancel} className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-muted hover:text-red-500">
                          <X className="h-3.5 w-3.5" /> Cancel
                        </button>
                      </div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-saffron/10">
                        <div className="h-full rounded-full bg-saffron transition-all duration-1000 ease-out" style={{ width: `${Math.min(92, 8 + elapsed * 2.2)}%` }} />
                      </div>
                    </div>
                  ) : current && (
                    <DoubtResult key={current.id} id={current.id} doubt={current.doubt} />
                  )}
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 z-30 -mx-4 mt-auto bg-gradient-to-t from-white via-white/95 to-transparent px-4 pb-4 pt-10 sm:-mx-6 sm:px-6 dark:from-dark-surface dark:via-dark-surface/95">
              {errorNote}
              {!busy && current && (
                <div className="mb-2 flex justify-center">
                  <button type="button" onClick={newDoubt} className="inline-flex items-center gap-1.5 rounded-full border border-card-border bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-navy shadow-sm hover:border-saffron/50 hover:text-saffron dark:border-dark-border dark:bg-dark-surface/90 dark:text-dark-text">
                    <Sparkles className="h-3.5 w-3.5 text-saffron" /> New doubt
                  </button>
                </div>
              )}
              {composer(true)}
              <p className="mt-2 text-center text-[11px] text-muted">VidyaAI can make mistakes — check the steps with your teacher or textbook.</p>
            </div>
          </>
        )}
      </div>
      </div>
    </main>
  );
}
