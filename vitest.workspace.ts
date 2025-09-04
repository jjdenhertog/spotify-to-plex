import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  // Root configuration for shared tests
  {
    test: {
      name: 'root',
      include: ['tests/**/*.{test,spec}.{js,jsx,ts,tsx}'],
      exclude: [
        '**/node_modules/**',
        'apps/sync-worker/**', // Explicitly exclude sync-worker
        'apps/spotify-scraper/**' // Exclude Python scraper
      ],
      environment: 'node'
    }
  },
  
  // Web app configuration (React/Next.js)
  {
    extends: './vitest.config.ts',
    test: {
      name: 'web',
      root: './apps/web',
      include: [
        'src/**/*.{test,spec}.{js,jsx,ts,tsx}',
        'pages/**/*.{test,spec}.{js,jsx,ts,tsx}',
        '__tests__/**/*.{test,spec}.{js,jsx,ts,tsx}'
      ],
      exclude: [
        '**/node_modules/**',
        '**/.next/**',
        '**/dist/**'
      ],
      environment: 'jsdom',
      setupFiles: ['../../tests/setup/vitest.setup.ts']
    },
    resolve: {
      alias: {
        '@/components': './src/components',
        '@/helpers': './src/helpers',
        '@/styles': './src/styles',
        '@/types': './src/types',
        '@/pages': './pages',
        '@/layouts': './src/layouts',
        '@/library': './src/library',
        '@/utils': './src/utils',
        '@/hoc': './src/hoc',
        '@/hooks': './src/hooks'
      }
    }
  },
  
  // Shared packages configuration
  {
    test: {
      name: 'packages-shared-types',
      root: './packages/shared-types',
      include: ['src/**/*.{test,spec}.{js,ts}'],
      environment: 'node'
    }
  },
  
  {
    test: {
      name: 'packages-http-client',
      root: './packages/http-client',
      include: ['src/**/*.{test,spec}.{js,ts}'],
      environment: 'node',
      setupFiles: ['../../tests/setup/vitest.setup.ts']
    }
  },
  
  {
    test: {
      name: 'packages-shared-utils',
      root: './packages/shared-utils',
      include: ['src/**/*.{test,spec}.{js,ts}'],
      environment: 'node'
    }
  },
  
  {
    test: {
      name: 'packages-music-search',
      root: './packages/music-search',
      include: ['src/**/*.{test,spec}.{js,ts}'],
      environment: 'node'
    }
  },
  
  {
    test: {
      name: 'packages-plex-music-search',
      root: './packages/plex-music-search',
      include: ['src/**/*.{test,spec}.{js,ts}'],
      environment: 'node',
      setupFiles: ['../../tests/setup/vitest.setup.ts']
    }
  },
  
  {
    test: {
      name: 'packages-tidal-music-search',
      root: './packages/tidal-music-search',
      include: ['src/**/*.{test,spec}.{js,ts}'],
      environment: 'node',
      setupFiles: ['../../tests/setup/vitest.setup.ts']
    }
  },
  
  {
    test: {
      name: 'packages-plex-config',
      root: './packages/plex-config',
      include: ['src/**/*.{test,spec}.{js,ts}'],
      environment: 'node',
      setupFiles: ['../../tests/setup/vitest.setup.ts']
    }
  },
  
  {
    test: {
      name: 'packages-plex-helpers',
      root: './packages/plex-helpers',
      include: ['src/**/*.{test,spec}.{js,ts}'],
      environment: 'node',
      setupFiles: ['../../tests/setup/vitest.setup.ts']
    }
  }
  
  // Note: sync-worker is intentionally excluded from workspace configuration
  // as per requirements - it should not have any test configuration
])