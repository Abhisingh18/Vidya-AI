'use client';

import { useState } from 'react';
import { Brain, Check, X, RotateCcw, Loader2 } from 'lucide-react';

interface ScriptLine { time: string; text: string }
interface QuizQuestion { question: string; options: string[]; correct: number; explanation: string }

interface Props {
  topic: string;
  language: string;
  script: ScriptLine[];
}

export default function QuizPanel({ topic, language, script }: Props) {
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const start = async () => {
    setLoading(true);
    setAnswers({});
    setSubmitted(false);
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, language, script }),
      });
      const d = await res.json();
      setQuestions(Array.isArray(d.questions) ? d.questions : []);
    } catch {
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const score = questions
    ? questions.reduce((s, q, i) => s + (answers[i] === q.correct ? 1 : 0), 0)
    : 0;

  return (
    <section className="mt-8 p-6 rounded-2xl bg-white dark:bg-dark-surface border border-card-border dark:border-dark-border">
      <div className="flex items-center justify-between gap-3 mb-1">
        <h2 className="flex items-center gap-2 text-lg font-heading font-bold text-navy dark:text-dark-text">
          <Brain className="w-5 h-5 text-saffron" /> Test Yourself
        </h2>
        {questions && (
          <button onClick={start} className="text-xs text-saffron hover:underline inline-flex items-center gap-1">
            <RotateCcw className="w-3 h-3" /> New quiz
          </button>
        )}
      </div>
      <p className="text-sm text-muted mb-4">Quick quiz to check your understanding of {topic}.</p>

      {!questions && (
        <button onClick={start} disabled={loading} className="btn-saffron text-sm disabled:opacity-50">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : <><Brain className="w-4 h-4" /> Start Quiz</>}
        </button>
      )}

      {questions && questions.length > 0 && (
        <div className="space-y-5">
          {questions.map((q, qi) => (
            <div key={qi} className="space-y-2">
              <p className="font-medium text-sm text-navy dark:text-dark-text">{qi + 1}. {q.question}</p>
              <div className="grid gap-2">
                {q.options.map((opt, oi) => {
                  const chosen = answers[qi] === oi;
                  const isCorrect = oi === q.correct;
                  let cls = 'border-card-border dark:border-dark-border hover:border-saffron';
                  if (submitted) {
                    if (isCorrect) cls = 'border-teal bg-teal/10 text-teal';
                    else if (chosen) cls = 'border-red-400 bg-red-50 dark:bg-red-500/10 text-red-500';
                  } else if (chosen) {
                    cls = 'border-saffron bg-saffron/10 text-saffron';
                  }
                  return (
                    <button
                      key={oi}
                      disabled={submitted}
                      onClick={() => setAnswers(a => ({ ...a, [qi]: oi }))}
                      className={`flex items-center justify-between gap-2 text-left text-sm px-4 py-2.5 rounded-xl border transition-all ${cls} text-navy dark:text-dark-text disabled:cursor-default`}
                    >
                      <span>{opt}</span>
                      {submitted && isCorrect && <Check className="w-4 h-4 text-teal shrink-0" />}
                      {submitted && chosen && !isCorrect && <X className="w-4 h-4 text-red-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
              {submitted && q.explanation && (
                <p className="text-xs text-muted pl-1 pt-1">💡 {q.explanation}</p>
              )}
            </div>
          ))}

          {!submitted ? (
            <button
              onClick={() => setSubmitted(true)}
              disabled={Object.keys(answers).length < questions.length}
              className="btn-saffron text-sm disabled:opacity-50"
            >
              Submit Answers
            </button>
          ) : (
            <div className="p-4 rounded-xl bg-gradient-to-br from-saffron/10 to-indigo-brand/10 text-center">
              <p className="text-2xl font-heading font-bold text-navy dark:text-dark-text">{score} / {questions.length}</p>
              <p className="text-sm text-muted mt-1">
                {score === questions.length ? '🎉 Perfect! You mastered it.' : score >= questions.length / 2 ? '👍 Good job — review the misses.' : '📖 Rewatch the lesson and try again.'}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
