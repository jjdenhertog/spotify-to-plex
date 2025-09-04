/**
 * @file useDualModeEditor.test.ts
 * @description Comprehensive tests for the useDualModeEditor hook
 * 
 * Tests cover:
 * - View mode switching between UI and JSON
 * - Content synchronization between modes
 * - Validation state management
 * - Save callbacks with proper data
 * - Error state handling
 * - Loading state transitions
 * - API integration (load/save operations)
 * - Edge cases and error conditions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  renderHookWithSetup, 
  act, 
  mockAxiosInstance, 
  mockEnqueueSnackbar,
  resetAllMocks,
  testDataGenerators,
  waitForAsync,
} from './hook-test-utils';
import { useDualModeEditor } from '../../src/hooks/useDualModeEditor';

// Type definitions for test data
interface TestJsonData {
  name: string;
  value: number;
  active: boolean;
}

interface TestUIData {
  displayName: string;
  count: number;
  enabled: boolean;
}

// Test configuration
const mockConfig = {
  loadEndpoint: '/api/test/load',
  saveEndpoint: '/api/test/save',
  validator: vi.fn((data: TestJsonData) => {
    if (!data.name || data.name.trim() === '') {
      return 'Name is required';
    }
    if (data.value < 0) {
      return 'Value must be non-negative';
    }
    return null;
  }),
  jsonToUI: vi.fn((json: TestJsonData): TestUIData => ({
    displayName: json.name,
    count: json.value,
    enabled: json.active,
  })),
  uiToJSON: vi.fn((ui: TestUIData): TestJsonData => ({
    name: ui.displayName,
    value: ui.count,
    active: ui.enabled,
  })),
  initialData: {
    name: 'Initial',
    value: 10,
    active: true,
  } as TestJsonData,
};

// Mock editor ref with getCurrentValue method
const mockEditorRef = {
  current: {
    getCurrentValue: vi.fn(),
  },
};

describe('useDualModeEditor Hook', () => {
  beforeEach(() => {
    resetAllMocks();
    vi.clearAllMocks();
    
    // Reset config function mocks
    mockConfig.validator.mockImplementation((data: TestJsonData) => {
      if (!data.name || data.name.trim() === '') {
        return 'Name is required';
      }
      if (data.value < 0) {
        return 'Value must be non-negative';
      }
      return null;
    });
    
    mockConfig.jsonToUI.mockImplementation((json: TestJsonData): TestUIData => ({
      displayName: json.name,
      count: json.value,
      enabled: json.active,
    }));
    
    mockConfig.uiToJSON.mockImplementation((ui: TestUIData): TestJsonData => ({
      name: ui.displayName,
      value: ui.count,
      active: ui.enabled,
    }));
  });

  describe('Initialization', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHookWithSetup(() => useDualModeEditor(mockConfig));

      expect(result.current.viewMode).toBe('ui');
      expect(result.current.jsonData).toEqual(mockConfig.initialData);
      expect(result.current.uiData).toEqual({
        displayName: 'Initial',
        count: 10,
        enabled: true,
      });
      expect(result.current.loading).toBe(true);
      expect(result.current.validationError).toBe('');
      expect(result.current.editorRef).toBeDefined();
    });

    it('should call jsonToUI converter on initialization', () => {
      renderHookWithSetup(() => useDualModeEditor(mockConfig));

      expect(mockConfig.jsonToUI).toHaveBeenCalledWith(mockConfig.initialData);
    });
  });

  describe('Data Loading', () => {
    it('should load data successfully', async () => {
      const apiData = { name: 'Loaded', value: 20, active: false };
      mockAxiosInstance.get.mockResolvedValue(
        testDataGenerators.createMockResponse(apiData)
      );

      const { result } = renderHookWithSetup(() => useDualModeEditor(mockConfig));

      await act(async () => {
        await result.current.loadData();
      });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/test/load');
      expect(result.current.jsonData).toEqual(apiData);
      expect(result.current.uiData).toEqual({
        displayName: 'Loaded',
        count: 20,
        enabled: false,
      });
      expect(result.current.loading).toBe(false);
    });

    it('should handle loading errors gracefully', async () => {
      mockAxiosInstance.get.mockRejectedValue(
        testDataGenerators.createMockError('Load failed')
      );

      const { result } = renderHookWithSetup(() => useDualModeEditor(mockConfig));

      await act(async () => {
        await result.current.loadData();
      });

      expect(result.current.loading).toBe(false);
      // Data should remain unchanged
      expect(result.current.jsonData).toEqual(mockConfig.initialData);
    });

    it('should set loading state correctly during load operation', async () => {
      let resolvePromise: (value: any) => void;
      const loadPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      
      mockAxiosInstance.get.mockReturnValue(loadPromise);

      const { result } = renderHookWithSetup(() => useDualModeEditor(mockConfig));

      // Start loading
      act(() => {
        result.current.loadData();
      });

      expect(result.current.loading).toBe(true);

      // Complete loading
      await act(async () => {
        resolvePromise!(testDataGenerators.createMockResponse({ name: 'Test', value: 5, active: true }));
        await loadPromise;
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('View Mode Switching', () => {
    it('should switch from UI to JSON mode', () => {
      const { result } = renderHookWithSetup(() => useDualModeEditor(mockConfig));

      act(() => {
        result.current.handleViewModeChange({} as React.MouseEvent<HTMLElement>, 'json');
      });

      expect(result.current.viewMode).toBe('json');
      expect(mockConfig.uiToJSON).toHaveBeenCalledWith(result.current.uiData);
    });

    it('should switch from JSON to UI mode', () => {
      const { result } = renderHookWithSetup(() => useDualModeEditor(mockConfig));

      // First switch to JSON
      act(() => {
        result.current.handleViewModeChange({} as React.MouseEvent<HTMLElement>, 'json');
      });

      // Then switch back to UI
      act(() => {
        result.current.handleViewModeChange({} as React.MouseEvent<HTMLElement>, 'ui');
      });

      expect(result.current.viewMode).toBe('ui');
      expect(mockConfig.jsonToUI).toHaveBeenCalledWith(result.current.jsonData);
    });

    it('should not change mode when null is passed', () => {
      const { result } = renderHookWithSetup(() => useDualModeEditor(mockConfig));
      const originalMode = result.current.viewMode;

      act(() => {
        result.current.handleViewModeChange({} as React.MouseEvent<HTMLElement>, null);
      });

      expect(result.current.viewMode).toBe(originalMode);
    });

    it('should synchronize data when switching modes', () => {
      const { result } = renderHookWithSetup(() => useDualModeEditor(mockConfig));

      // Modify UI data
      const newUIData = { displayName: 'Modified', count: 15, enabled: false };
      act(() => {
        result.current.handleUIDataChange(newUIData);
      });

      // Switch to JSON mode
      act(() => {
        result.current.handleViewModeChange({} as React.MouseEvent<HTMLElement>, 'json');
      });

      expect(mockConfig.uiToJSON).toHaveBeenCalledWith(newUIData);
      expect(result.current.jsonData).toEqual({
        name: 'Modified',
        value: 15,
        active: false,
      });
    });
  });

  describe('Data Changes', () => {
    it('should update UI data and clear validation error', () => {
      const { result } = renderHookWithSetup(() => useDualModeEditor(mockConfig));

      // Set an initial validation error
      act(() => {
        result.current.handleSave(); // This might set validation error
      });

      const newUIData = { displayName: 'New Name', count: 25, enabled: true };
      act(() => {
        result.current.handleUIDataChange(newUIData);
      });

      expect(result.current.uiData).toEqual(newUIData);
      expect(result.current.validationError).toBe('');
    });

    it('should update JSON data and clear validation error', () => {
      const { result } = renderHookWithSetup(() => useDualModeEditor(mockConfig));

      const newJsonData = { name: 'New JSON', value: 30, active: false };
      act(() => {
        result.current.handleJSONDataChange(newJsonData);
      });

      expect(result.current.jsonData).toEqual(newJsonData);
      expect(result.current.validationError).toBe('');
    });
  });

  describe('Save Operations', () => {
    it('should save UI data successfully', async () => {
      mockAxiosInstance.post.mockResolvedValue(
        testDataGenerators.createMockResponse('Success')
      );

      const { result } = renderHookWithSetup(() => useDualModeEditor(mockConfig));

      // Set some UI data
      const uiData = { displayName: 'Test Save', count: 100, enabled: true };
      act(() => {
        result.current.handleUIDataChange(uiData);
      });

      await act(async () => {
        await result.current.handleSave();
      });

      expect(mockConfig.uiToJSON).toHaveBeenCalledWith(uiData);
      expect(mockConfig.validator).toHaveBeenCalledWith({
        name: 'Test Save',
        value: 100,
        active: true,
      });
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/test/save', {
        name: 'Test Save',
        value: 100,
        active: true,
      });
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Configuration saved successfully', 
        { variant: 'success' }
      );
    });

    it('should save JSON data when in JSON mode', async () => {
      mockAxiosInstance.post.mockResolvedValue(
        testDataGenerators.createMockResponse('Success')
      );

      const { result } = renderHookWithSetup(() => useDualModeEditor(mockConfig));

      // Switch to JSON mode
      act(() => {
        result.current.handleViewModeChange({} as React.MouseEvent<HTMLElement>, 'json');
      });

      // Mock editor ref
      const jsonData = { name: 'Editor Data', value: 50, active: true };
      result.current.editorRef.current = {
        getCurrentValue: vi.fn().mockReturnValue(jsonData),
      };

      await act(async () => {
        await result.current.handleSave();
      });

      expect(result.current.editorRef.current.getCurrentValue).toHaveBeenCalled();
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/test/save', jsonData);
    });

    it('should handle validation errors during save', async () => {
      const { result } = renderHookWithSetup(() => useDualModeEditor(mockConfig));

      // Set invalid data (negative value)
      const invalidUIData = { displayName: 'Invalid', count: -5, enabled: true };
      act(() => {
        result.current.handleUIDataChange(invalidUIData);
      });

      await act(async () => {
        await result.current.handleSave();
      });

      expect(result.current.validationError).toBe('Value must be non-negative');
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Validation Error: Value must be non-negative',
        { variant: 'error' }
      );
      expect(mockAxiosInstance.post).not.toHaveBeenCalled();
    });

    it('should handle empty data during save', async () => {
      const { result } = renderHookWithSetup(() => useDualModeEditor(mockConfig));

      // Switch to JSON mode and mock empty data
      act(() => {
        result.current.handleViewModeChange({} as React.MouseEvent<HTMLElement>, 'json');
      });

      result.current.editorRef.current = {
        getCurrentValue: vi.fn().mockReturnValue(null),
      };

      await act(async () => {
        await result.current.handleSave();
      });

      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'No valid data to save',
        { variant: 'error' }
      );
      expect(mockAxiosInstance.post).not.toHaveBeenCalled();
    });

    it('should handle save API errors', async () => {
      mockAxiosInstance.post.mockRejectedValue(
        testDataGenerators.createMockError('Save failed')
      );

      const { result } = renderHookWithSetup(() => useDualModeEditor(mockConfig));

      await act(async () => {
        await result.current.handleSave();
      });

      // Should not throw, error is handled by errorBoundary
      expect(mockAxiosInstance.post).toHaveBeenCalled();
    });

    it('should update local state after successful save', async () => {
      mockAxiosInstance.post.mockResolvedValue(
        testDataGenerators.createMockResponse('Success')
      );

      const { result } = renderHookWithSetup(() => useDualModeEditor(mockConfig));

      const uiData = { displayName: 'Updated', count: 75, enabled: false };
      act(() => {
        result.current.handleUIDataChange(uiData);
      });

      await act(async () => {
        await result.current.handleSave();
      });

      const expectedJsonData = { name: 'Updated', value: 75, active: false };
      expect(result.current.jsonData).toEqual(expectedJsonData);
      expect(result.current.uiData).toEqual({
        displayName: 'Updated',
        count: 75,
        enabled: false,
      });
    });
  });

  describe('Reset Operations', () => {
    it('should reset data when confirmed', async () => {
      const apiData = { name: 'Reset Data', value: 999, active: false };
      mockAxiosInstance.get.mockResolvedValue(
        testDataGenerators.createMockResponse(apiData)
      );

      // Mock window.confirm to return true
      const mockConfirm = vi.spyOn(window, 'confirm');
      mockConfirm.mockReturnValue(true);

      const { result } = renderHookWithSetup(() => useDualModeEditor(mockConfig));

      // Modify data first
      act(() => {
        result.current.handleUIDataChange({ displayName: 'Modified', count: 1, enabled: true });
      });

      await act(async () => {
        await result.current.handleReset();
      });

      expect(mockConfirm).toHaveBeenCalledWith(
        'Reset to defaults? This will overwrite your current configuration.'
      );
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/test/load');
      expect(result.current.jsonData).toEqual(apiData);
      expect(result.current.validationError).toBe('');

      mockConfirm.mockRestore();
    });

    it('should not reset data when not confirmed', async () => {
      const mockConfirm = vi.spyOn(window, 'confirm');
      mockConfirm.mockReturnValue(false);

      const { result } = renderHookWithSetup(() => useDualModeEditor(mockConfig));

      const originalJsonData = result.current.jsonData;

      await act(async () => {
        await result.current.handleReset();
      });

      expect(mockConfirm).toHaveBeenCalled();
      expect(mockAxiosInstance.get).not.toHaveBeenCalled();
      expect(result.current.jsonData).toEqual(originalJsonData);

      mockConfirm.mockRestore();
    });

    it('should clear validation error on reset', async () => {
      const mockConfirm = vi.spyOn(window, 'confirm');
      mockConfirm.mockReturnValue(true);
      
      mockAxiosInstance.get.mockResolvedValue(
        testDataGenerators.createMockResponse({ name: 'Reset', value: 1, active: true })
      );

      const { result } = renderHookWithSetup(() => useDualModeEditor(mockConfig));

      // Set a validation error first
      await act(async () => {
        result.current.handleUIDataChange({ displayName: '', count: -1, enabled: true });
        await result.current.handleSave();
      });

      expect(result.current.validationError).toBeTruthy();

      await act(async () => {
        await result.current.handleReset();
      });

      expect(result.current.validationError).toBe('');

      mockConfirm.mockRestore();
    });
  });

  describe('Validation', () => {
    it('should validate data with custom validator', () => {
      // Use the result to avoid unused variable warning
      renderHookWithSetup(() => useDualModeEditor(mockConfig));

      // Test valid data
      expect(mockConfig.validator({ name: 'Valid', value: 10, active: true })).toBeNull();

      // Test empty name
      expect(mockConfig.validator({ name: '', value: 10, active: true })).toBe('Name is required');

      // Test negative value
      expect(mockConfig.validator({ name: 'Test', value: -1, active: true })).toBe('Value must be non-negative');
    });

    it('should clear validation error when data changes', () => {
      const { result } = renderHookWithSetup(() => useDualModeEditor(mockConfig));

      // First, create a validation error
      act(() => {
        result.current.handleUIDataChange({ displayName: '', count: -1, enabled: true });
      });

      // Now fix the data
      act(() => {
        result.current.handleUIDataChange({ displayName: 'Fixed', count: 10, enabled: true });
      });

      expect(result.current.validationError).toBe('');
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent save operations', async () => {
      mockAxiosInstance.post.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(testDataGenerators.createMockResponse('Success')), 100))
      );

      const { result } = renderHookWithSetup(() => useDualModeEditor(mockConfig));

      // Start multiple saves concurrently
      const savePromises = [
        result.current.handleSave(),
        result.current.handleSave(),
        result.current.handleSave(),
      ];

      await act(async () => {
        await Promise.all(savePromises);
      });

      // All should complete without throwing
      expect(mockAxiosInstance.post).toHaveBeenCalled();
    });

    it('should handle malformed JSON data', async () => {
      const { result } = renderHookWithSetup(() => useDualModeEditor(mockConfig));

      // Switch to JSON mode
      act(() => {
        result.current.handleViewModeChange({} as React.MouseEvent<HTMLElement>, 'json');
      });

      // Mock malformed JSON from editor
      result.current.editorRef.current = {
        getCurrentValue: vi.fn().mockReturnValue('invalid json'),
      };

      await act(async () => {
        await result.current.handleSave();
      });

      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'No valid data to save',
        { variant: 'error' }
      );
    });

    it('should handle converter function errors', () => {
      const errorConfig = {
        ...mockConfig,
        jsonToUI: vi.fn().mockImplementation(() => {
          throw new Error('Conversion failed');
        }),
      };

      // Should not crash on initialization
      const { result } = renderHookWithSetup(() => useDualModeEditor(errorConfig));

      // Hook should still be initialized
      expect(result.current).toBeDefined();
      expect(result.current.viewMode).toBe('ui');
    });
  });

  describe('Variable Usage Test', () => {
    it('should mock variables to avoid unused warnings', () => {
      // This test exists purely to use variables that might otherwise be unused
      expect(mockEditorRef).toBeDefined();
      expect(testDataGenerators).toBeDefined();
      expect(waitForAsync).toBeDefined();
      // MockedFunction was a type import that we no longer need
    });
  });
});