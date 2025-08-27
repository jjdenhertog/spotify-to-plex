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
    const [jsonContent, setJsonContent] = useState('');
    const [jsonError, setJsonError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadApproaches();
    }, []);

    const loadApproaches = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/plex/music-search-config/search-approaches');
            setJsonContent(JSON.stringify(response.data, null, 2));
            setJsonError('');
        } catch (error) {
            console.error('Failed to load search approaches:', error);
            enqueueSnackbar('Failed to load search approaches', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const approaches = JSON.parse(jsonContent);
            
            // Basic validation
            if (!Array.isArray(approaches)) {
                throw new Error('Configuration must be an array');
            }
            
            for (const approach of approaches) {
                if (!approach.id || typeof approach.id !== 'string') {
                    throw new Error('Each approach must have an id string');
                }

                // All other properties are optional booleans
                const optionalBoolProps = ['filtered', 'trim', 'ignoreQuotes', 'removeQuotes', 'force'];

                for (const prop of optionalBoolProps) {
                    if (approach[prop] !== undefined && typeof approach[prop] !== 'boolean') {
                        throw new Error(`Property ${prop} must be a boolean if present`);
                    }
                }
            }
            
            await axios.post('/api/plex/music-search-config/search-approaches', approaches);
            enqueueSnackbar('Search approaches saved successfully', { variant: 'success' });
            setJsonError('');
            
            if (onSave) {
                onSave(approaches);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Invalid JSON format';
            setJsonError(message);
            enqueueSnackbar(`Failed to save: ${message}`, { variant: 'error' });
        }
    };

    const handleReset = async () => {
        if (confirm('Reset to default search approaches? This will overwrite your current configuration.')) {
            await loadApproaches();
        }
    };

    if (loading) {
        return (
            <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography>Loading search approaches...</Typography>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Code />
                    <Typography variant="h6">Search Approaches Configuration</Typography>
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
                Configure search approaches as a unified list. Each approach represents a different strategy for searching and matching music.
                Approaches are tried in order until matches are found.
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

            <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                    <strong>Configuration Structure:</strong><br />
                    • Each approach is an object with required <code>id</code> (string)<br />
                    • Optional boolean flags: <code>filtered</code>, <code>trim</code>, <code>ignoreQuotes</code>, <code>removeQuotes</code>, <code>force</code><br />
                    • Approaches are executed in the order they appear in the array<br />
                    • The unified list eliminates platform-specific differentiation
                </Typography>
            </Alert>

            <Alert severity="warning">
                <Typography variant="body2">
                    <strong>Breaking Change:</strong> This unified approach list replaces the previous platform-specific 
                    Plex/Tidal separation. All search approaches now work universally across platforms, 
                    simplifying configuration and maintenance.
                </Typography>
            </Alert>
        </Box>
    );
};

export default SearchApproachesEditor;