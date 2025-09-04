import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import { SnackbarProvider } from 'notistack'
import { createTheme } from '@mui/material/styles'

// Create a basic theme for testing
const testTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2'
    },
    secondary: {
      main: '#dc004e'
    }
  }
})

// Custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  theme?: any
  withSnackbar?: boolean
}

const AllTheProviders = ({ 
  children, 
  theme = testTheme, 
  withSnackbar = true 
}: { 
  children: React.ReactNode
  theme?: any
  withSnackbar?: boolean
}) => {
  const content = (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )

  if (withSnackbar) {
    return (
      <SnackbarProvider 
        maxSnack={3}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
      >
        {content}
      </SnackbarProvider>
    )
  }

  return content
}

const customRender = (
  ui: ReactElement,
  {
    theme,
    withSnackbar = true,
    ...options
  }: CustomRenderOptions = {}
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AllTheProviders theme={theme} withSnackbar={withSnackbar}>
      {children}
    </AllTheProviders>
  )

  return render(ui, { wrapper: Wrapper, ...options })
}

// Render function without any providers (for testing components in isolation)
const renderWithoutProviders = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return render(ui, options)
}

// Render function with only theme provider (no snackbar)
const renderWithTheme = (
  ui: ReactElement,
  { theme = testTheme, ...options }: CustomRenderOptions = {}
) => {
  return customRender(ui, { theme, withSnackbar: false, ...options })
}

// Mock implementations for common hooks/functions
const mockUseRouter = () => ({
  push: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn(),
  back: vi.fn(),
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
  defaultLocale: 'en',
  domainLocales: [],
  isPreview: false,
  asPath: '/',
  basePath: '',
  locale: 'en',
  locales: ['en'],
  pathname: '/',
  route: '/',
  query: {}
})

// Mock Next.js router
vi.mock('next/router', () => ({
  useRouter: () => mockUseRouter()
}))

// Mock Next.js image component
vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || ''} />
  }
}))

// Mock Next.js link component
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => {
    return React.cloneElement(children, { href, ...props })
  }
}))

// Helper function to create mock API responses
const createMockApiResponse = <T>(data: T, status = 200) => ({
  data,
  status,
  statusText: status === 200 ? 'OK' : 'Error',
  headers: {},
  config: {}
})

// Helper function to create mock Plex server response
const createMockPlexServer = () => ({
  name: 'Test Plex Server',
  host: '192.168.1.100',
  port: 32400,
  token: 'test-token',
  uri: 'http://192.168.1.100:32400',
  version: '1.0.0',
  sections: []
})

// Helper function to create mock user data
const createMockUser = (overrides: any = {}) => ({
  id: 'test-user-id',
  username: 'testuser',
  email: 'test@example.com',
  displayName: 'Test User',
  ...overrides
})

// Helper function to create mock playlist
const createMockPlaylist = (overrides: any = {}) => ({
  id: 'test-playlist-id',
  name: 'Test Playlist',
  description: 'A test playlist',
  tracks: [],
  owner: createMockUser(),
  ...overrides
})

// Re-export everything
export * from '@testing-library/react'
export {
  customRender as render,
  renderWithoutProviders,
  renderWithTheme,
  testTheme,
  mockUseRouter,
  createMockApiResponse,
  createMockPlexServer,
  createMockUser,
  createMockPlaylist
}