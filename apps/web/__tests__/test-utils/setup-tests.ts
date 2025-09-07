// Force React development mode before importing anything else
// Set NODE_ENV safely without using Object.defineProperty
if (!process.env.NODE_ENV) {
    (process.env as any).NODE_ENV = 'development';
}

// Properly type global object extension
declare global {
    var __DEV__: boolean;
}
global.__DEV__ = true;

// Import jest-dom matchers using the vitest-specific import
import '@testing-library/jest-dom/vitest';
import { cleanupMocks } from './mocks';
import { vi, beforeAll, afterEach, afterAll } from 'vitest';

// Setup mocks before all tests
beforeAll(() => {
    // The global vitest setup already handles most mocks
    // Just set up any additional ones we need
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
    
    // Maintain React development mode
    (process.env as any).NODE_ENV = 'development';
    global.__DEV__ = true;
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
            message.includes('deprecated') ||
            message.includes('act(...) is not supported in production builds of React')
        )) {
            return; // Suppress these specific warnings
        }

        originalConsole.warn(...args);
    };

    console.error = (...args: any[]) => {
        const message = args[0];
        if (typeof message === 'string' && (
            message.includes('The above error occurred in the') ||
            message.includes('Consider adding an error boundary') ||
            message.includes('act(...) is not supported in production builds of React')
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