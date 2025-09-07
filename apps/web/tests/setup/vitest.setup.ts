// Web app-specific test setup that extends the root setup
import '../../../../tests/setup/vitest.setup';
import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Set environment variables safely
if (typeof process !== 'undefined' && process.env) {
  Object.defineProperty(process.env, 'NODE_ENV', {
    value: 'development',
    writable: true,
    configurable: true
  });
}

// Type global extensions
declare global {
    var __DEV__: boolean;
    interface Window {
        process?: {
            env?: Record<string, string>;
        };
    }
}
global.__DEV__ = true;

// Override any production mode settings
if (typeof window !== 'undefined') {
    window.process = window.process || {} as any;
    window.process.env = window.process.env || {};
    if (window.process.env) {
        Object.defineProperty(window.process.env, 'NODE_ENV', {
            value: 'development',
            writable: true,
            configurable: true
        });
    }
}

// Additional web-specific setup
console.log('Loading web app test setup...');

// Mock Next.js router
const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockBack = vi.fn();
const mockPrefetch = vi.fn();

vi.mock('next/router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    prefetch: mockPrefetch,
    query: {},
    pathname: '/',
    asPath: '/',
    route: '/',
    isReady: true,
    events: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn()
    }
  })
}));

// Mock Next.js navigation (App Router)
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    prefetch: mockPrefetch,
    refresh: vi.fn()
  }),
  usePathname: () => '/',
  useSearchParams: () => ({
    get: vi.fn(),
    has: vi.fn(),
    toString: () => ''
  }),
  useParams: () => ({}),
  notFound: vi.fn(),
  redirect: vi.fn()
}));

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: (props: any) => {
    return {
      $$typeof: Symbol.for('react.element'),
      type: 'img',
      props: {
        src: props.src,
        alt: props.alt,
        ...props
      }
    };
  }
}));

// Mock Next.js Head component
vi.mock('next/head', () => ({
  default: ({ children }: { children: any }) => {
    return children;
  }
}));

// Mock axios for API calls
vi.mock('axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: [], status: 200, statusText: 'OK', headers: {}, config: {} })),
    post: vi.fn(() => Promise.resolve({ data: { success: true }, status: 200, statusText: 'OK', headers: {}, config: {} })),
    put: vi.fn(() => Promise.resolve({ data: { success: true }, status: 200, statusText: 'OK', headers: {}, config: {} })),
    delete: vi.fn(() => Promise.resolve({ data: { success: true }, status: 200, statusText: 'OK', headers: {}, config: {} })),
    patch: vi.fn(() => Promise.resolve({ data: { success: true }, status: 200, statusText: 'OK', headers: {}, config: {} })),
    create: vi.fn(() => ({
      get: vi.fn(() => Promise.resolve({ data: [], status: 200, statusText: 'OK', headers: {}, config: {} })),
      post: vi.fn(() => Promise.resolve({ data: { success: true }, status: 200, statusText: 'OK', headers: {}, config: {} })),
      put: vi.fn(() => Promise.resolve({ data: { success: true }, status: 200, statusText: 'OK', headers: {}, config: {} })),
      delete: vi.fn(() => Promise.resolve({ data: { success: true }, status: 200, statusText: 'OK', headers: {}, config: {} })),
      patch: vi.fn(() => Promise.resolve({ data: { success: true }, status: 200, statusText: 'OK', headers: {}, config: {} }))
    })),
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() }
    }
  }
}));

// Mock notistack for notifications
vi.mock('notistack', () => ({
  useSnackbar: () => ({
    enqueueSnackbar: vi.fn(),
    closeSnackbar: vi.fn()
  }),
  enqueueSnackbar: vi.fn(),
  SnackbarProvider: ({ children }: { children: React.ReactNode }) => {
    return children;
  }
}));

// Mock ErrorProvider showError function
vi.mock('../../src/components/ErrorProvider/ErrorProvider', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    showError: vi.fn(),
    default: ({ children }: { children: React.ReactNode }) => children
  };
});

// Mock Material-UI components that might cause issues in tests
vi.mock('@mui/material/styles', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    createTheme: vi.fn((options) => ({
      palette: {
        primary: { main: '#1976d2' },
        secondary: { main: '#dc004e' },
        mode: 'light',
        ...options?.palette
      },
      breakpoints: {
        up: vi.fn(() => ''),
        down: vi.fn(() => ''),
        between: vi.fn(() => '')
      },
      spacing: vi.fn((value) => `${value * 8}px`),
      typography: {
        fontFamily: 'Roboto, sans-serif'
      },
      ...options
    })),
    useTheme: () => ({
      palette: {
        primary: { main: '#1976d2' },
        secondary: { main: '#dc004e' },
        mode: 'light'
      },
      breakpoints: {
        up: vi.fn(() => ''),
        down: vi.fn(() => ''),
        between: vi.fn(() => '')
      },
      spacing: vi.fn((value) => `${value * 8}px`),
      typography: {
        fontFamily: 'Roboto, sans-serif'
      }
    }),
    ThemeProvider: ({ children }: { children: any }) => children,
    styled: vi.fn(() => vi.fn())
  };
});

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => ({
  default: (props: any) => {
    return {
      $$typeof: Symbol.for('react.element'),
      type: 'textarea',
      props: {
        'data-testid': 'monaco-editor',
        value: props.value,
        onChange: (e: any) => props.onChange && props.onChange(e.target.value),
        ...props
      }
    };
  }
}));

// Mock web APIs
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true
});

Object.defineProperty(window, 'scrollBy', {
  value: vi.fn(),
  writable: true
});

Object.defineProperty(Element.prototype, 'scrollIntoView', {
  value: vi.fn(),
  writable: true
});

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn(() => Promise.resolve()),
    readText: vi.fn(() => Promise.resolve(''))
  },
  writable: true
});

// Mock URL constructor
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

// Mock File and FileReader
global.File = class File {
  constructor(bits: any[], filename: string, options?: any) {
    return {
      name: filename,
      size: bits.reduce((acc, bit) => acc + bit.length, 0),
      type: options?.type || '',
      lastModified: Date.now()
    } as any;
  }
} as any;

global.FileReader = class FileReader {
  result = '';
  readAsText = vi.fn();
  readAsDataURL = vi.fn();
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
} as any;

// Enhanced console filtering
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = (...args: any[]) => {
  if (typeof args[0] === 'string') {
    if (
      args[0].includes('Warning: ReactDOM.render is no longer supported') ||
      args[0].includes('Warning: componentWillMount has been renamed') ||
      args[0].includes('Warning: componentWillReceiveProps has been renamed') ||
      args[0].includes('The above error occurred in the') ||
      args[0].includes('Consider adding an error boundary') ||
      args[0].includes('act(...) is not supported in production builds of React')
    ) {
      return;
    }
  }
  originalConsoleError(...args);
};

console.warn = (...args: any[]) => {
  if (typeof args[0] === 'string') {
    if (
      args[0].includes('deprecated') ||
      args[0].includes('Warning:') ||
      args[0].includes('React does not recognize') ||
      args[0].includes('act(...) is not supported in production builds of React')
    ) {
      return;
    }
  }
  originalConsoleWarn(...args);
};

// Restore console methods after tests
import { afterAll, afterEach } from 'vitest';

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Global test cleanup
afterEach(() => {
  vi.clearAllMocks();
  vi.clearAllTimers();
  
  // Clear DOM
  document.body.innerHTML = '';
  while (document.body.firstChild) {
    document.body.removeChild(document.body.firstChild);
  }
  
  // Clear portal containers
  document.querySelectorAll('[id^="mui-"], [class*="MuiPortal"]').forEach(el => el.remove());
  
  // Reset global state
  (global as any).fetch?.mockClear?.();
  
  // Maintain development mode
  if (typeof process !== 'undefined' && process.env) {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      writable: true,
      configurable: true
    });
  }
  global.__DEV__ = true;
});

console.log('Web app test setup complete.');