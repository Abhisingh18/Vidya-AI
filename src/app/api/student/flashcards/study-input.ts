// Server-side validation of a "make me flashcards / notes" request, shared by
// POST /api/student/flashcards and POST /api/student/notes. Everything here
// runs BEFORE any AI call, so bad input costs no quota.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deriveTopic, parseSources, type SourceFile } from '@/lib/source';
import {
  normalizeGrade, STUDY_GRADES, STUDY_LANGUAGES, videoSourceFile, type StudySource,
} from '@/lib/flashcards';
import { notesSourceFile, parseNotes } from '@/lib/notes';

export interface StudyInput {
  topic: string;
  grade: string;
  language: string;
  sources: SourceFile[];
  /** What the prompt's source material is (decides how the model is told to use it). */
  sourceKind: StudySource['kind'];
  source: StudySource;
}

const bad = (error: string, status = 400) => ({ error: NextResponse.json({ error }, { status }) }) as const;
const ID = /^[A-Za-z0-9_-]{1,40}$/;

export async function resolveStudyInput(
  body: Record<string, unknown>, userId: string, { allowNotes }: { allowNotes: boolean },
): Promise<{ input: StudyInput } | { error: NextResponse }> {
  const uploads = parseSources(body.sources);
  let topic = typeof body.topic === 'string' ? body.topic.replace(/\s+/g, ' ').trim().slice(0, 200) : '';
  let fallbackGrade: string | null = null;
  let fallbackLanguage: string | null = null;
  let source: StudySource = { kind: uploads.length ? 'upload' : 'topic', label: uploads.map(f => f.name).join(', ').slice(0, 300), refId: '' };
  const sources: SourceFile[] = [...uploads];

  if (body.videoId !== undefined && body.videoId !== null && body.videoId !== '') {
    if (typeof body.videoId !== 'string' || !ID.test(body.videoId)) return bad('That video link is not valid');
    const video = await prisma.video.findUnique({
      where: { id: body.videoId }, select: { id: true, topic: true, grade: true, language: true, script: true },
    });
    if (!video) return bad('That video was not found', 404);
    const file = videoSourceFile(video.topic, video.script);
    if (!file) return bad('This video has no narration to learn from — try typing its topic instead');
    sources.unshift(file);
    topic ||= video.topic.slice(0, 200);
    fallbackGrade = normalizeGrade(video.grade);
    fallbackLanguage = STUDY_LANGUAGES.includes(video.language) ? video.language : null;
    source = { kind: 'video', label: video.topic.slice(0, 300), refId: video.id };
  }

  if (body.notesId !== undefined && body.notesId !== null && body.notesId !== '') {
    if (!allowNotes) return bad('notesId is not supported here');
    if (typeof body.notesId !== 'string' || !ID.test(body.notesId)) return bad('Those notes are not valid');
    const doc = await prisma.studentDoc.findFirst({ where: { id: body.notesId, userId, type: 'notes' } });
    if (!doc) return bad('Those notes were not found', 404);
    let content: unknown = null;
    try { content = JSON.parse(doc.content); } catch { /* handled below */ }
    const notes = parseNotes(content, false, doc.topic);
    if (!notes) return bad('Those notes are empty');
    sources.unshift(notesSourceFile(doc.title, notes));
    topic ||= doc.title.slice(0, 200);
    fallbackGrade = normalizeGrade(doc.grade);
    fallbackLanguage = STUDY_LANGUAGES.includes(doc.language) ? doc.language : null;
    source = { kind: 'notes', label: doc.title.slice(0, 300), refId: doc.id };
  }

  topic ||= deriveTopic(uploads);
  if (!topic) return bad('Type a topic, upload your notes or pick a video');

  let grade: string;
  if (body.grade === undefined || body.grade === null || body.grade === '') grade = fallbackGrade ?? '9';
  else if (typeof body.grade === 'string' && STUDY_GRADES.includes(body.grade)) grade = body.grade;
  else return bad(`Pick a class from ${STUDY_GRADES[0]} to ${STUDY_GRADES[STUDY_GRADES.length - 1]}`);

  let language: string;
  if (body.language === undefined || body.language === null || body.language === '') language = fallbackLanguage ?? 'English';
  else if (typeof body.language === 'string' && STUDY_LANGUAGES.includes(body.language)) language = body.language;
  else return bad('That language is not supported');

  if (source.kind === 'topic') source = { kind: 'topic', label: topic, refId: '' };
  return { input: { topic, grade, language, sources, sourceKind: source.kind, source } };
}
