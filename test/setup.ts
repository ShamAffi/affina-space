// Dummy env so importing server modules never crashes in tests: the Anthropic client is
// constructed at module load (anthropic.ts) and session.ts fail-closes without a secret
// (audit F10). These values are never used to make real calls — tests exercise pure logic.
process.env.ANTHROPIC_API_KEY ??= 'sk-ant-test-key-not-real';
process.env.SESSION_SECRET ??= 'test-session-secret-long-enough-0123456789abcdef';
process.env.DATABASE_URL ??= 'postgres://test:test@localhost:5432/test';
process.env.CRON_SECRET ??= 'test-cron-secret-long-enough-0123456789';
process.env.MENTOR_SECRET ??= 'test-mentor-secret-long-enough-0123456789';
