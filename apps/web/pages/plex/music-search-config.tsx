import Logo from "@/components/Logo";
import MainLayout from "@/layouts/MainLayout";
import { errorBoundary } from "@/helpers/errors/errorBoundary";
import MatchFilterEditor from "@/components/MatchFilterEditor";
import TextProcessingEditor from "@/components/TextProcessingEditor";
import SearchApproachesEditor from "@/components/SearchApproachesEditor";
import { ChevronLeft, Restore, Save, Code, Tune, Search } from "@mui/icons-material";
import { 
    Alert, 
    Box, 
    Button, 
    Card, 
    CardContent, 
    CircularProgress, 
    Container, 
 
    FormControlLabel, 
    Paper, 
    Switch, 
    TextField, 
    Typography,
    Tab,
    Tabs,
    Breadcrumbs,
    Link
} from "@mui/material";
import { LoadingButton } from '@mui/lab';
import { NextPage } from "next";
import Head from "next/head";
import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { enqueueSnackbar } from "notistack";

// Types for the configuration
interface MatchFilter {
    id: string;
    name: string;
    enabled: boolean;
    artistSimilarity?: number;
    titleSimilarity?: number;
    artistWithTitleSimilarity?: number;
    useContains?: boolean;
    useArtistMatch?: boolean;
    reason: string;
}

interface TextProcessingConfig {
    filterOutWords: string[];
    filterOutQuotes: string[];
    cutOffSeparators: string[];
    processing: {
        filtered: boolean;
        cutOffSeperators: boolean;
        removeQuotes: boolean;
    };
}

interface SearchApproachConfig {
    name: string;
    filtered: boolean;
    cutOffSeperators: boolean; // Note: preserving typo from original
    removeQuotes: boolean;
}

interface MusicSearchConfig {
    matchFilters: MatchFilter[];
    textProcessing: TextProcessingConfig;
    searchApproaches: {
        plex: SearchApproachConfig[];
        tidal: SearchApproachConfig[];
    };
}

const Page: NextPage = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [config, setConfig] = useState<MusicSearchConfig | null>(null);
    const [tabValue, setTabValue] = useState(0);
    const [jsonMode, setJsonMode] = useState(false);
    const [jsonError, setJsonError] = useState("");
    const jsonRef = useRef<HTMLTextAreaElement>(null);

    // Load configuration on mount
    useEffect(() => {
        loadConfiguration();
    }, []);

    const loadConfiguration = useCallback(() => {
        setLoading(true);
        errorBoundary(async () => {
            const response = await axios.get<MusicSearchConfig>('/api/plex/music-search-config');
            setConfig(response.data);
            setLoading(false);
        }, () => {
            setLoading(false);
        });
    }, []);

    const saveConfiguration = useCallback(() => {
        if (!config) return;

        setSaving(true);
        errorBoundary(async () => {
            let configToSave = config;
            
            if (jsonMode && jsonRef.current) {
                try {
                    configToSave = JSON.parse(jsonRef.current.value);
                    setJsonError("");
                } catch (error) {
                    setJsonError("Invalid JSON format");
                    setSaving(false);
                    return;
                }
            }

            await axios.post('/api/plex/music-search-config', configToSave);
            setConfig(configToSave);
            enqueueSnackbar("Configuration saved successfully", { variant: "success" });
            setSaving(false);
        }, () => {
            setSaving(false);
        });
    }, [config, jsonMode]);

    const resetConfiguration = useCallback(() => {
        setResetting(true);
        errorBoundary(async () => {
            await axios.post('/api/plex/music-search-config/reset');
            await loadConfiguration();
            enqueueSnackbar("Configuration reset to defaults", { variant: "info" });
            setResetting(false);
        }, () => {
            setResetting(false);
        });
    }, [loadConfiguration]);

    const handleTabChange = useCallback((_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    }, []);


    const updateMatchFilter = useCallback((index: number, field: string, value: any) => {
        if (!config) return;
        
        setConfig(prev => {
            if (!prev) return prev;
            const newConfig = { ...prev };
            newConfig.matchFilters = [...prev.matchFilters];
            newConfig.matchFilters[index] = {
                ...newConfig.matchFilters[index],
                [field]: value
            };
            return newConfig;
        });
    }, [config]);

    const updateTextProcessing = useCallback((field: string, value: any) => {
        if (!config) return;
        
        setConfig(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                textProcessing: {
                    ...prev.textProcessing,
                    [field]: value
                }
            };
        });
    }, [config]);

    const updateSearchApproach = useCallback((platform: 'plex' | 'tidal', index: number, field: string, value: any) => {
        if (!config) return;
        
        setConfig(prev => {
            if (!prev) return prev;
            const newConfig = { ...prev };
            newConfig.searchApproaches = {
                ...prev.searchApproaches,
                [platform]: [...prev.searchApproaches[platform]]
            };
            newConfig.searchApproaches[platform][index] = {
                ...newConfig.searchApproaches[platform][index],
                [field]: value
            };
            return newConfig;
        });
    }, [config]);

    if (loading) {
        return (
            <>
                <Head>
                    <title>Music Search Configuration - Spotify to Plex</title>
                </Head>
                <MainLayout loading={true} maxWidth="900px">
                    <Container>
                        <Logo />
                        <Box display="flex" justifyContent="center" pt={4}>
                            <CircularProgress />
                        </Box>
                    </Container>
                </MainLayout>
            </>
        );
    }

    return (
        <>
            <Head>
                <title>Music Search Configuration - Spotify to Plex</title>
            </Head>
            <MainLayout maxWidth="900px">
                <Container>
                    <Logo />
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'action.hover', mb: 3 }}>
                        <Breadcrumbs sx={{ mb: 2 }}>
                            <Link href="/" underline="hover" color="inherit">
                                Home
                            </Link>
                            <Link href="/plex/connection" underline="hover" color="inherit">
                                Plex Settings
                            </Link>
                            <Typography color="text.primary">Music Search Configuration</Typography>
                        </Breadcrumbs>

                        <Button component="a" href="/plex/connection" variant="outlined" color="inherit" size="small" startIcon={<ChevronLeft />}>
                            Back to Plex Settings
                        </Button>

                        <Typography variant="h4" sx={{ mt: 2, mb: 0.5 }}>
                            Music Search Configuration
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 2, maxWidth: 600 }}>
                            Configure how the system matches songs between Spotify and Plex. Adjust matching thresholds, text processing, and search approaches.
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                            <LoadingButton
                                loading={saving}
                                onClick={saveConfiguration}
                                variant="contained"
                                startIcon={<Save />}
                                disabled={!config}
                            >
                                Save Configuration
                            </LoadingButton>
                            
                            <LoadingButton
                                loading={resetting}
                                onClick={resetConfiguration}
                                variant="outlined"
                                color="warning"
                                startIcon={<Restore />}
                            >
                                Reset to Defaults
                            </LoadingButton>

                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={jsonMode}
                                        onChange={(e) => setJsonMode(e.target.checked)}
                                        size="small"
                                    />
                                }
                                label="Advanced JSON Editor"
                            />
                        </Box>
                    </Paper>

                    {!config ? (
                        <Alert severity="error">Failed to load configuration</Alert>
                    ) : (
                        <>
                            {jsonMode ? (
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" sx={{ mb: 2 }}>JSON Configuration Editor</Typography>
                                        <TextField
                                            ref={jsonRef}
                                            fullWidth
                                            multiline
                                            rows={25}
                                            variant="outlined"
                                            defaultValue={JSON.stringify(config, null, 2)}
                                            sx={{
                                                '& .MuiInputBase-input': {
                                                    fontFamily: 'monospace',
                                                    fontSize: '0.875rem'
                                                }
                                            }}
                                        />
                                        {jsonError && (
                                            <Alert severity="error" sx={{ mt: 2 }}>{jsonError}</Alert>
                                        )}
                                    </CardContent>
                                </Card>
                            ) : (
                                <Box>
                                    <Tabs 
                                        value={tabValue} 
                                        onChange={handleTabChange} 
                                        sx={{ mb: 3 }}
                                        variant="scrollable"
                                        scrollButtons="auto"
                                    >
                                        <Tab label="Match Filters" icon={<Tune />} iconPosition="start" />
                                        <Tab label="Text Processing" icon={<Code />} iconPosition="start" />
                                        <Tab label="Search Approaches" icon={<Search />} iconPosition="start" />
                                    </Tabs>

                                    {/* Match Filters Tab */}
                                    {tabValue === 0 && (
                                        <Card>
                                            <CardContent>
                                                <MatchFilterEditor
                                                    filters={config.matchFilters}
                                                    onUpdateFilter={updateMatchFilter}
                                                />
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Text Processing Tab */}
                                    {tabValue === 1 && (
                                        <Card>
                                            <CardContent>
                                                <TextProcessingEditor
                                                    config={config.textProcessing}
                                                    onUpdate={updateTextProcessing}
                                                />
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Search Approaches Tab */}
                                    {tabValue === 2 && (
                                        <Card>
                                            <CardContent>
                                                <SearchApproachesEditor
                                                    plexApproaches={config.searchApproaches.plex}
                                                    tidalApproaches={config.searchApproaches.tidal}
                                                    onUpdatePlex={(index, field, value) => updateSearchApproach('plex', index, field, value)}
                                                    onUpdateTidal={(index, field, value) => updateSearchApproach('tidal', index, field, value)}
                                                />
                                            </CardContent>
                                        </Card>
                                    )}
                                </Box>
                            )}
                        </>
                    )}
                </Container>
            </MainLayout>
        </>
    );
};

export default Page;