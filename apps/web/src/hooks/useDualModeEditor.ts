import { useState, useCallback } from 'react'

// Placeholder for shared dual-mode editor logic
// This will be implemented in Task 2
export function useDualModeEditor() {
    const [viewMode, setViewMode] = useState<'ui' | 'json'>('ui')
    
    const handleViewModeChange = useCallback(() => {
        setViewMode(prev => prev === 'ui' ? 'json' : 'ui')
    }, [])
    
    return {
        viewMode,
        handleViewModeChange
    }
}