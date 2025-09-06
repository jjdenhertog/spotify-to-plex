/**
 * @file useDualModeEditor.test.ts
 * @description Simple tests for the useDualModeEditor hook
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDualModeEditor } from '../../src/hooks/useDualModeEditor';

const mockConfig = {
    loadEndpoint: '/api/test/load',
    saveEndpoint: '/api/test/save',
    validator: vi.fn(() => null),
    jsonToUI: vi.fn((json: any) => ({ display: json.name })),
    uiToJSON: vi.fn((ui: any) => ({ name: ui.display })),
    initialData: { name: 'test' },
};

describe('useDualModeEditor Hook', () => {
    it('should initialize with default state', () => {
        const { result } = renderHook(() => useDualModeEditor(mockConfig));

        expect(result.current.viewMode).toBe('ui');
        expect(result.current.jsonData).toEqual(mockConfig.initialData);
        expect(result.current.editorRef).toBeDefined();
    });

    it('should switch view modes', () => {
        const { result } = renderHook(() => useDualModeEditor(mockConfig));

        act(() => {
            result.current.handleViewModeChange({} as any, 'json');
        });

        expect(result.current.viewMode).toBe('json');
    });

    it('should update data when changed', () => {
        const { result } = renderHook(() => useDualModeEditor(mockConfig));

        const newData = { name: 'updated' };
        act(() => {
            result.current.handleJSONDataChange(newData);
        });

        expect(result.current.jsonData).toEqual(newData);
    });
});