'use client';

// /flashcards/[id]: study a deck (due reviews first, then new cards) with
// spaced repetition, or browse/edit its cards. Every grade is saved right away
// (PATCH with only the graded cards; the server runs the same SM-2 schedule).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, BookOpen, CalendarCheck, Check, Clapperboard, CloudOff, FileText, Flame, Layers, Loader2,
  NotebookText, PartyPopper, Play, Repeat, Shuffle, Sparkles, Trophy,
} from 'lucide-react';
import {
  addDays, dueSummary, formatInterval, GRADE_LABEL, isNewCard, localToday, previewIntervals, schedule,
  shuffleQueue, studyQueue, type DeckContent, type Flashcard, type Grade, type ReviewInput,
} from '@/lib/flashcards';
import { langCode } from '@/lib/languages';
import { api, ErrorNote, panelCls, Spinner, TeacherPage } from '@/components/teacher/ui';
import PageHero from '@/components/ui/page-hero';
import Confetti from '@/components/ui/confetti';
import ScoreRing from '@/components/ui/score-ring';
import FlashcardCard from './flashcard-card';
import FlashcardBrowse, { type CardText } from './flashcard-browse';
import { nextLabel } from './flashcard-deck-list';

interface Deck extends DeckContent { id: string; title: string; topic: string; grade: string; language: string }
interface PatchResult { cards: Flashcard[]; xp: number }

interface Session {
  queue: string[];
  pos: number;
  practice: boolean;
  counts: [number, number, number, number];
  firstTry: Record<string, Grade>;
  startedAt: number;
  done: boolean;
  xp: number | null;
}

const GRADE_STYLE: Record<Grade, string> = {
  1: 'border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300 hover:border-rose-400',
  2: 'border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:border-amber-400',
  3: 'border-teal-200 dark:border-teal-500/30 bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 hover:border-teal-400',
  4: 'border-indigo-brand-200 dark:border-indigo-brand/40 bg-indigo-brand-50 dark:bg-indigo-brand/15 text-indigo-brand dark:text-indigo-brand-200 hover:border-indigo-brand-400',
};
const GRADE_BAR: Record<Grade, string> = { 1: 'bg-rose-500', 2: 'bg-amber-500', 3: 'bg-teal', 4: 'bg-indigo-brand' };
const SOURCE_ICON = { video: Clapperboard, upload: FileText, notes: NotebookText, topic: Layers } as const;
/** "Again" brings a card back after this many other cards. */
const AGAIN_GAP = 3;

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName));

export default function FlashcardStudy({ id }: { id: string }) {
  const [deck, setDeck] = useState<Deck | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [today] = useState(localToday);
  const [mode, setMode] = useState<'study' | 'browse'>('study');
  const [session, setSession] = useState<Session | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>('saved');
  const [speaking, setSpeaking] = useState(false);
  const [title, setTitle] = useState('');
  const [combo, setCombo] = useState(0);

  const url = `/api/student/flashcards/${id}`;
  const pending = useRef<ReviewInput[]>([]);
  const chain = useRef<Promise<unknown>>(Promise.resolve());
  const titleTimer = useRef<ReturnType<typeof setTimeout>>();

  const byId = useMemo(() => new Map((deck?.cards ?? []).map(c => [c.id, c])), [deck]);

  const newSession = useCallback((cards: Flashcard[], practice: boolean, shuffled: boolean): Session => {
    let queue = practice ? cards : studyQueue(cards, today);
    if (shuffled) queue = shuffleQueue(queue);
    return { queue: queue.map(c => c.id), pos: 0, practice, counts: [0, 0, 0, 0], firstTry: {}, startedAt: Date.now(), done: false, xp: null };
  }, [today]);

  useEffect(() => {
    api<{ deck: Deck }>(url)
      .then(({ deck }) => { setDeck(deck); setTitle(deck.title); setSession(newSession(deck.cards, false, false)); })
      .catch(e => setLoadError(e.message));
  }, [url, newSession]);

  // ── Saving: every request goes through one chain so edits never race reviews.
  const send = useCallback((make: () => Record<string, unknown> | null) => {
    const run = chain.current.catch(() => undefined).then(async () => {
      const body = make();
      if (!body) return null;
      setSaveState('saving');
      const res = await api<PatchResult>(url, { method: 'PATCH', json: { today, ...body } });
      const stillPending = new Set(pending.current.map(r => r.id));
      setDeck(d => {
        if (!d) return d;
        const fresh = new Map(res.cards.filter(c => !stillPending.has(c.id)).map(c => [c.id, c]));
        const known = new Set(d.cards.map(c => c.id));
        return { ...d, cards: [...d.cards.map(c => fresh.get(c.id) ?? c), ...res.cards.filter(c => !known.has(c.id))] };
      });
      setSaveState(pending.current.length ? 'saving' : 'saved');
      return res;
    });
    chain.current = run;
    return run;
  }, [url, today]);

  const failures = useRef(0);
  const sendReviews = useCallback((extra: Record<string, unknown> = {}) => {
    let taken: ReviewInput[] = [];
    return send(() => {
      taken = pending.current;
      pending.current = [];
      if (!taken.length && !extra.finish) return null;
      return { reviews: taken, ...extra };
    }).then(res => { failures.current = 0; return res; }, err => {
      // Put the grades back (in order) so the next save retries them.
      pending.current = [...taken, ...pending.current];
      failures.current++;
      setSaveState('error');
      throw err;
    });
  }, [send]);

  const retry = useCallback(() => { void sendReviews().catch(() => undefined); }, [sendReviews]);

  // Retry failed saves a few times on their own; after that the "retry" link stays.
  useEffect(() => {
    if (saveState !== 'error' || failures.current > 3) return;
    const t = setTimeout(retry, 5000);
    return () => clearTimeout(t);
  }, [saveState, retry]);

  // ── Studying
  const current = session && !session.done ? byId.get(session.queue[session.pos]) ?? null : null;

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  const finish = useCallback(async (s: Session) => {
    stopSpeaking();
    if (s.practice) return;
    try {
      const res = await sendReviews({ finish: true });
      setSession(x => (x && x.done ? { ...x, xp: res?.xp ?? 0 } : x));
    } catch { /* shown by the save indicator; grades stay pending */ }
  }, [sendReviews]);

  const grade = useCallback((g: Grade) => {
    if (!session || !current || !flipped) return;
    const cardId = current.id;
    if (!session.practice) {
      pending.current.push({ id: cardId, grade: g });
      setDeck(d => d && ({ ...d, cards: d.cards.map(c => (c.id === cardId ? { ...c, srs: schedule(c.srs, g, today) } : c)) }));
      sendReviews().catch(() => undefined); // kept in `pending` and retried
    }
    const queue = [...session.queue];
    if (g === 1) queue.splice(Math.min(queue.length, session.pos + 1 + AGAIN_GAP), 0, cardId);
    const counts = [...session.counts] as Session['counts'];
    counts[g - 1]++;
    const next: Session = {
      ...session, queue, counts, pos: session.pos + 1,
      firstTry: cardId in session.firstTry ? session.firstTry : { ...session.firstTry, [cardId]: g },
    };
    next.done = next.pos >= queue.length;
    stopSpeaking();
    setFlipped(false);
    setCombo(c => (g >= 2 ? c + 1 : 0));
    setSession(next);
    if (next.done) void finish(next);
  }, [session, current, flipped, today, sendReviews, finish]);

  const speak = useCallback(() => {
    if (!current || typeof window === 'undefined' || !window.speechSynthesis || !deck) return;
    if (speaking) { stopSpeaking(); return; }
    const text = flipped ? `${current.back}. ${current.example}` : current.front;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = langCode(deck.language);
    const voice = window.speechSynthesis.getVoices().find(v => v.lang === u.lang) ?? window.speechSynthesis.getVoices().find(v => v.lang.startsWith(u.lang.slice(0, 2)));
    if (voice) u.voice = voice;
    u.rate = 0.95;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    setSpeaking(true);
  }, [current, flipped, deck, speaking]);

  useEffect(() => () => { if (typeof window !== 'undefined') window.speechSynthesis?.cancel(); }, []);

  // Keyboard: Space flips, 1–4 grade.
  useEffect(() => {
    if (mode !== 'study' || !current) return;
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        stopSpeaking();
        setFlipped(f => !f);
      } else if (flipped && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        grade(Number(e.key) as Grade);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, current, flipped, grade]);

  // Save anything pending when leaving.
  useEffect(() => () => {
    clearTimeout(titleTimer.current);
    if (pending.current.length) {
      void fetch(url, { method: 'PATCH', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ today, reviews: pending.current }) });
    }
  }, [url, today]);

  const onTitle = (t: string) => {
    setTitle(t);
    clearTimeout(titleTimer.current);
    if (!t.trim()) return;
    titleTimer.current = setTimeout(() => { void send(() => ({ title: t })).then(() => setDeck(d => d && { ...d, title: t })).catch(() => setSaveState('error')); }, 700);
  };

  const shuffleNow = () => {
    const on = !shuffle;
    setShuffle(on);
    if (!on || !session || session.done) return;
    const done = session.queue.slice(0, session.pos);
    const rest = session.queue.slice(session.pos).map(x => byId.get(x)).filter((c): c is Flashcard => !!c);
    setFlipped(false);
    setSession({ ...session, queue: [...done, ...shuffleQueue(rest).map(c => c.id)] });
  };

  const restart = (practice: boolean) => {
    if (!deck) return;
    setFlipped(false);
    setSession(newSession(deck.cards, practice, shuffle || practice));
    setMode('study');
  };

  // ── Browse edits
  const saveCard = async (c: CardText) => {
    await send(() => ({ cards: [{ id: c.id, kind: c.kind, front: c.front, back: c.back, example: c.example, emoji: c.emoji }] }));
  };
  const deleteCard = async (cardId: string) => {
    await send(() => ({ deleted: [cardId] }));
    setDeck(d => d && ({ ...d, cards: d.cards.filter(c => c.id !== cardId) }));
    setSession(s => s && ({ ...s, queue: s.queue.filter((x, i) => i < s.pos || x !== cardId) }));
  };
  const resetDeck = async () => {
    await send(() => ({ reset: true }));
    setSession(null);
  };
  // Browse changes (new cards, reset) feed the next study session.
  useEffect(() => {
    if (mode === 'study' && deck && !session) setSession(newSession(deck.cards, false, shuffle));
  }, [mode, deck, session, newSession, shuffle]);

  if (loadError) return <TeacherPage><ErrorNote>{loadError}</ErrorNote><Link href="/flashcards" className="btn-outline mt-4">All decks</Link></TeacherPage>;
  if (!deck || !session) return <TeacherPage><Spinner label="Loading your deck…" /></TeacherPage>;

  const summary = dueSummary(deck.cards, today);
  const SourceIcon = SOURCE_ICON[deck.source?.kind ?? 'topic'];
  const progress = session.queue.length ? Math.round((Math.min(session.pos, session.queue.length) / session.queue.length) * 100) : 0;
  const intervals = current ? previewIntervals(current.srs, today) : null;

  return (
    <TeacherPage>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-5 overflow-hidden rounded-3xl shadow-card">
          <PageHero icon={<Layers />} glyphs={['?', '💡', '🧠', '✓', '⭐', '🔁', '∑', '📚']} title={title}
            eyebrow={<Link href="/flashcards" className="inline-flex items-center gap-1.5 hover:text-white"><ArrowLeft className="h-3.5 w-3.5" /> All decks</Link>}
            titleNode={<input value={title} onChange={e => onTitle(e.target.value)} aria-label="Deck title" maxLength={200} dir="auto"
              className="w-full truncate border-b-2 border-transparent bg-transparent font-heading text-2xl font-extrabold tracking-tight text-white outline-none focus:border-saffron/60 sm:text-3xl" />}
            stats={[{ label: 'cards', value: deck.cards.length }, { label: 'due today', value: summary.due }]}>
            <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-white/70">
              <SourceIcon className="h-3.5 w-3.5" />
              {deck.source?.kind === 'video' ? <>From video <Link href={`/library/${deck.source.refId}`} className="max-w-[12rem] truncate text-saffron hover:underline">{deck.source.label}</Link> ·</> : null}
              {deck.source?.kind === 'notes' ? <>From notes <Link href={`/notes/${deck.source.refId}`} className="max-w-[12rem] truncate text-saffron hover:underline">{deck.source.label}</Link> ·</> : null}
              <span>Class {deck.grade} · {deck.language}</span>
              <SaveBadge state={saveState} onRetry={retry} />
            </p>
          </PageHero>
        </div>

        <div className="mb-6 flex items-center gap-2">
          <div role="tablist" aria-label="Mode" className="inline-flex rounded-xl border border-card-border bg-off-white p-1 dark:border-dark-border dark:bg-dark-bg">
            {(['study', 'browse'] as const).map(m => (
              <button key={m} role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setFlipped(false); stopSpeaking(); }}
                className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold transition-all ${mode === m ? 'bg-white text-saffron shadow-card dark:bg-dark-surface' : 'text-muted hover:text-navy dark:hover:text-dark-text'}`}>
                {m === 'study' ? <><Play className="h-4 w-4" /> Study</> : <><BookOpen className="h-4 w-4" /> Browse</>}
              </button>
            ))}
          </div>
          {mode === 'study' && combo >= 2 && (
            <span key={combo} className="ph-pop inline-flex items-center gap-1.5 rounded-full bg-saffron/10 px-3 py-1.5 text-sm font-bold text-saffron" data-testid="combo">
              <span className="ph-flame">🔥</span> {combo} in a row
            </span>
          )}
          {mode === 'study' && (
            <button onClick={shuffleNow} aria-pressed={shuffle} title="Shuffle the cards"
              className={`ml-auto inline-flex h-9 items-center gap-1.5 rounded-xl border-2 px-3.5 text-sm font-semibold transition-colors ${shuffle ? 'border-saffron bg-saffron/10 text-saffron' : 'border-card-border text-muted hover:border-saffron/50 hover:text-saffron dark:border-dark-border'}`}>
              <Shuffle className="h-4 w-4" /> Shuffle{shuffle ? ' on' : ''}
            </button>
          )}
        </div>

        {mode === 'browse' && (
          <FlashcardBrowse cards={deck.cards} today={today} onSave={saveCard} onDelete={deleteCard} onReset={resetDeck} />
        )}

        {mode === 'study' && current && intervals && (
          <div data-testid="study" className="relative overflow-hidden rounded-3xl bg-[#1a1a2e] p-4 sm:p-7">
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div className="gen-aurora absolute -left-16 -top-24 h-72 w-72 rounded-full bg-saffron/30 blur-[100px]" />
              <div className="gen-aurora absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-indigo-brand/30 blur-[100px] [animation-delay:-8s]" />
              <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '44px 44px' }} />
            </div>
            <div className="relative">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-white/70">
              <span>
                {session.practice ? 'Practice round · doesn’t change your schedule' : isNewCard(current) ? 'New card' : 'Review'}
              </span>
              <span data-testid="progress-label">{session.pos + 1} / {session.queue.length}</span>
            </div>
            <div className="mb-5 h-2.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Session progress">
              <div className="h-full rounded-full bg-gradient-to-r from-saffron to-rose-400 shadow-[0_0_12px_rgba(255,107,26,0.8)] transition-[width] duration-500 ease-out" style={{ width: `${progress}%` }} />
            </div>

            <div key={`${current.id}-${session.pos}`} className="animate-fade-in">
              <FlashcardCard card={current} flipped={flipped} onFlip={() => { stopSpeaking(); setFlipped(f => !f); }} onSpeak={speak} speaking={speaking} />
            </div>

            <div className="mt-5 min-h-[76px]">
              {!flipped ? (
                <button onClick={() => setFlipped(true)} className="btn-saffron ph-pulse w-full !py-4 text-base" data-testid="show-answer">
                  Show answer <kbd className="hidden sm:inline font-mono text-[11px] px-1.5 py-0.5 rounded bg-white/20">Space</kbd>
                </button>
              ) : (
                <div className="grid grid-cols-4 gap-2 sm:gap-3 animate-fade-in" role="group" aria-label="How well did you remember?">
                  {([1, 2, 3, 4] as Grade[]).map(g => (
                    <button key={g} onClick={() => grade(g)} data-testid={`grade-${g}`}
                      className={`rounded-2xl border-2 py-2.5 sm:py-3 px-1 flex flex-col items-center gap-0.5 font-heading transition-all active:scale-95 ${GRADE_STYLE[g]}`}>
                      <span className="text-sm sm:text-base font-bold">{GRADE_LABEL[g]}</span>
                      <span className="text-[11px] sm:text-xs font-medium opacity-80 whitespace-nowrap">{formatInterval(intervals[g - 1])}</span>
                      <kbd className="hidden sm:block font-mono text-[10px] opacity-60">{g}</kbd>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="mt-4 hidden text-center text-xs text-white/50 sm:block">Space to flip · 1 Again · 2 Hard · 3 Good · 4 Easy</p>
            </div>
          </div>
        )}

        {mode === 'study' && session.done && (
          <SessionSummary session={session} deck={deck} today={today} saveState={saveState}
            onPractice={() => restart(true)} onBrowse={() => setMode('browse')} />
        )}

        {mode === 'study' && !session.done && !current && (
          <div className={`${panelCls} p-8 sm:p-10 text-center`} data-testid="caught-up">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-teal/10 text-teal flex items-center justify-center"><CalendarCheck className="w-8 h-8" /></div>
            <h2 className="text-xl font-heading font-bold text-navy dark:text-dark-text">All caught up for today!</h2>
            <p className="text-muted mt-1">{nextLabel(summary.next, today)}. Spaced repetition works best when you come back then.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
              <button onClick={() => restart(true)} className="btn-saffron"><Repeat className="w-4 h-4" /> Practice all {deck.cards.length} cards</button>
              <button onClick={() => setMode('browse')} className="btn-outline"><BookOpen className="w-4 h-4" /> Browse cards</button>
            </div>
          </div>
        )}
      </div>
    </TeacherPage>
  );
}

function SaveBadge({ state, onRetry }: { state: 'saved' | 'saving' | 'error'; onRetry: () => void }) {
  if (state === 'saving') return <span className="inline-flex items-center gap-1">· <Loader2 className="w-3 h-3 animate-spin" /> Saving…</span>;
  if (state === 'error') {
    return <button onClick={onRetry} className="inline-flex items-center gap-1 text-red-500 hover:underline">· <CloudOff className="w-3 h-3" /> Not saved — retry</button>;
  }
  return <span className="inline-flex items-center gap-1">· <Check className="w-3 h-3 text-teal" /> Progress saved</span>;
}

function SessionSummary({ session, deck, today, saveState, onPractice, onBrowse }: {
  session: Session; deck: Deck; today: string; saveState: 'saved' | 'saving' | 'error'; onPractice: () => void; onBrowse: () => void;
}) {
  const reviewed = session.counts.reduce((a, b) => a + b, 0);
  const unique = Object.keys(session.firstTry).length;
  const remembered = Object.values(session.firstTry).filter(g => g >= 2).length;
  const minutes = Math.max(1, Math.round((Date.now() - session.startedAt) / 60_000));
  const tomorrow = addDays(today, 1);
  const dueTomorrow = deck.cards.filter(c => c.srs.due <= tomorrow).length;
  const next = dueSummary(deck.cards, today).next;
  const pct = unique ? Math.round((remembered / unique) * 100) : 0;

  return (
    <div className={`${panelCls} p-6 sm:p-8 animate-fade-in-up`} data-testid="summary">
      <div className="text-center">
        {pct >= 50 && <Confetti />}
        <div className="mb-3 flex items-center justify-center gap-3">
          <ScoreRing pct={pct} size={120} label="first try" />
          <span className="ph-pop flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-saffron to-orange-600 text-white shadow-saffron">
            {pct >= 80 ? <Trophy className="h-6 w-6" /> : <PartyPopper className="h-6 w-6" />}
          </span>
        </div>
        <h2 className="text-2xl font-heading font-bold text-navy dark:text-dark-text">{session.practice ? 'Practice round done!' : 'Session complete!'}</h2>
        <p className="text-muted mt-1">
          You remembered <span className="font-semibold text-navy dark:text-dark-text">{remembered} of {unique}</span> cards on the first try{pct >= 80 ? ' — excellent!' : pct >= 50 ? ' — good going!' : ' — they will come back soon.'}
        </p>
        {!session.practice && (
          <div className="mt-3 h-7 flex justify-center" data-testid="xp">
            {session.xp === null ? (
              saveState === 'error' ? null : <span className="text-xs text-muted inline-flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Saving…</span>
            ) : session.xp > 0 ? (
              <span className="pill-saffron font-bold"><Sparkles className="w-3.5 h-3.5" /> +{session.xp} XP</span>
            ) : (
              <span className="text-xs text-muted inline-flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-saffron" /> XP for this deck already earned today</span>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mt-6">
        <Stat label="Reviews" value={reviewed} />
        <Stat label="Cards" value={unique} />
        <Stat label="Minutes" value={minutes} />
      </div>

      <div className="mt-5">
        <div className="flex h-3 rounded-full overflow-hidden bg-card-border dark:bg-dark-border">
          {([1, 2, 3, 4] as Grade[]).map(g => session.counts[g - 1] > 0 && (
            <div key={g} className={GRADE_BAR[g]} style={{ width: `${(session.counts[g - 1] / Math.max(1, reviewed)) * 100}%` }} />
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2 text-xs text-muted">
          {([1, 2, 3, 4] as Grade[]).map(g => (
            <span key={g} className="inline-flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${GRADE_BAR[g]}`} /> {GRADE_LABEL[g]} {session.counts[g - 1]}</span>
          ))}
        </div>
      </div>

      {!session.practice && (
        <p className="text-sm text-center text-muted mt-5 flex items-center justify-center gap-1.5">
          <CalendarCheck className="w-4 h-4 text-teal" />
          {dueTomorrow > 0 ? <>Tomorrow: <span className="font-semibold text-navy dark:text-dark-text">{dueTomorrow} cards</span> to review</> : nextLabel(next, today)}
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
        <Link href="/flashcards" className="btn-saffron"><Layers className="w-4 h-4" /> All decks</Link>
        <button onClick={onPractice} className="btn-outline"><Repeat className="w-4 h-4" /> Practice again</button>
        <button onClick={onBrowse} className="btn-outline"><BookOpen className="w-4 h-4" /> Browse cards</button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-off-white dark:bg-dark-bg border border-card-border dark:border-dark-border p-3 text-center">
      <p className="text-2xl font-heading font-bold text-navy dark:text-dark-text">{value}</p>
      <p className="text-[11px] uppercase tracking-wider font-semibold text-muted">{label}</p>
    </div>
  );
}
