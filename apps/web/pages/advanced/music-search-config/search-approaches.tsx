import MusicSearchConfigLayout from "@/components/layouts/MusicSearchConfigLayout";
import SearchApproachCard from "@/components/MusicSearchConfig/SearchApproachCard";
import { useConfigEditor } from "@/hooks/useConfigEditor";
import { Add as AddIcon, Refresh, Save } from "@mui/icons-material";
import { Box, Button, Card, CardContent, Typography } from "@mui/material";
import { NextPage } from "next";
import { enqueueSnackbar } from "notistack";
import { useCallback, useEffect, useState } from "react";

type SearchApproachConfig = {
    id: string;
    filtered?: boolean;
    trim?: boolean;
    removeQuotes?: boolean;
};

const validateSearchApproaches = (data: SearchApproachConfig[]) => {
    if (!Array.isArray(data)) {
        return 'Search approaches must be an array';
    }

    for (let i = 0; i < data.length; i++) {
        const approach = data[i];
        if (!approach?.id || typeof approach.id !== 'string') {
            return `Approach at index ${i} must have a valid ID`;
        }
    }

    return null;
};

const TextProcessingPage: NextPage = () => {

    const { data, loading, loadData, saveData } = useConfigEditor<SearchApproachConfig[]>(
        '/api/plex/music-search-config/search-approaches',
        validateSearchApproaches
    );

    const [localData, setLocalData] = useState<SearchApproachConfig[]>([]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        if (data) {
            setLocalData(data);
        }
    }, [data]);

    const handleSave = useCallback(async () => {
        try {
            await saveData(localData);
            enqueueSnackbar('Search approaches saved successfully', { variant: 'success' });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to save';
            enqueueSnackbar(`Failed to save: ${message}`, { variant: 'error' });
        }
    }, [localData, saveData]);

    const handleSaveClick = useCallback(() => {
        handleSave().catch(() => {
            // Error handled in handleSave
        });
    }, [handleSave]);

    const handleReset = useCallback(() => {
        // eslint-disable-next-line no-alert
        if (confirm('Reset search approaches to defaults? This will overwrite your current configuration.')) {
            loadData();
        }
    }, [loadData]);

    const handleApproachChange = useCallback((index: number, newApproach: SearchApproachConfig) => {
        setLocalData(prev => {
            const newApproaches = [...prev];
            newApproaches[index] = newApproach;

            return newApproaches;
        });
    }, []);

    const handleApproachDelete = useCallback((index: number) => {
        setLocalData(prev => prev.filter((_, i) => i !== index));
    }, []);

    const handleAddApproach = useCallback(() => {
        const newApproach: SearchApproachConfig = {
            id: `approach-${Date.now()}`,
            filtered: false,
            trim: false,
            removeQuotes: false
        };
        setLocalData(prev => [...prev, newApproach]);
    }, []);

    const createApproachChangeHandler = useCallback((index: number) => {
        return (newApproach: SearchApproachConfig) => handleApproachChange(index, newApproach);
    }, [handleApproachChange]);

    const createApproachDeleteHandler = useCallback((index: number) => {
        return () => handleApproachDelete(index);
    }, [handleApproachDelete]);

    if (loading) {
        return (
            <Typography>
                Loading search approaches configuration...
            </Typography>
        );
    }


    return (
        <MusicSearchConfigLayout activeTab="search-approaches" title="Search Approaches">
            <Card>
                <CardContent>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                            <Typography variant="h6">Search Approaches</Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button onClick={handleReset} variant="outlined" size="small" startIcon={<Refresh />}>
                                    Reset to Defaults
                                </Button>
                                <Button onClick={handleSaveClick} variant="contained" size="small" startIcon={<Save />}>
                                    Save Configuration
                                </Button>
                            </Box>
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Configure when to apply the text processing rules. Each approach represents a different combination.
                        </Typography>

                        {localData.map((approach, index) => (
                            <SearchApproachCard key={approach.id || index} approach={approach} onChange={createApproachChangeHandler(index)} onDelete={createApproachDeleteHandler(index)} disabled={loading} />
                        ))}

                        <Button onClick={handleAddApproach} startIcon={<AddIcon />} variant="outlined" size="small">
                            Add Search Approach
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </MusicSearchConfigLayout>
    )
}

export default TextProcessingPage