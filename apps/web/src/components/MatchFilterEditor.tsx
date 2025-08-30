/* eslint-disable no-alert */
import { errorBoundary } from '@/helpers/errors/errorBoundary';
import { Refresh, Save } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
/* eslint-disable no-console */
import React, { useCallback, useEffect, useRef, useState } from 'react';

import MonacoJsonEditor, { MonacoJsonEditorHandle } from './MonacoJsonEditor';

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
    const editorRef = useRef<MonacoJsonEditorHandle>(null);

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
            
            if (!filter.reason || !filter.filter) {
                return `Filter at index ${i} must have both 'reason' and 'filter' properties`;
            }

            if (typeof filter.reason !== 'string' || typeof filter.filter !== 'string') {
                return `Filter at index ${i}: both 'reason' and 'filter' must be strings`;
            }

            // Basic function string validation
            if (!filter.filter.includes('=>') && !filter.filter.startsWith('function')) {
                return `Filter at index ${i}: 'filter' should be a function string (e.g., "(item) => ...")`;
            }
        }
        
        return null; // Valid
    };

    const handleSave = useCallback(async () => {
        errorBoundary(async () => {
            // Get current content directly from Monaco editor
            const currentData = editorRef.current?.getCurrentValue?.();
            
            if (!currentData) {
                enqueueSnackbar('No valid JSON data to save', { variant: 'error' });

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
            
            if (onSave) {
                onSave(currentData);
            }
        });
    }, [onSave]);

    const handleReset = useCallback(async () => {
        if (confirm('Reset to default match filters? This will overwrite your current configuration.')) {
            errorBoundary(async () => {
                await loadFilters();
                setValidationError('');
            });
        }
    }, [loadFilters]);

    const handleChange = useCallback((newValue: any) => {
        setJsonData(newValue);
        setValidationError(''); // Clear validation error when user types
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
                <Typography>Loading match filters...</Typography>
            </Box>
        );
    }

    // JSON Schema for match filters
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
                }
            },
            required: ['reason', 'filter'],
            additionalProperties: false
        }
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Match Filters Configuration</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        onClick={handleResetClick}
                        variant="outlined"
                        size="small"
                        startIcon={<Refresh />}
                    >
                        Reset to Defaults
                    </Button>
                    <Button
                        onClick={handleSaveClick}
                        variant="contained"
                        size="small"
                        startIcon={<Save />}
                    >
                        Save Filters
                    </Button>
                </Box>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Configure match filters as function strings. Each filter should have a &apos;reason&apos; and &apos;filter&apos; property. 
                Filters are evaluated in order - the first matching filter wins.
            </Typography>

            {/* Monaco JSON Editor */}
            <MonacoJsonEditor
                ref={editorRef}
                value={jsonData}
                onChange={handleChange}
                schema={matchFilterSchema}
                height={500}
                error={validationError}
            />

        </Box>
    );
};

export default MatchFilterEditor;