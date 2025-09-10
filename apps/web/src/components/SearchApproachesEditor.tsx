import { Refresh, Save } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
/* eslint-disable @typescript-eslint/use-unknown-in-catch-callback-variable */
/* eslint-disable no-alert */
import React, { useCallback, useEffect, useRef, useState } from 'react';

import MonacoJsonEditor, { MonacoJsonEditorHandle } from './MonacoJsonEditor';

type SearchApproachConfig = {
    id: string;
    filtered?: boolean;
    trim?: boolean;
    ignoreQuotes?: boolean;
    removeQuotes?: boolean;
    force?: boolean;
}

type SearchApproachesEditorProps = {
    readonly onSave?: (approaches: SearchApproachConfig[]) => void;
}

const SearchApproachesEditor: React.FC<SearchApproachesEditorProps> = ({ onSave }) => {
    const [jsonData, setJsonData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [validationError, setValidationError] = useState<string>('');
    const editorRef = useRef<MonacoJsonEditorHandle>(null);

    useEffect(() => {
        loadApproaches();
    }, []);

    const loadApproaches = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/plex/music-search-config/search-approaches');
            setJsonData(response.data);
        } catch (_error) {
            // Failed to load search approaches - error handled in snackbar above
            enqueueSnackbar('Failed to load search approaches', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const validateApproaches = (data: any): string | null => {
        if (!Array.isArray(data)) {
            return 'Configuration must be an array';
        }
        
        for (let i = 0; i < data.length; i++) {
            const approach = data[i];
            if (!approach) {
                return `Approach at index ${i} is null or undefined`;
            }
            
            if (typeof approach !== 'object') {
                return `Approach at index ${i} must be an object`;
            }
            
            if (!approach.id || typeof approach.id !== 'string') {
                return `Approach at index ${i} must have an 'id' string property`;
            }

            // All other properties are optional booleans
            const optionalBoolProps = ['filtered', 'trim', 'ignoreQuotes', 'removeQuotes', 'force'];

            for (const prop of optionalBoolProps) {
                if (approach[prop] !== undefined && typeof approach[prop] !== 'boolean') {
                    return `Approach at index ${i}: property '${prop}' must be a boolean if present`;
                }
            }
            
            // Check for unknown properties
            const validProps = new Set(['id', ...optionalBoolProps]);
            const unknownProps = Object.keys(approach).filter(prop => !validProps.has(prop));
            if (unknownProps.length > 0) {
                return `Approach at index ${i} has unknown properties: ${unknownProps.join(', ')}`;
            }
        }
        
        return null; // Valid
    };

    const handleSave = useCallback(async () => {
        // Get current content directly from Monaco editor
        const currentData = editorRef.current?.getCurrentValue();
        
        if (!currentData) {
            enqueueSnackbar('No valid JSON data to save', { variant: 'error' });

            return;
        }

        // Do validation only on save
        const validationErrorMsg = validateApproaches(currentData);
        if (validationErrorMsg) {
            setValidationError(validationErrorMsg);
            enqueueSnackbar(`Validation Error: ${validationErrorMsg}`, { variant: 'error' });

            return;
        }

        setValidationError('');

        try {
            await axios.post('/api/plex/music-search-config/search-approaches', currentData);
            enqueueSnackbar('Search approaches saved successfully', { variant: 'success' });
            
            if (onSave) {
                onSave(currentData);
            }
        } catch (_error) {
            const message = _error instanceof Error ? _error.message : 'Failed to save';
            enqueueSnackbar(`Failed to save: ${message}`, { variant: 'error' });
        }
    }, [onSave]);

    const handleReset = useCallback(async () => {
        if (confirm('Reset to default search approaches? This will overwrite your current configuration.')) {
            await loadApproaches();
            setValidationError('');
        }
    }, []);

    const handleChange = useCallback((newValue: any) => {
        setJsonData(newValue);
        setValidationError(''); // Clear validation error when user types
    }, []);

    // Wrapper functions to handle promises properly for onClick
    const handleSaveClick = useCallback(() => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        handleSave();
    }, [handleSave]);

    const handleResetClick = useCallback(() => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        handleReset();
    }, [handleReset]);

    if (loading) {
        return (
            <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography>
                    Loading search approaches...
                </Typography>
            </Box>
        );
    }

    // JSON Schema for search approaches
    const searchApproachesSchema = {
        type: 'array',
        items: {
            type: 'object',
            properties: {
                id: {
                    type: 'string',
                    description: 'Unique identifier for this search approach'
                },
                filtered: {
                    type: 'boolean',
                    description: 'Whether to apply text filtering'
                },
                trim: {
                    type: 'boolean',
                    description: 'Whether to trim whitespace'
                },
                ignoreQuotes: {
                    type: 'boolean',
                    description: 'Whether to ignore quotes during matching'
                },
                removeQuotes: {
                    type: 'boolean',
                    description: 'Whether to remove quotes from text'
                },
                force: {
                    type: 'boolean',
                    description: 'Whether to force this approach'
                }
            },
            required: ['id'],
            additionalProperties: false
        }
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">
                    Search Approaches Configuration
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button onClick={handleResetClick} variant="outlined" size="small" startIcon={<Refresh />}>
                        Reset to Defaults
                    </Button>
                    <Button onClick={handleSaveClick} variant="contained" size="small" startIcon={<Save />}>
                        Save Approaches
                    </Button>
                </Box>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Configure search approaches as a unified list. Each approach represents a different strategy for searching and matching music. 
                Approaches are tried in order until matches are found.
            </Typography>

            {/* Monaco JSON Editor */}
            <MonacoJsonEditor ref={editorRef} value={jsonData} onChange={handleChange} schema={searchApproachesSchema} height={400} error={validationError} />
        </Box>
    );
};

export default SearchApproachesEditor;