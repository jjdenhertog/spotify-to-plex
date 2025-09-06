/**
 * @file Comprehensive Test Utilities
 * @description Central hub for all test utilities to reduce code duplication across test suites
 * 
 * This file provides:
 * - Mock data factories for common entities
 * - Common test setup/teardown utilities
 * - Data-driven test helpers
 * - Error scenario generators
 * - Hook testing utilities
 * - API mock helpers
 * - Performance testing utilities
 * - Type-safe testing patterns
 * 
 * Follows the "Rule of 3" principle: if a pattern appears in 3+ tests, extract it here.
 */

import { vi, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, RenderHookOptions, RenderHookResult, act } from '@testing-library/react';
import { createMocks, RequestMethod } from 'node-mocks-http';
import type { NextApiRequest, NextApiResponse } from 'next';
import React, { ReactNode } from 'react';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Generic mock function type for better type safety
 */
export type MockedFunction<T extends (...args: any[]) => any> = ReturnType<typeof vi.fn<T>>;

/**
 * Common API response structure
 */
export interface MockApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: Record<string, any>;
}

/**
 * Common error response structure
 */
export interface MockApiError {
  message: string;
  response?: {
    status: number;
    data: { error: string; [key: string]: any };
    statusText: string;
  };
  code?: string;
  [key: string]: any;
}

/**
 * Test data generator configuration
 */
export interface DataGeneratorOptions {
  count?: number;
  idPrefix?: string;
  overrides?: Record<string, any>;
  seed?: string;
}

/**
 * Performance test configuration
 */
export interface PerformanceTestConfig {
  iterations?: number;
  maxDuration?: number;
  measureMemory?: boolean;
}

/**
 * Hook testing configuration
 */
export interface HookTestConfig<TProps = any> {
  providers?: React.ComponentType<any>[];
  initialProps?: TProps;
  setupMocks?: () => void;
  cleanupMocks?: () => void;
}

// =============================================================================
// CORE MOCK UTILITIES
// =============================================================================

/**
 * Mock axios instance with comprehensive HTTP methods
 */
export const mockAxios = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  head: vi.fn(),
  options: vi.fn(),
  request: vi.fn(),
  defaults: { 
    headers: { common: {}, get: {}, post: {}, put: {}, patch: {}, delete: {} },
    timeout: 0,
    baseURL: '',
    transformRequest: [],
    transformResponse: []
  },
  interceptors: {
    request: { use: vi.fn(), eject: vi.fn(), clear: vi.fn() },
    response: { use: vi.fn(), eject: vi.fn(), clear: vi.fn() }
  },
  create: vi.fn(() => mockAxios),
  CancelToken: { source: vi.fn(() => ({ token: {}, cancel: vi.fn() })) },
  isCancel: vi.fn(() => false),
  all: vi.fn(Promise.all.bind(Promise)),
  spread: vi.fn(callback => callback)
};

/**
 * Mock notification system (notistack/snackbar)
 */
export const mockNotifications = {
  enqueueSnackbar: vi.fn(),
  closeSnackbar: vi.fn(),
  dismissSnackbar: vi.fn()
};

/**
 * Mock Next.js router with comprehensive functionality
 */
export const mockNextRouter = {
  push: vi.fn().mockResolvedValue(true),
  replace: vi.fn().mockResolvedValue(true),
  reload: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn().mockResolvedValue(undefined),
  beforePopState: vi.fn(),
  events: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn()
  },
  isFallback: false,
  isLocaleDomain: true,
  isReady: true,
  isPreview: false,
  asPath: '/',
  basePath: '',
  pathname: '/',
  route: '/',
  query: {},
  locale: 'en',
  locales: ['en'],
  defaultLocale: 'en',
  domainLocales: []
};

// =============================================================================
// MOCK SETUP & TEARDOWN
// =============================================================================

/**
 * Comprehensive mock setup for common testing scenarios
 */
export function setupCommonMocks() {
  // Mock axios
  vi.mock('axios', () => ({
    __esModule: true,
    default: mockAxios,
    create: vi.fn(() => mockAxios)
  }));

  // Mock notifications
  vi.mock('notistack', () => ({
    __esModule: true,
    enqueueSnackbar: mockNotifications.enqueueSnackbar,
    closeSnackbar: mockNotifications.closeSnackbar,
    SnackbarProvider: ({ children }: { children: ReactNode }) => children,
    useSnackbar: () => mockNotifications
  }));

  // Mock Next.js router
  vi.mock('next/router', () => ({
    __esModule: true,
    useRouter: () => mockNextRouter,
    withRouter: (Component: any) => Component
  }));

  // Mock Next.js dynamic imports
  vi.mock('next/dynamic', () => ({
    __esModule: true,
    default: (fn: () => Promise<any>) => fn
  }));

  // Mock window objects commonly used in tests
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
      dispatchEvent: vi.fn(),
    })),
  });

  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    })),
  });

  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    })),
  });
}

/**
 * Reset all mocks to their initial state
 */
export function resetAllMocks() {
  // Reset axios mocks
  Object.values(mockAxios).forEach(mock => {
    if (typeof mock === 'function') {
      mock.mockReset();
    }
  });

  // Reset notification mocks
  Object.values(mockNotifications).forEach(mock => mock.mockReset());

  // Reset router mocks
  mockNextRouter.push.mockReset();
  mockNextRouter.replace.mockReset();
  mockNextRouter.reload.mockReset();
  mockNextRouter.back.mockReset();
  mockNextRouter.forward.mockReset();
  mockNextRouter.prefetch.mockReset();
  mockNextRouter.beforePopState.mockReset();
  
  Object.values(mockNextRouter.events).forEach(mock => mock.mockReset());

  // Reset global mocks
  vi.clearAllMocks();
}

/**
 * Standard test suite setup with automatic cleanup
 */
export function useTestSuite() {
  beforeEach(() => {
    resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
}

// =============================================================================
// DATA GENERATORS
// =============================================================================

/**
 * Generate mock API responses with consistent structure
 */
export const apiResponseFactory = {
  /**
   * Create successful API response
   */
  success: <T>(data: T, status = 200): MockApiResponse<T> => ({
    data,
    status,
    statusText: getStatusText(status),
    headers: { 'Content-Type': 'application/json' },
    config: {}
  }),

  /**
   * Create error API response
   */
  error: (message: string, status = 500, details?: any): MockApiError => {
    const error = new Error(message) as MockApiError;
    error.response = {
      status,
      data: { error: message, ...details },
      statusText: getStatusText(status)
    };
    return error;
  },

  /**
   * Create validation error response
   */
  validationError: (errors: string[] | Record<string, string>): MockApiError => {
    const errorData = Array.isArray(errors) 
      ? { error: 'Validation failed', errors }
      : { error: 'Validation failed', fieldErrors: errors };
    
    return apiResponseFactory.error('Validation failed', 400, errorData);
  },

  /**
   * Create network timeout error
   */
  timeout: (message = 'Request timeout'): MockApiError => {
    const error = new Error(message) as MockApiError;
    error.code = 'ETIMEDOUT';
    return error;
  },

  /**
   * Create rate limiting error
   */
  rateLimit: (retryAfter = 60): MockApiError => {
    const error = apiResponseFactory.error('Rate limit exceeded', 429);
    if (error.response) {
      error.response.data.retryAfter = retryAfter;
    }
    return error;
  }
};

/**
 * Generate mock user data
 */
export const userDataFactory = {
  /**
   * Create single mock user
   */
  create: (overrides: Partial<any> = {}) => ({
    id: `user-${generateId()}`,
    email: `user${generateId()}@example.com`,
    username: `user${generateId()}`,
    displayName: `Test User ${generateId()}`,
    avatar: `https://avatar.example.com/${generateId()}`,
    role: 'user',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    preferences: {
      theme: 'light',
      notifications: true,
      language: 'en'
    },
    ...overrides
  }),

  /**
   * Create multiple mock users
   */
  createMany: (count: number, baseOverrides: Partial<any> = {}) => 
    Array.from({ length: count }, (_, index) => 
      userDataFactory.create({ 
        ...baseOverrides,
        username: `user${index + 1}`,
        displayName: `Test User ${index + 1}`
      })
    )
};

/**
 * Generate mock Spotify data
 */
export const spotifyDataFactory = {
  /**
   * Create mock Spotify track
   */
  track: (overrides: Partial<any> = {}) => ({
    id: `track-${generateId()}`,
    name: `Test Track ${generateId()}`,
    artists: [{ id: `artist-${generateId()}`, name: `Test Artist ${generateId()}` }],
    album: {
      id: `album-${generateId()}`,
      name: `Test Album ${generateId()}`,
      images: [{ url: `https://image.spotify.com/${generateId()}` }]
    },
    duration_ms: 180000 + Math.random() * 120000,
    explicit: Math.random() > 0.8,
    external_urls: { spotify: `https://open.spotify.com/track/track-${generateId()}` },
    preview_url: `https://preview.spotify.com/${generateId()}.mp3`,
    track_number: Math.floor(Math.random() * 15) + 1,
    disc_number: 1,
    ...overrides
  }),

  /**
   * Create mock Spotify playlist
   */
  playlist: (overrides: Partial<any> = {}) => ({
    id: `playlist-${generateId()}`,
    name: `Test Playlist ${generateId()}`,
    description: `A test playlist created at ${new Date().toISOString()}`,
    images: [{ url: `https://image.spotify.com/playlist/${generateId()}` }],
    owner: userDataFactory.create(),
    public: Math.random() > 0.5,
    tracks: { 
      total: Math.floor(Math.random() * 100) + 1,
      href: `https://api.spotify.com/v1/playlists/playlist-${generateId()}/tracks`
    },
    external_urls: { spotify: `https://open.spotify.com/playlist/playlist-${generateId()}` },
    ...overrides
  }),

  /**
   * Create mock Spotify user
   */
  user: (overrides: Partial<any> = {}) => ({
    id: `spotify-user-${generateId()}`,
    display_name: `Spotify User ${generateId()}`,
    email: `spotify${generateId()}@example.com`,
    images: [{ url: `https://avatar.spotify.com/${generateId()}` }],
    country: 'US',
    followers: { total: Math.floor(Math.random() * 1000) },
    product: Math.random() > 0.5 ? 'premium' : 'free',
    external_urls: { spotify: `https://open.spotify.com/user/spotify-user-${generateId()}` },
    ...overrides
  })
};

/**
 * Generate mock Plex data
 */
export const plexDataFactory = {
  /**
   * Create mock Plex server
   */
  server: (overrides: Partial<any> = {}) => ({
    name: `Plex Server ${generateId()}`,
    product: 'Plex Media Server',
    version: '1.32.5.7349-8f4248874',
    clientIdentifier: `server-${generateId()}`,
    connections: [
      { 
        uri: `http://192.168.1.${Math.floor(Math.random() * 254) + 1}:32400`, 
        local: true 
      }
    ],
    accessToken: `plex-token-${generateId()}`,
    ...overrides
  }),

  /**
   * Create mock Plex library section
   */
  section: (overrides: Partial<any> = {}) => ({
    key: Math.floor(Math.random() * 100) + 1,
    title: `Music Library ${generateId()}`,
    type: 'artist',
    agent: 'com.plexapp.agents.lastfm',
    scanner: 'Plex Music Scanner',
    language: 'en',
    uuid: `library-${generateId()}`,
    ...overrides
  }),

  /**
   * Create mock Plex track
   */
  track: (overrides: Partial<any> = {}) => ({
    ratingKey: Math.floor(Math.random() * 10000) + 1,
    key: `/library/metadata/${Math.floor(Math.random() * 10000) + 1}`,
    title: `Plex Track ${generateId()}`,
    parentTitle: `Plex Album ${generateId()}`,
    grandparentTitle: `Plex Artist ${generateId()}`,
    duration: 180000 + Math.random() * 120000,
    addedAt: Date.now() - Math.random() * 86400000 * 30, // Random time in last 30 days
    updatedAt: Date.now() - Math.random() * 86400000 * 7,  // Random time in last 7 days
    ...overrides
  })
};

/**
 * Generate mock match filter configurations
 */
export const matchFilterFactory = {
  /**
   * Create simple match filter expression
   */
  simple: (field = 'artist', operator = 'match'): string => 
    `${field}:${operator}`,

  /**
   * Create complex match filter with multiple conditions
   */
  complex: (conditions: Array<{field: string, operator: string, value?: string}>): string => 
    conditions.map(({ field, operator, value }) => 
      value ? `${field}:${operator}(${value})` : `${field}:${operator}`
    ).join(' AND '),

  /**
   * Create match filter with similarity threshold
   */
  similarity: (field: string, threshold = 0.8): string => 
    `${field}:similarity>=${threshold}`,

  /**
   * Create validation test cases
   */
  validationCases: () => ({
    valid: [
      'artist:match',
      'title:contains AND album:similarity>=0.8',
      'genre:exact OR artist:similarity>=0.9'
    ],
    invalid: [
      'invalid_syntax(',
      'unknown_field:match',
      'artist:invalid_operator',
      ''
    ]
  })
};

// =============================================================================
// NEXT.JS API TESTING UTILITIES
// =============================================================================

/**
 * Create mock Next.js API request and response objects
 */
export function createMockApiRequestResponse(options: {
  method?: RequestMethod;
  body?: any;
  query?: Record<string, string | string[]>;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
} = {}) {
  const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
    method: options.method || 'GET',
    body: options.body || {},
    query: options.query || {},
    headers: options.headers || {},
    cookies: options.cookies || {}
  });

  return { req, res };
}

/**
 * Helper to validate API response structure
 */
export function expectApiResponse(
  res: any, 
  expectedStatus: number, 
  expectedData?: any,
  additionalChecks?: (responseData: any) => void
) {
  expect(res._getStatusCode()).toBe(expectedStatus);
  
  if (expectedData !== undefined) {
    const responseData = JSON.parse(res._getData());
    expect(responseData).toEqual(expectedData);
    
    if (additionalChecks) {
      additionalChecks(responseData);
    }
  }
}

/**
 * Mock environment variables for testing
 */
export function withMockEnv(envVars: Record<string, string>, testFn: () => void | Promise<void>) {
  const originalEnv = { ...process.env };
  
  beforeEach(() => {
    Object.assign(process.env, envVars);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  return testFn;
}

// =============================================================================
// HOOK TESTING UTILITIES
// =============================================================================

/**
 * Enhanced hook testing with provider support
 */
export function renderHookWithProviders<TProps, TResult>(
  callback: (props: TProps) => TResult,
  config: HookTestConfig<TProps> = {}
): RenderHookResult<TResult, TProps> {
  const { providers = [], setupMocks, cleanupMocks, initialProps } = config;

  if (setupMocks) setupMocks();

  const wrapper = providers.length > 0 
    ? ({ children }: { children: ReactNode }) => 
        providers.reduce(
          (acc, Provider) => React.createElement(Provider, {}, acc),
          children as React.ReactElement
        )
    : undefined;

  const result = renderHook(callback, { 
    wrapper,
    initialProps: initialProps as TProps
  });

  // Cleanup function
  if (cleanupMocks) {
    result.unmount = () => {
      cleanupMocks();
      result.unmount();
    };
  }

  return result;
}

/**
 * Wait for async operations in hooks
 */
export const waitForHookAsync = async (ms: number = 0) => {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, ms));
  });
};

/**
 * Wait for next tick in event loop
 */
export const waitForNextTick = async () => {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });
};

// =============================================================================
// DATA-DRIVEN TESTING UTILITIES
// =============================================================================

/**
 * Create test cases for data-driven testing
 */
export function createTestCases<T>(
  description: string,
  testData: Array<{ name: string; input: T; expected: any; }>,
  testFn: (input: T, expected: any) => void | Promise<void>
) {
  describe(description, () => {
    testData.forEach(({ name, input, expected }) => {
      it(name, async () => {
        await testFn(input, expected);
      });
    });
  });
}

/**
 * Generate edge case test data
 */
export const edgeCases = {
  strings: [
    { name: 'empty string', value: '' },
    { name: 'whitespace only', value: '   ' },
    { name: 'very long string', value: 'x'.repeat(10000) },
    { name: 'unicode characters', value: '🎵 Music ñoño 中文' },
    { name: 'special characters', value: '!@#$%^&*()_+-=[]{}|;:,.<>?' },
    { name: 'null as string', value: 'null' },
    { name: 'undefined as string', value: 'undefined' }
  ],
  numbers: [
    { name: 'zero', value: 0 },
    { name: 'negative', value: -1 },
    { name: 'large positive', value: Number.MAX_SAFE_INTEGER },
    { name: 'large negative', value: Number.MIN_SAFE_INTEGER },
    { name: 'decimal', value: 3.14159 },
    { name: 'infinity', value: Infinity },
    { name: 'negative infinity', value: -Infinity },
    { name: 'NaN', value: NaN }
  ],
  arrays: [
    { name: 'empty array', value: [] },
    { name: 'single item', value: ['item'] },
    { name: 'large array', value: Array.from({ length: 1000 }, (_, i) => i) },
    { name: 'nested arrays', value: [[1, 2], [3, 4], []] },
    { name: 'mixed types', value: [1, 'string', true, null, undefined, {}] }
  ],
  nullish: [
    { name: 'null', value: null },
    { name: 'undefined', value: undefined }
  ]
};

// =============================================================================
// PERFORMANCE TESTING UTILITIES
// =============================================================================

/**
 * Measure function performance
 */
export async function measurePerformance<T>(
  fn: () => T | Promise<T>,
  config: PerformanceTestConfig = {}
): Promise<{ result: T; duration: number; memoryUsage?: any }> {
  const { measureMemory = false } = config;
  
  const startMemory = measureMemory ? process.memoryUsage() : undefined;
  const start = performance.now();
  
  const result = await fn();
  
  const end = performance.now();
  const endMemory = measureMemory ? process.memoryUsage() : undefined;
  
  const duration = end - start;
  
  const memoryUsage = startMemory && endMemory 
    ? {
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
        external: endMemory.external - startMemory.external,
        rss: endMemory.rss - startMemory.rss
      }
    : undefined;

  return { result, duration, memoryUsage };
}

/**
 * Run performance benchmark with multiple iterations
 */
export async function benchmark<T>(
  name: string,
  fn: () => T | Promise<T>,
  config: PerformanceTestConfig = {}
): Promise<void> {
  const { iterations = 100, maxDuration = 1000 } = config;
  
  const durations: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const { duration } = await measurePerformance(fn, config);
    durations.push(duration);
  }
  
  const avgDuration = durations.reduce((a, b) => a + b) / durations.length;
  const maxDurationActual = Math.max(...durations);
  const minDuration = Math.min(...durations);
  
  console.log(`Benchmark: ${name}`);
  console.log(`  Average: ${avgDuration.toFixed(2)}ms`);
  console.log(`  Min: ${minDuration.toFixed(2)}ms`);
  console.log(`  Max: ${maxDurationActual.toFixed(2)}ms`);
  console.log(`  Iterations: ${iterations}`);
  
  expect(avgDuration).toBeLessThan(maxDuration);
}

// =============================================================================
// ERROR TESTING UTILITIES
// =============================================================================

/**
 * Test error boundary behavior
 */
export function expectToThrow<T extends Error>(
  fn: () => any,
  expectedError?: new (...args: any[]) => T,
  expectedMessage?: string | RegExp
) {
  let thrownError: Error | null = null;
  
  try {
    fn();
  } catch (error) {
    thrownError = error as Error;
  }
  
  expect(thrownError).not.toBeNull();
  
  if (expectedError) {
    expect(thrownError).toBeInstanceOf(expectedError);
  }
  
  if (expectedMessage) {
    if (typeof expectedMessage === 'string') {
      expect(thrownError!.message).toBe(expectedMessage);
    } else {
      expect(thrownError!.message).toMatch(expectedMessage);
    }
  }
}

/**
 * Test async error scenarios
 */
export async function expectToThrowAsync<T extends Error>(
  fn: () => Promise<any>,
  expectedError?: new (...args: any[]) => T,
  expectedMessage?: string | RegExp
): Promise<void> {
  let thrownError: Error | null = null;
  
  try {
    await fn();
  } catch (error) {
    thrownError = error as Error;
  }
  
  expect(thrownError).not.toBeNull();
  
  if (expectedError) {
    expect(thrownError).toBeInstanceOf(expectedError);
  }
  
  if (expectedMessage) {
    if (typeof expectedMessage === 'string') {
      expect(thrownError!.message).toBe(expectedMessage);
    } else {
      expect(thrownError!.message).toMatch(expectedMessage);
    }
  }
}

// =============================================================================
// UTILITY HELPER FUNCTIONS
// =============================================================================

/**
 * Generate unique ID for test data
 */
let idCounter = 0;
function generateId(): string {
  return `${Date.now()}-${++idCounter}`;
}

/**
 * Get HTTP status text for status code
 */
function getStatusText(status: number): string {
  const statusTexts: Record<number, string> = {
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable'
  };
  
  return statusTexts[status] || 'Unknown';
}

/**
 * Create delay for testing async operations
 */
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Suppress console output during tests
 */
export function suppressConsole(methods: Array<'log' | 'warn' | 'error' | 'debug' | 'info'> = ['log', 'warn', 'error']) {
  const originalMethods: Record<string, any> = {};
  
  beforeEach(() => {
    methods.forEach(method => {
      originalMethods[method] = console[method];
      console[method] = vi.fn();
    });
  });
  
  afterEach(() => {
    methods.forEach(method => {
      console[method] = originalMethods[method];
    });
  });
}

// =============================================================================
// EXPORTS
// =============================================================================

// Re-export commonly used testing utilities
export { act, renderHook } from '@testing-library/react';
export { vi, expect, describe, it, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';

// Export all utilities as default for convenience
export default {
  // Core mocks
  mockAxios,
  mockNotifications,
  mockNextRouter,
  
  // Setup utilities
  setupCommonMocks,
  resetAllMocks,
  useTestSuite,
  
  // Data factories
  apiResponseFactory,
  userDataFactory,
  spotifyDataFactory,
  plexDataFactory,
  matchFilterFactory,
  
  // API testing
  createMockApiRequestResponse,
  expectApiResponse,
  withMockEnv,
  
  // Hook testing
  renderHookWithProviders,
  waitForHookAsync,
  waitForNextTick,
  
  // Data-driven testing
  createTestCases,
  edgeCases,
  
  // Performance testing
  measurePerformance,
  benchmark,
  
  // Error testing
  expectToThrow,
  expectToThrowAsync,
  
  // Utilities
  delay,
  suppressConsole
};