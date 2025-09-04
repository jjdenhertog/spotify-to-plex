// Mock implementations for testing
import { vi } from 'vitest';

// Mock axios for API calls
export const mockAxios = {
  get: vi.fn(() => Promise.resolve({ data: [] })),
  post: vi.fn(() => Promise.resolve({ data: 'success' })),
  put: vi.fn(() => Promise.resolve({ data: 'success' })),
  delete: vi.fn(() => Promise.resolve({ data: 'success' })),
};

// Mock notistack for notifications
export const mockEnqueueSnackbar = vi.fn();

// Mock Next.js router
export const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  query: {},
  pathname: '/',
  asPath: '/',
  route: '/',
  isReady: true,
};

// Mock window.confirm and window.alert
export const mockWindowConfirm = vi.fn(() => true);
export const mockWindowAlert = vi.fn();

// Setup mocks function
export function setupMocks() {
  // Mock window methods
  Object.defineProperty(window, 'confirm', {
    writable: true,
    value: mockWindowConfirm,
  });

  Object.defineProperty(window, 'alert', {
    writable: true,
    value: mockWindowAlert,
  });

  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  Object.defineProperty(window, 'localStorage', {
    writable: true,
    value: localStorageMock,
  });

  // Mock sessionStorage
  const sessionStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  Object.defineProperty(window, 'sessionStorage', {
    writable: true,
    value: sessionStorageMock,
  });

  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe(): void {
      // Mock implementation
    }
    disconnect(): void {
      // Mock implementation
    }
    unobserve(): void {
      // Mock implementation
    }
  } as any;

  // Mock ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    constructor() {}
    observe() {
      return null;
    }
    disconnect() {
      return null;
    }
    unobserve() {
      return null;
    }
  };
}

// Clean up mocks function
export function cleanupMocks() {
  vi.clearAllMocks();
  mockWindowConfirm.mockReturnValue(true);
  mockWindowAlert.mockClear();
}