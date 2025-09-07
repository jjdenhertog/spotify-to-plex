import { vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'

// Import jest-dom matchers
import '@testing-library/jest-dom/vitest'

// Set environment variables safely
if (typeof process !== 'undefined' && process.env) {
  try {
    if (!process.env.NODE_ENV) {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        configurable: true
      });
    }
  } catch (error) {
    // Ignore if NODE_ENV is already defined
  }
}

// Type global extensions
declare global {
  var __DEV__: boolean;
}
global.__DEV__ = true;

// Override any production mode React environment
if (typeof globalThis !== 'undefined') {
  globalThis.process = globalThis.process || {} as any;
  globalThis.process.env = globalThis.process.env || {};
  if (globalThis.process.env && !globalThis.process.env.NODE_ENV) {
    try {
      Object.defineProperty(globalThis.process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        configurable: true
      });
    } catch (error) {
      // Ignore if NODE_ENV is already defined
    }
  }
  globalThis.__DEV__ = true;
}

// Polyfills for Node.js environment
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  (global as any).TextEncoder = TextEncoder;
  (global as any).TextDecoder = TextDecoder;
}

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
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

// Mock fetch if not available
if (!global.fetch) {
  global.fetch = vi.fn()
}

// Mock console methods
const originalError = console.error
const originalWarn = console.warn

beforeAll(() => {
  console.error = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning:')) {
      return
    }
    originalError(...args)
  }
  
  console.warn = (...args: any[]) => {
    if (typeof args[0] === 'string' && (
      args[0].includes('Warning:') ||
      args[0].includes('deprecated')
    )) {
      return
    }
    originalWarn(...args)
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
  vi.clearAllMocks()
  
  // Maintain development mode
  if (typeof process !== 'undefined' && process.env && !process.env.NODE_ENV) {
    try {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        configurable: true
      });
    } catch (error) {
      // Ignore if NODE_ENV is already defined
    }
  }
  global.__DEV__ = true
})