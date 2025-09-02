/* eslint-disable no-alert */
import { errorBoundary } from '@/helpers/errors/errorBoundary';
import { Refresh, Save, TableChart, Code } from '@mui/icons-material';
import { 
    Box, 
    Button, 
    Typography, 
    ToggleButtonGroup, 
    ToggleButton,
    Paper,
    Divider 
} from '@mui/material';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
/* eslint-disable no-console */
import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';

import MonacoJsonEditor, { MonacoJsonEditorHandle } from './MonacoJsonEditor';
import TableEditor from './TableEditor';
import { MatchFilterRule, ViewMode } from '../types/MatchFilterTypes';

type MatchFilterConfig = {
    reason: string;
    filter: string;
}

type MatchFilterEditorProps = {
    readonly onSave?: (filters: MatchFilterConfig[]) => void;
}

const MatchFilterEditor: React.FC<MatchFilterEditorProps> = ({ onSave }) => {
    const [jsonData, setJsonData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [validationError, setValidationError] = useState<string>('');
    const [viewMode, setViewMode] = useState<ViewMode>('ui');
    const editorRef = useRef<MonacoJsonEditorHandle>(null);

    // Convert loaded data to expression format for UI
    const convertToExpressionFormat = useCallback((data: any[]): MatchFilterRule[] => {
        return data.map((filter) => typeof filter === 'string' ? filter : filter.expression || 'artist:match');
    }, []);

    const loadFilters = useCallback(async () => {
        errorBoundary(async () => {
            setLoading(true);
            const response = await axios.get('/api/plex/music-search-config/match-filters');
            setJsonData(response.data);
            setLoading(false);
        }, () => {
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        loadFilters();
    }, [loadFilters]);

    // Convert data for UI mode
    const expressionFilters = useMemo(() => {
        if (!jsonData) return [];

        return convertToExpressionFormat(jsonData);
    }, [jsonData, convertToExpressionFormat]);

    const validateFilters = (data: any): string | null => {
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
    };

    const handleSave = useCallback(async () => {
        errorBoundary(async () => {
            let currentData: any;

            if (viewMode === 'json') {
                // Get current content directly from Monaco editor
                currentData = editorRef.current?.getCurrentValue?.();
            } else {
                // Use expression format directly
                currentData = expressionFilters;
            }
            
            if (!currentData) {
                enqueueSnackbar('No valid data to save', { variant: 'error' });

                return;
            }

            // Do validation only on save
            const validationErrorMsg = validateFilters(currentData);
            if (validationErrorMsg) {
                setValidationError(validationErrorMsg);
                enqueueSnackbar(`Validation Error: ${validationErrorMsg}`, { variant: 'error' });

                return;
            }

            setValidationError('');
            await axios.post('/api/plex/music-search-config/match-filters', currentData);
            enqueueSnackbar('Match filters saved successfully', { variant: 'success' });
            
            // Update local state with saved data
            setJsonData(currentData);
            
            if (onSave) {
                onSave(currentData);
            }
        });
    }, [viewMode, expressionFilters, onSave]);

    const handleReset = useCallback(async () => {
        if (confirm('Reset to default match filters? This will overwrite your current configuration.')) {
            errorBoundary(async () => {
                await loadFilters();
                setValidationError('');
            });
        }
    }, [loadFilters]);

    const handleJsonChange = useCallback((newValue: any) => {
        setJsonData(newValue);
        setValidationError(''); // Clear validation error when user types
    }, []);

    const handleTableChange = useCallback((newFilters: MatchFilterRule[]) => {
        // Update jsonData with the new expression format
        setJsonData(newFilters);
        setValidationError('');
    }, []);

    const handleViewModeChange = useCallback((_event: React.MouseEvent<HTMLElement>, newMode: ViewMode | null) => {
        if (newMode) {
            setViewMode(newMode);
        }
    }, []);

    // Wrapper functions to handle promises properly for onClick
    const handleSaveClick = useCallback(() => {
        handleSave().catch((error: unknown) => console.error(error));
    }, [handleSave]);

    const handleResetClick = useCallback(() => {
        handleReset().catch((error: unknown) => console.error(error));
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
            <Box
                sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    mb: 3,
                    p: 2,
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider'
                }}>
                <Typography variant="h6" sx={{ color: 'text.primary' }}>
                    Match Filters Configuration
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    {/* View Mode Toggle */}
                    <ToggleButtonGroup value={viewMode} exclusive onChange={handleViewModeChange} size="small">
                        <ToggleButton value="ui">
                            <TableChart fontSize="small" sx={{ mr: 1 }} />
                            UI Mode
                        </ToggleButton>
                        <ToggleButton value="json">
                            <Code fontSize="small" sx={{ mr: 1 }} />
                            JSON Mode
                        </ToggleButton>
                    </ToggleButtonGroup>

                    <Divider orientation="vertical" flexItem />

                    {/* Action Buttons */}
                    <Button onClick={handleResetClick} variant="outlined" size="small" startIcon={<Refresh />}>
                        Reset to Defaults
                    </Button>
                    <Button onClick={handleSaveClick} variant="contained" size="small" startIcon={<Save />}>
                        Save Filters
                    </Button>
                </Box>
            </Box>
            
            {/* Mode-specific descriptions */}
            {viewMode === 'ui' ? (
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
                {viewMode === 'ui' ? (
                    <Box sx={{ p: 2 }}>
                        <TableEditor filters={expressionFilters} onChange={handleTableChange} />
                    </Box>
                ) : (
                    <MonacoJsonEditor ref={editorRef} value={jsonData} onChange={handleJsonChange} schema={matchFilterSchema} height={500} error={validationError} />
                )}
            </Paper>

        </Box>
    );
};

export default MatchFilterEditor;