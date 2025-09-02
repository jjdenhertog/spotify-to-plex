import { useState, useCallback } from 'react';

export type ViewMode = 'ui' | 'json';

interface DualModeEditorState {
    viewMode: ViewMode;
    toggleViewMode: () => void;
    setViewMode: (mode: ViewMode) => void;
}

/**
 * useDualModeEditor - Hook placeholder for dual-mode editor logic
 * This hook will manage the state and behavior for components that support both UI and JSON editing modes
 */
const useDualModeEditor = (initialMode: ViewMode = 'ui'): DualModeEditorState => {
    const [viewMode, setViewModeState] = useState<ViewMode>(initialMode);

    const toggleViewMode = useCallback(() => {
        setViewModeState(currentMode => currentMode === 'ui' ? 'json' : 'ui');
    }, []);

    const setViewMode = useCallback((mode: ViewMode) => {
        setViewModeState(mode);
    }, []);

    return {
        viewMode,
        toggleViewMode,
        setViewMode,
    };
};

export default useDualModeEditor;