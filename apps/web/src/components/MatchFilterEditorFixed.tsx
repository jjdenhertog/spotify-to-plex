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

    // Convert legacy filter to new expression format (simplified for now)
    const convertLegacyToExpression = useCallback((filter: string): string => {
        // This is a simplified converter - in practice, you'd want a more robust parser
        if (filter.includes('artist.match') && filter.includes('title.match')) {
            return 'artist:match AND title:match';
        }
        if (filter.includes('artist.match') && filter.includes('title.contains')) {
            return 'artist:match AND title:contains';
        }
        if (filter.includes('artist.contains') && filter.includes('title.match')) {
            return 'artist:contains AND title:match';
        }
        if (filter.includes('artist.similarity') && filter.includes('title.similarity')) {
            // Extract similarity threshold (simplified)
            const threshold = filter.match(/>=\\s*(0\\.\\d+)/)?.[1] || '0.8';
            return `artist:similarity>=${threshold} AND title:similarity>=${threshold}`;
        }
        // Fallback to a basic expression
        return 'artist:match';
    }, []);

    // Convert between legacy format and new expression format
    const convertToExpressionFormat = useCallback((data: MatchFilterConfig[]): MatchFilterRule[] => {
        return data.map((filter) => ({
            reason: filter.reason,
            expression: convertLegacyToExpression(filter.filter),
            enabled: true
        }));
    }, [convertLegacyToExpression]);

    // Convert back to legacy format for saving
    const convertToLegacyFormat = useCallback((filters: MatchFilterRule[]): MatchFilterConfig[] => {
        return filters.map(filter => {
            // Convert expression back to function string (simplified)
            let functionString = '';
            if (filter.expression.includes('artist:match') && filter.expression.includes('title:match')) {
                functionString = '(item) => item.matching.artist.match && item.matching.title.match';
            } else if (filter.expression.includes('artist:match') && filter.expression.includes('title:contains')) {
                functionString = '(item) => item.matching.artist.match && item.matching.title.contains';
            } else if (filter.expression.includes('artist:contains') && filter.expression.includes('title:match')) {
                functionString = '(item) => item.matching.artist.contains && item.matching.title.match';
            } else {
                // Fallback
                functionString = '(item) => item.matching.artist.match';
            }

            return {
                reason: filter.reason,
                filter: functionString
            };
        });
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
            
            if (typeof filter !== 'object') {
                return `Filter at index ${i} must be an object`;
            }
            
            if (!filter.reason || (!filter.filter && !filter.expression)) {
                return `Filter at index ${i} must have both 'reason' and 'filter' (or 'expression') properties`;
            }

            if (typeof filter.reason !== 'string') {
                return `Filter at index ${i}: 'reason' must be a string`;
            }

            // Validate based on format
            if (filter.filter) {
                if (typeof filter.filter !== 'string') {
                    return `Filter at index ${i}: 'filter' must be a string`;
                }
                // Basic function string validation
                if (!filter.filter.includes('=>') && !filter.filter.startsWith('function')) {
                    return `Filter at index ${i}: 'filter' should be a function string (e.g., "(item) => ...")`;
                }
            } else if (filter.expression) {
                if (typeof filter.expression !== 'string') {
                    return `Filter at index ${i}: 'expression' must be a string`;
                }
                // Basic expression validation
                const validFieldPattern = /^(artist|title|album|artistWithTitle|artistInTitle):(match|contains|similarity>=\\d*\\.?\\d+)(\\s+(AND|OR)\\s+(artist|title|album|artistWithTitle|artistInTitle):(match|contains|similarity>=\\d*\\.?\\d+))*$/;
                if (!validFieldPattern.test(filter.expression.trim())) {
                    return `Filter at index ${i}: invalid expression format`;
                }
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
                // Convert UI data back to legacy format
                currentData = convertToLegacyFormat(expressionFilters);
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
    }, [viewMode, expressionFilters, convertToLegacyFormat, onSave]);

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
        // Convert back to legacy format and update jsonData
        const legacyData = convertToLegacyFormat(newFilters);
        setJsonData(legacyData);
        setValidationError('');
    }, [convertToLegacyFormat]);

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

    // JSON Schema for match filters (updated to support both formats)
    const matchFilterSchema = {
        type: 'array',
        items: {
            type: 'object',
            properties: {
                reason: {
                    type: 'string',
                    description: 'Description of why this filter should match'
                },
                filter: {
                    type: 'string',
                    description: 'Function string that returns true/false for matching items'
                },
                expression: {
                    type: 'string',
                    description: 'Expression string using simplified syntax (e.g., "artist:match AND title:contains")'
                },
                enabled: {
                    type: 'boolean',
                    description: 'Whether this filter is enabled'
                }
            },
            required: ['reason'],
            anyOf: [
                { required: ['filter'] },
                { required: ['expression'] }
            ],
            additionalProperties: false
        }
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">
                    Match Filters Configuration
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    {/* View Mode Toggle */}
                    <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={handleViewModeChange}
                        size="small"
                    >
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
                    Use the table editor for quick rule management. Drag rows to reorder priority.
                    Filters are evaluated in order - the first matching filter wins.
                </Typography>
            ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Edit raw JSON for advanced configurations. Each filter should have a 'reason' and 'filter' property. 
                    Filters are evaluated in order - the first matching filter wins.
                </Typography>
            )}

            {/* Content based on view mode */}
            <Paper variant="outlined" sx={{ p: 0 }}>
                {viewMode === 'ui' ? (
                    <Box sx={{ p: 2 }}>
                        <TableEditor 
                            filters={expressionFilters} 
                            onChange={handleTableChange}
                        />
                    </Box>
                ) : (
                    <MonacoJsonEditor 
                        ref={editorRef} 
                        value={jsonData} 
                        onChange={handleJsonChange} 
                        schema={matchFilterSchema} 
                        height={500} 
                        error={validationError} 
                    />
                )}
            </Paper>

            {/* Footer help */}
            <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                    <strong>UI Mode:</strong> Visual table editor with drag-and-drop reordering and inline expression editing.
                    <br />
                    <strong>JSON Mode:</strong> Direct JSON editing with schema validation for bulk operations and advanced scenarios.
                </Typography>
            </Box>
        </Box>
    );
};

export default MatchFilterEditor;