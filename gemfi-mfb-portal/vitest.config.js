import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// A dedicated, minimal config rather than reusing vite.config.js — the
// base44 Vite plugin there expects a real dev-server/browser context
// (HMR notifier, analytics tracker) that has no business running under a
// unit test. This only needs the same "@" -> "src" alias every source
// file already relies on.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
