import { errorBoundary } from "@/helpers/errors/errorBoundary";
import { Alert, Box, Button, CircularProgress, Grid, Paper, Typography } from "@mui/material";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import type { SyncAvailability } from "../../pages/api/sync/availability";

type SyncType = 'users' | 'albums' | 'playlists' | 'lidarr' | 'mqtt' | 'slskd' | 'all';

type SyncOption = {
    type: SyncType;
    label: string;
    description: string;
}

const syncOptions: SyncOption[] = [
    {
        type: 'users',
        label: 'Users',
        description: 'Sync user-specific playlists and saved items'
    },
    {
        type: 'albums',
        label: 'Albums',
        description: 'Sync saved albums from Spotify to Plex'
    },
    {
        type: 'playlists',
        label: 'Playlists',
        description: 'Sync playlists from Spotify to Plex'
    },
    {
        type: 'lidarr',
        label: 'Lidarr',
        description: 'Sync missing albums to Lidarr'
    },
    {
        type: 'slskd',
        label: 'SLSKD',
        description: 'Sync missing tracks to SLSKD'
    },
    {
        type: 'mqtt',
        label: 'MQTT',
        description: 'Publish Plex data to Home Assistant via MQTT'
    }
];

export default function SyncTrigger() {
    const [loading, setLoading] = useState(true);
    const [availability, setAvailability] = useState<SyncAvailability | null>(null);
    const [syncing, setSyncing] = useState<Record<SyncType, boolean>>({
        users: false,
        albums: false,
        playlists: false,
        lidarr: false,
        mqtt: false,
        slskd: false,
        all: false
    });
    const [success, setSuccess] = useState<SyncType | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Fetch availability on mount
    useEffect(() => {
        const fetchAvailability = async () => {
            setLoading(true);
            await errorBoundary(async () => {
                const response = await axios.get<SyncAvailability>('/api/sync/availability');
                setAvailability(response.data);
                setLoading(false);
            }, () => {
                setLoading(false);
            });
        };

        fetchAvailability().catch((error: unknown) => {
            console.error('Error fetching sync availability:', error);
        });
    }, []);

    const handleSync = useCallback(async (type: SyncType) => {
        setSyncing(prev => ({ ...prev, [type]: true }));
        setSuccess(null);
        setError(null);

        await errorBoundary(async () => {
            await axios.post(`/api/sync/${type}`);
            setSuccess(type);
            setSyncing(prev => ({ ...prev, [type]: false }));

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(null), 3000);
        }, (err: unknown) => {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setError(`Failed to start ${type} sync: ${message}`);
            setSyncing(prev => ({ ...prev, [type]: false }));
        });
    }, []);

    const onSyncClick = useCallback((type: SyncType) => () => {
        handleSync(type).catch((error: unknown) => {
            console.error('Error triggering sync:', error);
        });
    }, [handleSync]);

    // Filter sync options based on availability
    const availableOptions = availability
        ? syncOptions.filter(option => availability[option.type as keyof SyncAvailability])
        : [];

    // Check if any sync options are available
    const hasAvailableOptions = availableOptions.length > 0;

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {!!success &&
                <Alert severity="success" sx={{ mb: 2 }}>
                    {success === 'all' ? 'All syncs' : `${success.charAt(0).toUpperCase() + success.slice(1)} sync`} started successfully! Check the logs for progress.
                </Alert>
            }

            {!!error &&
                <Alert severity="error" sx={{ mb: 2 }} >
                    {error}
                </Alert>
            }

            {!hasAvailableOptions &&
                <Alert severity="info" sx={{ mb: 2 }}>
                    No sync options are currently available. Please configure at least one sync option (Users, Lidarr, SLSKD or MQTT) to enable manual synchronization.
                </Alert>
            }

            <Grid container spacing={2}>
                {availableOptions.map(option => (
                    <Grid item xs={12} sm={6} md={4} key={option.type}>
                        <Paper elevation={0} sx={{ p: 2, height: '100%', bgcolor: 'action.hover' }}>
                            <Typography variant="h6" sx={{ mb: 1 }}>
                                {option.label}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                                {option.description}
                            </Typography>
                            <Button variant="contained" fullWidth onClick={onSyncClick(option.type)} disabled={syncing[option.type]} startIcon={syncing[option.type] ? <CircularProgress size={16} /> : null}>
                                {syncing[option.type] ? 'Starting...' : 'Start Sync'}
                            </Button>
                        </Paper>
                    </Grid>
                ))}

                {!!hasAvailableOptions &&
                    <Grid item xs={12}>
                        <Paper elevation={0} sx={{ p: 3, bgcolor: 'action.hover', borderWidth: 2, borderStyle: 'solid', borderColor: 'primary.main' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="h6" sx={{ mb: 0.5 }}>
                                        Sync All
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Run all available sync processes sequentially
                                    </Typography>
                                </Box>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    size="large"
                                    onClick={onSyncClick('all')}
                                    disabled={syncing.all}
                                    startIcon={syncing.all ? <CircularProgress size={20} /> : null}
                                    sx={{ minWidth: 150 }}
                                >
                                    {syncing.all ? 'Starting...' : 'Sync All'}
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>
                }
            </Grid>

            <Alert severity="info" sx={{ mt: 3 }}>
                Sync processes run in the background. Check the Logs page to monitor progress and view results.
            </Alert>
        </Box>
    );
}
