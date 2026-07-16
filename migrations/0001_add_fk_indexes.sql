-- 0001 — index the child-table foreign keys that lack one (audit F32). tasks,
-- achievements and delegations have no (user_id, …) composite unique to piggyback on,
-- so every lookup by user_id is a sequential scan — and the hourly cron does it per user.
-- (lesson_inputs / completed_lessons / brain_entries / check_ins already get a usable
-- index from their UNIQUE(user_id, lesson_id|week_of), so they are intentionally omitted.)
CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON tasks (user_id);
CREATE INDEX IF NOT EXISTS achievements_user_id_idx ON achievements (user_id);
CREATE INDEX IF NOT EXISTS delegations_user_id_idx ON delegations (user_id);
