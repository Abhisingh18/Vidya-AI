import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { generateJson, llmErrorMessage, LlmUnavailableError } from '@/lib/llm';
import { parseSources, sourceBlock } from '@/lib/source';
import { LANGUAGES } from '@/lib/teacher-docs';
import {
  assemblePaper, blueprintTotal, buildSectionPrompt, chaptersFromText, EXAM_TYPE_LIST, EXAM_TYPES, examSystemPrompt,
  examTotal, parseBlueprint, parseCallResult, parseExam, patternFor, planCalls, sectionLabel, sectionWord,
  type CallResult, type ExamPattern, type ExamType, type PaperRequest,
} from '@/lib/exam';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const SCHOOL_CLASSES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
// Each call gets its own excerpt of the uploaded syllabus/notes (all calls run at once).
const SOURCE_CHARS_PER_CALL = 12_000;

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, max) : '');
const clamp = (v: unknown, lo: number, hi: number, d: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(lo, Math.min(hi, Math.round(n))) : d;
};
const bad = (error: string) => NextResponse.json({ error }, { status: 400 });

// POST: generate an exam question paper (+ answer key) section by section and save it as a draft.
export async function POST(req: NextRequest) {
  const auth = await requireUser('TEACHER');
  if ('error' in auth) return auth.error;
  const body = await req.json().catch(() => ({}));

  const examType = body.examType as ExamType;
  if (!EXAM_TYPE_LIST.includes(examType)) return bad('Pick an exam type.');
  const pattern = patternFor(examType, body.pattern === 'university' ? 'university' : 'school') as ExamPattern;

  const subject = clean(body.subject, 100);
  if (!subject) return bad('Subject is required.');
  const topics = String(body.topics ?? '').slice(0, 4000);
  const chapters = chaptersFromText(topics);
  const sources = parseSources(body.sources);
  if (!chapters.length && !sources.length) return bad('Add the chapters/topics to cover, or upload the syllabus.');

  const grade = pattern === 'school' ? (SCHOOL_CLASSES.includes(String(body.grade)) ? String(body.grade) : '10') : 'College';
  const className = pattern === 'school' ? `Class ${grade}` : clean(body.semester, 100) || 'Semester';
  const language = LANGUAGES.includes(body.language) ? body.language : 'English';
  const maxMarks = clamp(body.maxMarks, 5, 200, 80);
  const duration = clamp(body.durationMinutes, 15, 240, 180);

  const sections = parseBlueprint(body.blueprint);
  if (!sections) return bad('The paper needs 1–6 sections with at most 60 questions in total.');
  const total = blueprintTotal(sections);
  if (total !== maxMarks) return bad(`The sections add up to ${total} marks but the paper is out of ${maxMarks}. Adjust the blueprint or the maximum marks.`);

  const d = (body.difficulty ?? {}) as Record<string, unknown>;
  const mix = { easy: clamp(d.easy, 0, 100, 30), medium: clamp(d.medium, 0, 100, 50), hard: clamp(d.hard, 0, 100, 20) };
  if (mix.easy + mix.medium + mix.hard === 0) Object.assign(mix, { easy: 30, medium: 50, hard: 20 });

  const paper: PaperRequest = {
    examType, pattern, className, subject, language, maxMarks, duration, chapters, mix, sections,
    subjectCode: clean(body.subjectCode, 30),
    examName: clean(body.examName, 150) || EXAM_TYPES[examType].name,
    institution: clean(body.institution, 150),
  };

  // One request per section (big sections split), all in parallel: free models
  // write ~25 tokens/s, so a whole paper in one request would time out.
  const calls = planCalls(paper);
  const system = examSystemPrompt(pattern);
  const settled = await Promise.allSettled(calls.map(call => {
    const focus = Array.from(new Set(call.plan.map(q => q.chapter).filter(Boolean))).join(', ') || subject;
    const prompt = buildSectionPrompt(paper, call, sourceBlock(sources, focus, SOURCE_CHARS_PER_CALL));
    const marksEach = sections[call.section].marksEach;
    return generateJson<CallResult>(prompt, v => parseCallResult(v, call, marksEach), {
      system,
      maxTokens: Math.min(12_000, Math.max(3000, Math.round(call.estTokens * 2.2))),
    });
  }));

  const failed = settled.flatMap((r, i) => (r.status === 'rejected' ? [{ call: calls[i], err: r.reason as unknown }] : []));
  if (failed.length) {
    const other = failed.find(f => !(f.err instanceof LlmUnavailableError));
    if (other) throw other.err;
    // Quota/config problems affect every call the same way: report them as-is.
    const fatal = failed.find(f => (f.err as LlmUnavailableError).reason !== 'busy');
    if (fatal) {
      console.error('[teacher/exam]', (fatal.err as Error).message);
      return NextResponse.json({ error: llmErrorMessage(fatal.err as LlmUnavailableError) }, { status: 503 });
    }
    const names = Array.from(new Set(failed.map(f => `${sectionWord(pattern)} ${sectionLabel(f.call.section)}`)));
    console.error('[teacher/exam] failed:', names.join(', '));
    return NextResponse.json({
      error: `The AI couldn't finish ${names.join(', ')} of the paper, so nothing was saved. ${llmErrorMessage(failed[0].err as LlmUnavailableError)}`,
    }, { status: 503 });
  }

  const results = settled.map(r => (r as PromiseFulfilledResult<CallResult>).value);
  const content = parseExam(assemblePaper(paper, calls, results), true);
  if (!content || examTotal(content) !== maxMarks) {
    console.error('[teacher/exam] assembled paper failed validation');
    return NextResponse.json({ error: 'The generated paper was incomplete, so nothing was saved. Please try again.' }, { status: 502 });
  }

  const doc = await prisma.teacherDoc.create({
    data: {
      userId: auth.user.id, type: 'exam',
      title: `${subject} — ${paper.examName}`.slice(0, 200),
      topic: (chapters.join(', ') || subject).slice(0, 200),
      grade, language, content: JSON.stringify(content),
    },
    select: { id: true },
  });
  return NextResponse.json({ id: doc.id });
}
