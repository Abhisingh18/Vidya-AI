import { randomInt } from 'crypto';
import { prisma } from '@/lib/prisma';
import type { Role } from '@/lib/roles';
import { isAutoGraded, parseQuiz, type QuizContent } from '@/lib/teacher-docs';

// No 0/O/1/I so codes are easy to read out in class.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export async function newJoinCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = Array.from({ length: 6 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('');
    if (!(await prisma.classroom.findUnique({ where: { joinCode: code }, select: { id: true } }))) return code;
  }
  throw new Error('Could not allocate a join code');
}

/** The class if this user teaches it or is a member of it, plus which one. */
export async function classAccess(classId: string, user: { id: string; role: Role }) {
  const cls = await prisma.classroom.findUnique({ where: { id: classId } });
  if (!cls) return null;
  if (cls.teacherId === user.id) return { cls, isTeacher: true as const };
  const member = await prisma.classMember.findUnique({
    where: { classroomId_userId: { classroomId: classId, userId: user.id } },
    select: { id: true },
  });
  return member ? { cls, isTeacher: false as const } : null;
}

/** Strip answers/explanations so students can't read them before submitting. */
export function quizForStudent(quiz: QuizContent) {
  return {
    instructions: quiz.instructions,
    questions: quiz.questions.filter(isAutoGraded).map(q => ({ type: q.type, question: q.question, options: q.options, marks: q.marks })),
  };
}

export function gradeQuiz(content: string, answers: unknown) {
  const quiz = parseQuiz(JSON.parse(content), false);
  if (!quiz) return null;
  const graded = quiz.questions.filter(isAutoGraded);
  const chosen = Array.isArray(answers) ? answers : [];
  let score = 0;
  let total = 0;
  const review = graded.map((q, i) => {
    const pick = Number.isInteger(chosen[i]) ? (chosen[i] as number) : -1;
    const right = pick === q.correct;
    total += q.marks;
    if (right) score += q.marks;
    return { question: q.question, options: q.options, chosen: pick, correct: q.correct, explanation: q.explanation, right };
  });
  return { score, total, review, answers: graded.map((_, i) => (Number.isInteger(chosen[i]) ? chosen[i] : -1)) };
}
