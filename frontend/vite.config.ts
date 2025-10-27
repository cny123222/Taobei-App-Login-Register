import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  test: {
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    bail: 1,
    reporter: ['verbose'],
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts']
  }
})