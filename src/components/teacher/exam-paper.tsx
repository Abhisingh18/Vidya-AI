// Formal, black-and-white renderings of an exam paper (TeacherDoc type 'exam'):
// the question paper and its answer key / marking scheme. Used for printing
// (A4) and for the on-screen preview in the editor.
import type { ReactNode } from 'react';
import {
  answeredCount, formatDuration, isObjective, sectionMarks, sectionStarts, sectionWord,
  type Difficulty, type ExamContent, type ExamItem, type ExamPattern, type ExamQuestion, type ExamSection,
} from '@/lib/exam';

/** A4 page setup; only rendered on the exam pages, so it doesn't affect other prints. */
export function ExamPrintStyles() {
  return (
    <style>{`
      @page { size: A4; margin: 14mm 15mm 16mm; }
      @page { @bottom-right { content: "Page " counter(page) " of " counter(pages); font: 9pt Georgia, serif; } }
      @media print { html, body { background: #fff !important; } }
    `}</style>
  );
}

const letter = (i: number) => String.fromCharCode(97 + i);
const marksLabel = (m: number, pattern: ExamPattern) => (pattern === 'university' ? `(${m})` : String(m));
const sectionMarksLine = (s: ExamSection) => `${answeredCount(s)} × ${s.marksEach} = ${sectionMarks(s)}`;

function Options({ item }: { item: ExamItem }) {
  if (!item.options.length) return null;
  // Two columns like printed papers; long options (e.g. assertion–reason) get a line each.
  const wide = item.options.some(o => o.length > 42);
  return (
    <ol className={`mt-1 grid gap-x-8 gap-y-0.5 ${wide ? 'grid-cols-1' : 'grid-cols-2'}`}>
      {item.options.map((o, j) => <li key={j} className="flex gap-1.5"><span>({letter(j)})</span><span>{o}</span></li>)}
    </ol>
  );
}

/** Number | question | marks, with the marks right-aligned like a printed paper. */
function Row({ num, marks, children }: { num?: ReactNode; marks?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="w-7 shrink-0 text-right">{num}</span>
      <div className="flex-1 min-w-0">{children}</div>
      <span className="w-9 shrink-0 text-right">{marks}</span>
    </div>
  );
}

function Or() {
  return <p className="text-center font-bold my-1.5">OR</p>;
}

function RollBox({ pattern }: { pattern: ExamPattern }) {
  return (
    <div className="flex items-center justify-end gap-2 text-[10pt]">
      <span className="font-semibold">{pattern === 'university' ? 'Reg. No.' : 'Roll No.'}</span>
      <span className="flex">
        {Array.from({ length: pattern === 'university' ? 12 : 8 }, (_, i) => (
          <span key={i} className="w-6 h-7 border border-black -ml-px first:ml-0" />
        ))}
      </span>
    </div>
  );
}

function PaperHeader({ exam, subtitle }: { exam: ExamContent; subtitle?: string }) {
  const h = exam.header;
  const uni = h.pattern === 'university';
  return (
    <header className="text-center">
      {h.institution && <p className="text-[15pt] font-bold uppercase tracking-wide leading-tight">{h.institution}</p>}
      {h.examName && <p className="text-[13pt] font-bold mt-0.5">{h.examName}</p>}
      {subtitle && <p className="text-[12pt] font-bold uppercase tracking-wider mt-1">{subtitle}</p>}
      <div className="mt-2 flex flex-wrap justify-center gap-x-8 text-[11.5pt]">
        {h.className && <span><b>{uni ? 'Programme / Semester' : 'Class'}:</b> {h.className.replace(/^Class\s+/i, '')}</span>}
        {h.subject && <span><b>{uni ? 'Course' : 'Subject'}:</b> {h.subject}{h.subjectCode && !uni ? ` (${h.subjectCode})` : ''}</span>}
        {uni && h.subjectCode && <span><b>Course Code:</b> {h.subjectCode}</span>}
      </div>
      <div className="mt-2 flex justify-between border-y-2 border-black py-1 text-[11.5pt] font-semibold">
        <span>{uni ? 'Duration' : 'Time allowed'}: {formatDuration(h.duration)}</span>
        <span>{uni ? 'Max. Marks' : 'Maximum Marks'}: {h.maxMarks}</span>
      </div>
    </header>
  );
}

function SectionHeading({ section, pattern, withTitle = true }: { section: ExamSection; pattern: ExamPattern; withTitle?: boolean }) {
  return (
    <div className="text-center pt-5 mb-2 break-inside-avoid break-after-avoid">
      <p className="font-bold uppercase tracking-wider text-[12pt]">
        {sectionWord(pattern)} {section.label}
        {pattern === 'university' && <span className="normal-case tracking-normal"> — ({sectionMarksLine(section)} marks)</span>}
      </p>
      {withTitle && section.title && <p className="font-semibold text-[11pt]">{section.title}{pattern === 'school' && ` (${sectionMarksLine(section)})`}</p>}
      {section.instructions && <p className="italic text-[10.5pt] whitespace-pre-line">{section.instructions}</p>}
    </div>
  );
}

const Text = ({ children }: { children: string }) => <p className="whitespace-pre-line">{children || ' '}</p>;

function QuestionBlock({ q, n, marks, pattern, after }: { q: ExamQuestion; n: number; marks: number; pattern: ExamPattern; after?: ReactNode }) {
  const eitherOr = pattern === 'university' && !!q.alternative;
  const m = marksLabel(marks, pattern);
  return (
    <div className="break-inside-avoid mb-3">
      <Row num={`${n}.`} marks={m}>
        {eitherOr ? <div className="flex gap-1.5"><span>(a)</span><div className="flex-1"><Text>{q.text}</Text></div></div> : <Text>{q.text}</Text>}
        <Options item={q} />
      </Row>
      {q.alternative && (
        <>
          <Or />
          <Row marks={m}>
            {eitherOr ? <div className="flex gap-1.5"><span>(b)</span><div className="flex-1"><Text>{q.alternative.text}</Text></div></div> : <Text>{q.alternative.text}</Text>}
            <Options item={q.alternative} />
          </Row>
        </>
      )}
      {after}
    </div>
  );
}

const EndMark = () => <p className="text-center font-semibold pt-6 tracking-widest text-[10pt]">* * * END OF QUESTION PAPER * * *</p>;

/** The question paper students receive. */
export function ExamPaper({ exam }: { exam: ExamContent }) {
  const starts = sectionStarts(exam);
  const pattern = exam.header.pattern;
  const instructions = exam.instructions.filter(i => i.trim());
  // The end mark is printed inside the last question's block so it never sits alone on a page.
  const lastSection = exam.sections.length - 1;
  const endsWithQuestion = (exam.sections[lastSection]?.questions.length ?? 0) > 0;
  const endAfter = (si: number, qi: number) =>
    si === lastSection && qi === exam.sections[si].questions.length - 1 ? <EndMark /> : undefined;
  return (
    <article className="exam-paper font-serif text-black bg-white text-[11.5pt] leading-snug">
      <RollBox pattern={pattern} />
      <div className="mt-3"><PaperHeader exam={exam} /></div>
      {instructions.length > 0 && (
        <section className="mt-3 text-[10.5pt]">
          <p className="font-bold">General Instructions:</p>
          <ol className="list-decimal pl-6 space-y-0.5 mt-0.5">{instructions.map((x, i) => <li key={i}>{x}</li>)}</ol>
        </section>
      )}
      {exam.sections.map((s, si) => (
        <section key={si}>
          {/* A heading never ends a page: it travels with the section's first question. */}
          <div className="break-inside-avoid">
            <SectionHeading section={s} pattern={pattern} />
            {s.questions[0] && <QuestionBlock q={s.questions[0]} n={starts[si]} marks={s.marksEach} pattern={pattern} after={endAfter(si, 0)} />}
          </div>
          {s.questions.slice(1).map((q, qi) => (
            <QuestionBlock key={qi} q={q} n={starts[si] + qi + 1} marks={s.marksEach} pattern={pattern} after={endAfter(si, qi + 1)} />
          ))}
        </section>
      ))}
      {!endsWithQuestion && <EndMark />}
    </article>
  );
}

function KeyItem({ item, marks, pattern, label }: { item: ExamItem; marks: number; pattern: ExamPattern; label?: string }) {
  const objective = item.options.length > 0;
  const flat = item.text.replace(/\s+/g, ' ').trim();
  const excerpt = flat.slice(0, 150);
  return (
    <div>
      {label && <p className="font-semibold">{label}</p>}
      <p className="italic text-[10pt] text-gray-700">{excerpt}{flat.length > excerpt.length ? '…' : ''}</p>
      {objective && (
        <p><b>Answer:</b> ({letter(item.correct)}) {item.options[item.correct] ?? ''}</p>
      )}
      {item.answer && (
        <div className={objective ? 'text-[10.5pt]' : ''}>
          {!objective && <p className="font-semibold">Expected answer / value points:</p>}
          <p className="whitespace-pre-line">{item.answer}</p>
        </div>
      )}
      {item.markingScheme && !objective && (
        <p className="mt-0.5 text-[10.5pt]"><b>Marking scheme ({marksLabel(marks, pattern).replace(/[()]/g, '')} marks):</b> <span className="whitespace-pre-line">{item.markingScheme}</span></p>
      )}
    </div>
  );
}

function KeyQuestion({ q, n, marks, pattern }: { q: ExamQuestion; n: number; marks: number; pattern: ExamPattern }) {
  return (
    <div className="break-inside-avoid mb-3">
      <Row num={`${n}.`} marks={marksLabel(marks, pattern)}>
        <KeyItem item={q} marks={marks} pattern={pattern} label={q.alternative && pattern === 'university' ? '(a)' : undefined} />
        {q.alternative && (
          <div className="mt-1.5">
            <p className="font-bold text-center">OR</p>
            <KeyItem item={q.alternative} marks={marks} pattern={pattern} label={pattern === 'university' ? '(b)' : undefined} />
          </div>
        )}
      </Row>
    </div>
  );
}

const DIFF: Difficulty[] = ['easy', 'medium', 'hard'];

/** Answer key and marking scheme for examiners, with a short paper analysis. */
export function ExamAnswerKey({ exam }: { exam: ExamContent }) {
  const starts = sectionStarts(exam);
  const pattern = exam.header.pattern;
  const byDifficulty: Record<Difficulty, number> = { easy: 0, medium: 0, hard: 0 };
  const byChapter = new Map<string, number>();
  for (const s of exam.sections) {
    for (const q of s.questions) {
      byDifficulty[q.difficulty] += s.marksEach;
      const ch = q.chapter.trim() || 'Unspecified';
      byChapter.set(ch, (byChapter.get(ch) ?? 0) + s.marksEach);
    }
  }
  const printed = DIFF.reduce((t, d) => t + byDifficulty[d], 0) || 1;
  return (
    <article className="exam-paper font-serif text-black bg-white text-[11pt] leading-snug">
      <PaperHeader exam={exam} subtitle="Answer Key & Marking Scheme" />
      <p className="text-[10pt] italic mt-2">For examiners only. Award marks for any equivalent correct answer or method; the value points below are indicative.</p>
      {exam.sections.map((s, si) => {
        const objective = isObjective(s.questionType) && s.questions.every(q => q.options.length > 0);
        return (
          <section key={si}>
            {objective && <SectionHeading section={s} pattern={pattern} withTitle />}
            {objective ? (
              <table className="w-full border-collapse text-[10.5pt]">
                <thead>
                  <tr className="border-b border-black text-left"><th className="py-1 pr-2 w-12">Q.</th><th className="py-1 pr-2 w-14">Ans.</th><th className="py-1">Correct option / reason</th><th className="py-1 w-10 text-right">Marks</th></tr>
                </thead>
                <tbody>
                  {s.questions.flatMap((q, qi) => [q, ...(q.alternative ? [q.alternative] : [])].map((item, k) => (
                    <tr key={`${qi}-${k}`} className="border-b border-gray-400 align-top break-inside-avoid">
                      <td className="py-1 pr-2">{k ? 'OR' : `${starts[si] + qi}.`}</td>
                      <td className="py-1 pr-2 font-bold">({letter(item.correct)})</td>
                      <td className="py-1">{item.options[item.correct]}{item.answer && <span className="text-gray-700"> — {item.answer}</span>}</td>
                      <td className="py-1 text-right">{k ? '' : s.marksEach}</td>
                    </tr>
                  )))}
                </tbody>
              </table>
            ) : (
              <>
                <div className="break-inside-avoid">
                  <SectionHeading section={s} pattern={pattern} withTitle />
                  {s.questions[0] && <KeyQuestion q={s.questions[0]} n={starts[si]} marks={s.marksEach} pattern={pattern} />}
                </div>
                {s.questions.slice(1).map((q, qi) => <KeyQuestion key={qi} q={q} n={starts[si] + qi + 1} marks={s.marksEach} pattern={pattern} />)}
              </>
            )}
          </section>
        );
      })}

      <section className="mt-6 break-inside-avoid text-[10pt]">
        <p className="font-bold uppercase tracking-wider text-center text-[11pt] mb-2">Paper analysis</p>
        <div className="grid grid-cols-2 gap-6 items-start">
          <table className="w-full border-collapse">
            <thead><tr className="border-b border-black text-left"><th className="py-0.5">{sectionWord(pattern)}</th><th>Questions</th><th className="text-right">Marks</th></tr></thead>
            <tbody>
              {exam.sections.map((s, i) => (
                <tr key={i} className="border-b border-gray-400"><td className="py-0.5">{s.label} — {s.title}</td><td>{s.questions.length}{s.attempt && s.attempt < s.questions.length ? ` (any ${s.attempt})` : ''}</td><td className="text-right">{sectionMarks(s)}</td></tr>
              ))}
              <tr className="font-bold"><td className="py-0.5">Total</td><td>{exam.sections.reduce((t, s) => t + s.questions.length, 0)}</td><td className="text-right">{exam.sections.reduce((t, s) => t + sectionMarks(s), 0)}</td></tr>
            </tbody>
          </table>
          <div className="space-y-3">
            <table className="w-full border-collapse">
              <thead><tr className="border-b border-black text-left"><th className="py-0.5">Difficulty</th><th className="text-right">Marks</th><th className="text-right">Share</th></tr></thead>
              <tbody>
                {DIFF.map(d => (
                  <tr key={d} className="border-b border-gray-400 capitalize"><td className="py-0.5">{d}</td><td className="text-right">{byDifficulty[d]}</td><td className="text-right">{Math.round((byDifficulty[d] / printed) * 100)}%</td></tr>
                ))}
              </tbody>
            </table>
            <table className="w-full border-collapse">
              <thead><tr className="border-b border-black text-left"><th className="py-0.5">Chapter / unit</th><th className="text-right">Marks</th></tr></thead>
              <tbody>
                {Array.from(byChapter).map(([ch, m]) => (
                  <tr key={ch} className="border-b border-gray-400"><td className="py-0.5">{ch}</td><td className="text-right">{m}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-[9pt] italic mt-1">Marks counted over all printed questions (internal-choice alternatives excluded).</p>
      </section>
    </article>
  );
}
