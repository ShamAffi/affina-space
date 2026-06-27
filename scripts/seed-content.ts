// Run once to seed lesson content to DB:
// npx tsx scripts/seed-content.ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { modulesContent, lessonsContent } from '../src/db/schema';
import { MODULES } from '../src/data';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function seed() {
  console.log('Seeding content...');
  for (const mod of MODULES) {
    await db.insert(modulesContent)
      .values({ id: mod.id, order: mod.order, title: mod.title })
      .onConflictDoUpdate({ target: modulesContent.id, set: { title: mod.title, order: mod.order } });

    for (let i = 0; i < mod.lessons.length; i++) {
      const lesson = mod.lessons[i];
      await db.insert(lessonsContent)
        .values({
          id: lesson.id,
          moduleId: mod.id,
          order: i + 1,
          title: lesson.title,
          type: lesson.type,
          body: lesson.body,
          inputPrompt: lesson.inputPrompt ?? null,
        })
        .onConflictDoUpdate({
          target: lessonsContent.id,
          set: { title: lesson.title, body: lesson.body, inputPrompt: lesson.inputPrompt ?? null },
        });
    }
  }
  console.log('Done.');
}

seed().catch(console.error);
