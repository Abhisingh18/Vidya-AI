'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Square } from 'lucide-react';

// Mic button for speaking a question (Web Speech API: SpeechRecognition /
// webkitSpeechRecognition — Chrome, Edge, Android Chrome, Safari 14.1+).
// Live interim words are shown in a bubble; each finished phrase is handed to
// `onText` for the parent to append to its field. Listening stops on its own
// after a pause in speech, on a second tap, or after MAX_MS.

interface RecognitionAlternative { transcript: string }
interface RecognitionResult { isFinal: boolean; length: number; [i: number]: RecognitionAlternative }
interface RecognitionEvent { resultIndex: number; results: { length: number; [i: number]: RecognitionResult } }
interface RecognitionErrorEvent { error: string }
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const MAX_MS = 30_000;
const UNSUPPORTED = 'Voice input needs Chrome';

const ERRORS: Record<string, string> = {
  'not-allowed': 'Microphone is blocked. Allow mic access for this site in your browser settings, then try again.',
  'service-not-allowed': 'Microphone is blocked. Allow mic access for this site in your browser settings, then try again.',
  'no-speech': "Didn't hear anything — tap the mic and speak.",
  'audio-capture': 'No microphone found on this device.',
  network: 'Voice input needs an internet connection.',
  'language-not-supported': "Voice input isn't available for this language yet — try typing.",
};

export interface VoiceInputProps {
  /** BCP-47 language to listen for, e.g. "hi-IN" (see src/lib/languages.ts). */
  lang: string;
  /** Called with each finished phrase; append it to your field. */
  onText: (text: string) => void;
  /** Live (not yet final) words, '' when cleared. The bubble shows them too. */
  onInterim?: (text: string) => void;
  /** Called when listening starts/stops (e.g. to disable submit meanwhile). */
  onListeningChange?: (listening: boolean) => void;
  disabled?: boolean;
  /** Where the live bubble opens. */
  bubble?: 'above' | 'below';
  className?: string;
  title?: string;
}

export default function VoiceInput({
  lang, onText, onInterim, onListeningChange, disabled, bubble = 'above', className = '', title = 'Speak your question',
}: VoiceInputProps) {
  // null until mounted, so the server render and first client render match.
  const [supported, setSupported] = useState<boolean | null>(null);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const recRef = useRef<Recognition | null>(null);
  const pendingRef = useRef('');
  const timers = useRef<number[]>([]);
  const cbs = useRef({ onText, onInterim, onListeningChange });
  cbs.current = { onText, onInterim, onListeningChange };

  useEffect(() => { setSupported(!!recognitionCtor()); }, []);

  const clearTimers = useCallback(() => { timers.current.forEach(t => window.clearTimeout(t)); timers.current = []; }, []);

  const flash = useCallback((text: string) => {
    setMessage(text);
    const t = window.setTimeout(() => setMessage(m => (m === text ? null : m)), 5000);
    timers.current.push(t);
  }, []);

  const stop = useCallback(() => { recRef.current?.stop(); }, []);

  const start = useCallback(() => {
    const Ctor = recognitionCtor();
    if (!Ctor) { flash(UNSUPPORTED); return; }
    setMessage(null);
    let rec: Recognition;
    try {
      rec = new Ctor();
    } catch {
      flash(UNSUPPORTED);
      return;
    }
    rec.lang = lang;
    rec.continuous = false; // ends by itself after a pause in speech
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    pendingRef.current = '';

    rec.onresult = e => {
      let finalText = '';
      let live = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0]?.transcript ?? '';
        else live += r[0]?.transcript ?? '';
      }
      if (finalText.trim()) {
        cbs.current.onText(finalText.trim());
        pendingRef.current = '';
      }
      if (live.trim()) pendingRef.current = live.trim();
      setInterim(live);
      cbs.current.onInterim?.(live);
    };
    rec.onerror = e => {
      if (e.error === 'aborted') return;
      flash(ERRORS[e.error] ?? 'Voice input stopped — please try again.');
    };
    rec.onend = () => {
      clearTimers();
      // Some browsers end without promoting the last interim words to final.
      if (pendingRef.current) cbs.current.onText(pendingRef.current);
      pendingRef.current = '';
      recRef.current = null;
      setListening(false);
      setInterim('');
      cbs.current.onInterim?.('');
      cbs.current.onListeningChange?.(false);
    };

    try {
      rec.start();
    } catch {
      flash('Voice input is busy — please try again.');
      return;
    }
    recRef.current = rec;
    setListening(true);
    cbs.current.onListeningChange?.(true);
    timers.current.push(window.setTimeout(() => rec.stop(), MAX_MS));
  }, [lang, flash, clearTimers]);

  // Changing language or unmounting stops listening.
  useEffect(() => () => { recRef.current?.abort(); clearTimers(); }, [lang, clearTimers]);

  const unsupported = supported === false;
  const label = unsupported ? UNSUPPORTED : listening ? 'Stop listening' : title;
  const showBubble = listening || !!message;

  return (
    <div className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={() => (unsupported ? flash(UNSUPPORTED) : listening ? stop() : start())}
        disabled={disabled || supported === null}
        aria-pressed={listening}
        aria-label={label}
        title={label}
        className={`relative w-11 h-11 shrink-0 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
          listening
            ? 'bg-red-500 text-white shadow-[0_0_0_4px_rgba(239,68,68,0.2)]'
            : unsupported
              ? 'bg-gray-100 dark:bg-dark-border text-muted/60'
              : 'bg-saffron/10 text-saffron hover:bg-saffron/20 dark:bg-saffron/15'
        }`}
      >
        {listening && <span className="absolute inset-0 rounded-xl bg-red-500/40 animate-ping" aria-hidden />}
        {listening ? <Square className="relative w-4 h-4 fill-current" /> : unsupported ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </button>

      {showBubble && (
        <div
          role="status"
          aria-live="polite"
          className={`absolute right-0 z-20 w-64 max-w-[80vw] px-3 py-2 rounded-xl text-xs shadow-card-hover border ${
            bubble === 'above' ? 'bottom-full mb-2' : 'top-full mt-2'
          } ${message
            ? 'bg-white dark:bg-dark-surface border-card-border dark:border-dark-border text-navy dark:text-dark-text'
            : 'bg-navy text-white border-navy dark:bg-dark-border dark:border-dark-border'}`}
        >
          {message ?? (
            <>
              <span className="flex items-center gap-1.5 font-semibold">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Listening…
              </span>
              <span className="block mt-1 opacity-90 break-words">{interim || 'Speak now — tap ■ to stop.'}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
