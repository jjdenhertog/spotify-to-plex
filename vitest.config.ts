import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    // Global configuration defaults
    globals: true,
    reporters: ['verbose', 'junit'],
    outputFile: {
      junit: './test-results/junit.xml',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'build/',
        '.next/',
        'apps/sync-worker/**', // Exclude sync-worker from coverage
        'apps/spotify-scraper/**', // Exclude Python scraper from coverage
        'coverage/',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/index.{js,ts}',
        'tests/setup/**',
        'vitest.*.ts'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false
      }
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    watchExclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      'apps/sync-worker/**', // Don't watch sync-worker for test changes
      'apps/spotify-scraper/**'
    ],
    // Projects configuration (migrated from vitest.workspace.ts)
    projects: [
      // Root configuration for shared tests
      {
        name: 'root',
        test: {
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
        name: 'web',
        test: {
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
        name: 'packages-shared-types',
        test: {
          root: './packages/shared-types',
          include: ['src/**/*.{test,spec}.{js,ts}'],
          environment: 'node'
        }
      },
      
      {
        name: 'packages-http-client',
        test: {
          root: './packages/http-client',
          include: ['src/**/*.{test,spec}.{js,ts}'],
          environment: 'node',
          setupFiles: ['../../tests/setup/vitest.setup.ts']
        }
      },
      
      {
        name: 'packages-shared-utils',
        test: {
          root: './packages/shared-utils',
          include: ['src/**/*.{test,spec}.{js,ts}'],
          environment: 'node'
        }
      },
      
      {
        name: 'packages-music-search',
        test: {
          root: './packages/music-search',
          include: ['src/**/*.{test,spec}.{js,ts}'],
          environment: 'node'
        }
      },
      
      {
        name: 'packages-plex-music-search',
        test: {
          root: './packages/plex-music-search',
          include: ['src/**/*.{test,spec}.{js,ts}'],
          environment: 'node',
          setupFiles: ['../../tests/setup/vitest.setup.ts']
        }
      },
      
      {
        name: 'packages-tidal-music-search',
        test: {
          root: './packages/tidal-music-search',
          include: ['src/**/*.{test,spec}.{js,ts}'],
          environment: 'node',
          setupFiles: ['../../tests/setup/vitest.setup.ts']
        }
      },
      
      {
        name: 'packages-plex-config',
        test: {
          root: './packages/plex-config',
          include: ['src/**/*.{test,spec}.{js,ts}'],
          environment: 'node',
          setupFiles: ['../../tests/setup/vitest.setup.ts']
        }
      },
      
      {
        name: 'packages-plex-helpers',
        test: {
          root: './packages/plex-helpers',
          include: ['src/**/*.{test,spec}.{js,ts}'],
          environment: 'node',
          setupFiles: ['../../tests/setup/vitest.setup.ts']
        }
      }
      
      // Note: sync-worker is intentionally excluded from test configuration
      // as per requirements - it should not have any test configuration
    ]
  },
  resolve: {
    alias: {
      // Path aliases for @/ imports (Next.js app structure)
      '@/components': resolve(__dirname, 'apps/web/src/components'),
      '@/helpers': resolve(__dirname, 'apps/web/src/helpers'),
      '@/styles': resolve(__dirname, 'apps/web/src/styles'),
      '@/types': resolve(__dirname, 'apps/web/src/types'),
      '@/pages': resolve(__dirname, 'apps/web/pages'),
      '@/layouts': resolve(__dirname, 'apps/web/src/layouts'),
      '@/library': resolve(__dirname, 'apps/web/src/library'),
      '@/utils': resolve(__dirname, 'apps/web/src/utils'),
      '@/hoc': resolve(__dirname, 'apps/web/src/hoc'),
      '@/hooks': resolve(__dirname, 'apps/web/src/hooks'),
      
      // Test utilities alias
      '@test-utils': resolve(__dirname, 'tests/test-utils'),
      
      // Workspace package aliases
      '@spotify-to-plex/shared-types': resolve(__dirname, 'packages/shared-types/src'),
      '@spotify-to-plex/http-client': resolve(__dirname, 'packages/http-client/src'),
      '@spotify-to-plex/shared-utils': resolve(__dirname, 'packages/shared-utils/src'),
      '@spotify-to-plex/music-search': resolve(__dirname, 'packages/music-search/src'),
      '@spotify-to-plex/plex-music-search': resolve(__dirname, 'packages/plex-music-search/src'),
      '@spotify-to-plex/tidal-music-search': resolve(__dirname, 'packages/tidal-music-search/src'),
      '@spotify-to-plex/plex-config': resolve(__dirname, 'packages/plex-config/src'),
      '@spotify-to-plex/plex-helpers': resolve(__dirname, 'packages/plex-helpers/src')
    }
  },
  esbuild: {
    target: 'node18'
  }
})