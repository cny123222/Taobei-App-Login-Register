import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock fetch for API calls
global.fetch = vi.fn()

// Mock console methods to avoid noise in tests
Object.assign(global, {
  console: {
    ...console,
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }
})