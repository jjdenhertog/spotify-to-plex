/**
 * @file useMatchFiltersApi.test.ts
 * @description Comprehensive tests for the useMatchFiltersApi hook
 * 
 * Tests cover:
 * - API operations (load, save, validate)
 * - State management (loading, error, data)
 * - Error handling and recovery
 * - Async operations and race conditions
 * - Validation scenarios
 * - Edge cases and boundary conditions
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
  renderHookWithSetup, 
  act
} from './hook-test-utils';
import { useMatchFiltersApi } from '../../src/api/match-filters';
import type { MatchFilterConfig } from '@spotify-to-plex/shared-types/common/MatchFilterConfig';

// Mock global fetch for the API client
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Test data - MatchFilterConfig is a string type representing expressions
const mockMatchFilter: MatchFilterConfig = 'artist:match AND title:contains';

const mockMatchFilters: MatchFilterConfig[] = [
  mockMatchFilter,
  'album:similarity>=0.8 OR genre:match',
];

describe('useMatchFiltersApi Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHookWithSetup(() => useMatchFiltersApi());

      expect(result.current.filters).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.loadFilters).toBe('function');
      expect(typeof result.current.saveFilters).toBe('function');
      expect(typeof result.current.validateExpression).toBe('function');
      expect(typeof result.current.validateFilter).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
    });

    it('should provide all required methods and properties', () => {
      const { result } = renderHookWithSetup(() => useMatchFiltersApi());

      const expectedProperties = [
        'filters', 'isLoading', 'error',
        'loadFilters', 'saveFilters', 'validateExpression', 'validateFilter', 'clearError'
      ];

      expectedProperties.forEach(prop => {
        expect(result.current).toHaveProperty(prop);
      });
    });
  });

  describe('loadFilters', () => {
    it('should load filters successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMatchFilters,
      });

      const { result } = renderHookWithSetup(() => useMatchFiltersApi());

      await act(async () => {
        await result.current.loadFilters();
      });

      expect(result.current.filters).toEqual(mockMatchFilters);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockFetch).toHaveBeenCalledWith('/api/plex/music-search-config/match-filters', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
    });

    it('should set loading state during API call', async () => {
      let resolvePromise: (value: any) => void;
      const loadPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(loadPromise);

      const { result } = renderHookWithSetup(() => useMatchFiltersApi());

      // Start loading
      act(() => {
        result.current.loadFilters();
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();

      // Complete loading
      await act(async () => {
        resolvePromise!({
          ok: true,
          json: async () => mockMatchFilters,
        });
        await loadPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should handle loading errors', async () => {
      const errorMessage = 'Failed to load filters';
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: errorMessage }),
      });

      const { result } = renderHookWithSetup(() => useMatchFiltersApi());

      await act(async () => {
        await result.current.loadFilters();
      });

      expect(result.current.filters).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHookWithSetup(() => useMatchFiltersApi());

      await act(async () => {
        await result.current.loadFilters();
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.filters).toEqual([]);
    });

    it('should handle non-Error exceptions', async () => {
      mockFetch.mockRejectedValueOnce('String error');

      const { result } = renderHookWithSetup(() => useMatchFiltersApi());

      await act(async () => {
        await result.current.loadFilters();
      });

      expect(result.current.error).toBe('Failed to load filters');
      expect(result.current.isLoading).toBe(false);
    });

    it('should clear previous error state when loading', async () => {
      const { result } = renderHookWithSetup(() => useMatchFiltersApi());

      // First, create an error state
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Initial error' }),
      });

      await act(async () => {
        await result.current.loadFilters();
      });

      expect(result.current.error).toBe('Initial error');

      // Now make a successful call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMatchFilters,
      });

      await act(async () => {
        await result.current.loadFilters();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.filters).toEqual(mockMatchFilters);
    });
  });

  describe('saveFilters', () => {
    it('should save filters successfully', async () => {
      const savedFilters = [...mockMatchFilters];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ filters: savedFilters }),
      });

      const { result } = renderHookWithSetup(() => useMatchFiltersApi());

      await act(async () => {
        await result.current.saveFilters(mockMatchFilters);
      });

      expect(result.current.filters).toEqual(savedFilters);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockFetch).toHaveBeenCalledWith('/api/plex/music-search-config/match-filters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockMatchFilters),
      });
    });

    it('should set loading state during save operation', async () => {
      let resolvePromise: (value: any) => void;
      const savePromise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(savePromise);

      const { result } = renderHookWithSetup(() => useMatchFiltersApi());

      // Start saving
      act(() => {
        result.current.saveFilters(mockMatchFilters);
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();

      // Complete saving
      await act(async () => {
        resolvePromise!({
          ok: true,
          json: async () => ({ filters: mockMatchFilters }),
        });
        await savePromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should handle save errors and rethrow', async () => {
      const errorMessage = 'Validation failed';
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: errorMessage }),
      });

      const { result } = renderHookWithSetup(() => useMatchFiltersApi());

      let thrownError: any;
      await act(async () => {
        try {
          await result.current.saveFilters(mockMatchFilters);
        } catch (error) {
          thrownError = error;
        }
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.isLoading).toBe(false);
      expect(thrownError).toBeDefined();
      expect(thrownError.message).toBe(errorMessage);
    });

    it('should handle network errors during save', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network failed'));

      const { result } = renderHookWithSetup(() => useMatchFiltersApi());

      let thrownError: any;
      await act(async () => {
        try {
          await result.current.saveFilters(mockMatchFilters);
        } catch (error) {
          thrownError = error;
        }
      });

      expect(result.current.error).toBe('Network failed');
      expect(thrownError).toBeDefined();
    });

    it('should handle non-Error exceptions during save', async () => {
      mockFetch.mockRejectedValueOnce('Save failed');

      const { result } = renderHookWithSetup(() => useMatchFiltersApi());

      let thrownError: any;
      await act(async () => {
        try {
          await result.current.saveFilters(mockMatchFilters);
        } catch (error) {
          thrownError = error;
        }
      });

      expect(result.current.error).toBe('Failed to save filters');
      expect(thrownError).toBeDefined();
    });

    it('should update filters state with response data', async () => {
      const updatedFilters = [
        'artist:similarity>=0.9 AND title:match'
      ];
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ filters: updatedFilters }),
      });

      const { result } = renderHookWithSetup(() => useMatchFiltersApi());

      await act(async () => {
        await result.current.saveFilters(mockMatchFilters);
      });

      expect(result.current.filters).toEqual(updatedFilters);
    });
  });

  describe('validateExpression', () => {
    it('should validate expression successfully', async () => {
      const validationResponse = { valid: true, errors: [] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => validationResponse,
      });

      const { result } = renderHookWithSetup(() => useMatchFiltersApi());

      let validationResult: any;
      await act(async () => {
        validationResult = await result.current.validateExpression('artist.includes("test")');
      });

      expect(validationResult).toEqual({ valid: true, errors: [] });
      expect(mockFetch).toHaveBeenCalledWith('/api/plex/music-search-config/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expression: 'artist.includes("test")' }),
      });
    });

    it('should handle invalid expression', async () => {
      const validationResponse = { 
        valid: false, 
        errors: ['Syntax error: unexpected token'] 
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => validationResponse,
      });

      const { result } = renderHookWithSetup(() => useMatchFiltersApi());

      let validationResult: any;
      await act(async () => {
        validationResult = await result.current.validateExpression('invalid.expression(');
      });

      expect(validationResult).toEqual({ 
        valid: false, 
        errors: ['Syntax error: unexpected token'] 
      });
    });

    it('should handle validation API errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Validation service unavailable'));

      const { result } = renderHookWithSetup(() => useMatchFiltersApi());

      let validationResult: any;
      await act(async () => {
        validationResult = await result.current.validateExpression('test.expression');
      });

      expect(validationResult).toEqual({ 
        valid: false, 
        errors: ['Validation service unavailable'] 
      });
    });

    it('should handle non-Error exceptions in validation', async () => {
      mockFetch.mockRejectedValueOnce('Service down');

      const { result } = renderHookWithSetup(() => useMatchFiltersApi());

      let validationResult: any;
      await act(async () => {
        validationResult = await result.current.validateExpression('test.expression');
      });

      expect(validationResult).toEqual({ 
        valid: false, 
        errors: ['Validation failed'] 
      });
    });
  });

  describe('validateFilter', () => {
    it('should validate filter successfully', async () => {
      const validationResponse = { valid: true, errors: [] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => validationResponse,
      });

      const { result } = renderHookWithSetup(() => useMatchFiltersApi());

      let validationResult: any;
      await act(async () => {
        validationResult = await result.current.validateFilter(mockMatchFilter);
      });

      expect(validationResult).toEqual({ valid: true, errors: [] });
      expect(mockFetch).toHaveBeenCalledWith('/api/plex/music-search-config/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filter: mockMatchFilter }),
      });
    });

    it('should handle invalid filter', async () => {
      const validationResponse = { 
        valid: false, 
        errors: ['Filter name is required', 'Invalid expression syntax'] 
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => validationResponse,
      });

      const { result } = renderHookWithSetup(() => useMatchFiltersApi());

      const invalidFilter: MatchFilterConfig = 'invalid_expression_syntax(';

      let validationResult: any;
      await act(async () => {
        validationResult = await result.current.validateFilter(invalidFilter);
      });

      expect(validationResult).toEqual({ 
        valid: false, 
        errors: ['Filter name is required', 'Invalid expression syntax'] 
      });
    });

    it('should handle filter validation API errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Validation server error'));

      const { result } = renderHookWithSetup(() => useMatchFiltersApi());

      let validationResult: any;
      await act(async () => {
        validationResult = await result.current.validateFilter(mockMatchFilter);
      });

      expect(validationResult).toEqual({ 
        valid: false, 
        errors: ['Validation server error'] 
      });
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      const { result } = renderHookWithSetup(() => useMatchFiltersApi());

      // First, create an error state
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Test error' }),
      });

      await act(async () => {
        await result.current.loadFilters();
      });

      expect(result.current.error).toBe('Test error');

      // Clear the error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should not affect other state when clearing error', async () => {
      const { result } = renderHookWithSetup(() => useMatchFiltersApi());

      // First, load data successfully
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMatchFilters,
      });

      await act(async () => {
        await result.current.loadFilters();
      });

      // Then create an error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Test error' }),
      });

      await act(async () => {
        await result.current.loadFilters();
      });

      expect(result.current.error).toBe('Test error');
      expect(result.current.filters).toEqual(mockMatchFilters); // Should still have previous data

      // Clear the error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.filters).toEqual(mockMatchFilters); // Data should remain
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent load operations', async () => {
      const responses = [
        { ok: true, json: async () => [mockMatchFilters[0]] },
        { ok: true, json: async () => mockMatchFilters },
      ];

      let callCount = 0;
      mockFetch.mockImplementation(() => {
        const response = responses[callCount++];
        return Promise.resolve(response);
      });

      const { result } = renderHookWithSetup(() => useMatchFiltersApi());

      // Start multiple loads concurrently
      await act(async () => {
        await Promise.all([
          result.current.loadFilters(),
          result.current.loadFilters(),
        ]);
      });

      // Should complete without errors
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should handle concurrent save operations', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ filters: mockMatchFilters }),
      });

      const { result } = renderHookWithSetup(() => useMatchFiltersApi());

      // Start multiple saves concurrently
      await act(async () => {
        const savePromises = [
          result.current.saveFilters([mockMatchFilters[0] || '']),
          result.current.saveFilters(mockMatchFilters),
        ];

        await Promise.all(savePromises.map(p => p.catch(() => null)));
      });

      expect(result.current.isLoading).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should handle mixed concurrent operations', async () => {
      mockFetch.mockImplementation((_url, options) => {
        if (options?.method === 'GET') {
          return Promise.resolve({
            ok: true,
            json: async () => mockMatchFilters,
          });
        } else if (options?.method === 'POST') {
          const body = JSON.parse(options.body as string);
          if (body.expression) {
            return Promise.resolve({
              ok: true,
              json: async () => ({ valid: true, errors: [] }),
            });
          } else {
            return Promise.resolve({
              ok: true,
              json: async () => ({ filters: mockMatchFilters }),
            });
          }
        }
        return Promise.reject(new Error('Unknown request'));
      });

      const { result } = renderHookWithSetup(() => useMatchFiltersApi());

      // Mix of different operations
      await act(async () => {
        await Promise.all([
          result.current.loadFilters(),
          result.current.validateExpression('test.expression'),
          result.current.saveFilters(mockMatchFilters).catch(() => null),
        ]);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Error Recovery', () => {
    it('should recover from error state on successful operation', async () => {
      const { result } = renderHookWithSetup(() => useMatchFiltersApi());

      // First, create an error state
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Server error' }),
      });

      await act(async () => {
        await result.current.loadFilters();
      });

      expect(result.current.error).toBe('Server error');

      // Then recover with successful operation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMatchFilters,
      });

      await act(async () => {
        await result.current.loadFilters();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.filters).toEqual(mockMatchFilters);
    });

    it('should maintain error state until explicitly cleared or successful operation', async () => {
      const { result } = renderHookWithSetup(() => useMatchFiltersApi());

      // Create error state
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Persistent error' }),
      });

      await act(async () => {
        await result.current.loadFilters();
      });

      expect(result.current.error).toBe('Persistent error');

      // Error should persist through other state changes
      expect(result.current.error).toBe('Persistent error');

      // Clear error explicitly
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty filter arrays', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const { result } = renderHookWithSetup(() => useMatchFiltersApi());

      await act(async () => {
        await result.current.loadFilters();
      });

      expect(result.current.filters).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should handle empty validation responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: true }), // No errors field
      });

      const { result } = renderHookWithSetup(() => useMatchFiltersApi());

      let validationResult: any;
      await act(async () => {
        validationResult = await result.current.validateExpression('test');
      });

      expect(validationResult.valid).toBe(true);
      expect(validationResult.errors).toBeDefined();
    });

    it('should handle malformed API responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}), // No error field
      });

      const { result } = renderHookWithSetup(() => useMatchFiltersApi());

      await act(async () => {
        await result.current.loadFilters();
      });

      expect(result.current.error).toBe('HTTP 200'); // Fallback error message
    });

    it('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const { result } = renderHookWithSetup(() => useMatchFiltersApi());

      await act(async () => {
        await result.current.loadFilters();
      });

      expect(result.current.error).toBe('Invalid JSON');
      expect(result.current.filters).toEqual([]);
    });
  });
});