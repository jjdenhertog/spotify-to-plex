import { errorBoundary } from "@/helpers/errors/errorBoundary";
import { Alert, Box, Button, CircularProgress, FormControl, FormControlLabel, FormHelperText, InputLabel, MenuItem, Select, Switch, TextField, Typography } from "@mui/material";
import axios from "axios";
import { enqueueSnackbar } from "notistack";
import { ChangeEvent, SelectChangeEvent, useCallback, useEffect, useState } from "react";

type LidarrSettings = {
    enabled: boolean;
    url: string;
    root_folder_path: string;
    quality_profile_id: number;
    metadata_profile_id: number;
    auto_sync: boolean;
};

type LidarrProfile = {
    id: number;
    name: string;
};

export default function LidarrSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [canUseLidarr, setCanUseLidarr] = useState(false);
    const [qualityProfiles, setQualityProfiles] = useState<LidarrProfile[]>([]);
    const [metadataProfiles, setMetadataProfiles] = useState<LidarrProfile[]>([]);
    const [profilesLoading, setProfilesLoading] = useState(false);
    const [profilesError, setProfilesError] = useState<string | null>(null);
    const [settings, setSettings] = useState<LidarrSettings>({
        enabled: false,
        url: '',
        root_folder_path: '',
        quality_profile_id: 1,
        metadata_profile_id: 1,
        auto_sync: false,
    });

    const fetchProfiles = useCallback(async (url: string) => {
        setProfilesLoading(true);
        setProfilesError(null);
        await errorBoundary(async () => {
            const result = await axios.post<{ qualityProfiles?: LidarrProfile[]; metadataProfiles?: LidarrProfile[]; error?: string }>(
                '/api/lidarr/profiles',
                { url }
            );

            if (result.data.error) {
                setProfilesError(result.data.error);
            } else {
                setQualityProfiles(result.data.qualityProfiles ?? []);
                setMetadataProfiles(result.data.metadataProfiles ?? []);
            }

            setProfilesLoading(false);
        }, () => {
            setProfilesError('Failed to fetch profiles from Lidarr');
            setProfilesLoading(false);
        });
    }, []);

    useEffect(() => {
        errorBoundary(async () => {
            const validResult = await axios.get<{ ok: boolean }>('/api/lidarr/valid');
            setCanUseLidarr(validResult.data.ok);

            const result = await axios.get<LidarrSettings>('/api/lidarr/settings');
            setSettings(result.data);
            setLoading(false);
        }, () => {
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        if (!settings.url) {
            setQualityProfiles([]);
            setMetadataProfiles([]);
            setProfilesError(null);

            return;
        }

        const timeout = setTimeout(() => {
            fetchProfiles(settings.url);
        }, 600);

        return () => clearTimeout(timeout);
    }, [settings.url, fetchProfiles]);

    const handleChange = useCallback((field: keyof LidarrSettings, value: any) => {
        setSettings(prev => ({ ...prev, [field]: value }));
        setTestResult(null);
    }, []);

    const handleSave = useCallback(async () => {
        setSaving(true);
        await errorBoundary(async () => {
            await axios.put('/api/lidarr/settings', settings);
            setSaving(false);
            enqueueSnackbar('Settings saved successfully', { variant: 'success' });
        }, () => {
            setSaving(false);
        });
    }, [settings]);

    const handleTestConnection = useCallback(async () => {
        setTesting(true);
        setTestResult(null);
        await errorBoundary(async () => {
            const result = await axios.post<{ success: boolean; message: string }>(
                '/api/lidarr/test-connection',
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

    const handleEnabledChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        handleChange('enabled', e.target.checked);
    }, [handleChange]);

    const handleUrlChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        handleChange('url', e.target.value);
    }, [handleChange]);

    const handleRootFolderPathChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        handleChange('root_folder_path', e.target.value);
    }, [handleChange]);

    const handleQualityProfileChange = useCallback((e: SelectChangeEvent<number>) => {
        handleChange('quality_profile_id', Number(e.target.value));
    }, [handleChange]);

    const handleMetadataProfileChange = useCallback((e: SelectChangeEvent<number>) => {
        handleChange('metadata_profile_id', Number(e.target.value));
    }, [handleChange]);

    const handleAutoSyncChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        handleChange('auto_sync', e.target.checked);
    }, [handleChange]);

    const handleSaveClick = useCallback(() => {
        handleSave();
    }, [handleSave]);

    const handleTestConnectionClick = useCallback(() => {
        handleTestConnection();
    }, [handleTestConnection]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    const profilesDisabled = profilesLoading || !settings.url;
    const profileHelperText = profilesLoading
        ? 'Loading profiles...'
        : profilesError
            ? `Could not load profiles: ${profilesError}`
            : !settings.url
                ? 'Enter a Lidarr URL to load profiles'
                : null;

    return (
        <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
                Lidarr Integration
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                Configure Lidarr to automatically download missing albums from your playlists.
            </Typography>

            {!canUseLidarr &&
                <Alert severity="warning" sx={{ fontWeight: 'normal', mb: 2 }}>
                    You have not added the Lidarr API key. Please set the LIDARR_API_KEY environment variable. Visit Github for more info.
                </Alert>
            }

            <FormControlLabel control={<Switch checked={settings.enabled} onChange={handleEnabledChange} disabled={!canUseLidarr} />} label="Enable Lidarr Integration" sx={{ mb: 2 }} />

            {!!settings.enabled && !!canUseLidarr && <>
                <TextField
                    fullWidth
                    label="Lidarr URL"
                    placeholder="http://192.168.1.100:8686"
                    value={settings.url}
                    onChange={handleUrlChange}
                    sx={{ mb: 2 }}
                    helperText="The base URL of your Lidarr instance (e.g., http://192.168.1.100:8686)"
                />

                <TextField
                    fullWidth
                    label="Root Folder Path"
                    placeholder="/library/lidarr/music"
                    value={settings.root_folder_path}
                    onChange={handleRootFolderPathChange}
                    sx={{ mb: 2 }}
                    helperText="The root folder path in Lidarr where music will be downloaded"
                />

                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <FormControl sx={{ flex: 1 }} disabled={profilesDisabled}>
                        <InputLabel id="quality-profile-label">Quality Profile</InputLabel>
                        <Select
                            labelId="quality-profile-label"
                            value={settings.quality_profile_id}
                            label="Quality Profile"
                            onChange={handleQualityProfileChange}
                        >
                            {qualityProfiles.map(profile => (
                                <MenuItem key={profile.id} value={profile.id}>{profile.name}</MenuItem>
                            ))}
                        </Select>
                        {!!profileHelperText &&
                            <FormHelperText error={!!profilesError}>{profileHelperText}</FormHelperText>
                        }
                    </FormControl>

                    <FormControl sx={{ flex: 1 }} disabled={profilesDisabled}>
                        <InputLabel id="metadata-profile-label">Metadata Profile</InputLabel>
                        <Select
                            labelId="metadata-profile-label"
                            value={settings.metadata_profile_id}
                            label="Metadata Profile"
                            onChange={handleMetadataProfileChange}
                        >
                            {metadataProfiles.map(profile => (
                                <MenuItem key={profile.id} value={profile.id}>{profile.name}</MenuItem>
                            ))}
                        </Select>
                        {!!profileHelperText &&
                            <FormHelperText error={!!profilesError}>{profileHelperText}</FormHelperText>
                        }
                    </FormControl>
                </Box>

                <FormControlLabel control={<Switch checked={settings.auto_sync} onChange={handleAutoSyncChange} />} label="Enable Automatic Synchronization" sx={{ mb: 2 }} />
                <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                    When enabled, Lidarr will automatically download missing albums during daily synchronization.
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Button variant="outlined" onClick={handleTestConnectionClick} disabled={testing || !settings.url}>
                        {testing ? 'Testing...' : 'Test Connection'}
                    </Button>

                    <Button variant="contained" onClick={handleSaveClick} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Settings'}
                    </Button>
                </Box>

                {!!testResult &&
                    <Alert severity={testResult.success ? 'success' : 'error'} sx={{ mb: 2 }}>
                        {testResult.message}
                    </Alert>
                }
            </>
            }
            {!settings.enabled && !!canUseLidarr &&
                <Box>
                    <Button variant="contained" onClick={handleSaveClick} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Settings'}
                    </Button>
                </Box>
            }
        </Box>
    );
}
