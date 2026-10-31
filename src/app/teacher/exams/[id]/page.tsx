'use client';

import { useState, type ReactNode } from 'react';
import { AlertTriangle, ArrowDown, ArrowUp, CheckCircle2, Eye, KeyRound, PencilLine, Plus, Printer, RotateCcw, Trash2, X } from 'lucide-react';
import {
  answeredCount, buildGeneralInstructions, defaultSectionTitle, emptyItem, emptyQuestion, emptySection, examTotal,
  formatDuration, isObjective, QUESTION_TYPE_LIST, QUESTION_TYPES, retypeItem, sectionInstruction, sectionLabel,
  sectionMarks, sectionStarts, sectionWord, shapeOfSection,
  type Difficulty, type ExamContent, type ExamHeader, type ExamItem, type ExamQuestion, type ExamQuestionType, type ExamSection,
} from '@/lib/exam';
import { useDoc } from '@/components/teacher/use-doc';
import EditorBar from '@/components/teacher/editor-bar';
import { ExamAnswerKey, ExamPaper, ExamPrintStyles } from '@/components/teacher/exam-paper';
import { ErrorNote, inputCls, labelCls, panelCls, Spinner, TeacherPage, textareaCls } from '@/components/teacher/ui';
import FeedbackBar from '@/components/feedback-bar';

type View = 'edit' | 'paper' | 'key';
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
// Textareas grow with their text where the browser supports field-sizing (Chromium); `rows` is the fallback.
const growCls = `${textareaCls} !min-h-[3.75rem] max-h-[32rem] [field-sizing:content]`;
/** Textarea rows that fit the text; `perLine` ≈ characters per line at the field's width. */
const rowsFor = (v: string, min = 2, perLine = 95) =>
  Math.min(16, Math.max(min, v.split('\n').reduce((t, line) => t + Math.max(1, Math.ceil(line.length / perLine)), 0)));
const relabel = (sections: ExamSection[]) => sections.map((s, i) => ({ ...s, label: sectionLabel(i) }));
const swap = <T,>(list: T[], i: number, j: number) => {
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
};

export default function ExamEditor({ params }: { params: { id: string } }) {
  const { doc, loadError, saveState, setContent, setTitle } = useDoc<ExamContent>(params.id);
  const [view, setView] = useState<View>('edit');
  const [printing, setPrinting] = useState<'paper' | 'key'>('paper');

  if (loadError) return <TeacherPage><ErrorNote>{loadError}</ErrorNote></TeacherPage>;
  if (!doc) return <TeacherPage><Spinner label="Loading exam paper…" /></TeacherPage>;
  const exam = doc.content;
  const h = exam.header;
  const total = examTotal(exam);
  const starts = sectionStarts(exam);
  const word = sectionWord(h.pattern);

  const setHeader = (p: Partial<ExamHeader>) => setContent(c => ({ ...c, header: { ...c.header, ...p } }));
  const setSections = (f: (s: ExamSection[]) => ExamSection[]) => setContent(c => ({ ...c, sections: f(c.sections) }));
  const patchSection = (si: number, p: Partial<ExamSection>) => setSections(ss => ss.map((s, j) => (j === si ? { ...s, ...p } : s)));
  const setQuestions = (si: number, f: (qs: ExamQuestion[]) => ExamQuestion[]) =>
    setSections(ss => ss.map((s, j) => (j === si ? { ...s, questions: f(s.questions) } : s)));
  const patchQ = (si: number, qi: number, p: Partial<ExamQuestion>) =>
    setQuestions(si, qs => qs.map((q, k) => (k === qi ? { ...q, ...p } : q)));

  const changeSectionType = (si: number, type: ExamQuestionType) => setSections(ss => ss.map((s, j) => {
    if (j !== si) return s;
    const keepAR = (q: ExamQuestion) => type === 'mcq' && q.type === 'assertion-reason';
    return {
      ...s,
      questionType: type,
      title: s.title === defaultSectionTitle(s.questionType, h.pattern) ? defaultSectionTitle(type, h.pattern) : s.title,
      questions: s.questions.map(q => (keepAR(q) ? q : {
        ...retypeItem(q, q.type, type), type,
        alternative: q.alternative ? retypeItem(q.alternative, q.type, type) : null,
      })),
    };
  }));
  const changeQuestionType = (si: number, qi: number, type: ExamQuestionType) => setQuestions(si, qs => qs.map((q, k) => (k !== qi ? q : {
    ...retypeItem(q, q.type, type), type,
    alternative: q.alternative ? retypeItem(q.alternative, q.type, type) : null,
  })));
  const addSection = () => setSections(ss => relabel([...ss, emptySection(ss.length, h.pattern)]));
  const rebuildInstructions = () =>
    setContent(c => ({ ...c, instructions: buildGeneralInstructions(c.sections.map(shapeOfSection), c.header.pattern) }));
  const print = (what: 'paper' | 'key') => {
    setPrinting(what);
    setTimeout(() => window.print(), 50);
  };

  // Things a teacher should fix before printing.
  const warnings: string[] = [];
  if (total !== h.maxMarks) warnings.push(`Questions add up to ${total} marks, but the paper says maximum marks ${h.maxMarks}.`);
  exam.sections.forEach((s, si) => {
    const name = `${word} ${s.label || sectionLabel(si)}`;
    if (!s.questions.length) warnings.push(`${name} has no questions.`);
    if (s.attempt && s.attempt >= s.questions.length && s.questions.length) warnings.push(`${name}: "answer any ${s.attempt}" but it only has ${s.questions.length} questions.`);
    const blank = s.questions.filter(q => !q.text.trim() || (q.alternative && !q.alternative.text.trim())).length;
    if (blank) warnings.push(`${name}: ${blank} question${blank > 1 ? 's' : ''} still empty.`);
    const noOptions = s.questions.filter(q => isObjective(q.type) && q.options.some(o => !o.trim())).length;
    if (noOptions) warnings.push(`${name}: ${noOptions} MCQ${noOptions > 1 ? 's have' : ' has'} empty options.`);
  });

  const meta = [h.className, h.subject, `${total}/${h.maxMarks} marks`, formatDuration(h.duration), h.language].filter(Boolean).join(' · ');

  return (
    <TeacherPage>
      <ExamPrintStyles />
      <div className="print:hidden">
        <EditorBar back="/teacher/exams" title={doc.title} onTitle={setTitle} saveState={saveState} meta={meta}
          actions={<>
            <div className="flex rounded-full border-2 border-card-border dark:border-dark-border p-0.5" role="tablist" aria-label="View">
              {([['edit', 'Edit', PencilLine], ['paper', 'Paper', Eye], ['key', 'Answer key', KeyRound]] as const).map(([v, label, Icon]) => (
                <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 transition-colors ${view === v ? 'bg-saffron text-white' : 'text-navy dark:text-dark-text hover:text-saffron'}`}>
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>
            <button onClick={() => print('paper')} className="btn-outline !py-2 !px-4 text-sm"><Printer className="w-4 h-4" /> Print question paper</button>
            <button onClick={() => print('key')} className="btn-outline !py-2 !px-4 text-sm"><Printer className="w-4 h-4" /> Print answer key</button>
          </>} />

        <div className={`mb-5 p-3 rounded-xl border flex flex-wrap items-center gap-x-3 gap-y-1 text-sm ${total === h.maxMarks
          ? 'bg-teal/5 border-teal/30 text-teal-700 dark:text-teal-300'
          : 'bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-300'}`}>
          {total === h.maxMarks ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span className="font-semibold">Total: {total} / {h.maxMarks} marks</span>
          <span className="text-muted">{exam.sections.map(s => `${s.label} ${sectionMarks(s)}`).join(' · ')}</span>
          {total !== h.maxMarks && total > 0 && (
            <button onClick={() => setHeader({ maxMarks: total })} className="ml-auto underline font-medium">Set maximum marks to {total}</button>
          )}
        </div>

        {view !== 'edit' ? (
          <div className="overflow-x-auto">
            <div className="mx-auto w-[210mm] max-w-none bg-white shadow-card rounded-md p-[15mm] min-h-[297mm]">
              {view === 'paper' ? <ExamPaper exam={exam} /> : <ExamAnswerKey exam={exam} />}
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_280px] gap-5 items-start">
            <div className="space-y-5 min-w-0">
              <div className={`${panelCls} p-5`}>
                <h2 className="font-heading font-semibold text-navy dark:text-dark-text mb-3">Paper header</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="School / university name"><input className={inputCls} value={h.institution} onChange={e => setHeader({ institution: e.target.value })} placeholder="e.g. Kendriya Vidyalaya No. 2, Pune" /></Field>
                  <Field label="Exam name"><input className={inputCls} value={h.examName} onChange={e => setHeader({ examName: e.target.value })} /></Field>
                  <Field label={h.pattern === 'university' ? 'Programme / semester' : 'Class'}><input className={inputCls} value={h.className} onChange={e => setHeader({ className: e.target.value })} /></Field>
                  <Field label={h.pattern === 'university' ? 'Course / subject' : 'Subject'}><input className={inputCls} value={h.subject} onChange={e => setHeader({ subject: e.target.value })} /></Field>
                  <Field label="Subject / course code"><input className={inputCls} value={h.subjectCode} onChange={e => setHeader({ subjectCode: e.target.value })} placeholder="optional" /></Field>
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="Minutes"><input type="number" min={5} max={600} className={inputCls} value={h.duration} onChange={e => setHeader({ duration: Math.max(5, Math.min(600, +e.target.value || 0)) })} /></Field>
                    <Field label="Max marks"><input type="number" min={1} max={500} className={inputCls} value={h.maxMarks} onChange={e => setHeader({ maxMarks: Math.max(1, Math.min(500, +e.target.value || 0)) })} /></Field>
                    <Field label="Pattern">
                      <select className={inputCls} value={h.pattern} onChange={e => setHeader({ pattern: e.target.value as ExamHeader['pattern'] })}>
                        <option value="school">School</option><option value="university">University</option>
                      </select>
                    </Field>
                  </div>
                </div>
              </div>

              <div className={`${panelCls} p-5`}>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <label className={`${labelCls} !mb-0`} htmlFor="general">General instructions <span className="normal-case font-normal">(one per line)</span></label>
                  <button onClick={rebuildInstructions} className="text-xs text-saffron font-medium flex items-center gap-1 hover:underline" title="Rewrite the instructions from the current sections (in English)">
                    <RotateCcw className="w-3.5 h-3.5" /> Rebuild from sections
                  </button>
                </div>
                <textarea id="general" className={textareaCls} rows={rowsFor(exam.instructions.join('\n'), 4)} value={exam.instructions.join('\n')}
                  onChange={e => setContent(c => ({ ...c, instructions: e.target.value.split('\n') }))} />
              </div>

              {exam.sections.map((s, si) => (
                <section key={si} id={`section-${si}`} className={`${panelCls} p-5 space-y-4 scroll-mt-24`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 h-9 rounded-lg bg-saffron/10 text-saffron font-heading font-bold text-sm flex items-center">{word}</span>
                    <input aria-label={`${word} label`} className={`${inputCls} !w-14 !h-9 text-center font-bold`} value={s.label} maxLength={4}
                      onChange={e => patchSection(si, { label: e.target.value })} />
                    <input aria-label={`${word} title`} className={`${inputCls} !h-9 flex-1 min-w-[12rem] font-medium`} value={s.title}
                      onChange={e => patchSection(si, { title: e.target.value })} />
                    <div className="flex gap-1">
                      <SmallBtn label={`Move ${word.toLowerCase()} up`} disabled={si === 0} onClick={() => setSections(ss => relabel(swap(ss, si, si - 1)))}><ArrowUp className="w-4 h-4" /></SmallBtn>
                      <SmallBtn label={`Move ${word.toLowerCase()} down`} disabled={si === exam.sections.length - 1} onClick={() => setSections(ss => relabel(swap(ss, si, si + 1)))}><ArrowDown className="w-4 h-4" /></SmallBtn>
                      <SmallBtn label={`Delete ${word.toLowerCase()}`} danger disabled={exam.sections.length <= 1}
                        onClick={() => { if (confirm(`Delete ${word} ${s.label} and its ${s.questions.length} questions?`)) setSections(ss => relabel(ss.filter((_, j) => j !== si))); }}><Trash2 className="w-4 h-4" /></SmallBtn>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Field label="Question type">
                      <select className={`${inputCls} !h-10`} value={s.questionType} onChange={e => changeSectionType(si, e.target.value as ExamQuestionType)}>
                        {QUESTION_TYPE_LIST.map(t => <option key={t} value={t}>{QUESTION_TYPES[t].label}</option>)}
                      </select>
                    </Field>
                    <Field label="Marks each">
                      <input type="number" min={1} max={50} className={`${inputCls} !h-10`} value={s.marksEach}
                        onChange={e => patchSection(si, { marksEach: Math.max(0, Math.min(50, +e.target.value || 0)) })} />
                    </Field>
                    <Field label="Answer any">
                      <input type="number" min={1} max={s.questions.length} placeholder="all" className={`${inputCls} !h-10`} value={s.attempt ?? ''}
                        onChange={e => patchSection(si, { attempt: +e.target.value > 0 ? Math.min(99, Math.round(+e.target.value)) : null })} />
                    </Field>
                    <div>
                      <span className={labelCls}>Marks</span>
                      <p className="h-10 flex items-center text-sm font-semibold text-navy dark:text-dark-text tabular-nums">
                        {answeredCount(s)} × {s.marksEach} = {sectionMarks(s)}
                      </p>
                    </div>
                  </div>

                  <Field label={`${word} instructions`} action={
                    <button onClick={() => patchSection(si, { instructions: sectionInstruction(shapeOfSection(s), h.pattern) })} className="text-xs text-saffron font-medium flex items-center gap-1 hover:underline">
                      <RotateCcw className="w-3.5 h-3.5" /> Rebuild
                    </button>}>
                    <input className={`${inputCls} !h-10`} value={s.instructions} onChange={e => patchSection(si, { instructions: e.target.value })} />
                  </Field>

                  <ol className="space-y-3">
                    {s.questions.map((q, qi) => (
                      <QuestionEditor key={qi} q={q} n={starts[si] + qi} marks={s.marksEach} eitherOr={h.pattern === 'university'}
                        first={qi === 0} last={qi === s.questions.length - 1}
                        onPatch={p => patchQ(si, qi, p)}
                        onType={t => changeQuestionType(si, qi, t)}
                        onMove={dir => setQuestions(si, qs => swap(qs, qi, qi + dir))}
                        onDelete={() => setQuestions(si, qs => qs.filter((_, k) => k !== qi))} />
                    ))}
                  </ol>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setQuestions(si, qs => [...qs, emptyQuestion(s.questionType, qs[qs.length - 1]?.chapter)])}
                      className="btn-outline !py-2 !px-4 text-sm"><Plus className="w-4 h-4" /> Add {QUESTION_TYPES[s.questionType].short} question</button>
                    {s.questionType === 'mcq' && (
                      <button onClick={() => setQuestions(si, qs => [...qs, emptyQuestion('assertion-reason', qs[qs.length - 1]?.chapter)])}
                        className="btn-outline !py-2 !px-4 text-sm"><Plus className="w-4 h-4" /> Add assertion–reason</button>
                    )}
                  </div>
                </section>
              ))}

              <button onClick={addSection} disabled={exam.sections.length >= 8} className="btn-outline !py-2 !px-4 text-sm disabled:opacity-40">
                <Plus className="w-4 h-4" /> Add {word.toLowerCase()}
              </button>
            </div>

            <aside className={`${panelCls} p-4 lg:sticky lg:top-6 space-y-3`}>
              <h2 className="font-heading font-semibold text-navy dark:text-dark-text">Paper summary</h2>
              <table className="w-full text-sm">
                <tbody>
                  {exam.sections.map((s, si) => (
                    <tr key={si} className="border-b border-card-border dark:border-dark-border last:border-0">
                      <td className="py-1.5 pr-2">
                        <a href={`#section-${si}`} className="hover:text-saffron text-navy dark:text-dark-text">{word} {s.label}</a>
                        <span className="block text-xs text-muted">
                          {s.questions.length} Qs{s.attempt && s.attempt < s.questions.length ? `, any ${s.attempt}` : ''}
                          {s.questions.some(q => q.alternative) ? ` · ${s.questions.filter(q => q.alternative).length} OR` : ''}
                        </span>
                      </td>
                      <td className="py-1.5 text-right tabular-nums text-muted">{answeredCount(s)}×{s.marksEach}</td>
                      <td className="py-1.5 pl-2 text-right tabular-nums font-semibold text-navy dark:text-dark-text">{sectionMarks(s)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="pt-2 font-semibold text-navy dark:text-dark-text">Total</td><td />
                    <td className={`pt-2 pl-2 text-right tabular-nums font-bold ${total === h.maxMarks ? 'text-teal' : 'text-amber-600 dark:text-amber-400'}`}>{total}/{h.maxMarks}</td>
                  </tr>
                </tbody>
              </table>
              {warnings.length > 0 ? (
                <ul className="space-y-1.5 text-xs text-amber-700 dark:text-amber-300">
                  {warnings.map((w, i) => <li key={i} className="flex gap-1.5"><AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {w}</li>)}
                </ul>
              ) : (
                <p className="text-xs text-teal flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Ready to print</p>
              )}
            </aside>
          </div>
        )}
      </div>

      <FeedbackBar feature="exam" refId={doc.id} label="Is this paper useful?" className="mt-8" />
      <div className="hidden print:block">
        {printing === 'paper' ? <ExamPaper exam={exam} /> : <ExamAnswerKey exam={exam} />}
      </div>
    </TeacherPage>
  );
}

function QuestionEditor({ q, n, marks, eitherOr, first, last, onPatch, onType, onMove, onDelete }: {
  q: ExamQuestion; n: number; marks: number; eitherOr: boolean; first: boolean; last: boolean;
  onPatch: (p: Partial<ExamQuestion>) => void; onType: (t: ExamQuestionType) => void;
  onMove: (dir: -1 | 1) => void; onDelete: () => void;
}) {
  const patchAlt = (p: Partial<ExamItem>) => q.alternative && onPatch({ alternative: { ...q.alternative, ...p } });
  return (
    <li className="rounded-xl border border-card-border dark:border-dark-border p-4 space-y-3 bg-off-white/60 dark:bg-dark-bg/40">
      <div className="flex flex-wrap items-center gap-2">
        <span className="min-w-9 px-2 h-9 rounded-lg bg-navy/5 dark:bg-white/10 text-navy dark:text-dark-text font-heading font-bold text-sm flex items-center justify-center">Q{n}</span>
        <select aria-label="Question type" className={`${inputCls} !w-auto !h-9`} value={q.type} onChange={e => onType(e.target.value as ExamQuestionType)}>
          {QUESTION_TYPE_LIST.map(t => <option key={t} value={t}>{QUESTION_TYPES[t].label}</option>)}
        </select>
        <input aria-label="Chapter" placeholder="Chapter / unit" className={`${inputCls} !h-9 !w-auto flex-1 min-w-[9rem]`} value={q.chapter}
          onChange={e => onPatch({ chapter: e.target.value })} />
        <select aria-label="Difficulty" className={`${inputCls} !w-auto !h-9 capitalize`} value={q.difficulty} onChange={e => onPatch({ difficulty: e.target.value as Difficulty })}>
          {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <span className="text-xs text-muted tabular-nums">{marks} mark{marks === 1 ? '' : 's'}</span>
        <div className="ml-auto flex gap-1">
          <SmallBtn label="Move question up" disabled={first} onClick={() => onMove(-1)}><ArrowUp className="w-4 h-4" /></SmallBtn>
          <SmallBtn label="Move question down" disabled={last} onClick={() => onMove(1)}><ArrowDown className="w-4 h-4" /></SmallBtn>
          <SmallBtn label="Delete question" danger onClick={onDelete}><Trash2 className="w-4 h-4" /></SmallBtn>
        </div>
      </div>

      <ItemFields item={q} type={q.type} name={`q${n}`} prefix={eitherOr && q.alternative ? '(a) ' : ''} onPatch={onPatch} />

      {q.alternative ? (
        <div className="rounded-xl border-2 border-dashed border-saffron/40 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-saffron">OR — internal choice{eitherOr ? ' (b)' : ''}</span>
            <button onClick={() => onPatch({ alternative: null })} className="text-xs text-muted hover:text-red-500 flex items-center gap-1"><X className="w-3.5 h-3.5" /> Remove choice</button>
          </div>
          <ItemFields item={q.alternative} type={q.type} name={`q${n}-alt`} onPatch={patchAlt} />
        </div>
      ) : (
        <button onClick={() => onPatch({ alternative: { ...emptyItem(q.type, q.chapter), difficulty: q.difficulty } })}
          className="text-sm text-saffron font-medium flex items-center gap-1 hover:underline"><Plus className="w-4 h-4" /> Add OR question (internal choice)</button>
      )}
    </li>
  );
}

function ItemFields({ item, type, name, prefix = '', onPatch }: {
  item: ExamItem; type: ExamQuestionType; name: string; prefix?: string; onPatch: (p: Partial<ExamItem>) => void;
}) {
  const objective = isObjective(type);
  return (
    <>
      <textarea aria-label={`${prefix}Question`} className={growCls} rows={rowsFor(item.text, type === 'case-based' ? 6 : 2)} value={item.text}
        placeholder={type === 'assertion-reason' ? 'Assertion (A): …\nReason (R): …' : type === 'case-based' ? 'Case / passage…\n(i) … (1)\n(ii) … (1)\n(iii) … (2)' : 'Question'}
        onChange={e => onPatch({ text: e.target.value })} />
      {objective && (
        <fieldset className="grid sm:grid-cols-2 gap-2">
          <legend className={labelCls}>Options — select the correct one</legend>
          {item.options.map((o, j) => (
            <div key={j} className="flex items-center gap-2">
              <input type="radio" name={`${name}-correct`} checked={item.correct === j} onChange={() => onPatch({ correct: j })}
                aria-label={`Mark option ${String.fromCharCode(97 + j)} correct`} className="w-4 h-4 accent-[#FF6B2C] shrink-0" />
              <span className="text-xs text-muted w-5">({String.fromCharCode(97 + j)})</span>
              <input className={`${inputCls} !h-9 ${item.correct === j ? '!border-teal' : ''}`} value={o} placeholder={`Option ${String.fromCharCode(97 + j)}`}
                onChange={e => onPatch({ options: item.options.map((x, k) => (k === j ? e.target.value : x)) })} />
            </div>
          ))}
        </fieldset>
      )}
      <div className={objective ? '' : 'grid md:grid-cols-[3fr_2fr] gap-3'}>
        <Field label={objective ? 'Reason (answer key)' : 'Answer / value points'}>
          <textarea className={growCls} rows={rowsFor(item.answer, objective ? 1 : 3, objective ? 95 : 52)} value={item.answer} onChange={e => onPatch({ answer: e.target.value })} />
        </Field>
        {!objective && (
          <Field label="Marking scheme">
            <textarea className={growCls} rows={rowsFor(item.markingScheme, 3, 34)} value={item.markingScheme}
              placeholder="e.g. Definition – 1; Example – 1" onChange={e => onPatch({ markingScheme: e.target.value })} />
          </Field>
        )}
      </div>
    </>
  );
}

function Field({ label, action, children }: { label: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="relative">
      <label className="block"><span className={labelCls}>{label}</span>{children}</label>
      {action && <div className="absolute right-0 top-0">{action}</div>}
    </div>
  );
}

function SmallBtn({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled} aria-label={label} title={label}
      className={`w-9 h-9 rounded-lg flex items-center justify-center border border-card-border dark:border-dark-border text-navy dark:text-dark-text disabled:opacity-30 ${danger ? 'hover:text-red-500 hover:border-red-300' : 'hover:text-saffron hover:border-saffron'}`}>
      {children}
    </button>
  );
}
