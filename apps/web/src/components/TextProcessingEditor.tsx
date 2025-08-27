import React, { useState, useEffect } from 'react';
import {
    Box,
    TextField,
    Typography,
    Alert,
    Button
} from '@mui/material';
import { Code, Refresh } from '@mui/icons-material';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';

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
    const [jsonContent, setJsonContent] = useState('');
    const [jsonError, setJsonError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/plex/music-search-config/text-processing');
            setJsonContent(JSON.stringify(response.data, null, 2));
            setJsonError('');
        } catch (error) {
            console.error('Failed to load text processing config:', error);
            enqueueSnackbar('Failed to load text processing config', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const config = JSON.parse(jsonContent);
            
            // Basic validation
            if (!config || typeof config !== 'object') {
                throw new Error('Configuration must be an object');
            }
            
            if (!Array.isArray(config.filterOutWords) || 
                !Array.isArray(config.filterOutQuotes) || 
                !Array.isArray(config.cutOffSeparators)) {
                throw new Error('filterOutWords, filterOutQuotes, and cutOffSeparators must be arrays');
            }
            
            if (!config.processing || 
                typeof config.processing.filtered !== 'boolean' ||
                typeof config.processing.cutOffSeperators !== 'boolean' ||
                typeof config.processing.removeQuotes !== 'boolean') {
                throw new Error('processing must be an object with boolean properties');
            }
            
            await axios.post('/api/plex/music-search-config/text-processing', config);
            enqueueSnackbar('Text processing configuration saved successfully', { variant: 'success' });
            setJsonError('');
            
            if (onSave) {
                onSave(config);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Invalid JSON format';
            setJsonError(message);
            enqueueSnackbar(`Failed to save: ${message}`, { variant: 'error' });
        }
    };

    const handleReset = async () => {
        if (confirm('Reset to default text processing configuration? This will overwrite your current settings.')) {
            await loadConfig();
        }
    };

    if (loading) {
        return (
            <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography>Loading text processing configuration...</Typography>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Code />
                    <Typography variant="h6">Text Processing Configuration</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        onClick={handleReset}
                        variant="outlined"
                        size="small"
                        startIcon={<Refresh />}
                    >
                        Reset
                    </Button>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        size="small"
                    >
                        Save
                    </Button>
                </Box>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Configure how text is processed before matching. This includes word filtering, quote removal, and separator handling.
            </Typography>

            <TextField
                fullWidth
                multiline
                rows={15}
                value={jsonContent}
                onChange={(e) => setJsonContent(e.target.value)}
                variant="outlined"
                sx={{
                    mb: 2,
                    '& .MuiInputBase-input': {
                        fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                        fontSize: '0.875rem',
                        lineHeight: 1.5
                    }
                }}
                placeholder="Loading..."
            />

            {jsonError ? <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="body2">
                    <strong>JSON Error:</strong> {jsonError}
                </Typography>
            </Alert> : null}

            <Alert severity="info">
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