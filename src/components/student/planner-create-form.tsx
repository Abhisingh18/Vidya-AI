'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Sparkles, Trash2 } from 'lucide-react';
import { addDays, istDate, MAX_SUBJECTS, PLAN_CLASSES, WEEKDAYS, type Confidence } from '@/lib/planner';
import { LANGUAGES } from '@/lib/languages';
import type { SourceFile } from '@/lib/source';
import SourceUpload from '@/components/teacher/source-upload';
import { api, ErrorNote, inputCls, labelCls, textareaCls } from '@/components/teacher/ui';
import { studioCardCls } from './study-shell';

interface SubjectRow { name: string; chapters: string; confidence: Confidence }
const CONF: { id: Confidence; label: string }[] = [{ id: 'low', label: '😟 Weak' }, { id: 'medium', label: '🙂 OK' }, { id: 'high', label: '😎 Strong' }];
const HOURS = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8];

export default function PlannerCreateForm() {
  const router = useRouter();
  const today = istDate();
  const [examName, setExamName] = useState('');
  const [examDate, setExamDate] = useState(addDays(today, 30));
  const [hours, setHours] = useState(2);
  const [daysOff, setDaysOff] = useState<number[]>([0]);
  const [grade, setGrade] = useState('10');
  const [language, setLanguage] = useState('English');
  const [subjects, setSubjects] = useState<SubjectRow[]>([{ name: '', chapters: '', confidence: 'medium' }]);
  const [sources, setSources] = useState<SourceFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setRow = (i: number, p: Partial<SubjectRow>) => setSubjects(s => s.map((r, j) => (j === i ? { ...r, ...p } : r)));
  const missing = !examName.trim() ? 'Enter your exam name.'
    : subjects.some(s => !s.name.trim()) ? 'Give every subject a name.'
    : !sources.length && subjects.some(s => !s.chapters.trim()) ? 'Add chapters for each subject, or upload your syllabus.' : '';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (missing) return;
    setBusy(true); setError(null);
    try {
      const { id } = await api<{ id: string }>('/api/student/plan', {
        method: 'POST', json: { examName, examDate, hoursPerDay: hours, daysOff, grade, language, subjects, sources },
      });
      router.push(`/planner/${id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className={`${studioCardCls} space-y-5`}>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="lg:col-span-2">
          <label className={labelCls} htmlFor="plan-exam">Exam</label>
          <input id="plan-exam" className={inputCls} value={examName} onChange={e => setExamName(e.target.value)} maxLength={120} placeholder="e.g. Class 10 Board Exams, Half-Yearly" />
        </div>
        <div>
          <label className={labelCls} htmlFor="plan-date">Exam date</label>
          <input id="plan-date" type="date" className={inputCls} value={examDate} min={addDays(today, 1)} max={addDays(today, 366)} onChange={e => setExamDate(e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Study time per day</label>
          <select className={inputCls} value={hours} onChange={e => setHours(Number(e.target.value))}>
            {HOURS.map(h => <option key={h} value={h}>{h < 1 ? '30 minutes' : `${h} hour${h === 1 ? '' : 's'}`}</option>)}
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="sm:col-span-1">
          <p className={labelCls}>Days off</p>
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAYS.map((d, i) => (
              <button key={d} type="button" aria-pressed={daysOff.includes(i)} onClick={() => setDaysOff(o => (o.includes(i) ? o.filter(x => x !== i) : [...o, i]))}
                className={`w-11 h-9 rounded-lg text-xs font-semibold border-2 ${daysOff.includes(i) ? 'border-saffron bg-saffron/10 text-saffron' : 'border-card-border dark:border-dark-border text-muted'}`}>{d}</button>
            ))}
          </div>
        </div>
        <div>
          <label className={labelCls}>Class</label>
          <select className={inputCls} value={grade} onChange={e => setGrade(e.target.value)}>
            {PLAN_CLASSES.map(g => <option key={g} value={g}>Class {g}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Language</label>
          <select className={inputCls} value={language} onChange={e => setLanguage(e.target.value)}>
            {LANGUAGES.map(l => <option key={l.name} value={l.name}>{l.name}</option>)}
          </select>
        </div>
      </div>

      <div>
        <p className={labelCls}>Subjects & chapters</p>
        <div className="space-y-3">
          {subjects.map((s, i) => (
            <div key={i} className="rounded-xl border-2 border-card-border dark:border-dark-border p-3 grid md:grid-cols-[200px_1fr_auto] gap-3 items-start">
              <div className="space-y-2">
                <input className={inputCls} value={s.name} onChange={e => setRow(i, { name: e.target.value })} placeholder="Subject, e.g. Science" maxLength={60} aria-label={`Subject ${i + 1}`} />
                <div className="flex gap-1">
                  {CONF.map(c => (
                    <button key={c.id} type="button" aria-pressed={s.confidence === c.id} onClick={() => setRow(i, { confidence: c.id })}
                      className={`flex-1 h-8 rounded-lg text-[11px] font-semibold border ${s.confidence === c.id ? 'border-saffron bg-saffron/10 text-saffron' : 'border-card-border dark:border-dark-border text-muted'}`}>{c.label}</button>
                  ))}
                </div>
              </div>
              <textarea className={`${textareaCls} min-h-[84px]`} value={s.chapters} onChange={e => setRow(i, { chapters: e.target.value })} aria-label={`Chapters for subject ${i + 1}`}
                placeholder={'Chapters, one per line\nLight – reflection and refraction\nElectricity'} />
              <button type="button" onClick={() => setSubjects(list => list.filter((_, j) => j !== i))} disabled={subjects.length === 1} aria-label="Remove subject"
                className="w-10 h-10 flex items-center justify-center text-muted hover:text-red-500 disabled:opacity-30"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
        {subjects.length < MAX_SUBJECTS && (
          <button type="button" onClick={() => setSubjects(l => [...l, { name: '', chapters: '', confidence: 'medium' }])} className="mt-2 text-sm text-saffron font-medium flex items-center gap-1">
            <Plus className="w-4 h-4" /> Add subject
          </button>
        )}
      </div>

      <SourceUpload files={sources} onChange={setSources} disabled={busy} topic={subjects.map(s => `${s.name} ${s.chapters}`).join(' ')}
        hint="Or upload your syllabus / date sheet (PDF, PPTX, DOCX, TXT) — chapters will be taken from it." />

      {error && <ErrorNote>{error}</ErrorNote>}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy || !!missing} className="btn-saffron h-12 px-7 text-base disabled:opacity-60 disabled:cursor-not-allowed">
          {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Planning your days…</> : <><Sparkles className="w-4 h-4" /> Make my study plan</>}
        </button>
        <span className="text-xs text-muted">{busy ? 'Usually 20–60 seconds.' : missing}</span>
      </div>
    </form>
  );
}
