import '@testing-library/jest-dom';
import { setupMocks, cleanupMocks } from './mocks';
import { vi, beforeAll, afterEach, beforeEach, afterAll } from 'vitest';

// Setup mocks before all tests
beforeAll(() => {
    setupMocks();
});

// Setup fresh mocks before each test
beforeEach(() => {
    setupMocks();
});

// Clean up after each test
afterEach(() => {
    // Clean up any state between tests
    document.body.innerHTML = '';
    
    // Clean up mocks
    cleanupMocks();
    
    // Reset all timers
    vi.clearAllTimers();
    
    // Reset DOM
    if (document.body) {
        document.body.innerHTML = '';
    }
    
    // Clear any remaining timeouts/intervals
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
});

// Store original console methods
const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info
};

// More selective console mocking to avoid hiding important errors
beforeAll(() => {
    // Only suppress specific known warnings, not all console output
    console.warn = (...args: any[]) => {
        const message = args[0];
        if (typeof message === 'string' && (
            message.includes('Warning: ReactDOM.render is no longer supported') ||
            message.includes('Warning: componentWillMount') ||
            message.includes('Warning: componentWillReceiveProps') ||
            message.includes('deprecated')
        )) {
            return; // Suppress these specific warnings
        }
        originalConsole.warn(...args);
    };

    console.error = (...args: any[]) => {
        const message = args[0];
        if (typeof message === 'string' && (
            message.includes('The above error occurred in the') ||
            message.includes('Consider adding an error boundary')
        )) {
            return; // Suppress React error boundary messages
        }
        originalConsole.error(...args);
    };
});

// Restore console methods after all tests
afterAll(() => {
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.info = originalConsole.info;
});