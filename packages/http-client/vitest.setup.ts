import { vi, beforeEach, afterEach } from 'vitest'
import { TextEncoder, TextDecoder } from 'util'

// Polyfills for Node.js environment
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as any

// Mock fetch if not available
if (!global.fetch) {
  global.fetch = vi.fn()
}

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks()
  vi.clearAllTimers()
})

// Global test environment setup
beforeEach(() => {
  // Reset any mocks that should be clean for each test
  vi.clearAllMocks()
})