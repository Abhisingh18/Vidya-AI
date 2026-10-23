// Read-only renderings used for printing and for students viewing assignments.
import type { LessonContent, QuizContent } from '@/lib/teacher-docs';

export function QuizPaper({ title, quiz, withAnswers }: { title: string; quiz: QuizContent; withAnswers: boolean }) {
  const totalMarks = quiz.questions.reduce((t, q) => t + q.marks, 0);
  return (
    <div className="text-black bg-white">
      <div className="flex items-end justify-between border-b-2 border-black pb-2 mb-4">
        <h1 className="text-2xl font-bold">{title}{withAnswers ? ' — Answer key' : ''}</h1>
        <p className="text-sm">Max marks: {totalMarks}</p>
      </div>
      {!withAnswers && <p className="text-sm mb-1">Name: ____________________ &nbsp; Roll no: ______ &nbsp; Date: __________</p>}
      {quiz.instructions && <p className="text-sm italic mb-4">{quiz.instructions}</p>}
      <ol className="space-y-4">
        {quiz.questions.map((q, i) => (
          <li key={i} className="break-inside-avoid">
            <p className="font-medium">Q{i + 1}. {q.question} <span className="text-xs font-normal">[{q.marks}]</span></p>
            {q.options.length > 0 && (
              <ol className="grid grid-cols-2 gap-x-6 gap-y-1 mt-1 ml-5 text-sm">
                {q.options.map((o, j) => (
                  <li key={j} className={withAnswers && j === q.correct ? 'font-bold underline' : ''}>({String.fromCharCode(97 + j)}) {o}</li>
                ))}
              </ol>
            )}
            {q.type === 'short' && !withAnswers && <div className="mt-2 ml-5 border-b border-dashed border-gray-400 h-12" />}
            {withAnswers && (
              <p className="text-sm mt-1 ml-5">
                {q.type === 'short' && <><b>Answer:</b> {q.answer} </>}
                {q.explanation && <span className="text-gray-700">— {q.explanation}</span>}
              </p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

const List = ({ title, items }: { title: string; items: string[] }) =>
  items.length ? (
    <section className="break-inside-avoid">
      <h3 className="font-heading font-semibold text-navy dark:text-dark-text print:text-black mb-1.5">{title}</h3>
      <ul className="list-disc ml-5 space-y-1 text-sm">{items.map((x, i) => <li key={i}>{x}</li>)}</ul>
    </section>
  ) : null;

export function LessonView({ title, meta, lesson }: { title: string; meta: string; lesson: LessonContent }) {
  return (
    <div className="space-y-5 text-navy/90 dark:text-dark-text/90 print:text-black">
      <div className="border-b border-card-border dark:border-dark-border print:border-black pb-3">
        <h1 className="text-2xl font-heading font-bold text-navy dark:text-dark-text print:text-black">{title}</h1>
        <p className="text-sm text-muted print:text-black">{meta} · {lesson.duration} minutes</p>
      </div>
      <List title="Learning objectives" items={lesson.objectives} />
      <div className="grid sm:grid-cols-2 gap-5">
        <List title="Prerequisites" items={lesson.prerequisites} />
        <List title="Materials" items={lesson.materials} />
      </div>
      <section>
        <h3 className="font-heading font-semibold text-navy dark:text-dark-text print:text-black mb-2">Lesson flow</h3>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-muted print:text-black">
              <th className="py-2 pr-3 w-[18%]">Stage</th><th className="py-2 pr-3 w-[8%]">Min</th>
              <th className="py-2 pr-3">Teacher</th><th className="py-2">Students</th>
            </tr>
          </thead>
          <tbody>
            {lesson.sections.map((s, i) => (
              <tr key={i} className="border-t border-card-border dark:border-dark-border print:border-gray-400 align-top break-inside-avoid">
                <td className="py-2 pr-3 font-medium">{s.title}</td><td className="py-2 pr-3 tabular-nums">{s.minutes}</td>
                <td className="py-2 pr-3 whitespace-pre-line">{s.teacher}</td><td className="py-2 whitespace-pre-line">{s.students}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <div className="grid sm:grid-cols-2 gap-5">
        <List title="Assessment" items={lesson.assessment} />
        <List title="Homework" items={lesson.homework} />
      </div>
      {lesson.differentiation && <section className="break-inside-avoid"><h3 className="font-heading font-semibold mb-1.5">Differentiation</h3><p className="text-sm whitespace-pre-line">{lesson.differentiation}</p></section>}
      {lesson.boardWork && <section className="break-inside-avoid"><h3 className="font-heading font-semibold mb-1.5">Blackboard plan</h3><p className="text-sm whitespace-pre-line">{lesson.boardWork}</p></section>}
    </div>
  );
}
