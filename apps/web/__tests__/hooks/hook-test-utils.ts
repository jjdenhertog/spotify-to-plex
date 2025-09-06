/**
 * @file Hook Test Utils
 * @description Testing utilities for React hooks
 */

import { renderHook, RenderHookOptions } from '@testing-library/react';
import { act } from '@testing-library/react';
import { vi } from 'vitest';
import * as React from 'react';

// Mock Axios instance
export const mockAxiosInstance = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};

// Mock enqueueSnackbar function
export const mockEnqueueSnackbar = vi.fn();

// Test data generators
export const testDataGenerators = {
  createMockResponse: (data: any) => ({
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
  }),
  
  createMockError: (message: string, status: number = 500) => {
    const error = new Error(message) as any;
    error.response = {
      status,
      data: { message },
      statusText: status === 500 ? 'Internal Server Error' : 'Error',
    };
    return error;
  },
};

// Reset all mocks
export const resetAllMocks = () => {
  vi.clearAllMocks();
  mockAxiosInstance.get.mockReset();
  mockAxiosInstance.post.mockReset();
  mockAxiosInstance.put.mockReset();
  mockAxiosInstance.delete.mockReset();
  mockEnqueueSnackbar.mockReset();
};

// Wrapper component for hook testing
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return React.createElement('div', null, children);
};

// Custom render hook with providers
export const renderHookWithSetup = <TProps, TResult>(
  hook: (props: TProps) => TResult,
  options?: RenderHookOptions<TProps>
) => {
  return renderHook(hook, {
    wrapper: AllTheProviders,
    ...options,
  });
};

// Wait for async operations
export const waitForAsync = async () => {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });
};

// Export act for convenience
export { act };