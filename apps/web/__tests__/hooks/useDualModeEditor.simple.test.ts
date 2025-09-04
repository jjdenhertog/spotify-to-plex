/**
 * @file useDualModeEditor.simple.test.ts  
 * @description Comprehensive tests for the useDualModeEditor hook (Vitest compatible)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDualModeEditor } from '../../src/hooks/useDualModeEditor';

// Mock axios
const mockAxios = {
  get: vi.fn(),
  post: vi.fn(),
};
vi.mock('axios', () => ({ default: mockAxios }));

// Mock notistack
const mockEnqueueSnackbar = vi.fn();
vi.mock('notistack', () => ({
  enqueueSnackbar: mockEnqueueSnackbar,
}));

// Mock error boundary
vi.mock('../../src/helpers/errors/errorBoundary', () => ({
  errorBoundary: vi.fn((fn, errorHandler) => {
    try {
      return fn();
    } catch (error) {
      if (errorHandler) errorHandler();
      throw error;
    }
  }),
}));

// Test types
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

describe('useDualModeEditor Hook', () => {
  beforeEach(() => {
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
      const { result } = renderHook(() => useDualModeEditor(mockConfig));

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
      renderHook(() => useDualModeEditor(mockConfig));
      expect(mockConfig.jsonToUI).toHaveBeenCalledWith(mockConfig.initialData);
    });
  });

  describe('View Mode Switching', () => {
    it('should switch from UI to JSON mode', () => {
      const { result } = renderHook(() => useDualModeEditor(mockConfig));

      act(() => {
        result.current.handleViewModeChange({} as React.MouseEvent<HTMLElement>, 'json');
      });

      expect(result.current.viewMode).toBe('json');
      expect(mockConfig.uiToJSON).toHaveBeenCalledWith(result.current.uiData);
    });

    it('should switch from JSON to UI mode', () => {
      const { result } = renderHook(() => useDualModeEditor(mockConfig));

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
      const { result } = renderHook(() => useDualModeEditor(mockConfig));
      const originalMode = result.current.viewMode;

      act(() => {
        result.current.handleViewModeChange({} as React.MouseEvent<HTMLElement>, null);
      });

      expect(result.current.viewMode).toBe(originalMode);
    });
  });

  describe('Data Loading', () => {
    it('should load data successfully', async () => {
      const apiData = { name: 'Loaded', value: 20, active: false };
      mockAxios.get.mockResolvedValue({ data: apiData });

      const { result } = renderHook(() => useDualModeEditor(mockConfig));

      await act(async () => {
        await result.current.loadData();
      });

      expect(mockAxios.get).toHaveBeenCalledWith('/api/test/load');
      expect(result.current.jsonData).toEqual(apiData);
      expect(result.current.uiData).toEqual({
        displayName: 'Loaded',
        count: 20,
        enabled: false,
      });
      expect(result.current.loading).toBe(false);
    });

    it('should handle loading errors gracefully', async () => {
      mockAxios.get.mockRejectedValue(new Error('Load failed'));

      const { result } = renderHook(() => useDualModeEditor(mockConfig));

      await act(async () => {
        await result.current.loadData();
      });

      expect(result.current.loading).toBe(false);
      // Data should remain unchanged
      expect(result.current.jsonData).toEqual(mockConfig.initialData);
    });
  });

  describe('Data Changes', () => {
    it('should update UI data and clear validation error', () => {
      const { result } = renderHook(() => useDualModeEditor(mockConfig));

      const newUIData = { displayName: 'New Name', count: 25, enabled: true };
      act(() => {
        result.current.handleUIDataChange(newUIData);
      });

      expect(result.current.uiData).toEqual(newUIData);
      expect(result.current.validationError).toBe('');
    });

    it('should update JSON data and clear validation error', () => {
      const { result } = renderHook(() => useDualModeEditor(mockConfig));

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
      mockAxios.post.mockResolvedValue({ data: 'Success' });

      const { result } = renderHook(() => useDualModeEditor(mockConfig));

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
      expect(mockAxios.post).toHaveBeenCalledWith('/api/test/save', {
        name: 'Test Save',
        value: 100,
        active: true,
      });
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Configuration saved successfully', 
        { variant: 'success' }
      );
    });

    it('should handle validation errors during save', async () => {
      const { result } = renderHook(() => useDualModeEditor(mockConfig));

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
      expect(mockAxios.post).not.toHaveBeenCalled();
    });

    it('should handle empty data during save', async () => {
      const { result } = renderHook(() => useDualModeEditor(mockConfig));

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
      expect(mockAxios.post).not.toHaveBeenCalled();
    });
  });

  describe('Reset Operations', () => {
    it('should reset data when confirmed', async () => {
      const apiData = { name: 'Reset Data', value: 999, active: false };
      mockAxios.get.mockResolvedValue({ data: apiData });

      // Mock window.confirm to return true
      const mockConfirm = vi.spyOn(window, 'confirm');
      mockConfirm.mockReturnValue(true);

      const { result } = renderHook(() => useDualModeEditor(mockConfig));

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
      expect(mockAxios.get).toHaveBeenCalledWith('/api/test/load');
      expect(result.current.jsonData).toEqual(apiData);
      expect(result.current.validationError).toBe('');

      mockConfirm.mockRestore();
    });

    it('should not reset data when not confirmed', async () => {
      const mockConfirm = vi.spyOn(window, 'confirm');
      mockConfirm.mockReturnValue(false);

      const { result } = renderHook(() => useDualModeEditor(mockConfig));
      const originalJsonData = result.current.jsonData;

      await act(async () => {
        await result.current.handleReset();
      });

      expect(mockConfirm).toHaveBeenCalled();
      expect(mockAxios.get).not.toHaveBeenCalled();
      expect(result.current.jsonData).toEqual(originalJsonData);

      mockConfirm.mockRestore();
    });
  });

  describe('Validation', () => {
    it('should validate data with custom validator', () => {
      renderHook(() => useDualModeEditor(mockConfig));

      // Test valid data
      expect(mockConfig.validator({ name: 'Valid', value: 10, active: true })).toBeNull();

      // Test empty name
      expect(mockConfig.validator({ name: '', value: 10, active: true })).toBe('Name is required');

      // Test negative value
      expect(mockConfig.validator({ name: 'Test', value: -1, active: true })).toBe('Value must be non-negative');
    });

    it('should clear validation error when data changes', () => {
      const { result } = renderHook(() => useDualModeEditor(mockConfig));

      // First, create a validation error by changing data
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
    it('should handle JSON mode save with editor data', async () => {
      mockAxios.post.mockResolvedValue({ data: 'Success' });

      const { result } = renderHook(() => useDualModeEditor(mockConfig));

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
      expect(mockAxios.post).toHaveBeenCalledWith('/api/test/save', jsonData);
    });

    it('should synchronize data when switching modes with modified data', () => {
      const { result } = renderHook(() => useDualModeEditor(mockConfig));

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

    it('should handle converter function errors gracefully', () => {
      const errorConfig = {
        ...mockConfig,
        jsonToUI: vi.fn().mockImplementation(() => {
          throw new Error('Conversion failed');
        }),
      };

      // Should not crash on initialization
      expect(() => {
        renderHook(() => useDualModeEditor(errorConfig));
      }).not.toThrow();
    });
  });
});