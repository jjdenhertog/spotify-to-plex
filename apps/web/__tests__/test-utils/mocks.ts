// Mock implementations for testing
import { vi } from 'vitest';

// Mock axios for API calls with proper response structure
export const mockAxios = {
    get: vi.fn(() => Promise.resolve({ 
        data: [], 
        status: 200, 
        statusText: 'OK', 
        headers: {}, 
        config: {} 
    })),
    post: vi.fn(() => Promise.resolve({ 
        data: { success: true }, 
        status: 200, 
        statusText: 'OK', 
        headers: {}, 
        config: {} 
    })),
    put: vi.fn(() => Promise.resolve({ 
        data: { success: true }, 
        status: 200, 
        statusText: 'OK', 
        headers: {}, 
        config: {} 
    })),
    delete: vi.fn(() => Promise.resolve({ 
        data: { success: true }, 
        status: 200, 
        statusText: 'OK', 
        headers: {}, 
        config: {} 
    })),
    patch: vi.fn(() => Promise.resolve({ 
        data: { success: true }, 
        status: 200, 
        statusText: 'OK', 
        headers: {}, 
        config: {} 
    })),
    create: vi.fn(() => mockAxios),
    interceptors: {
        request: { use: vi.fn(), eject: vi.fn() },
        response: { use: vi.fn(), eject: vi.fn() }
    }
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

// Mock fetch API to prevent real network calls
export const mockFetch = vi.fn(() =>
    Promise.resolve({
        json: () => Promise.resolve({ data: [], success: true }),
        text: () => Promise.resolve(''),
        status: 200,
        statusText: 'OK',
        ok: true,
        headers: new Headers(),
        url: '',
        type: 'cors',
        body: null,
        bodyUsed: false,
        clone: vi.fn(),
        redirected: false
    } as Response)
);

// Setup mocks function
export function setupMocks() {
    // Mock fetch globally
    global.fetch = mockFetch;
    
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

    // Mock XMLHttpRequest to prevent real network calls
    const mockXHR = {
        open: vi.fn(),
        send: vi.fn(),
        setRequestHeader: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        readyState: 4,
        status: 200,
        statusText: 'OK',
        responseText: JSON.stringify({ data: [], success: true }),
        response: { data: [], success: true },
        onreadystatechange: null,
        onerror: null,
        onload: null
    };
    
    global.XMLHttpRequest = vi.fn(() => mockXHR) as any;

    // Mock URL constructor if not available
    if (typeof global.URL === 'undefined') {
        global.URL = class URL {
            constructor(url: string) {
                return {
                    href: url,
                    origin: 'http://localhost:3000',
                    pathname: '/',
                    search: '',
                    hash: ''
                } as any;
            }
        } as any;
    }
}

// Clean up mocks function
export function cleanupMocks() {
    vi.clearAllMocks();
    mockWindowConfirm.mockReturnValue(true);
    mockWindowAlert.mockClear();
    mockFetch.mockClear();
    
    // Reset axios mocks
    mockAxios.get.mockClear();
    mockAxios.post.mockClear();
    mockAxios.put.mockClear();
    mockAxios.delete.mockClear();
    mockAxios.patch.mockClear();
}