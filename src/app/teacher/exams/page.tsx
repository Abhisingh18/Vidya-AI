'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle, Award, BookOpenCheck, CalendarClock, CalendarRange, CheckCircle2, GraduationCap, ListChecks,
  ChevronDown, Loader2, Paperclip, Plus, RotateCcw, School, ScrollText, SlidersHorizontal, Sparkles, Trash2, type LucideIcon,
} from 'lucide-react';
import {
  blueprintFor, blueprintTotal, DIFFICULTY_PRESETS, EXAM_TYPE_LIST, EXAM_TYPES, formatDuration, MAX_SECTION_QUESTIONS,
  MAX_SECTIONS, normalizeSpec, patternFor, QUESTION_TYPE_LIST, QUESTION_TYPES, sectionLabel, sectionWord, specMarks,
  type DifficultyMix, type ExamPattern, type ExamType, type SectionSpec,
} from '@/lib/exam';
import { LANGUAGES } from '@/lib/teacher-docs';
import type { SourceFile } from '@/lib/source';
import SourceUpload from '@/components/teacher/source-upload';
import DocList from '@/components/teacher/doc-list';
import { api, ErrorNote, inputCls, labelCls, textareaCls } from '@/components/teacher/ui';
import StudyShell, { StudySection } from '@/components/student/study-shell';

const TYPE_ICON: Record<ExamType, LucideIcon> = {
  'unit-test': ListChecks, quarterly: CalendarClock, 'half-yearly': CalendarRange, annual: Award,
  'mid-sem': BookOpenCheck, 'end-sem': GraduationCap, custom: SlidersHorizontal,
};
const CLASSES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const range = (from: number, to: number) => Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);

/** "Half-Yearly Examination 2026–27" (school, April–March year) or "End-Semester Examination, November 2026". */
function defaultExamName(type: ExamType, pattern: ExamPattern) {
  const now = new Date();
  const name = type === 'custom' ? (pattern === 'university' ? 'Internal Assessment' : 'Class Test') : EXAM_TYPES[type].name;
  if (pattern === 'university') return `${name}, ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  const start = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${name} ${start}–${String((start + 1) % 100).padStart(2, '0')}`;
}

export default function ExamsPage({ searchParams }: { searchParams: { topic?: string } }) {
  return (
    <StudyShell theme="mock" icon={<ScrollText />} title="Exam Papers"
      subtitle="Unit test to annual or university paper, with a marking scheme. Edit and print.">
      <ExamForm defaultTopics={searchParams?.topic ?? ''} />
      <StudySection title="Your exam papers">
        <DocList type="exam" />
      </StudySection>
    </StudyShell>
  );
}

function ExamForm({ defaultTopics }: { defaultTopics: string }) {
  const router = useRouter();
  const initial = blueprintFor('half-yearly', 80);
  const [pattern, setPattern] = useState<ExamPattern>('school');
  const [examType, setExamType] = useState<ExamType>('half-yearly');
  const [grade, setGrade] = useState('10');
  const [semester, setSemester] = useState('');
  const [subject, setSubject] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [topics, setTopics] = useState(defaultTopics);
  const [sources, setSources] = useState<SourceFile[]>([]);
  const [language, setLanguage] = useState('English');
  const [institution, setInstitution] = useState('');
  const [examName, setExamName] = useState(() => defaultExamName('half-yearly', 'school'));
  const [nameEdited, setNameEdited] = useState(false);
  const [maxMarks, setMaxMarks] = useState(initial.maxMarks);
  const [duration, setDuration] = useState(initial.duration);
  const [mix, setMix] = useState<DifficultyMix>(DIFFICULTY_PRESETS[1].mix);
  const [blueprint, setBlueprint] = useState<SectionSpec[]>(initial.sections);
  const [attach, setAttach] = useState(false);
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!busy) return;
    setElapsed(0);
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [busy]);

  const total = blueprintTotal(blueprint);
  const word = sectionWord(pattern);
  const presetMarks = EXAM_TYPES[examType].marks;

  const applyPreset = (type: ExamType, p: ExamPattern, marks?: number) => {
    const bp = blueprintFor(type, marks, p);
    setBlueprint(bp.sections);
    setMaxMarks(bp.maxMarks);
    setDuration(bp.duration);
  };
  const pickType = (type: ExamType, p = pattern) => {
    setExamType(type);
    applyPreset(type, p);
    if (!nameEdited) setExamName(defaultExamName(type, p));
  };
  const pickPattern = (p: ExamPattern) => {
    if (p === pattern) return;
    setPattern(p);
    pickType(EXAM_TYPES[examType].pattern === null ? 'custom' : p === 'school' ? 'half-yearly' : 'end-sem', p);
  };
  const setRow = (i: number, patch: Partial<SectionSpec>) =>
    setBlueprint(rows => rows.map((r, j) => (j === i ? normalizeSpec({ ...r, ...patch }) : r)));

  const missing = !subject.trim() ? 'Enter the subject.'
    : !topics.trim() && !sources.length ? 'Add the chapters/topics to cover, or upload the syllabus.'
    : total !== maxMarks ? `The blueprint adds up to ${total} marks, not ${maxMarks}.`
    : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (missing || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { id } = await api<{ id: string }>('/api/teacher/exam', {
        method: 'POST',
        json: {
          examType, pattern: patternFor(examType, pattern), grade, semester, subject, subjectCode, topics, maxMarks,
          durationMinutes: duration, language, difficulty: mix, institution, examName, blueprint, sources,
        },
      });
      router.push(`/teacher/exams/${id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  const types = EXAM_TYPE_LIST.filter(t => EXAM_TYPES[t].pattern === null || EXAM_TYPES[t].pattern === pattern);
  const labels = blueprint.map((_, i) => sectionLabel(i));

  return (
    <form onSubmit={submit} className="space-y-7">
      {/* 1. Exam type */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <span className={`${labelCls} !mb-0`}>Exam</span>
          <div className="flex rounded-full border-2 border-card-border dark:border-dark-border p-0.5" role="radiogroup" aria-label="Pattern">
            {([['school', 'School', School], ['university', 'University', GraduationCap]] as const).map(([p, label, Icon]) => (
              <button key={p} type="button" role="radio" aria-checked={pattern === p} onClick={() => pickPattern(p)} disabled={busy}
                className={`px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 transition-colors ${pattern === p ? 'bg-saffron text-white' : 'text-navy dark:text-dark-text hover:text-saffron'}`}>
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>
        </div>
        <div role="radiogroup" aria-label="Exam type" className={`grid grid-cols-2 sm:grid-cols-3 ${types.length > 3 ? 'lg:grid-cols-5' : ''} gap-3`}>
          {types.map(t => {
            const Icon = TYPE_ICON[t];
            const on = t === examType;
            return (
              <button key={t} type="button" role="radio" aria-checked={on} onClick={() => pickType(t)} disabled={busy}
                className={`text-left p-4 rounded-2xl border-2 transition-colors ${on
                  ? 'border-saffron bg-saffron/5 dark:bg-saffron/10'
                  : 'border-card-border dark:border-dark-border hover:border-saffron/50'}`}>
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${on ? 'bg-saffron text-white' : 'bg-saffron/10 text-saffron'}`}><Icon className="w-[18px] h-[18px]" /></span>
                <span className="block font-heading font-semibold text-navy dark:text-dark-text mt-2">{EXAM_TYPES[t].label}</span>
                <span className="block text-xs text-muted mt-0.5">{EXAM_TYPES[t].description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Essentials */}
      <div className="grid gap-3 sm:grid-cols-3">
        {pattern === 'school' ? (
          <Labelled label="Class">
            <select className={inputCls} value={grade} onChange={e => setGrade(e.target.value)}>
              {CLASSES.map(g => <option key={g} value={g}>Class {g}</option>)}
            </select>
          </Labelled>
        ) : (
          <Labelled label="Programme / semester">
            <input className={inputCls} value={semester} onChange={e => setSemester(e.target.value)} maxLength={100} placeholder="e.g. B.Tech CSE · Sem III" />
          </Labelled>
        )}
        <Labelled label="Subject">
          <input className={inputCls} value={subject} onChange={e => setSubject(e.target.value)} maxLength={100} required
            placeholder={pattern === 'school' ? 'e.g. Science' : 'e.g. Data Structures'} />
        </Labelled>
        <Labelled label="Language">
          <select className={inputCls} value={language} onChange={e => setLanguage(e.target.value)}>
            {LANGUAGES.map(l => <option key={l}>{l}</option>)}
          </select>
        </Labelled>
      </div>
      <details className="group rounded-xl border border-card-border dark:border-dark-border">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold text-navy dark:text-dark-text">
          Paper details <span className="font-normal text-muted">· {pattern === 'school' ? 'school name, subject code' : 'college, course code'}, title</span>
          <ChevronDown className="ml-auto h-4 w-4 text-muted transition-transform group-open:rotate-180" />
        </summary>
        <div className="grid gap-3 border-t border-card-border p-4 sm:grid-cols-2 dark:border-dark-border">
          <Labelled label={pattern === 'school' ? 'School name' : 'University / college name'} optional>
            <input className={inputCls} value={institution} onChange={e => setInstitution(e.target.value)} maxLength={150}
              placeholder={pattern === 'school' ? 'e.g. Kendriya Vidyalaya No. 2, Pune' : 'e.g. Government Engineering College, Thrissur'} />
          </Labelled>
          <Labelled label={pattern === 'school' ? 'Subject code' : 'Course code'} optional>
            <input className={inputCls} value={subjectCode} onChange={e => setSubjectCode(e.target.value)} maxLength={30} placeholder={pattern === 'school' ? 'e.g. 086' : 'e.g. CS301'} />
          </Labelled>
          <div className="sm:col-span-2">
            <Labelled label="Exam name (printed on the paper)">
              <input className={inputCls} value={examName} maxLength={150} onChange={e => { setExamName(e.target.value); setNameEdited(true); }} />
            </Labelled>
          </div>
        </div>
      </details>

      {/* 3. Syllabus */}
      <div>
        <Labelled label="Chapters / topics to cover" optional={sources.length > 0}>
          <textarea className={`${textareaCls} min-h-[112px]`} value={topics} onChange={e => setTopics(e.target.value)} maxLength={4000}
            placeholder={pattern === 'school'
              ? 'One chapter per line — e.g.\nCh 1 Chemical Reactions\nCh 2 Acids, Bases and Salts'
              : 'One unit per line — e.g.\nUnit I – Arrays and stacks\nUnit II – Linked lists'} />
        </Labelled>
        <button type="button" onClick={() => setAttach(a => !a)} className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-saffron hover:underline">
          <Paperclip className="h-4 w-4" /> Add your PDF{sources.length ? ` · ${sources.length}` : ''}
        </button>
        {(attach || sources.length > 0) && (
          <div className="mt-3 rounded-2xl border border-card-border bg-off-white/70 p-3 dark:border-dark-border dark:bg-dark-bg/60">
            <SourceUpload files={sources} onChange={setSources} disabled={busy} topic={`${subject} ${topics}`.trim()} hint="" label="Syllabus, notes or a past paper" />
          </div>
        )}
      </div>

      {/* 4. Marks, time, difficulty */}
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <span className={labelCls}>Maximum marks</span>
          <div className="flex flex-wrap items-center gap-2">
            {presetMarks.map(m => (
              <button key={m} type="button" onClick={() => applyPreset(examType, pattern, m)} disabled={busy}
                className={`h-11 px-4 rounded-xl border-2 text-sm font-semibold transition-colors ${maxMarks === m && blueprint.length ? 'border-saffron bg-saffron/5 text-saffron' : 'border-card-border dark:border-dark-border text-navy dark:text-dark-text hover:border-saffron/50'}`}>
                {m}
              </button>
            ))}
            <input type="number" aria-label="Maximum marks" min={5} max={200} className={`${inputCls} !w-24`} value={maxMarks}
              onChange={e => setMaxMarks(Math.max(0, Math.min(200, Math.round(+e.target.value) || 0)))} />
          </div>
        </div>
        <Labelled label="Time (minutes)">
          <input type="number" min={15} max={240} step={5} className={inputCls} value={duration}
            onChange={e => setDuration(Math.max(0, Math.min(240, Math.round(+e.target.value) || 0)))} />
          <span className="block text-xs text-muted mt-1">{formatDuration(duration)}</span>
        </Labelled>
        <div>
          <span className={labelCls}>Difficulty</span>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {DIFFICULTY_PRESETS.map(p => {
              const on = p.mix.easy === mix.easy && p.mix.medium === mix.medium && p.mix.hard === mix.hard;
              return (
                <button key={p.id} type="button" onClick={() => setMix(p.mix)} disabled={busy}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${on ? 'border-saffron bg-saffron text-white' : 'border-card-border dark:border-dark-border text-navy dark:text-dark-text hover:border-saffron/50'}`}>
                  {p.label}
                </button>
              );
            })}
          </div>
          <details className="text-xs">
            <summary className="cursor-pointer text-muted hover:text-saffron">Easy {mix.easy}% · Medium {mix.medium}% · Hard {mix.hard}% — adjust</summary>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(['easy', 'medium', 'hard'] as const).map(k => (
                <label key={k} className="capitalize text-muted">
                  {k} %
                  <input type="number" min={0} max={100} step={5} className={`${inputCls} !h-9 mt-0.5`} value={mix[k]}
                    onChange={e => setMix(m => ({ ...m, [k]: Math.max(0, Math.min(100, Math.round(+e.target.value) || 0)) }))} />
                </label>
              ))}
            </div>
            {mix.easy + mix.medium + mix.hard !== 100 && <span className="mt-1 block text-muted">Adds up to {mix.easy + mix.medium + mix.hard}% — scaled to 100%.</span>}
          </details>
        </div>
      </div>

      {/* 5. Blueprint (collapsed: a one-line summary until the teacher wants to edit it) */}
      <details className="group rounded-xl border border-card-border dark:border-dark-border" open={total !== maxMarks}>
        <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm">
          <span className="font-heading font-semibold text-navy dark:text-dark-text">Paper pattern</span>
          <span className="text-muted">{blueprint.length} {word.toLowerCase()}s · {blueprint.reduce((t, r) => t + r.count, 0)} questions</span>
          <span className={`font-semibold ${total === maxMarks ? 'text-saffron' : 'text-amber-600 dark:text-amber-400'}`}>{total} / {maxMarks} marks</span>
          <span className="ml-auto inline-flex items-center gap-1 font-semibold text-saffron">Edit <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" /></span>
        </summary>
      <div className="border-t border-card-border p-4 dark:border-dark-border">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <span className={`${labelCls} !mb-0`}>{word}s, questions and marks</span>
          {examType !== 'custom' && (
            <button type="button" onClick={() => applyPreset(examType, pattern, presetMarks.includes(maxMarks) ? maxMarks : undefined)} disabled={busy}
              className="text-xs text-saffron font-medium flex items-center gap-1 hover:underline"><RotateCcw className="w-3.5 h-3.5" /> Reset to {EXAM_TYPES[examType].label} pattern</button>
          )}
        </div>
        <div className="overflow-x-auto rounded-xl border border-card-border dark:border-dark-border">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-off-white dark:bg-dark-bg text-xs uppercase tracking-wider text-muted">
              <tr className="text-left">
                <th className="py-2 px-3">{word}</th><th className="py-2 px-2">Question type</th><th className="py-2 px-2">Questions</th>
                <th className="py-2 px-2">Marks each</th><th className="py-2 px-2">Answer any</th><th className="py-2 px-2" title="Questions with an internal choice (OR)">OR choice</th>
                <th className="py-2 px-2" title="Assertion–reason questions among the MCQs">A–R</th><th className="py-2 px-3 text-right">Marks</th><th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {blueprint.map((r, i) => (
                <tr key={i} className="border-t border-card-border dark:border-dark-border">
                  <td className="py-2 px-3 font-heading font-bold text-navy dark:text-dark-text">{labels[i]}</td>
                  <td className="py-2 px-2">
                    <Select label={`${word} ${labels[i]} question type`} value={r.type} onChange={v => setRow(i, { type: v as SectionSpec['type'] })} wide
                      options={QUESTION_TYPE_LIST.map(t => [t, QUESTION_TYPES[t].label])} />
                  </td>
                  <td className="py-2 px-2"><Select label={`${word} ${labels[i]} questions`} value={r.count} onChange={v => setRow(i, { count: +v })} options={range(1, MAX_SECTION_QUESTIONS).map(n => [n, n])} /></td>
                  <td className="py-2 px-2"><Select label={`${word} ${labels[i]} marks each`} value={r.marksEach} onChange={v => setRow(i, { marksEach: +v })} options={range(1, 20).map(n => [n, n])} /></td>
                  <td className="py-2 px-2">
                    <Select label={`${word} ${labels[i]} answer any`} value={r.attempt ?? 0} onChange={v => setRow(i, { attempt: +v || null })}
                      options={[[0, 'All'], ...range(1, r.count - 1).map(n => [n, `${n} of ${r.count}`] as [number, string])]} />
                  </td>
                  <td className="py-2 px-2">
                    <Select label={`${word} ${labels[i]} internal choice`} value={r.choices} onChange={v => setRow(i, { choices: +v })}
                      options={range(0, r.count).map(n => [n, n === 0 ? 'None' : n === r.count ? `All ${n}` : n])} />
                  </td>
                  <td className="py-2 px-2">
                    {r.type === 'mcq'
                      ? <Select label={`${word} ${labels[i]} assertion–reason`} value={r.assertionReason} onChange={v => setRow(i, { assertionReason: +v })} options={range(0, r.count).map(n => [n, n])} />
                      : <span className="text-muted">—</span>}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums whitespace-nowrap text-navy dark:text-dark-text">
                    <span className="text-muted text-xs">{r.attempt ?? r.count} × {r.marksEach} =</span> <b>{specMarks(r)}</b>
                  </td>
                  <td className="py-2 pr-2">
                    <button type="button" onClick={() => setBlueprint(rows => rows.filter((_, j) => j !== i))} disabled={blueprint.length <= 1 || busy}
                      aria-label={`Remove ${word} ${labels[i]}`} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-red-500 disabled:opacity-30">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <button type="button" onClick={() => setBlueprint(rows => [...rows, normalizeSpec({ type: 'short', count: 4, marksEach: 3 })])}
            disabled={blueprint.length >= MAX_SECTIONS || busy} className="btn-outline !py-2 !px-4 text-sm disabled:opacity-40">
            <Plus className="w-4 h-4" /> Add {word.toLowerCase()}
          </button>
          <span aria-live="polite" className={`text-sm font-semibold flex items-center gap-1.5 ${total === maxMarks ? 'text-teal' : 'text-amber-600 dark:text-amber-400'}`}>
            {total === maxMarks ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            Total {total} / {maxMarks} marks
            {total !== maxMarks && <span className="font-normal">— {Math.abs(maxMarks - total)} {total < maxMarks ? 'short' : 'over'}</span>}
          </span>
          {total !== maxMarks && total > 0 && (
            <button type="button" onClick={() => setMaxMarks(total)} className="text-sm text-saffron underline">Make the paper out of {total}</button>
          )}
          <span className="text-xs text-muted">{blueprint.reduce((t, r) => t + r.count, 0)} questions</span>
        </div>
      </div>
      </details>

      {error && <ErrorNote>{error}</ErrorNote>}

      <div className="flex flex-col items-center gap-2">
        <button type="submit" disabled={busy || !!missing} className="btn-saffron h-12 w-full whitespace-nowrap px-7 text-base disabled:opacity-60 disabled:cursor-not-allowed sm:w-auto sm:min-w-[16rem]">
          {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Writing the paper…</> : <><Sparkles className="w-4 h-4" /> Generate question paper</>}
        </button>
        {busy ? (
          <p className="text-sm text-muted" aria-live="polite">
            Writing {word} {labels.join(', ')}… (about 1–2 minutes) · {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
          </p>
        ) : <p className="min-h-[1.25rem] text-sm text-muted">{missing ?? 'Includes the answer key · takes 1–2 minutes'}</p>}
      </div>
    </form>
  );
}

function Labelled({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={labelCls}>{label}{optional && <span className="normal-case font-normal"> (optional)</span>}</span>
      {children}
    </label>
  );
}

function Select({ label, value, onChange, options, wide }: {
  label: string; value: string | number; onChange: (v: string) => void; options: [string | number, string | number][]; wide?: boolean;
}) {
  return (
    <select aria-label={label} value={value} onChange={e => onChange(e.target.value)}
      className={`${inputCls} !h-9 !px-2 ${wide ? '!w-48' : '!w-24'}`}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}
