import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
    define: {
        'process.env.NODE_ENV': '"development"',
    },
    test: {
        name: 'web',
        environment: 'jsdom',
        setupFiles: ['./__tests__/test-utils/setup-tests.ts'],
        include: ['**/__tests__/**/*.{test,spec}.{js,ts,tsx}'],
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/.next/**'
        ],
        globals: true,
        css: false,
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
            '@': resolve(__dirname, 'src'),
            '~': resolve(__dirname),
        },
    },
    esbuild: {
        target: 'node14',
    },
});