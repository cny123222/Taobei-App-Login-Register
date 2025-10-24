/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  test: {
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    bail: 1,
    reporters: ['verbose'],
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    globals: true,
  },
})