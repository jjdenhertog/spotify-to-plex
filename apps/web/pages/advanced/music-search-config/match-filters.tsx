import { Box, Button, Card, CardContent, Paper, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material"
import { NextPage } from "next"
import MusicSearchConfigLayout from "@/components/layouts/MusicSearchConfigLayout"
import MonacoJsonEditor from "@/components/MonacoJsonEditor"
import TableEditor from "@/components/TableEditor"
import { errorBoundary } from "@/helpers/errors/errorBoundary"
import { MatchFilterRule } from "@/types/MatchFilterTypes"
import { Refresh, Save } from "@mui/icons-material"
import axios from "axios"
import { enqueueSnackbar } from "notistack"
import { useState, useCallback, useEffect } from "react"

type ViewMode = 'ui' | 'json';

const MatchFiltersPage: NextPage = () => {

    const [data, setData] = useState<MatchFilterRule[]>([]);
    const [loading, setLoading] = useState(false);
    const [validationError, setValidationError] = useState<string>('');
    const [viewMode, setViewMode] = useState<ViewMode>('ui');

    // Validation function
    const validateFilters = useCallback((data: any) => {
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

    const loadData = useCallback(async () => {
        errorBoundary(async () => {
            setLoading(true);
            const response = await axios.get('/api/plex/music-search-config/match-filters');
            setData(response.data);
            setLoading(false);
        }, () => {
            setLoading(false);
        });
    }, []);

    const saveData = useCallback(async () => {
        errorBoundary(async () => {
            const validationErrorMsg = validateFilters(data);
            if (validationErrorMsg) {
                setValidationError(validationErrorMsg);
                enqueueSnackbar(`Validation Error: ${validationErrorMsg}`, { variant: 'error' });

                return;
            }

            setValidationError('');
            await axios.post('/api/plex/music-search-config/match-filters', data);
            enqueueSnackbar('Match filters saved successfully', { variant: 'success' });

        });
    }, [data, validateFilters]);

    const handleReset = useCallback(async () => {
        // eslint-disable-next-line no-alert
        if (confirm('Reset match filters to defaults? This will overwrite your current configuration.')) {
            await loadData();
            setValidationError('');
        }
    }, [loadData]);

    const handleResetClick = useCallback(() => {
        handleReset().catch(console.error);
    }, [handleReset]);

    const handleSaveClick = useCallback(() => {
        saveData().catch(console.error);
    }, [saveData]);

    const handleViewModeChange = useCallback((
        _event: React.MouseEvent<HTMLElement>,
        newMode: ViewMode | null
    ) => {
        if (newMode) {
            setViewMode(newMode);
        }
    }, []);

    const handleDataChange = useCallback((newValue: MatchFilterRule[]) => {
        setData(newValue);
        setValidationError('');
    }, []);

    // Load data on component mount
    useEffect(() => {
        loadData();
    }, [loadData]);

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
        <MusicSearchConfigLayout activeTab="match-filters" title="Match Filters">
            <Card>
                <CardContent>
                    <Box>
                        {/* Header */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                            <Typography variant="h6">
                                Match Filters Configuration
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <ToggleButtonGroup value={viewMode} exclusive onChange={handleViewModeChange} size="small">
                                    <ToggleButton value="ui">UI</ToggleButton>
                                    <ToggleButton value="json">JSON</ToggleButton>
                                </ToggleButtonGroup>
                                <Button onClick={handleResetClick} variant="outlined" size="small" startIcon={<Refresh />}>
                                    Reset to Defaults
                                </Button>
                                <Button onClick={handleSaveClick} variant="contained" size="small" startIcon={<Save />}>
                                    Save Configuration
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
                                Edit raw JSON for advanced configurations. Each filter should be a string expression.
                                Filters are evaluated in order - the first matching filter wins.
                            </Typography>
                        )}

                        {/* Content based on view mode */}
                        <Paper variant="outlined" sx={{ p: 0 }}>
                            {viewMode === 'ui' ? (
                                <Box sx={{ p: 2 }}>
                                    <TableEditor filters={data} onChange={setData} />
                                </Box>
                            ) : (
                                <MonacoJsonEditor value={data} onChange={handleDataChange} schema={matchFilterSchema} height={500} error={validationError} />
                            )}
                        </Paper>
                    </Box>
                </CardContent>
            </Card>
        </MusicSearchConfigLayout>
    )
}

export default MatchFiltersPage