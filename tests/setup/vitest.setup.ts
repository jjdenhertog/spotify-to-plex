import { vi, beforeAll, afterAll, beforeEach, afterEach, expect } from 'vitest'
import { TextEncoder, TextDecoder } from 'util'

// Import jest-dom matchers - this must be done after vitest globals are available
// We need to import it in a way that extends the expect object properly
import '@testing-library/jest-dom/vitest'

// Ensure React runs in development mode for tests
// This is crucial for act() warnings to be resolved
process.env.NODE_ENV = 'development'
global.__DEV__ = true

// Override any production mode React environment
if (typeof globalThis !== 'undefined') {
  globalThis.process = globalThis.process || {}
  globalThis.process.env = globalThis.process.env || {}
  globalThis.process.env.NODE_ENV = 'development'
  globalThis.__DEV__ = true
}

// Polyfills for Node.js environment
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as any

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn()
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
})

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: mockIntersectionObserver
})

Object.defineProperty(global, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: mockIntersectionObserver
})

// Mock ResizeObserver
const mockResizeObserver = vi.fn()
mockResizeObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
})

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: mockResizeObserver
})

Object.defineProperty(global, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: mockResizeObserver
})

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

// Mock fetch if not available
if (!global.fetch) {
  global.fetch = vi.fn()
}

// Mock console methods in test environment to reduce noise
const originalError = console.error
const originalWarn = console.warn

// Make vi (Vitest utilities) globally available
global.vi = vi

beforeAll(() => {
  console.error = (...args: any[]) => {
    // Still log actual errors, but filter out React dev warnings
    if (typeof args[0] === 'string' && args[0].includes('Warning:')) {
      return
    }
    originalError.call(console, ...args)
  }
  
  console.warn = (...args: any[]) => {
    // Filter out common warnings in test environment
    if (typeof args[0] === 'string' && (
      args[0].includes('Warning:') ||
      args[0].includes('deprecated')
    )) {
      return
    }
    originalWarn.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
  console.warn = originalWarn
})

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks()
  vi.clearAllTimers()
  
  // Clear DOM if in jsdom environment
  if (typeof document !== 'undefined') {
    document.body.innerHTML = ''
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild)
    }
  }
})

// Global test environment setup
beforeEach(() => {
  // Reset any mocks that should be clean for each test
  vi.clearAllMocks()
  
  // Ensure development mode is maintained throughout tests
  process.env.NODE_ENV = 'development'
  global.__DEV__ = true
})
