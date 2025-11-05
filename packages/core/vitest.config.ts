import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
  resolve: {
    alias: {
      '@superfine-components/core': path.resolve(__dirname, './dist'),
      '@superfine-components/core/jsx-runtime': path.resolve(__dirname, './dist/jsx-runtime.js'),
      '@superfine-components/core/jsx-dev-runtime': path.resolve(__dirname, './dist/jsx-dev-runtime.js'),
    },
  },
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: '@superfine-components/core',
  },
});
