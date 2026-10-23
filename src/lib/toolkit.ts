// Teacher toolkit: small one-shot AI tools. Every tool returns the same
// generic shape so one renderer/editor can show all of them. Every tool also
// takes optional uploaded material (`sources`); a required field may then be empty.

import { sourceBlock, type SourceFile } from './source';

export type ToolId = 'rubric' | 'ncert' | 'translate' | 'parent';

export interface ToolField {
  name: string;
  label: string;
  kind: 'text' | 'textarea' | 'grade' | 'language' | 'select';
  placeholder?: string;
  options?: string[];
  required?: boolean;
}

export interface ToolDef {
  id: ToolId;
  title: string;
  description: string;
  fields: ToolField[];
  /** Helper line for the upload box. */
  sourceHint: string;
}

export const TOOLS: ToolDef[] = [
  {
    id: 'rubric',
    title: 'Rubric generator',
    description: 'Grading criteria with 4 performance levels for any assignment or project.',
    fields: [
      { name: 'assignment', label: 'Assignment / project', kind: 'textarea', placeholder: 'e.g. Make a working model of the water cycle', required: true },
      { name: 'grade', label: 'Class', kind: 'grade' },
      { name: 'language', label: 'Language', kind: 'language' },
    ],
    sourceHint: 'Upload the assignment sheet, project brief or marking scheme — the rubric will follow it.',
  },
  {
    id: 'ncert',
    title: 'NCERT / CBSE alignment',
    description: 'Map a topic to its NCERT chapter, learning outcomes, key terms and what comes before/after.',
    fields: [
      { name: 'topic', label: 'Topic', kind: 'text', placeholder: 'e.g. Laws of motion', required: true },
      { name: 'subject', label: 'Subject', kind: 'text', placeholder: 'e.g. Science' },
      { name: 'grade', label: 'Class', kind: 'grade' },
    ],
    sourceHint: 'Upload your syllabus or a chapter — each unit is mapped to NCERT.',
  },
  {
    id: 'translate',
    title: 'Translate material',
    description: 'Translate notes, questions or instructions into any Indian language, classroom-ready.',
    fields: [
      { name: 'text', label: 'Text to translate', kind: 'textarea', placeholder: 'Paste notes, questions or instructions…', required: true },
      { name: 'language', label: 'Translate to', kind: 'language' },
    ],
    sourceHint: 'Upload a handout, worksheet or notes to translate (about 6,000 characters per run).',
  },
  {
    id: 'parent',
    title: 'Parent message',
    description: 'A polite, clear message or progress note for parents (WhatsApp / diary / PTM).',
    fields: [
      { name: 'context', label: 'What is it about?', kind: 'textarea', placeholder: 'e.g. Riya has improved in maths but misses homework often', required: true },
      { name: 'tone', label: 'Tone', kind: 'select', options: ['Warm', 'Formal', 'Concerned', 'Appreciative'] },
      { name: 'language', label: 'Language', kind: 'language' },
    ],
    sourceHint: 'Optional: upload your observation notes or a progress report to base the message on.',
  },
];

export interface ToolOutput {
  title: string;
  sections: { heading: string; text: string; items: string[] }[];
}

export function parseToolOutput(value: unknown): ToolOutput | null {
  const o = value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
  if (!o || !Array.isArray(o.sections)) return null;
  const sections = o.sections
    .map(s => {
      const x = (s && typeof s === 'object' ? s : {}) as Record<string, unknown>;
      return {
        heading: typeof x.heading === 'string' ? x.heading.slice(0, 200) : '',
        text: typeof x.text === 'string' ? x.text.slice(0, 6000) : '',
        items: Array.isArray(x.items) ? x.items.filter(i => typeof i === 'string').map(i => (i as string).slice(0, 1000)).slice(0, 20) : [],
      };
    })
    .filter(s => s.heading || s.text || s.items.length)
    .slice(0, 20);
  if (!sections.length) return null;
  return { title: typeof o.title === 'string' ? o.title.slice(0, 200) : 'Result', sections };
}

const SHAPE = `Return ONLY JSON: {"title":"...","sections":[{"heading":"...","text":"...","items":["..."]}]} — use "text" for paragraphs and "items" for lists.`;

/** Prompt budget for uploaded material (characters); translation output must fit one response. */
export const TOOL_SOURCE_CHARS = 12_000;
const TRANSLATE_SOURCE_CHARS = 7_000;

/** Output budget: translating uploaded material needs more room. */
export function toolMaxTokens(tool: ToolId, sources: SourceFile[]) {
  return tool === 'translate' && sources.length ? 8000 : 4000;
}

export function buildToolPrompt(tool: ToolId, input: Record<string, string>, sources: SourceFile[] = []): string {
  const lang = input.language && input.language !== 'English'
    ? `Write it in ${input.language} (native script).` : 'Write it in simple English.';
  const grade = input.grade ? `Class ${input.grade} (Indian CBSE/NCERT).` : '';
  const material = (topic: string, guidance: string[], max = TOOL_SOURCE_CHARS) =>
    sourceBlock(sources, topic, max, { guidance });

  switch (tool) {
    case 'rubric': {
      const block = material(input.assignment, [
        'It describes the assignment or project (task sheet, instructions, marking scheme or sample work). Base the criteria, weights and level descriptors on its actual requirements, marks and terminology; if it has a marking scheme, follow it.',
        'Do not contradict it or add requirements it does not ask for.',
      ]);
      return `Create a grading rubric for ${input.assignment ? `this assignment: "${input.assignment}"` : 'the assignment in the SOURCE MATERIAL below'}. ${grade} ${lang}
${block}Give 4-5 criteria. One section per criterion: heading = criterion name with its weight in marks, items = exactly 4 level descriptors in order "Excellent (4): ...", "Good (3): ...", "Fair (2): ...", "Needs work (1): ...". End with a "Scoring guide" section explaining how to total marks.
${SHAPE}`;
    }
    case 'ncert': {
      const block = material(input.topic, [
        'It is the teacher\'s syllabus, chapter or notes. Align what it actually covers, using its unit and topic names; if it lists several units or topics, cover each of them.',
        'Do not invent content it does not cover.',
      ]);
      const what = input.topic
        ? `the topic "${input.topic}"${block ? ' (as covered in the SOURCE MATERIAL below)' : ''}`
        : 'the topics in the SOURCE MATERIAL below';
      return `Align ${what}${input.subject ? ` (${input.subject})` : ''} to the NCERT/CBSE curriculum. ${grade}
${block}Sections: "NCERT chapter" (book, chapter number and name — say clearly if you are unsure${block ? '; one item per unit or topic of the material' : ''}), "Learning outcomes" (NCERT-style, measurable), "Key terms" (term — one-line meaning), "Prerequisites", "What comes next", "Board exam focus" (typical question types and marks), "Common misconceptions".
${SHAPE}`;
    }
    case 'translate': {
      const block = material('', [
        'Translate this material completely and faithfully, in its order. Keep its structure: headings, lists, numbering, and slide/page breaks ("[Slide 3]" becomes a section heading). Parts left out as "[…]" stay out.',
      ], TRANSLATE_SOURCE_CHARS);
      return `Translate the following classroom material. ${lang} Keep formulas, units, numbers and scientific symbols unchanged; keep the original structure (lists stay lists). Use words students in Indian schools actually use, not overly literary ones.
${input.text ? `Material:\n"""${input.text}"""\n` : ''}${block}${block
  ? 'Put the translation in sections: one per heading, slide or page of the material (max 18 sections, heading translated, "text" for prose, "items" for lists), then a final section "Glossary" listing key terms as "English term — translation".'
  : 'Put the translation in one section with heading "Translation" (use "text" for prose, "items" for lists), then a section "Glossary" listing key terms as "English term — translation".'}
${SHAPE}`;
    }
    case 'parent': {
      const block = material(input.context, [
        'It contains the teacher\'s notes or a report about the student. Use only facts from it and from the context above; do not invent marks, incidents or names.',
      ]);
      return `Write a message from a teacher to a student's parents. Context: ${input.context ? `"${input.context}"` : 'see the SOURCE MATERIAL below'}. Tone: ${input.tone || 'Warm'}. ${lang}
${block}Be respectful, specific and constructive; mention one strength, the concern or update, and 1-2 concrete things parents can do at home. Keep it under 120 words so it fits WhatsApp.
Sections: "Message" (text = the full message), "Short version" (text = a 2-line SMS version), "Talking points for PTM" (items).
${SHAPE}`;
    }
  }
}
