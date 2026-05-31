'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircleQuestion, Send, Loader2 } from 'lucide-react';

interface ScriptLine { time: string; text: string }
interface Msg { role: 'user' | 'bot'; text: string }

interface Props {
  topic: string;
  language: string;
  script: ScriptLine[];
}

const SUGGESTIONS = [
  'Explain this more simply',
  'Give me a real-life example',
  'Why is this important?',
];

export default function DoubtChat({ topic, language, script }: Props) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || loading) return;
    setMessages(m => [...m, { role: 'user', text: q }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/doubt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, language, question: q, script }),
      });
      const d = await res.json();
      setMessages(m => [...m, { role: 'bot', text: d.answer ?? 'Sorry, try again.' }]);
    } catch {
      setMessages(m => [...m, { role: 'bot', text: 'Network error — please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-8 p-6 rounded-2xl bg-white dark:bg-dark-surface border border-card-border dark:border-dark-border">
      <h2 className="flex items-center gap-2 text-lg font-heading font-bold text-navy dark:text-dark-text mb-1">
        <MessageCircleQuestion className="w-5 h-5 text-indigo-brand" /> Ask a Doubt
      </h2>
      <p className="text-sm text-muted mb-4">Confused about something? Ask the AI tutor about {topic}.</p>

      {messages.length > 0 && (
        <div className="space-y-3 mb-4 max-h-80 overflow-y-auto pr-1">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${
                m.role === 'user'
                  ? 'bg-saffron text-white rounded-br-md'
                  : 'bg-gray-100 dark:bg-dark-border text-navy dark:text-dark-text rounded-bl-md'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="px-4 py-2.5 rounded-2xl rounded-bl-md bg-gray-100 dark:bg-dark-border">
                <Loader2 className="w-4 h-4 animate-spin text-muted" />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      )}

      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => ask(s)} className="px-3 py-1.5 rounded-full border border-card-border dark:border-dark-border text-xs text-muted hover:border-indigo-brand hover:text-indigo-brand transition-all">
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && ask(input)}
          placeholder="Type your question…"
          className="flex-1 h-11 px-4 rounded-xl border-2 border-card-border dark:border-dark-border bg-off-white dark:bg-dark-bg text-navy dark:text-dark-text focus:border-indigo-brand outline-none text-sm"
        />
        <button onClick={() => ask(input)} disabled={loading || !input.trim()} className="w-11 h-11 rounded-xl bg-indigo-brand text-white flex items-center justify-center disabled:opacity-50 hover:bg-indigo-brand/90 transition-all shrink-0">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}
