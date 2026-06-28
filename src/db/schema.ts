import { pgTable, serial, text, integer, timestamp, unique, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').default(''),
  idea: text('idea').default(''),
  customer: text('customer').default(''),
  businessModel: text('business_model').default(''),
  stage: text('stage').default(''),
  score: integer('score').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const lessonInputs = pgTable('lesson_inputs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  lessonId: text('lesson_id').notNull(),
  content: text('content').default(''),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => [unique().on(t.userId, t.lessonId)]);

export const completedLessons = pgTable('completed_lessons', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  lessonId: text('lesson_id').notNull(),
  completedAt: timestamp('completed_at').defaultNow(),
}, (t) => [unique().on(t.userId, t.lessonId)]);

export const brainEntries = pgTable('brain_entries', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  lessonId: text('lesson_id').notNull(),
  lessonTitle: text('lesson_title').notNull(),
  prompt: text('prompt').notNull(),
  content: text('content').notNull().default(''),
  entryType: text('entry_type').notNull(),
  processedByAi: boolean('processed_by_ai').default(false),
  aiScore: integer('ai_score'),
  aiFeedback: text('ai_feedback'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => [unique().on(t.userId, t.lessonId)]);

// Content tables — editable via Neon dashboard
export const modulesContent = pgTable('modules_content', {
  id: text('id').primaryKey(),
  order: integer('order').notNull(),
  title: text('title').notNull(),
});

export const lessonsContent = pgTable('lessons_content', {
  id: text('id').primaryKey(),
  moduleId: text('module_id').references(() => modulesContent.id, { onDelete: 'cascade' }),
  order: integer('order').notNull(),
  title: text('title').notNull(),
  type: text('type').notNull(),
  body: text('body').notNull(),
  inputPrompt: text('input_prompt'),
});
