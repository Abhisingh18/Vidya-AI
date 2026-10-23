// Adds animated motion scenes to visual explainer videos made before animations
// existed (see src/lib/explainer-motion.ts). One AI call per video; videos that
// already have motion are skipped.
//
//   node scripts/add-motion.mjs            # every explainer video
//   node scripts/add-motion.mjs <videoId>  # one video
//
// Uses DATABASE_URL and OPENROUTER_API_KEY from .env.local / the environment.

import { createRequire } from 'node:module';
import nextEnv from '@next/env';
import { PrismaClient } from '@prisma/client';

nextEnv.loadEnvConfig(process.cwd());
const require = createRequire(import.meta.url);
const jiti = require('jiti')(import.meta.url);
const { addMotionToExplainer } = jiti('../src/lib/explainer-motion.ts');
const { explainerDuration, explainerToScript, isExplainer } = jiti('../src/lib/explainer.ts');

const prisma = new PrismaClient();
const only = process.argv[2];

try {
  const videos = await prisma.video.findMany({
    where: only ? { id: only } : { scene: { contains: '"format":"explainer-v1"' } },
    select: { id: true, topic: true, language: true, scene: true },
  });
  console.log(`${videos.length} explainer video(s)`);
  for (const v of videos) {
    let content;
    try { content = JSON.parse(v.scene ?? ''); } catch { content = null; }
    if (!isExplainer(content)) { console.log(`- ${v.id}: not an explainer, skipped`); continue; }
    try {
      const { content: next, added } = await addMotionToExplainer(content);
      if (!added) { console.log(`- ${v.id} (${v.language}) ${v.topic}: already animated`); continue; }
      await prisma.video.update({
        where: { id: v.id },
        data: { scene: JSON.stringify(next), script: JSON.stringify(explainerToScript(next)), duration: explainerDuration(next) },
      });
      const kinds = next.scenes.map((s, i) => (s.motion ? `${i}:${s.motion.kind}` : null)).filter(Boolean).join(', ');
      console.log(`✓ ${v.id} (${v.language}) ${v.topic}: ${added} motion scene(s) — ${kinds}`);
    } catch (err) {
      console.log(`✗ ${v.id} ${v.topic}: ${err.message}`);
      if (/daily|quota/i.test(err.message)) break;
    }
  }
} finally {
  await prisma.$disconnect();
}
