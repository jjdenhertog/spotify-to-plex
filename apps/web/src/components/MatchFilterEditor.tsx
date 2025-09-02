/* eslint-disable no-alert */
import { 
    Box, 
    Typography, 
    Paper
} from '@mui/material';
/* eslint-disable no-console */
import React, { useCallback, useEffect } from 'react';

import EditorHeader from './EditorHeader';
import MonacoJsonEditor from './MonacoJsonEditor';
import TableEditor from './TableEditor';
import { MatchFilterRule } from '../types/MatchFilterTypes';
import { useDualModeEditor } from '../hooks/useDualModeEditor';

type MatchFilterConfig = {
    reason: string;
    filter: string;
}

type MatchFilterEditorProps = {
    readonly onSave?: (filters: MatchFilterConfig[]) => void;
}

const MatchFilterEditor: React.FC<MatchFilterEditorProps> = ({ onSave }) => {
    // Define conversion functions for the useDualModeEditor hook
    const jsonToUI = useCallback((data: MatchFilterRule[]): MatchFilterRule[] => {
        if (!Array.isArray(data)) return [];

        return data.map((filter) => typeof filter === 'string' ? filter : (filter as any).expression || 'artist:match');
    }, []);

    const uiToJSON = useCallback((data: MatchFilterRule[]): MatchFilterRule[] => {
        return data;
    }, []);

    // Validation function
    const validateFilters = useCallback((data: any): string | null => {
        if (!Array.isArray(data)) {
            return 'Configuration must be an array';
        }
        
        for (let i = 0; i < data.length; i++) {
            const filter = data[i];
            if (!filter) {
                return `Filter at index ${i} is null or undefined`;
            }
            
            if (typeof filter !== 'string') {
                return `Filter at index ${i} must be a string expression`;
            }

            // Basic expression validation - allow optional operations
            const validFieldPattern = /^(artist|title|album|artistWithTitle|artistInTitle)(:(match|contains|similarity>=\d*\.?\d+))?((\s+(AND|OR)\s+(artist|title|album|artistWithTitle|artistInTitle)(:(match|contains|similarity>=\d*\.?\d+))?))*$/;
            if (!validFieldPattern.test(filter.trim())) {
                return `Filter at index ${i}: invalid expression format`;
            }
        }
        
        return null; // Valid
    }, []);

    // Use the dual mode editor hook
    const {
        viewMode,
        jsonData,
        uiData,
        loading,
        validationError,
        editorRef,
        loadData,
        handleSave,
        handleReset,
        handleViewModeChange,
        handleUIDataChange,
        handleJSONDataChange
    } = useDualModeEditor<MatchFilterRule[], MatchFilterRule[]>({
        loadEndpoint: '/api/plex/music-search-config/match-filters',
        saveEndpoint: '/api/plex/music-search-config/match-filters',
        validator: validateFilters,
        jsonToUI,
        uiToJSON,
        initialData: []
    });

    // Load data on component mount
    useEffect(() => {
        loadData();
    }, [loadData]);

    // Custom save handler that includes onSave callback
    const handleSaveWithCallback = useCallback(() => {
        handleSave();
        if (onSave) {
            const currentData = viewMode === 'json' ? jsonData : uiData;
            onSave(currentData as unknown as MatchFilterConfig[]);
        }
    }, [handleSave, onSave, viewMode, jsonData, uiData]);

    // Wrapper functions to handle promises properly for onClick
    const handleSaveClick = useCallback(() => {
        handleSaveWithCallback();
    }, [handleSaveWithCallback]);

    const handleResetClick = useCallback(() => {
        handleReset();
    }, [handleReset]);

    if (loading) {
        return (
            <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography>
                    Loading match filters...
                </Typography>
            </Box>
        );
    }

    // JSON Schema for match filters
    const matchFilterSchema = {
        type: 'array',
        items: {
            type: 'string',
            description: 'Expression string using simplified syntax (e.g., "artist:match AND title:contains")',
            pattern: String.raw`^(artist|title|album|artistWithTitle|artistInTitle):(match|contains|similarity>=\d*\.?\d+)(\s+(AND|OR)\s+(artist|title|album|artistWithTitle|artistInTitle):(match|contains|similarity>=\d*\.?\d+))*$`
        }
    };

    return (
        <Box>
            {/* Header */}
            <EditorHeader title="Match Filters Configuration" viewMode={viewMode} onViewModeChange={handleViewModeChange} onSave={handleSaveClick} onReset={handleResetClick} disabled={loading} />
            
            {/* Mode-specific descriptions */}
            {!!viewMode && viewMode === 'ui' ? (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Add filter expressions to match tracks. Filters are evaluated in order - the first matching filter wins.
                </Typography>
            ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Edit raw JSON for advanced configurations. Each filter should have a &apos;reason&apos; and &apos;expression&apos; property. 
                    Filters are evaluated in order - the first matching filter wins.
                </Typography>
            )}

            {/* Content based on view mode */}
            <Paper variant="outlined" sx={{ p: 0 }}>
                {!!viewMode && viewMode === 'ui' ? (
                    <Box sx={{ p: 2 }}>
                        <TableEditor filters={uiData} onChange={handleUIDataChange} />
                    </Box>
                ) : (
                    <MonacoJsonEditor ref={editorRef} value={jsonData} onChange={handleJSONDataChange} schema={matchFilterSchema} height={500} error={validationError} />
                )}
            </Paper>

        </Box>
    );
};

export default MatchFilterEditor;