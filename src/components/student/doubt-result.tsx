'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle, CheckCircle2, Eye, EyeOff, Lightbulb, ListOrdered, MessageCircle, PenLine, PlayCircle, Square, Volume2, Wand2,
} from 'lucide-react';
import type { Doubt } from '@/app/api/student/doubt/solver';
import { getTtsStatus, speak, speechCode, stopSpeaking, useSpeakingId } from '@/lib/speak';
import { api, panelCls } from '@/components/teacher/ui';
import DoubtFollowup, { type ChatMsg } from './doubt-followup';
import { nativeName, SubjectPill } from './doubt-history';

const SIMPLER_PROMPT = 'Explain this more simply, please.';

/** Hint-first view of a solved doubt: question → hints one by one → full solution → practice. */
export default function DoubtResult({ id, doubt }: { id: string; doubt: Doubt }) {
  const [hintsShown, setHintsShown] = useState(0);
  const [solution, setSolution] = useState(doubt.hints.length === 0);
  const [practiceAnswer, setPracticeAnswer] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [chatBusy, setChatBusy] = useState(false);
  const [noVoice, setNoVoice] = useState(false);
  const speakingId = useSpeakingId();
  const lang = speechCode(doubt.language);
  const solutionRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getTtsStatus(); // warm up, so "Read aloud" starts quickly
    return () => stopSpeaking();
  }, []);

  const showSolution = () => {
    setSolution(true);
    window.setTimeout(() => solutionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const readAloud = async () => {
    if (speakingId === 'doubt') { stopSpeaking(); return; }
    setNoVoice(false);
    const parts = [doubt.question];
    if (solution) {
      doubt.steps.forEach((s, i) => parts.push(`${i + 1}. ${s.title}. ${s.explanation}${s.formula ? `. ${s.formula}` : ''}`));
      parts.push(doubt.finalAnswer);
    } else {
      parts.push(...doubt.hints.slice(0, hintsShown));
    }
    if ((await speak(parts.join('. \n'), lang, { id: 'doubt' })) === 'no-voice') setNoVoice(true);
  };

  const send = async (text: string, simpler = false) => {
    if (chatBusy) return;
    const history = chat.filter(m => !m.error).slice(-6).map(({ role, text: t }) => ({ role, text: t }));
    setChat(c => [...c, { role: 'user', text: simpler ? SIMPLER_PROMPT : text }]);
    setChatBusy(true);
    try {
      const { answer } = await api<{ answer: string }>(`/api/student/doubt/${id}/followup`, {
        method: 'POST',
        json: { message: simpler ? '' : text, simpler, history },
      });
      setChat(c => [...c, { role: 'bot', text: answer }]);
    } catch (err) {
      setChat(c => [...c, { role: 'bot', text: (err as Error).message, error: true }]);
    } finally {
      setChatBusy(false);
    }
  };

  const openChat = (simpler: boolean) => {
    setChatOpen(true);
    if (simpler) send('', true);
    window.setTimeout(() => chatRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
  };

  const meta = [doubt.chapter, doubt.topic !== doubt.chapter ? doubt.topic : ''].filter(Boolean).join(' · ');
  const moreHints = hintsShown < doubt.hints.length;

  return (
    <div className="space-y-4">
      {/* Question */}
      <section className={`${panelCls} p-5`}>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <SubjectPill subject={doubt.subject} />
          {(doubt.level || doubt.grade) && (
            <span className="text-[11px] font-semibold text-muted">{doubt.level || (doubt.grade === 'College' ? 'College' : `Class ${doubt.grade}`)}</span>
          )}
          <span className="text-[11px] text-muted">· {nativeName(doubt.language)}</span>
        </div>
        {meta && <p className="text-xs font-semibold uppercase tracking-wider text-saffron mb-1.5 break-words">{meta}</p>}
        <p className="text-[15px] sm:text-base leading-relaxed font-medium text-navy dark:text-dark-text whitespace-pre-line break-words">{doubt.question}</p>
        {doubt.studentNote && (
          <p className="mt-3 text-sm text-muted border-l-2 border-saffron/40 pl-3 break-words"><span className="font-semibold">You asked:</span> {doubt.studentNote}</p>
        )}
      </section>

      {/* Hints */}
      {doubt.hints.length > 0 && (
        <section className={`${panelCls} p-5`}>
          <h3 className="flex items-center gap-2 font-heading font-semibold text-navy dark:text-dark-text">
            <Lightbulb className="w-4 h-4 text-amber-500" /> Try it yourself first
          </h3>
          {hintsShown === 0 && !solution && (
            <p className="text-sm text-muted mt-1">Take a hint, think for a minute, then check the full solution.</p>
          )}
          {hintsShown > 0 && (
            <ol className="mt-3 space-y-2">
              {doubt.hints.slice(0, hintsShown).map((h, i) => (
                <li key={i} className="animate-fade-in rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200/70 dark:border-amber-500/20 px-4 py-3">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">Hint {i + 1}</span>
                  <span className="block mt-0.5 text-sm text-navy dark:text-dark-text whitespace-pre-line break-words">{h}</span>
                </li>
              ))}
            </ol>
          )}
          {!solution && (
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              {moreHints && (
                <button type="button" onClick={() => setHintsShown(n => n + 1)}
                  className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl border-2 border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-200 font-heading font-semibold text-sm hover:bg-amber-50 dark:hover:bg-amber-500/10">
                  <Lightbulb className="w-4 h-4" /> {hintsShown === 0 ? 'Show hint 1' : `Show hint ${hintsShown + 1}`}
                </button>
              )}
              <button type="button" onClick={showSolution}
                className={`inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl font-heading font-semibold text-sm transition-colors ${
                  moreHints ? 'text-muted hover:text-saffron' : 'bg-saffron text-white hover:bg-saffron-500'
                }`}>
                <ListOrdered className="w-4 h-4" /> Show full solution
              </button>
            </div>
          )}
        </section>
      )}

      {/* Solution */}
      {solution && (
        <section ref={solutionRef} className={`${panelCls} p-5 animate-fade-in scroll-mt-24`}>
          <h3 className="flex items-center gap-2 font-heading font-semibold text-navy dark:text-dark-text mb-4">
            <ListOrdered className="w-4 h-4 text-saffron" /> Step-by-step solution
          </h3>
          <ol className="space-y-4">
            {doubt.steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-7 h-7 shrink-0 rounded-full bg-saffron/10 text-saffron text-sm font-bold flex items-center justify-center">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-navy dark:text-dark-text break-words">{s.title}</p>
                  {s.explanation && <p className="mt-0.5 text-sm leading-relaxed text-navy/80 dark:text-dark-text/80 whitespace-pre-line break-words">{s.explanation}</p>}
                  {s.formula && (
                    <p className="mt-2 px-3 py-2 rounded-lg bg-indigo-brand/5 dark:bg-indigo-brand/15 border border-indigo-brand/10 text-[15px] font-semibold tracking-wide text-indigo-brand-700 dark:text-indigo-brand-200 whitespace-pre-wrap break-words">
                      {s.formula}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-5 rounded-xl bg-teal/10 dark:bg-teal/15 border-2 border-teal/30 px-4 py-3">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">
              <CheckCircle2 className="w-4 h-4" /> Final answer
            </p>
            <p className="mt-1 text-base sm:text-lg font-heading font-bold text-navy dark:text-dark-text whitespace-pre-line break-words">{doubt.finalAnswer}</p>
          </div>

          {doubt.commonMistake && (
            <div className="mt-3 flex gap-2 rounded-xl bg-red-50/70 dark:bg-red-500/10 border border-red-200/60 dark:border-red-500/20 px-4 py-3 text-sm">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
              <p className="text-navy dark:text-dark-text break-words"><span className="font-semibold">Common mistake: </span>{doubt.commonMistake}</p>
            </div>
          )}

          {doubt.keyConcepts.length > 0 && (
            <div className="mt-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2">Key concepts</p>
              <div className="flex flex-wrap gap-2">
                {doubt.keyConcepts.map(c => (
                  <span key={c} className="px-3 py-1 rounded-full bg-indigo-brand/10 dark:bg-indigo-brand/20 text-indigo-brand dark:text-indigo-brand-200 text-xs font-semibold">{c}</span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Practice */}
      {solution && doubt.practice && (
        <section className={`${panelCls} p-5`}>
          <h3 className="flex items-center gap-2 font-heading font-semibold text-navy dark:text-dark-text">
            <PenLine className="w-4 h-4 text-teal" /> Try a similar question
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-navy dark:text-dark-text whitespace-pre-line break-words">{doubt.practice.question}</p>
          {doubt.practice.answer && (
            <>
              <button type="button" onClick={() => setPracticeAnswer(v => !v)} aria-expanded={practiceAnswer}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-teal hover:underline">
                {practiceAnswer ? <><EyeOff className="w-4 h-4" /> Hide answer</> : <><Eye className="w-4 h-4" /> Show answer</>}
              </button>
              {practiceAnswer && (
                <p className="mt-2 rounded-lg bg-teal/10 px-3 py-2 text-sm font-semibold text-navy dark:text-dark-text whitespace-pre-line break-words animate-fade-in">{doubt.practice.answer}</p>
              )}
            </>
          )}
        </section>
      )}

      {/* Actions */}
      <section className={`${panelCls} p-3`}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <ActionButton onClick={() => openChat(true)} disabled={chatBusy} icon={<Wand2 className="w-4 h-4" />} label="Explain simpler" />
          <ActionButton onClick={readAloud} active={speakingId === 'doubt'}
            icon={speakingId === 'doubt' ? <Square className="w-3.5 h-3.5 fill-current" /> : <Volume2 className="w-4 h-4" />}
            label={speakingId === 'doubt' ? 'Stop reading' : 'Read aloud'} />
          <ActionButton onClick={() => openChat(false)} active={chatOpen} icon={<MessageCircle className="w-4 h-4" />} label="Ask a follow-up" />
          <Link href={`/generate?topic=${encodeURIComponent(doubt.topic || doubt.chapter || doubt.subject)}`}
            className="inline-flex items-center justify-center gap-2 h-11 px-3 rounded-xl bg-indigo-brand text-white text-sm font-semibold hover:bg-indigo-brand-600 transition-colors text-center">
            <PlayCircle className="w-4 h-4 shrink-0" /> <span className="truncate">Watch a video</span>
          </Link>
        </div>
        {noVoice && (
          <p className="mt-2 px-1 text-xs text-muted">
            This device has no voice for {doubt.language}. Try Chrome on Android, or install a {doubt.language} voice in your phone&apos;s text-to-speech settings.
          </p>
        )}
      </section>

      {chatOpen && (
        <section ref={chatRef} className={`${panelCls} p-5 scroll-mt-24`}>
          <DoubtFollowup messages={chat} busy={chatBusy} langCode={lang} onSend={t => send(t)} onNoVoice={() => setNoVoice(true)} />
        </section>
      )}
    </div>
  );
}

function ActionButton({ onClick, icon, label, active, disabled }: { onClick: () => void; icon: React.ReactNode; label: string; active?: boolean; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 h-11 px-3 rounded-xl text-sm font-semibold border-2 transition-colors disabled:opacity-60 ${
        active
          ? 'border-saffron bg-saffron/10 text-saffron'
          : 'border-card-border dark:border-dark-border text-navy dark:text-dark-text hover:border-saffron hover:text-saffron'
      }`}>
      <span className="shrink-0">{icon}</span> <span className="truncate">{label}</span>
    </button>
  );
}
