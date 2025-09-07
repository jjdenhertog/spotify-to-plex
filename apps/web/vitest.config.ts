import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
    define: {
        'process.env.NODE_ENV': '"development"',
        __DEV__: true,
        // Ensure React Development mode
        'global.__DEV__': true
    },
    test: {
        name: 'web',
        environment: 'jsdom',
        setupFiles: [
            './tests/setup/vitest.setup.ts',
            './__tests__/test-utils/setup-tests.ts'
        ],
        include: ['**/__tests__/**/*.{test,spec}.{js,ts,tsx}'],
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/.next/**'
        ],
        globals: true,
        css: false,
        env: {
            NODE_ENV: 'development'
        },
        reporters: ['verbose', 'junit', 'html'],
        outputFile: {
            junit: './test-results/junit.xml',
            html: './test-results/index.html',
        },
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: [
                'src/**/*.{js,ts,tsx}'
            ],
            exclude: [
                'src/**/*.test.{js,ts,tsx}',
                'src/**/*.spec.{js,ts,tsx}',
                'src/**/__tests__/**',
                'src/**/types/**',
                'src/**/*.d.ts',
                '**/.next/**',
                '**/node_modules/**'
            ],
            thresholds: {
                global: {
                    branches: 75,
                    functions: 80,
                    lines: 80,
                    statements: 80,
                },
            },
        },
    },
    resolve: {
        alias: {
            '@/components': resolve(__dirname, 'src/components'),
            '@/helpers': resolve(__dirname, 'src/helpers'),
            '@/styles': resolve(__dirname, 'src/styles'),
            '@/types': resolve(__dirname, 'src/types'),
            '@/pages': resolve(__dirname, 'pages'),
            '@/layouts': resolve(__dirname, 'src/layouts'),
            '@/library': resolve(__dirname, 'src/library'),
            '@/utils': resolve(__dirname, 'src/utils'),
            '@/hoc': resolve(__dirname, 'src/hoc'),
            '@/hooks': resolve(__dirname, 'src/hooks'),
            '@': resolve(__dirname, 'src'),
            '~': resolve(__dirname),
        },
    },
    esbuild: {
        target: 'node14',
    },
});
