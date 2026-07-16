-- 0006 — make email_log dedup atomic (audit F30). Deduplicate any existing rows (keep the
-- earliest per key), then add a UNIQUE index so sendOnce can claim-then-send via ON CONFLICT.
DELETE FROM email_log a USING email_log b
  WHERE a.id > b.id AND a.user_id IS NOT DISTINCT FROM b.user_id AND a.type = b.type AND a.week_of = b.week_of;
CREATE UNIQUE INDEX IF NOT EXISTS email_log_dedup_uniq ON email_log (user_id, type, week_of);
