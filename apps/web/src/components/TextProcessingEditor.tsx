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
import { errorBoundary } from '@/helpers/errors/errorBoundary';
import MonacoJsonEditor, { MonacoJsonEditorHandle } from './MonacoJsonEditor';

type TextProcessingConfig = {
    filterOutWords: string[];
    filterOutQuotes: string[];
    cutOffSeparators: string[];
    processing: {
        filtered: boolean;
        cutOffSeperators: boolean;
        removeQuotes: boolean;
    };
}

type TextProcessingEditorProps = {
    readonly onSave?: (config: TextProcessingConfig) => void;
}

const TextProcessingEditor: React.FC<TextProcessingEditorProps> = ({ onSave }) => {
    const [jsonData, setJsonData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [validationError, setValidationError] = useState<string>('');
    const editorRef = useRef<MonacoJsonEditorHandle>(null);

    const loadConfig = useCallback(async () => {
        errorBoundary(async () => {
            setLoading(true);
            const response = await axios.get('/api/plex/music-search-config/text-processing');
            setJsonData(response.data);
            setLoading(false);
        }, () => {
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        loadConfig();
    }, [loadConfig]);

    const validateConfig = (data: any): string | null => {
        if (!data || typeof data !== 'object') {
            return 'Configuration must be an object';
        }
        
        if (!Array.isArray(data.filterOutWords)) {
            return 'filterOutWords must be an array of strings';
        }
        
        if (!Array.isArray(data.filterOutQuotes)) {
            return 'filterOutQuotes must be an array of strings';
        }
        
        if (!Array.isArray(data.cutOffSeparators)) {
            return 'cutOffSeparators must be an array of strings';
        }
        
        if (!data.processing || typeof data.processing !== 'object') {
            return 'processing must be an object';
        }
        
        const { processing } = data;
        if (typeof processing.filtered !== 'boolean' ||
            typeof processing.cutOffSeperators !== 'boolean' ||
            typeof processing.removeQuotes !== 'boolean') {
            return 'processing properties (filtered, cutOffSeperators, removeQuotes) must be booleans';
        }
        
        // Validate array contents
        const { filterOutWords, filterOutQuotes, cutOffSeparators } = data;
        if (!filterOutWords.every((word: any) => typeof word === 'string')) {
            return 'All items in filterOutWords must be strings';
        }
        
        if (!filterOutQuotes.every((quote: any) => typeof quote === 'string')) {
            return 'All items in filterOutQuotes must be strings';
        }
        
        if (!cutOffSeparators.every((sep: any) => typeof sep === 'string')) {
            return 'All items in cutOffSeparators must be strings';
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
        const validationErrorMsg = validateConfig(currentData);
        if (validationErrorMsg) {
            setValidationError(validationErrorMsg);
            enqueueSnackbar(`Validation Error: ${validationErrorMsg}`, { variant: 'error' });

            return;
        }

        setValidationError('');

        try {
            await axios.post('/api/plex/music-search-config/text-processing', currentData);
            enqueueSnackbar('Text processing configuration saved successfully', { variant: 'success' });
            
            if (onSave) {
                onSave(currentData);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to save';
            enqueueSnackbar(`Failed to save: ${message}`, { variant: 'error' });
        }
    }, [onSave]);

    const handleReset = useCallback(async () => {
        if (confirm('Reset to default text processing configuration? This will overwrite your current settings.')) {
            await loadConfig();
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
                <Typography>Loading text processing configuration...</Typography>
            </Box>
        );
    }

    // JSON Schema for text processing
    const textProcessingSchema = {
        type: 'object',
        properties: {
            filterOutWords: {
                type: 'array',
                items: { type: 'string' },
                description: 'Words to remove from track titles'
            },
            filterOutQuotes: {
                type: 'array',
                items: { type: 'string' },
                description: 'Quote characters to remove from track titles'
            },
            cutOffSeparators: {
                type: 'array',
                items: { type: 'string' },
                description: 'Separators that indicate where to cut off text'
            },
            processing: {
                type: 'object',
                properties: {
                    filtered: {
                        type: 'boolean',
                        description: 'Enable filtering out words'
                    },
                    cutOffSeperators: {
                        type: 'boolean',
                        description: 'Enable cutting off at separators (note: typo preserved for compatibility)'
                    },
                    removeQuotes: {
                        type: 'boolean',
                        description: 'Enable removing quote characters'
                    }
                },
                required: ['filtered', 'cutOffSeperators', 'removeQuotes'],
                additionalProperties: false
            }
        },
        required: ['filterOutWords', 'filterOutQuotes', 'cutOffSeparators', 'processing'],
        additionalProperties: false
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Text Processing Configuration</Typography>
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
                        Save Configuration
                    </Button>
                </Box>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Configure how text is processed before matching. This includes word filtering, quote removal, and separator handling.
            </Typography>

            {/* Monaco JSON Editor */}
            <MonacoJsonEditor
                ref={editorRef}
                value={jsonData}
                onChange={handleChange}
                schema={textProcessingSchema}
                height={400}
                error={validationError}
            />

            <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                    <strong>Configuration Structure:</strong><br />
                    • <code>filterOutWords</code>: Array of words to remove from titles<br />
                    • <code>filterOutQuotes</code>: Array of quote characters to remove<br />
                    • <code>cutOffSeparators</code>: Array of separators that cut off text<br />
                    • <code>processing</code>: Boolean flags for enabling each processing step<br />
                    • Note: <code>cutOffSeperators</code> typo is preserved for backward compatibility
                </Typography>
            </Alert>
        </Box>
    );
};

export default TextProcessingEditor;