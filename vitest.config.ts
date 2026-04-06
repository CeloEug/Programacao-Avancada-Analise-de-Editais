import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    reporters:
      process.env.GITHUB_ACTIONS === 'true'
        ? ['dot', 'github-actions']
        : ['dot'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['src/__tests__/**'],
    },
  },
});
