import { defineConfig } from 'vitest/config';

// Unit tests for the server-side security/logic helpers (audit P5). Kept in test/ so
// `tsc -b` (which builds src/ + api/) never compiles them. Run with `npm test`.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    setupFiles: ['test/setup.ts'],
  },
});
