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

type MatchFilterConfig = {
    reason: string;
    filter: string;
}

type MatchFilterEditorProps = {
    readonly onSave?: (filters: MatchFilterConfig[]) => void;
}

const MatchFilterEditor: React.FC<MatchFilterEditorProps> = ({ onSave }) => {
    const [jsonContent, setJsonContent] = useState('');
    const [jsonError, setJsonError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFilters();
    }, []);

    const loadFilters = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/plex/music-search-config/match-filters');
            setJsonContent(JSON.stringify(response.data, null, 2));
            setJsonError('');
        } catch (error) {
            console.error('Failed to load match filters:', error);
            enqueueSnackbar('Failed to load match filters', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const filters = JSON.parse(jsonContent);
            
            // Basic validation
            if (!Array.isArray(filters)) {
                throw new Error('Configuration must be an array');
            }
            
            for (const filter of filters) {
                if (!filter.reason || !filter.filter) {
                    throw new Error('Each filter must have a reason and filter property');
                }

                if (typeof filter.reason !== 'string' || typeof filter.filter !== 'string') {
                    throw new Error('Reason and filter must be strings');
                }
            }
            
            await axios.post('/api/plex/music-search-config/match-filters', filters);
            enqueueSnackbar('Match filters saved successfully', { variant: 'success' });
            setJsonError('');
            
            if (onSave) {
                onSave(filters);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Invalid JSON format';
            setJsonError(message);
            enqueueSnackbar(`Failed to save: ${message}`, { variant: 'error' });
        }
    };

    const handleReset = async () => {
        if (confirm('Reset to default match filters? This will overwrite your current configuration.')) {
            await loadFilters();
        }
    };

    if (loading) {
        return (
            <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography>Loading match filters...</Typography>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Code />
                    <Typography variant="h6">Match Filters Configuration</Typography>
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
                Configure match filters as function strings. Each filter should have a <code>reason</code> and <code>filter</code> property.
                Filters are evaluated in order - the first matching filter wins.
            </Typography>

            <TextField
                fullWidth
                multiline
                rows={20}
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