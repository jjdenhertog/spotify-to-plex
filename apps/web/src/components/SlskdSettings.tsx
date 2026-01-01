import { errorBoundary } from "@/helpers/errors/errorBoundary";
import { Alert, Box, Button, Chip, CircularProgress, Divider, FormControlLabel, Switch, TextField, Typography } from "@mui/material";
import axios from "axios";
import { enqueueSnackbar } from "notistack";
import { ChangeEvent, useCallback, useEffect, useState } from "react";

type SlskdSettings = {
    enabled: boolean;
    url: string;
    allowed_extensions: string[];
    search_timeout: number;
    max_results: number;
    download_attempts: number;
    auto_sync: boolean;
};

export default function SlskdSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [canUseSlskd, setCanUseSlskd] = useState(false);
    const [extensionInput, setExtensionInput] = useState('');
    const [settings, setSettings] = useState<SlskdSettings>({
        enabled: false,
        url: '',
        allowed_extensions: ['flac', 'mp3', 'wav', 'ogg', 'm4a'],
        search_timeout: 5,
        max_results: 50,
        download_attempts: 3,
        auto_sync: false,
    });

    useEffect(() => {
        errorBoundary(async () => {
            // Check if SLSKD_API_KEY is configured
            const validResult = await axios.get<{ ok: boolean }>('/api/slskd/valid');
            setCanUseSlskd(validResult.data.ok);

            // Load settings
            const result = await axios.get<SlskdSettings>('/api/slskd/settings');
            setSettings(result.data);
            setLoading(false);
        }, () => {
            setLoading(false);
        });
    }, []);

    const handleChange = useCallback((field: keyof SlskdSettings, value: any) => {
        setSettings(prev => ({ ...prev, [field]: value }));
        setTestResult(null);
    }, []);

    const handleSave = useCallback(async () => {
        setSaving(true);
        await errorBoundary(async () => {
            await axios.put('/api/slskd/settings', settings);
            setSaving(false);
            enqueueSnackbar('Settings saved successfully', { variant: 'success' });
        }, () => {
            setSaving(false);
        });
    }, [settings]);
    const handleSaveClick = useCallback(() => {
        handleSave();
    }, [handleSave]);

    const handleTestConnection = useCallback(async () => {
        setTesting(true);
        setTestResult(null);
        await errorBoundary(async () => {
            const result = await axios.post<{ success: boolean; message: string }>(
                '/api/slskd/test-connection',
                { url: settings.url }
            );
            setTestResult(result.data);
            setTesting(false);
        }, (error: unknown) => {
            setTestResult({
                success: false,
                message: error instanceof Error ? error.message : 'Connection failed'
            });
            setTesting(false);
        });
    }, [settings.url]);

    const handleTestConnectionClick = useCallback(() => {
        handleTestConnection();
    }, [handleTestConnection]);

    const handleAddExtension = useCallback(() => {
        const ext = extensionInput.trim().toLowerCase()
            .replace(/^\./, '');
        if (ext && !settings.allowed_extensions.includes(ext)) {
            handleChange('allowed_extensions', [...settings.allowed_extensions, ext]);
            setExtensionInput('');
        }
    }, [extensionInput, settings.allowed_extensions, handleChange]);

    const handleRemoveExtension = useCallback((extToRemove: string) => {
        handleChange('allowed_extensions', settings.allowed_extensions.filter(ext => ext !== extToRemove));
    }, [settings.allowed_extensions, handleChange]);

    const handleExtensionKeyPress = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddExtension();
        }
    }, [handleAddExtension]);


    const handleUrlChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        handleChange('url', e.target.value);
    }, [handleChange]);

    const handleEnabledChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        handleChange('enabled', e.target.checked);
    }, [handleChange]);
    
    const hanldeRemoveExtension = useCallback((ext: string) => () => {
        handleRemoveExtension(ext);
    }, [handleRemoveExtension]);

    const handleExtensionInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setExtensionInput(e.target.value);
    }, []);

    const handleDownloadAttemptsChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        handleChange('download_attempts', parseInt(e.target.value, 10));
    }, [handleChange]);

    const handleSearchTimeoutChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        handleChange('search_timeout', parseInt(e.target.value, 10));
    }, [handleChange]);

    const handleMaxResultsChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        handleChange('max_results', parseInt(e.target.value, 10));
    }, [handleChange]);

    const handleAutoSyncChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        handleChange('auto_sync', e.target.checked);
    }, [handleChange]);


    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
                SLSKD Integration
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                Configure SLSKD (Soulseek daemon) to automatically download missing tracks from the Soulseek P2P network.
            </Typography>

            {!canUseSlskd && (
                <Alert severity="warning" sx={{ fontWeight: 'normal', mb: 2 }}>
                    You have not added the SLSKD API key. Please set the SLSKD_API_KEY environment variable. Visit Github for more info.
                </Alert>
            )}

            <FormControlLabel control={<Switch checked={settings.enabled} onChange={handleEnabledChange} disabled={!canUseSlskd} />} label="Enable SLSKD Integration" sx={{ mb: 2 }} />

            {settings.enabled && canUseSlskd ? <>
                {/* Connection Settings */}
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                    Connection
                </Typography>
                <TextField
                    fullWidth
                    label="SLSKD URL"
                    placeholder="http://192.168.1.100:5030"
                    value={settings.url}
                    onChange={handleUrlChange}
                    sx={{ mb: 2 }}
                    helperText="The base URL of your SLSKD instance (e.g., http://192.168.1.100:5030)"
                />

                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <Button variant="outlined" onClick={handleTestConnectionClick} disabled={testing || !settings.url}>
                        {testing ? 'Testing...' : 'Test Connection'}
                    </Button>
                </Box>

                {testResult ? <Alert severity={testResult.success ? 'success' : 'error'} sx={{ mb: 3 }}>
                    {testResult.message}
                </Alert> : null}

                <Divider sx={{ mb: 3 }} />

                {/* File Extensions Filter */}
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                    File Extensions
                </Typography>

                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                        Allowed File Extensions (in preference order)
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                        {settings.allowed_extensions.map((ext) => (
                            <Chip key={ext} label={ext} onDelete={hanldeRemoveExtension(ext)} size="small" />
                        ))}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField size="small" placeholder="Add extension (e.g., flac)" value={extensionInput} onChange={handleExtensionInputChange} onKeyPress={handleExtensionKeyPress} sx={{ flex: 1 }} />
                        <Button variant="outlined" size="small" onClick={handleAddExtension} disabled={!extensionInput.trim()}>
                            Add
                        </Button>
                    </Box>
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* Search Settings */}
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                    Search Settings
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    {/* TODO: Re-enable when Track type includes duration_ms */}
                    {/* <TextField label="Max Length Difference (seconds)" type="number" value={settings.max_length_difference} onChange={handleMaxLengthDifferenceChange} sx={{ flex: 1 }} helperText="Allowed track duration difference" /> */}

                    <TextField label="Download Attempts" type="number" value={settings.download_attempts} onChange={handleDownloadAttemptsChange} sx={{ flex: 1 }} helperText="Number of files to try downloading" />
                </Box>

                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <TextField label="Search Timeout (seconds)" type="number" value={settings.search_timeout} onChange={handleSearchTimeoutChange} sx={{ flex: 1 }} helperText="Time to wait for search results" />
                </Box>

                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <TextField label="Max Results" type="number" value={settings.max_results} onChange={handleMaxResultsChange} sx={{ flex: 1 }} helperText="Maximum results per search approach" />
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* Auto-Sync */}
                <FormControlLabel control={<Switch checked={settings.auto_sync} onChange={handleAutoSyncChange} />} label="Enable Automatic Synchronization" sx={{ mb: 2 }} />
                <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                    When enabled, SLSKD will automatically download missing tracks during daily synchronization.
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Button variant="contained" onClick={handleSaveClick} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Settings'}
                    </Button>
                </Box>
            </> : null}
        </Box>
    );
}
