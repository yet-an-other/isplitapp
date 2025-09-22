/// <reference types="vitest" />
import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
  include: ['src/__test__/**/*.test.{ts,tsx}'],
  exclude: ['**/node_modules/**'],
  },
})
