/**
 * Hook Testing Utilities
 * 
 * Utilities for testing React hooks with proper setup and mocking.
 */

import React from 'react';
import { renderHook, RenderHookOptions, RenderHookResult } from '@testing-library/react';
import { act } from '@testing-library/react';
import { ReactNode } from 'react';
import { vi } from 'vitest';

// Re-export commonly used testing utilities for hooks
export { renderHook, act } from '@testing-library/react';

/**
 * Mock axios for API testing
 */
export const mockAxiosInstance = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  defaults: { headers: {} },
  interceptors: {
    request: { use: vi.fn(), eject: vi.fn() },
    response: { use: vi.fn(), eject: vi.fn() }
  }
};

/**
 * Mock notistack for notifications testing
 */
export const mockEnqueueSnackbar = vi.fn();
export const mockCloseSnackbar = vi.fn();

// Mock modules
vi.mock('axios', () => ({
  __esModule: true,
  default: mockAxiosInstance,
}));

vi.mock('notistack', () => ({
  __esModule: true,
  enqueueSnackbar: mockEnqueueSnackbar,
  closeSnackbar: mockCloseSnackbar,
  SnackbarProvider: ({ children }: { children: ReactNode }) => children,
}));

/**
 * Helper function to create a wrapper with providers for hook testing
 */
export function createHookWrapper(providers: Array<React.ComponentType<any>> = []) {
  return ({ children }: { children: ReactNode }) => {
    return providers.reduce(
      (acc, Provider) => React.createElement(Provider, {}, acc),
      children as React.ReactElement
    );
  };
}

/**
 * Helper to render hook with common setup
 */
export function renderHookWithSetup<TProps, TResult>(
  callback: (props: TProps) => TResult,
  options?: RenderHookOptions<TProps> & {
    wrapper?: React.ComponentType<any>;
  }
): RenderHookResult<TResult, TProps> {
  return renderHook(callback, {
    ...options,
  });
}

/**
 * Helper to wait for next tick (useful for async operations)
 */
export const waitForNextTick = () => act(async () => {
  await new Promise(resolve => setTimeout(resolve, 0));
});

/**
 * Helper to simulate async operation completion
 */
export const waitForAsync = (ms: number = 0) => act(async () => {
  await new Promise(resolve => setTimeout(resolve, ms));
});

/**
 * Reset all mocks to clean state
 */
export function resetAllMocks() {
  mockAxiosInstance.get.mockReset();
  mockAxiosInstance.post.mockReset();
  mockAxiosInstance.put.mockReset();
  mockAxiosInstance.delete.mockReset();
  mockEnqueueSnackbar.mockReset();
  mockCloseSnackbar.mockReset();
}

/**
 * Common test data generators
 */
export const testDataGenerators = {
  /**
   * Generate mock API response
   */
  createMockResponse: <T>(data: T, status = 200) => ({
    data,
    status,
    statusText: 'OK',
    headers: {},
    config: {},
  }),

  /**
   * Generate mock API error
   */
  createMockError: (message: string, status = 500) => {
    const error = new Error(message) as any;
    error.response = {
      data: { error: message },
      status,
      statusText: 'Internal Server Error',
    };
    return error;
  },

  /**
   * Generate mock validation error
   */
  createMockValidationError: (errors: string[]) => {
    const error = new Error('Validation failed') as any;
    error.response = {
      data: { 
        error: 'Validation failed',
        validationErrors: errors 
      },
      status: 400,
      statusText: 'Bad Request',
    };
    return error;
  },
};

/**
 * Type helpers for testing
 */
export type MockedFunction<T extends (...args: any[]) => any> = ReturnType<typeof vi.fn<T>>;
export type MockedAxios = typeof mockAxiosInstance;