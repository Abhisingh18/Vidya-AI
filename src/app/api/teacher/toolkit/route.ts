import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { generateJson, llmErrorMessage, LlmUnavailableError } from '@/lib/llm';
import { TOOLS, buildToolPrompt, parseToolOutput, toolMaxTokens, type ToolId } from '@/lib/toolkit';
import { GRADES, LANGUAGES } from '@/lib/teacher-docs';
import { deriveTopic, parseSources } from '@/lib/source';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// POST { tool, input, sources? } → runs a toolkit tool (sources: uploaded material as text).
// POST { tool, input, sources?, output, save: true } → stores an (edited) result without re-generating.
export async function POST(req: NextRequest) {
  const auth = await requireUser('TEACHER');
  if ('error' in auth) return auth.error;

  const body = await req.json().catch(() => ({}));
  const def = TOOLS.find(t => t.id === body.tool);
  if (!def) return NextResponse.json({ error: 'Unknown tool' }, { status: 400 });

  const raw = (body.input && typeof body.input === 'object' ? body.input : {}) as Record<string, unknown>;
  // With uploaded material a required field may stay empty (e.g. translate the uploaded handout).
  const sources = parseSources(body.sources);
  const input: Record<string, string> = {};
  for (const f of def.fields) {
    let v = String(raw[f.name] ?? '').trim().slice(0, f.kind === 'textarea' ? 4000 : 200);
    if (f.kind === 'grade' && v && !GRADES.includes(v)) v = '';
    if (f.kind === 'language' && !LANGUAGES.includes(v)) v = 'English';
    if (f.kind === 'select' && f.options && !f.options.includes(v)) v = f.options[0];
    if (f.required && !v && !sources.length) {
      return NextResponse.json({ error: `${f.label} is required (or upload your material)` }, { status: 400 });
    }
    input[f.name] = v;
  }

  let output = body.save ? parseToolOutput(body.output) : null;
  if (body.save && !output) return NextResponse.json({ error: 'Nothing to save' }, { status: 400 });
  if (!output) try {
    output = await generateJson(buildToolPrompt(def.id as ToolId, input, sources), parseToolOutput, {
      maxTokens: toolMaxTokens(def.id as ToolId, sources),
    });
  } catch (err) {
    if (err instanceof LlmUnavailableError) {
      console.error('[teacher/toolkit]', err.message);
      return NextResponse.json({ error: llmErrorMessage(err) }, { status: 503 });
    }
    throw err;
  }

  let id: string | undefined;
  if (body.save) {
    const subject = input.topic || input.assignment || input.context || input.text || deriveTopic(sources) || def.title;
    const doc = await prisma.teacherDoc.create({
      data: {
        userId: auth.user.id, type: 'toolkit', title: output.title || def.title,
        topic: subject.slice(0, 200), grade: input.grade || '', language: input.language || 'English',
        content: JSON.stringify(output),
      },
      select: { id: true },
    });
    id = doc.id;
  }
  return NextResponse.json({ output, id });
}
