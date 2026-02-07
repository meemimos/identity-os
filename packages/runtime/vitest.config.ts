import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: { globals: true },
  resolve: {
    alias: {
      '@identity-os/core': path.resolve(__dirname, '../core/src/index.ts'),
      '@identity-os/storage': path.resolve(__dirname, '../storage/src/index.ts'),
      '@identity-os/skills': path.resolve(__dirname, '../skills/src/index.ts'),
    },
  },
});
