import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Box,
    Typography,
    Alert,
    Button
} from '@mui/material';
import { Save, Refresh } from '@mui/icons-material';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
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

    useEffect(() => {
        loadFilters();
    }, []);

    const loadFilters = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/plex/music-search-config/match-filters');
            setJsonData(response.data);
        } catch (error) {
            console.error('Failed to load match filters:', error);
            enqueueSnackbar('Failed to load match filters', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

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

        try {
            await axios.post('/api/plex/music-search-config/match-filters', currentData);
            enqueueSnackbar('Match filters saved successfully', { variant: 'success' });
            
            if (onSave) {
                onSave(currentData);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to save';
            enqueueSnackbar(`Failed to save: ${message}`, { variant: 'error' });
        }
    }, [onSave]);

    const handleReset = useCallback(async () => {
        if (confirm('Reset to default match filters? This will overwrite your current configuration.')) {
            await loadFilters();
            setValidationError('');
        }
    }, []);

    const handleChange = useCallback((newValue: any) => {
        setJsonData(newValue);
        setValidationError(''); // Clear validation error when user types
    }, []);

    // Wrapper functions to handle promises properly for onClick
    const handleSaveClick = useCallback(() => {
        handleSave().catch(console.error);
    }, [handleSave]);

    const handleResetClick = useCallback(() => {
        handleReset().catch(console.error);
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
                Configure match filters as function strings. Each filter should have a 'reason' and 'filter' property. 
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

            <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                    <strong>Filter Structure:</strong><br />
                    • Each filter is an object with <code>reason</code> (string) and <code>filter</code> (function string)<br />
                    • Function strings should start with <code>(item) =&gt;</code><br />
                    • Available properties: <code>item.matching.artist</code>, <code>item.matching.title</code>, <code>item.matching.album</code><br />
                    • Each has <code>.match</code>, <code>.contains</code>, and <code>.similarity</code> properties
                </Typography>
            </Alert>
        </Box>
    );
};

export default MatchFilterEditor;