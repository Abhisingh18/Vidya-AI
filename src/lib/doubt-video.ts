// Hand-off from a solved doubt to the video generator: the question and its worked solution
// travel as "notes" the explainer follows, so the video teaches that exact solution.
// sessionStorage carries it across the page change (too big for a URL).

import type { Doubt } from '@/app/api/student/doubt/solver';
import type { SourceFile } from '@/lib/source';

const KEY = 'vidya-doubt-video';

export interface DoubtVideoHandoff { topic: string; grade: string; language: string; sources: SourceFile[] }

/** The generator's class bands: 3–8 → "6-8", 9–10, 11–12, College. */
export function videoGrade(grade: string): string {
  if (grade === 'College') return 'College';
  const n = Number(grade);
  return n >= 11 ? '11-12' : n >= 9 ? '9-10' : '6-8';
}

export function buildDoubtVideo(d: Doubt): DoubtVideoHandoff {
  const steps = d.steps.map((s, i) => `Step ${i + 1}: ${s.title}\n${s.explanation}${s.formula ? `\nWorking: ${s.formula}` : ''}`).join('\n\n');
  const text = [
    'A student asked this exact question. Make a video that teaches how to solve THIS question, step by step, following the worked solution below. Show the working visually and end with the final answer.',
    `QUESTION\n${d.question}`,
    d.studentNote ? `STUDENT'S NOTE\n${d.studentNote}` : '',
    `WORKED SOLUTION\n${steps}`,
    `FINAL ANSWER\n${d.finalAnswer}`,
    d.keyConcepts.length ? `KEY CONCEPTS\n${d.keyConcepts.join('; ')}` : '',
    d.commonMistake ? `COMMON MISTAKE\n${d.commonMistake}` : '',
  ].filter(Boolean).join('\n\n').slice(0, 12000);
  const first = d.question.split('\n')[0].replace(/\s+/g, ' ').trim();
  return {
    topic: `Solving: ${first.length > 90 ? `${first.slice(0, 87)}…` : first}`,
    grade: videoGrade(d.grade),
    language: d.language,
    sources: [{ name: 'Your question and its solution', kind: 'text', text }],
  };
}

export function stashDoubtVideo(h: DoubtVideoHandoff) {
  try { window.sessionStorage.setItem(KEY, JSON.stringify(h)); } catch { /* private mode: the video page just opens empty */ }
}

/** Reads and clears the hand-off (null when there is none). */
export function takeDoubtVideo(): DoubtVideoHandoff | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(KEY);
    const h = JSON.parse(raw) as DoubtVideoHandoff;
    return h && typeof h.topic === 'string' && Array.isArray(h.sources) ? h : null;
  } catch { return null; }
}
