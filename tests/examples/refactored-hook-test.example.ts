/**
 * @file Example: Refactored Hook Test
 * @description Shows how to use the new test utilities to refactor existing hook tests
 * 
 * This example demonstrates the before/after transformation of a typical hook test
 * using the comprehensive test utilities.
 */

// ❌ BEFORE: Using old patterns (lots of boilerplate and duplication)
/*
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMatchFiltersApi } from '../../src/api/match-filters';

// Mock global fetch for the API client
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Manually create test data every time
const mockMatchFilter = 'artist:match AND title:contains';
const mockMatchFilters = [
    mockMatchFilter,
    'album:similarity>=0.8 OR genre:match'
];

describe('useMatchFiltersApi Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFetch.mockClear();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    it('should load filters successfully', async () => {
        // Manually create mock response structure
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockMatchFilters,
        });

        const { result } = renderHook(() => useMatchFiltersApi());

        await act(async () => {
            await result.current.loadFilters();
        });

        expect(result.current.filters).toEqual(mockMatchFilters);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('should handle loading errors', async () => {
        const errorMessage = 'Failed to load filters';
        // Manually create error structure
        mockFetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: errorMessage }),
        });

        const { result } = renderHook(() => useMatchFiltersApi());

        await act(async () => {
            await result.current.loadFilters();
        });

        expect(result.current.error).toBe(errorMessage);
        expect(result.current.isLoading).toBe(false);
    });

    // ... many more similar tests with repeated patterns
});
*/

// ✅ AFTER: Using new test utilities (clean, DRY, maintainable)

import { describe, it, expect } from 'vitest';
import { 
  useTestSuite,
  renderHookWithProviders,
  matchFilterFactory,
  apiResponseFactory,
  mockAxios,
  createTestCases,
  waitForHookAsync,
  act
} from '../test-utils/test-utils';
import { useMatchFiltersApi } from '../../src/api/match-filters';

describe('useMatchFiltersApi Hook', () => {
  // ✅ Automatic setup/cleanup (replaces beforeEach/afterEach boilerplate)
  useTestSuite();

  describe('Initialization', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHookWithProviders(() => useMatchFiltersApi());

      expect(result.current.filters).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.loadFilters).toBe('function');
      expect(typeof result.current.saveFilters).toBe('function');
      expect(typeof result.current.validateExpression).toBe('function');
    });
  });

  describe('Load Operations', () => {
    it('should load filters successfully', async () => {
      // ✅ Use factory for consistent test data
      const { valid: mockFilters } = matchFilterFactory.validationCases();
      
      // ✅ Use factory for API responses
      mockAxios.get.mockResolvedValue(
        apiResponseFactory.success(mockFilters)
      );

      const { result } = renderHookWithProviders(() => useMatchFiltersApi());

      await act(async () => {
        await result.current.loadFilters();
      });

      expect(result.current.filters).toEqual(mockFilters);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    // ✅ Data-driven testing for multiple error scenarios
    createTestCases(
      'error handling scenarios',
      [
        {
          name: 'should handle API errors',
          input: apiResponseFactory.error('Failed to load filters'),
          expected: { error: 'Failed to load filters', loading: false, filters: [] }
        },
        {
          name: 'should handle validation errors',
          input: apiResponseFactory.validationError(['Invalid filter format']),
          expected: { error: 'Validation failed', loading: false, filters: [] }
        },
        {
          name: 'should handle network timeouts',
          input: apiResponseFactory.timeout('Request timeout'),
          expected: { error: 'Request timeout', loading: false, filters: [] }
        },
        {
          name: 'should handle rate limiting',
          input: apiResponseFactory.rateLimit(60),
          expected: { error: 'Rate limit exceeded', loading: false, filters: [] }
        }
      ],
      async (mockError, expected) => {
        mockAxios.get.mockRejectedValue(mockError);

        const { result } = renderHookWithProviders(() => useMatchFiltersApi());

        await act(async () => {
          await result.current.loadFilters();
        });

        expect(result.current.error).toBe(expected.error);
        expect(result.current.isLoading).toBe(expected.loading);
        expect(result.current.filters).toEqual(expected.filters);
      }
    );

    it('should set loading state during API call', async () => {
      // ✅ Cleaner async testing pattern
      let resolvePromise: (value: any) => void;
      const loadPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      
      mockAxios.get.mockReturnValue(loadPromise);

      const { result } = renderHookWithProviders(() => useMatchFiltersApi());

      // Start loading
      act(() => {
        result.current.loadFilters();
      });

      expect(result.current.isLoading).toBe(true);

      // Complete loading
      await act(async () => {
        resolvePromise!(apiResponseFactory.success([]));
        await loadPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Save Operations', () => {
    it('should save filters successfully', async () => {
      const filtersToSave = [
        matchFilterFactory.simple('artist', 'match'),
        matchFilterFactory.similarity('title', 0.9)
      ];
      
      mockAxios.post.mockResolvedValue(
        apiResponseFactory.success({ filters: filtersToSave })
      );

      const { result } = renderHookWithProviders(() => useMatchFiltersApi());

      await act(async () => {
        await result.current.saveFilters(filtersToSave);
      });

      expect(result.current.filters).toEqual(filtersToSave);
      expect(mockAxios.post).toHaveBeenCalledWith(
        '/api/plex/music-search-config/match-filters',
        filtersToSave
      );
    });
  });

  describe('Validation Operations', () => {
    // ✅ Use factory for validation test cases
    it('should validate expressions correctly', async () => {
      const { valid, invalid } = matchFilterFactory.validationCases();
      
      // Test valid expressions
      for (const validExpression of valid) {
        mockAxios.post.mockResolvedValue(
          apiResponseFactory.success({ valid: true, errors: [] })
        );

        const { result } = renderHookWithProviders(() => useMatchFiltersApi());
        
        let validationResult: any;
        await act(async () => {
          validationResult = await result.current.validateExpression(validExpression);
        });

        expect(validationResult.valid).toBe(true);
        expect(validationResult.errors).toEqual([]);
      }

      // Test invalid expressions
      for (const invalidExpression of invalid) {
        mockAxios.post.mockResolvedValue(
          apiResponseFactory.success({ 
            valid: false, 
            errors: ['Invalid syntax'] 
          })
        );

        const { result } = renderHookWithProviders(() => useMatchFiltersApi());
        
        let validationResult: any;
        await act(async () => {
          validationResult = await result.current.validateExpression(invalidExpression);
        });

        expect(validationResult.valid).toBe(false);
        expect(validationResult.errors).toContain('Invalid syntax');
      }
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent load operations', async () => {
      const mockFilters = [matchFilterFactory.simple('artist', 'match')];
      
      mockAxios.get.mockResolvedValue(
        apiResponseFactory.success(mockFilters)
      );

      const { result } = renderHookWithProviders(() => useMatchFiltersApi());

      // Start multiple loads concurrently
      await act(async () => {
        await Promise.all([
          result.current.loadFilters(),
          result.current.loadFilters()
        ]);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockAxios.get).toHaveBeenCalledTimes(2);
    });
  });
});

// ✅ BENEFITS OF THE REFACTORED VERSION:
// 
// 1. **Reduced Boilerplate**: useTestSuite() handles all setup/cleanup
// 2. **Consistent Test Data**: matchFilterFactory ensures valid/consistent data
// 3. **Reusable Patterns**: apiResponseFactory creates consistent response structures
// 4. **Data-Driven Testing**: createTestCases eliminates repetitive test code
// 5. **Better Error Testing**: Pre-defined error scenarios cover common cases
// 6. **Type Safety**: All utilities are fully typed
// 7. **Maintainability**: Changes to data structures only need updates in factories
// 8. **Readability**: Tests focus on the "what" not the "how" of mocking
// 9. **Performance**: Built-in performance testing capabilities
// 10. **Consistency**: All tests across the project use the same patterns