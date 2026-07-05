import { pgTable, serial, text, integer, timestamp, unique, boolean, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').default(''),
  projectName: text('project_name').default(''),
  idea: text('idea').default(''),
  customer: text('customer').default(''),
  businessModel: text('business_model').default(''),
  stage: text('stage').default(''),
  goal: text('goal').default(''),
  // Location (onboarding) — personalization + timezone for 11:00-local lifecycle sends
  country: text('country').default(''),
  city: text('city').default(''),
  timezone: text('timezone').default(''),   // IANA tz captured from the browser at onboarding
  score: integer('score').default(0),
  // Phase model
  phase: text('phase').default('launch'),
  launchValidatedAt: timestamp('launch_validated_at'),
  growthXp: integer('growth_xp').default(0),
  // Pulse
  northStar: jsonb('north_star'),  // { key, label, unit } | null
  pulseStreak: integer('pulse_streak').default(0),
  lastCheckInAt: timestamp('last_check_in_at'),
  lastActiveAt: timestamp('last_active_at'),   // §4 lifecycle-email activity signal (14-day suppression / re-engagement)
  momentumCard: jsonb('momentum_card'),  // AI-composed MomentumCard | null
  lastReadinessGain: jsonb('last_readiness_gain'),  // { delta, sourceLabel } | null
  // Startup Snapshot (§3.4)
  snapshot: jsonb('snapshot'),                 // current StartupSnapshot | null
  snapshotHistory: jsonb('snapshot_history'),  // StartupSnapshot[] — last 5 versions
  // Mentor sessions (§6.5): { S1?: { completed?, booked?, seen? }, S2?: ..., S3?: ... }
  mentorSessions: jsonb('mentor_sessions'),
  // Paywall entitlement (SPEC_PAYWALL) — M5–M12 gated on this. Stripe sets it later.
  subscribed: boolean('subscribed').default(false),
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
  // Delegate (§4): keep both drafts alongside the final content
  userDraft: text('user_draft'),
  aiDraft: text('ai_draft'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => [unique().on(t.userId, t.lessonId)]);

export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  source: text('source').notNull(),            // 'mentor'|'lesson'|'advisor'|'self'|'system'|'pulse'|'program'
  sourceRef: text('source_ref'),               // lessonId for mentor/lesson/program; null for self
  title: text('title').notNull(),              // ≤6 words, shown on card
  instruction: text('instruction').notNull(),  // full text, shown on task page
  status: text('status').default('todo'),      // 'todo'|'submitted'|'reviewed'|'done'
  priority: integer('priority').default(0),
  submissionText: text('submission_text'),
  submissionFiles: jsonb('submission_files'),  // string[] of URLs
  submissionData: jsonb('submission_data'),    // TaskSubmissionData (interview log, template fields, url)
  briefing: text('briefing'),                  // §4b AI Mission Briefing (cached)
  aiReview: text('ai_review'),                 // JSON TaskReview (+ optional debrief)
  linkedEntryType: text('linked_entry_type'),  // brain layer this task strengthens
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const checkIns = pgTable('check_ins', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  weekOf: text('week_of').notNull(),       // 'YYYY-MM-DD' Monday of the week
  rawText: text('raw_text'),
  headline: text('headline'),
  keyResults: jsonb('key_results'),        // CheckInKeyResult[]
  metrics: jsonb('metrics'),               // CheckInMetric[]
  activity: jsonb('activity'),             // CheckInActivity[] — normalised weekly actions
  sentiment: text('sentiment'),            // 'energized'|'steady'|'struggling'
  mentorNote: text('mentor_note'),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [unique().on(t.userId, t.weekOf)]);

export const achievements = pgTable('achievements', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'paying_customer' | 'mrr_milestone' | 'funding_round' | 'metric_growth' | 'soft_milestone'
  value: text('value'),         // description or numeric value as string
  verified: boolean('verified').default(false),
  xp: integer('xp').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Delegate usage log (§4 / §10.5) — data for the future credit model
export const delegations = pgTable('delegations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  lessonId: text('lesson_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

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

// Rate-limit counters (src/server/ratelimit.ts, SPEC_API_HARDENING §2) — pre-auth
// stopgap protecting the Anthropic bill. Raw SQL owns this table; defined here
// only to document the schema. Keys: ip:<ip>:min, ip:<ip>:day, email:<email>:day.
export const rateLimits = pgTable('rate_limits', {
  key: text('key').primaryKey(),
  windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
  count: integer('count').notNull().default(0),
});

// Magic-link auth tokens (api/auth.ts, SPEC_RESEND_AUTH §5). We store only
// sha256(token); the raw token lives only in the emailed link. Single-use
// (used_at), 15-min TTL (expires_at). Index token_hash for lookup.
export const authTokens = pgTable('auth_tokens', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Email log (SPEC_EMAILS §4) — idempotency (dedupe lifecycle sends) + analytics.
// weekOf is the dedup window key: week string for weeklies, 'once' or a session id
// for once-only. Unique-ish on (user_id, type, week_of) — see the migration index.
export const emailLog = pgTable('email_log', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  weekOf: text('week_of').notNull().default('once'),
  sentAt: timestamp('sent_at').defaultNow(),
});
