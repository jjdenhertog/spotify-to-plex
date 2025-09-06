import '@testing-library/jest-dom';
import { setupMocks } from './mocks';
import { vi, beforeAll, afterEach } from 'vitest';

// Setup mocks before all tests
beforeAll(() => {
    setupMocks();
});

// Clean up after each test
afterEach(() => {
    // Clean up any state between tests
    document.body.innerHTML = '';
  
    // Reset all mocks
    vi.clearAllMocks();
});

// Global test configuration
global.console = {
    ...console,
    // Suppress console.warn and console.error in tests unless needed
    warn: vi.fn(),
    error: vi.fn(),
};