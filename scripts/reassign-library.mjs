// One-time script: move all seeded library videos onto a dedicated
// "VidyaAI Library" system user, so they don't pollute real students' dashboards.
//
// Run with:  node scripts/reassign-library.mjs

import { PrismaClient } from '@prisma/client';
import { VIDEOS } from './videos-data.mjs';

const prisma = new PrismaClient();

async function main() {
  const SYSTEM_EMAIL = 'library@vidyaai.system';

  let systemUser = await prisma.user.findUnique({ where: { email: SYSTEM_EMAIL } });
  if (!systemUser) {
    systemUser = await prisma.user.create({
      data: {
        email: SYSTEM_EMAIL,
        name: 'VidyaAI Library',
        preferredLanguage: 'English',
        preferredGrade: '9-10',
      },
    });
    console.log(`Created system user: ${systemUser.id}`);
  } else {
    console.log(`Using existing system user: ${systemUser.id}`);
  }

  const seedKeys = VIDEOS.map(v => ({ topic: v.topic, language: v.language }));

  let moved = 0;
  for (const key of seedKeys) {
    const result = await prisma.video.updateMany({
      where: {
        topic: key.topic,
        language: key.language,
        userId: { not: systemUser.id },
      },
      data: { userId: systemUser.id },
    });
    if (result.count > 0) {
      console.log(`  → moved ${result.count} × ${key.language.padEnd(10)} ${key.topic}`);
      moved += result.count;
    }
  }

  console.log(`\nDone. Moved ${moved} video(s) to system user.`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
