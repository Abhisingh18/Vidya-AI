import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const MODELS = [
  'openai/gpt-oss-20b:free',
  'google/gemma-4-31b-it:free',
  'openai/gpt-oss-120b:free',
];

interface ScriptLine { time: string; text: string }

interface SceneStep {
  at: number;                   // seconds when this appears
  duration?: number;            // how long it stays (default: until next clear)
  type: 'title' | 'subtitle' | 'text' | 'equation' | 'circle' | 'rectangle'
      | 'polygon' | 'line' | 'arrow' | 'curve' | 'axes' | 'point' | 'clear';
  text?: string;
  cx?: number; cy?: number; r?: number;
  x?: number; y?: number; w?: number; h?: number;
  points?: [number, number][];
  from?: [number, number]; to?: [number, number];
  d?: string;                   // SVG path
  color?: string;               // saffron | indigo | teal | success | white | etc
  fill?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

interface GenerationOutput {
  script: ScriptLine[];
  manim_code: string;
  scene: { title: string; subtitle?: string; duration: number; steps: SceneStep[] };
}

function buildPrompt(topic: string, language: string, grade: string, videoStyle: string): string {
  const langInstruction = language === 'English'
    ? 'in clear simple English'
    : `in ${language} (mix English technical terms where natural — Hinglish style for ${language})`;

  return `You are India's most patient teacher creating an animated educational video for a WEAK student.

TOPIC: ${topic}
LANGUAGE: ${language}
GRADE: Class ${grade}
STYLE: ${videoStyle === 'math' ? 'mathematical with diagrams' : 'concept-driven with metaphors'}

═══════════════════════════════════════════════════════════
TASK — produce THREE things in a single JSON object:

1. A SCRIPT — 12 to 14 narration lines that teach this specific topic in detail (${langInstruction}).
2. A SCENE — a list of visual steps that appear ON SCREEN, timed to match the script. Each step describes a specific shape, equation, or label related to "${topic}".
3. A MANIM CODE — Python Manim code for the same animation (for advanced users to render locally).

═══════════════════════════════════════════════════════════
SCENE COORDINATE SYSTEM (use these — they are SVG viewBox 0–320 wide, 0–200 tall):
- Center of canvas: (160, 100)
- Top edge: y = 0,  Bottom: y = 200
- Left edge: x = 0, Right: x = 320

COLORS to use: "saffron" (orange #FF6B2C), "indigo" (purple #3D3BDB), "teal" (green #0F9E75), "white", "muted"

STEP TYPES — be SPECIFIC to "${topic}":
- {"at": 0, "type": "title", "text": "...", "color": "saffron"}
- {"at": 2, "type": "subtitle", "text": "...", "color": "muted"}
- {"at": 5, "type": "text", "text": "...", "x": 160, "y": 50, "color": "white", "size": "md"}
- {"at": 8, "type": "equation", "text": "a^2 + b^2 = c^2", "x": 160, "y": 40, "color": "saffron", "size": "lg"}
- {"at": 10, "type": "circle", "cx": 160, "cy": 110, "r": 50, "color": "indigo", "fill": false}
- {"at": 12, "type": "rectangle", "x": 80, "y": 100, "w": 60, "h": 60, "color": "teal"}
- {"at": 14, "type": "polygon", "points": [[160,30],[240,170],[80,170]], "color": "saffron"}
- {"at": 16, "type": "line", "from": [80,170], "to": [240,170], "color": "white"}
- {"at": 18, "type": "arrow", "from": [50,100], "to": [120,100], "color": "saffron", "label": "F"}
- {"at": 20, "type": "curve", "d": "M 40 150 Q 160 30 280 150", "color": "indigo"}
- {"at": 22, "type": "axes", "color": "muted"}
- {"at": 24, "type": "point", "cx": 200, "cy": 100, "color": "saffron", "label": "P"}
- {"at": 26, "type": "clear"} ← clears everything before adding new content

═══════════════════════════════════════════════════════════
EXAMPLE (Pythagoras Theorem) — your scene MUST be this specific to the topic:

"scene": {
  "title": "Pythagoras Theorem",
  "subtitle": "Why a² + b² = c²",
  "duration": 60,
  "steps": [
    {"at": 0,  "type": "title",     "text": "Pythagoras Theorem", "color": "saffron"},
    {"at": 3,  "type": "subtitle",  "text": "For any right-angled triangle", "color": "muted"},
    {"at": 6,  "type": "polygon",   "points": [[160,30],[240,170],[80,170]], "color": "saffron"},
    {"at": 9,  "type": "line",      "from": [80,170], "to": [85,165], "color": "teal", "label": "right angle"},
    {"at": 12, "type": "text",      "text": "a", "x": 160, "y": 190, "color": "indigo", "size": "md"},
    {"at": 14, "type": "text",      "text": "b", "x": 220, "y": 115, "color": "saffron", "size": "md"},
    {"at": 16, "type": "text",      "text": "c", "x": 110, "y": 95,  "color": "teal", "size": "md"},
    {"at": 20, "type": "equation",  "text": "a^2 + b^2 = c^2", "x": 160, "y": 25, "color": "white", "size": "lg"},
    {"at": 30, "type": "clear"},
    {"at": 31, "type": "title",     "text": "Example: a=3, b=4", "color": "saffron"},
    {"at": 34, "type": "equation",  "text": "3^2 + 4^2 = c^2",   "x": 160, "y": 80, "color": "white", "size": "lg"},
    {"at": 38, "type": "equation",  "text": "9 + 16 = 25",        "x": 160, "y": 110, "color": "indigo", "size": "lg"},
    {"at": 42, "type": "equation",  "text": "c = 5",              "x": 160, "y": 140, "color": "saffron", "size": "xl"}
  ]
}

═══════════════════════════════════════════════════════════
RULES:
- Make at LEAST 15 scene steps that are SPECIFIC to "${topic}". DO NOT use generic shapes.
- Steps should appear in time order (at values increasing).
- Use "clear" between scenes (e.g. between explanation and worked example).
- Use the EXACT formula(s) for this topic in equation steps.
- Match scene timing to the script — when narration says "the formula is X", the equation should appear around that time.
- Total scene duration should match the last script timestamp + 10 seconds.

═══════════════════════════════════════════════════════════
OUTPUT JSON SCHEMA (return ONLY this JSON, nothing else):

{
  "script": [
    {"time": "0:00", "text": "warm opening + why this topic matters"},
    {"time": "0:15", "text": "introduce the concept in simplest words"},
    ... 12 to 14 lines total, each 15-35 words
  ],
  "scene": {
    "title": "${topic}",
    "subtitle": "...",
    "duration": 60,
    "steps": [
      ... at LEAST 15 steps specific to ${topic}
    ]
  },
  "manim_code": "from manim import *\\n\\nclass TopicScene(Scene):\\n    def construct(self):\\n        ..."
}

CRITICAL:
- Use the actual equations and visuals for "${topic}", NOT generic ones.
- Hindi script should use Devanagari + English technical terms (Hinglish).
- Escape backslashes in JSON strings (\\\\n, \\\\frac).
- No prose before/after the JSON. ONLY the JSON object.`;
}

function extractJson(raw: string): GenerationOutput | null {
  let cleaned = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();

  const tryParse = (s: string): GenerationOutput | null => {
    try {
      const obj = JSON.parse(s);
      if (obj.script && obj.manim_code && obj.scene?.steps) return obj;
      if (obj.script && obj.manim_code) {
        // Allow missing scene — we'll synthesize later
        return { ...obj, scene: { title: '', duration: 60, steps: [] } };
      }
    } catch { /* */ }
    return null;
  };

  const direct = tryParse(cleaned);
  if (direct) return direct;

  const start = cleaned.indexOf('{');
  if (start === -1) return null;
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < cleaned.length; i++) {
    const c = cleaned[i];
    if (esc) { esc = false; continue; }
    if (c === '\\') { esc = true; continue; }
    if (c === '"' && !esc) { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) {
        const cand = cleaned.slice(start, i + 1);
        const obj = tryParse(cand);
        if (obj) return obj;
      }
    }
  }
  return null;
}

async function callModel(model: string, prompt: string) {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://vidyaai.app',
        'X-Title': 'VidyaAI',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are an expert teacher AND an animation designer. Always return a single valid JSON object with script, scene, and manim_code. No prose, no markdown.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.6,
        max_tokens: 8000,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[${model}] ${res.status}:`, text.slice(0, 200));
      return null;
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? '';
    if (!raw) return null;
    const parsed = extractJson(raw);
    if (!parsed) {
      console.error(`[${model}] unparseable:`, raw.slice(0, 200));
      return null;
    }
    if (!Array.isArray(parsed.script) || parsed.script.length < 6) return null;
    return parsed;
  } catch (e) {
    console.error(`[${model}] threw:`, e);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const { topic, language, grade, videoStyle } = await req.json();
  if (!topic?.trim()) return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
  if (!OPENROUTER_API_KEY) return NextResponse.json({ error: 'API key not configured' }, { status: 500 });

  const prompt = buildPrompt(topic, language ?? 'English', grade ?? '9-10', videoStyle ?? 'math');

  for (const model of MODELS) {
    const result = await callModel(model, prompt);
    if (result) {
      console.log(`✓ ${model} succeeded (${result.script.length} lines, ${result.scene?.steps?.length ?? 0} scene steps)`);
      return NextResponse.json({
        script: result.script,
        manim_code: result.manim_code ?? '',
        scene: result.scene ?? null,
      });
    }
  }

  console.warn('⚠ All models failed for:', topic);
  return NextResponse.json({
    error: 'All AI models are currently unavailable. Please try again in a moment.',
    script: [],
    manim_code: '',
    scene: null,
  }, { status: 503 });
}
