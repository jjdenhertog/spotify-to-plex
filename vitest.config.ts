import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup/vitest.setup.ts'],
    include: [
      'packages/**/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
      'apps/web/**/*.{test,spec}.{js,jsx,ts,tsx}',
      'tests/**/*.{test,spec}.{js,jsx,ts,tsx}'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      'apps/sync-worker/**', // Explicitly exclude sync-worker
      'apps/spotify-scraper/**', // Exclude Python scraper
      '**/coverage/**'
    ],
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