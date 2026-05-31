// Seed script — handcrafted 30+ professional educational animations.
// Run with:  node scripts/seed-videos.mjs
// Idempotent: skips videos with the same (topic, language) already in DB.

import { PrismaClient } from '@prisma/client';
import { VIDEOS } from './videos-data.mjs';

const prisma = new PrismaClient();

function inferSubject(topic) {
  const t = topic.toLowerCase();
  if (/(theorem|integral|integration|deriv|equation|trig|algebra|geometry|calcul|matrix|matric|probab|vector|permut|series)/.test(t)) return 'Mathematics';
  if (/(newton|force|motion|gravity|ohm|circuit|wave|optic|relativity|quantum|energy|magnet|light)/.test(t)) return 'Physics';
  if (/(periodic|element|bond|acid|reaction|organic|atom|mole|redox|matter)/.test(t)) return 'Chemistry';
  if (/(cell|dna|photosynth|biology|organ|evolution|gene|heart|nervous|ecosystem|blood)/.test(t)) return 'Biology';
  if (/(revolution|war|empire|king|history|ancient|medieval|independence|industrial)/.test(t)) return 'History';
  if (/(algorithm|sort|search|code|program|recursion|data structure|binary|linked list|stack|queue|tree|graph)/.test(t)) return 'Computer Science';
  return 'General';
}

function timeStr(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Expand a video config into the full DB shape.
function build(video) {
  const linePace = Math.floor(video.duration / Math.max(video.scriptLines.length, 1));
  const script = video.scriptLines.map((text, i) => ({
    time: timeStr(i * linePace),
    text,
  }));

  return {
    topic: video.topic,
    language: video.language,
    grade: video.grade,
    voiceType: video.voiceType ?? 'female',
    videoStyle: video.videoStyle ?? 'math',
    duration: video.duration,
    subject: inferSubject(video.topic),
    script: JSON.stringify(script),
    manimCode: video.manimCode ?? `# Manim source for "${video.topic}"\nfrom manim import *\n\nclass ${video.topic.replace(/[^A-Za-z0-9]/g, '')}Scene(Scene):\n    def construct(self):\n        title = Text("${video.topic}").scale(1.2)\n        self.play(Write(title))\n        self.wait(2)\n`,
    scene: JSON.stringify({
      title: video.topic,
      subtitle: video.subtitle ?? '',
      duration: video.duration,
      steps: video.steps,
    }),
  };
}

async function main() {
  // Use a dedicated VidyaAI system user as the author for seeded library videos.
  // Created on first run; reused on every subsequent run so seeding is idempotent.
  const SYSTEM_EMAIL = 'library@vidyaai.system';
  let user = await prisma.user.findUnique({ where: { email: SYSTEM_EMAIL } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: SYSTEM_EMAIL,
        name: 'VidyaAI Library',
        preferredLanguage: 'English',
        preferredGrade: '9-10',
      },
    });
    console.log(`Created system user: ${user.id}`);
  }
  console.log(`Seeding videos as user: ${user.name} (${user.id})`);

  let created = 0;
  let skipped = 0;

  for (const v of VIDEOS) {
    const existing = await prisma.video.findFirst({
      where: { topic: v.topic, language: v.language, userId: user.id },
    });
    if (existing) {
      console.log(`  ⏭  skip   ${v.language.padEnd(10)} ${v.topic}`);
      skipped++;
      continue;
    }

    const data = build(v);
    await prisma.video.create({ data: { ...data, userId: user.id } });
    console.log(`  ✓ added   ${v.language.padEnd(10)} ${v.topic}`);
    created++;
  }

  console.log(`\nDone. created=${created} skipped=${skipped} total=${VIDEOS.length}`);
}

main()
  // Never fail the production build because of seeding — log and continue.
  // (Shorts work without a DB; the library simply starts empty if this skips.)
  .catch(e => { console.error('[seed] skipped due to error:', e?.message ?? e); })
  .finally(() => prisma.$disconnect());
