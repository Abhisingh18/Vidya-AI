'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, MessageCircle, Send, Square, Volume2 } from 'lucide-react';
import { speak, stopSpeaking, useSpeakingId } from '@/lib/speak';
import VoiceInput from './voice-input';

export interface ChatMsg { role: 'user' | 'bot'; text: string; error?: boolean }

const SUGGESTIONS = ['Why do we do this step?', 'Give me a real-life example', 'What if the numbers change?'];

/** Small follow-up chat under a solved doubt. Messages live in the parent (DoubtResult). */
export default function DoubtFollowup({ messages, busy, langCode, onSend, onNoVoice }: {
  messages: ChatMsg[];
  busy: boolean;
  /** BCP-47 code of the doubt's language (mic + read aloud). */
  langCode: string;
  onSend: (text: string) => void;
  onNoVoice: () => void;
}) {
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const speakingId = useSpeakingId();

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [messages, busy]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    onSend(t);
    setInput('');
  };

  const read = async (i: number, text: string) => {
    const id = `followup-${i}`;
    if (speakingId === id) { stopSpeaking(); return; }
    if ((await speak(text, langCode, { id })) === 'no-voice') onNoVoice();
  };

  return (
    <div id="doubt-followup">
      <h3 className="flex items-center gap-2 font-heading font-semibold text-navy dark:text-dark-text mb-3">
        <MessageCircle className="w-4 h-4 text-indigo-brand" /> Ask a follow-up
      </h3>

      {messages.length > 0 && (
        <div className="space-y-3 mb-4 max-h-96 overflow-y-auto pr-1" aria-live="polite">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[88%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-line break-words ${
                m.role === 'user'
                  ? 'bg-saffron text-white rounded-br-md'
                  : m.error
                    ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-bl-md'
                    : 'bg-gray-100 dark:bg-dark-border text-navy dark:text-dark-text rounded-bl-md'
              }`}>
                {m.text}
                {m.role === 'bot' && !m.error && (
                  <button type="button" onClick={() => read(i, m.text)}
                    className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-indigo-brand dark:text-indigo-brand-200 hover:underline">
                    {speakingId === `followup-${i}` ? <><Square className="w-3 h-3 fill-current" /> Stop</> : <><Volume2 className="w-3.5 h-3.5" /> Read aloud</>}
                  </button>
                )}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex justify-start">
              <div className="px-4 py-2.5 rounded-2xl rounded-bl-md bg-gray-100 dark:bg-dark-border flex items-center gap-2 text-xs text-muted">
                <Loader2 className="w-4 h-4 animate-spin" /> Thinking…
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      )}

      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {SUGGESTIONS.map(s => (
            <button key={s} type="button" onClick={() => send(s)} disabled={busy}
              className="px-3 py-1.5 rounded-full border border-card-border dark:border-dark-border text-xs text-muted hover:border-indigo-brand hover:text-indigo-brand transition-all">
              {s}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={e => { e.preventDefault(); send(input); }} className="flex items-center gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={listening ? 'Listening…' : 'Type or speak your question…'}
          maxLength={500}
          aria-label="Your follow-up question"
          className="flex-1 min-w-0 h-11 px-4 rounded-xl border-2 border-card-border dark:border-dark-border bg-off-white dark:bg-dark-bg text-navy dark:text-dark-text focus:border-indigo-brand outline-none text-sm"
        />
        <VoiceInput lang={langCode} onText={t => setInput(v => (v.trim() ? `${v.trim()} ${t}` : t))} onListeningChange={setListening} disabled={busy} />
        <button type="submit" disabled={busy || listening || !input.trim()} aria-label="Send"
          className="w-11 h-11 rounded-xl bg-indigo-brand text-white flex items-center justify-center disabled:opacity-50 hover:bg-indigo-brand/90 transition-all shrink-0">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
