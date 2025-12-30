/* eslint-disable react/no-multi-comp */
import { errorBoundary } from "@/helpers/errors/errorBoundary";
import { Alert, Box, Button, Chip, CircularProgress, Paper, Tab, Tabs, TextField, Typography } from "@mui/material";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { GetLogsResponse } from "../../pages/api/logs";
import { SyncType } from "@spotify-to-plex/shared-types/common/sync";
import BMoment from "./BMoment";

type TabPanelProps = {
    readonly children?: React.ReactNode;
    readonly index: number;
    readonly value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`logs-tabpanel-${index}`}
            aria-labelledby={`logs-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

export default function Logs() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<GetLogsResponse | null>(null);
    const [tabValue, setTabValue] = useState(0);
    const [clearing, setClearing] = useState(false);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        await errorBoundary(async () => {
            const result = await axios.get<GetLogsResponse>('/api/logs');
            setData(result.data);
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleTabChange = useCallback((_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    }, []);

    const handleClearLogs = useCallback(async () => {
        // eslint-disable-next-line no-alert
        if (!confirm('Are you sure you want to clear all logs? This action cannot be undone.')) {
            return;
        }

        setClearing(true);
        await errorBoundary(async () => {
            await axios.delete('/api/logs');
            await fetchLogs();
            setClearing(false);
        });
    }, [fetchLogs]);

    const onClearLogsClick = useCallback(() => {
        handleClearLogs().catch((error: unknown) => {
            console.error('Error clearing logs:', error);
        });
    }, [handleClearLogs]);

    const getSyncTypeTitle = (type: SyncType) => {
        const titles: Record<SyncType, string> = {
            users: 'Users',
            albums: 'Albums',
            playlists: 'Playlists',
            lidarr: 'Lidarr',
            slskd: 'SLSKD',
            mqtt: 'MQTT'
        };

        return titles[type];
    };

    const formatDuration = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        }

        return `${seconds}s`;
    };

    const renderOverview = () => {
        if (!data) return null;

        const syncTypes: SyncType[] = ['users', 'albums', 'playlists', 'lidarr', 'slskd', 'mqtt'];

        return (
            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Sync Overview</Typography>
                <Box sx={{ display: 'grid', gap: 2 }}>
                    {syncTypes.map(type => {
                        const typeLog = data.sync_type_log[type];
                        const duration = typeLog?.end && typeLog?.start ? typeLog.end - typeLog.start : null;

                        return (
                            <Paper key={type} elevation={0} sx={{ p: 2, bgcolor: 'action.hover' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body1" fontWeight="medium">
                                        {getSyncTypeTitle(type)}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {typeLog ? (
                                            <>
                                                {duration !== null && (
                                                    <Typography variant="body2" color="text.secondary">
                                                        {formatDuration(duration)}
                                                    </Typography>
                                                )}
                                                <Chip label={typeLog.status} color={typeLog.status==='success' ? 'success' : typeLog.status==='error' ? 'error' : 'default'} size="small" />
                                                {typeLog.start ? <Typography variant="body2" color="text.secondary">
                                                    <BMoment date={typeLog.start} format="D MMM HH:mm" />
                                                </Typography> : null}
                                            </>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                Never run
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                                {typeLog?.error ? <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                                    {typeLog.error}
                                </Typography> : null}
                            </Paper>
                        );
                    })}
                </Box>
            </Box>
        );
    };

    const renderSyncTypeLogs = (type: SyncType) => {
        if (!data) return null;

        const logs = data.sync_log[type];

        if (!logs || logs.length === 0) {
            return (
                <Alert severity="info">
                    No {getSyncTypeTitle(type)} sync logs found. Logs will appear here after the first sync.
                </Alert>
            );
        }

        return (
            <Box>
                {logs.map((log) => {
                    const duration = log.end && log.start ? log.end - log.start : null;
                    const hasError = Boolean(log.error);

                    return (
                        <Box
                            key={log.id}
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                py: 0.75,
                                px: 1.5,
                                bgcolor: hasError ? 'error.lighter' : 'action.hover',
                                borderRadius: 1,
                                mb: 0.5
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
                                <Typography variant="body2" sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                    {log.title}
                                </Typography>
                                {log.start ? <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                                    <BMoment date={log.start} format="D MMM HH:mm" />
                                </Typography> : null}
                                {duration !== null && (
                                    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap', minWidth: '60px', textAlign: 'right' }}>
                                        {formatDuration(duration)}
                                    </Typography>
                                )}
                                <Chip label={hasError ? 'Error' : 'Success'} color={hasError ? 'error' : 'success'} size="small" sx={{ minWidth: '75px' }} />
                            </Box>
                        </Box>
                    );
                })}
            </Box>
        );
    };

    const renderLidarrDetailLogs = () => {
        if (!data?.lidarr_sync_log || Object.keys(data.lidarr_sync_log).length === 0) {
            return (
                <Alert severity="info">
                    No Lidarr synchronization detail logs found. Logs will appear here after albums are sent to Lidarr.
                </Alert>
            );
        }

        const lidarrEntries = Object.entries(data.lidarr_sync_log)
            .map(([id, log]: [string, any]) => ({ id, ...log }))
            .sort((a, b) => (b.start || 0) - (a.start || 0))
            .slice(0, 100);

        return (
            <Box>
                {lidarrEntries.map((log) => {
                    const duration = log.end && log.start ? log.end - log.start : null;
                    const hasError = log.status === 'error';

                    return (
                        <Box
                            key={log.id}
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                py: 0.75,
                                px: 1.5,
                                bgcolor: hasError ? 'error.lighter' : 'action.hover',
                                borderRadius: 1,
                                mb: 0.5
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
                                <Typography variant="body2" sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                    {log.artist_name} - {log.album_name}
                                </Typography>
                                {log.start ? <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                                    <BMoment date={log.start} format="D MMM HH:mm" />
                                </Typography> : null}
                                {duration !== null && (
                                    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap', minWidth: '60px', textAlign: 'right' }}>
                                        {formatDuration(duration)}
                                    </Typography>
                                )}
                                <Chip label={log.status} color={log.status==='success' ? 'success' : log.status==='error' ? 'error' : 'warning'} size="small" sx={{ minWidth: '85px' }} />
                            </Box>
                        </Box>
                    );
                })}
            </Box>
        );
    };

    const renderSlskdDetailLogs = () => {
        if (!data?.slskd_sync_log || Object.keys(data.slskd_sync_log).length === 0) {
            return (
                <Alert severity="info">
                    No SLSKD synchronization detail logs found. Logs will appear here after tracks are sent to SLSKD.
                </Alert>
            );
        }

        const slskdEntries = Object.entries(data.slskd_sync_log)
            .map(([id, log]: [string, any]) => ({ id, ...log }))
            .sort((a, b) => (b.start || 0) - (a.start || 0))
            .slice(0, 100);

        return (
            <Box>
                {slskdEntries.map((log) => {
                    const duration = log.end && log.start ? log.end - log.start : null;
                    const hasError = log.status === 'error';
                    const notFound = log.status === 'not_found';
                    const isQueued = log.status === 'queued';

                    return (
                        <Box
                            key={log.id}
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                py: 0.75,
                                px: 1.5,
                                bgcolor: hasError ? 'error.lighter' : 'action.hover',
                                borderRadius: 1,
                                mb: 0.5
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
                                <Typography variant="body2" sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                    {log.artist_name} - {log.track_name}
                                </Typography>
                                {log.start ? <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                                    <BMoment date={log.start} format="D MMM HH:mm" />
                                </Typography> : null}
                                {duration !== null && (
                                    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap', minWidth: '60px', textAlign: 'right' }}>
                                        {formatDuration(duration)}
                                    </Typography>
                                )}
                                <Chip label={log.status} color={log.status==='success' || isQueued ? 'success' : notFound ? 'warning' : 'error'} size="small" sx={{ minWidth: '85px' }} />
                            </Box>
                        </Box>
                    );
                })}
            </Box>
        );
    };

    const renderOutput = () => {
        if (!data) return null;

        const outputFiles = [
            { title: 'Missing Tracks - Spotify', content: data.missing_files.missing_tracks_spotify },
            { title: 'Missing Tracks - Tidal', content: data.missing_files.missing_tracks_tidal },
            { title: 'Missing Albums - Spotify', content: data.missing_files.missing_albums_spotify },
            { title: 'Missing Albums - Tidal', content: data.missing_files.missing_albums_tidal },
            { title: 'Missing Tracks - Lidarr (JSON)', content: data.missing_files.missing_tracks_lidarr },
            { title: 'Missing Albums - Lidarr (JSON)', content: data.missing_files.missing_albums_lidarr },
            { title: 'Missing Tracks - SLSKD (JSON)', content: data.missing_files.missing_tracks_slskd }
        ];

        return (
            <Box sx={{ display: 'grid', gap: 3 }}>
                {outputFiles.map(file => {
                    const hasContent = file.content && file.content.trim() !== '' && file.content !== '[]';

                    return (
                        <Box key={file.title}>
                            <Typography variant="h6" sx={{ mb: 1 }}>{file.title}</Typography>
                            {hasContent ? (
                                <TextField
                                    multiline
                                    fullWidth
                                    value={file.content}
                                    variant="outlined"
                                    minRows={5}
                                    maxRows={15}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            backgroundColor: 'action.hover',
                                            fontFamily: 'monospace',
                                            fontSize: '0.85rem'
                                        }
                                    }}
                                />
                            ) : (
                                <Alert severity="info">
                                    No data found for {file.title.toLowerCase()}.
                                </Alert>
                            )}
                        </Box>
                    );
                })}
            </Box>
        );
    };

    if (loading) {
        return (
            <Paper sx={{ p: 4 }}>
                <Box textAlign="center">
                    <CircularProgress />
                </Box>
            </Paper>
        );
    }

    // Determine which tabs to show based on available logs
    const tabs: { label: string; type: SyncType | 'overview' | 'output' }[] = [
        { label: 'Overview', type: 'overview' }
    ];

    if (data?.sync_log.users && data.sync_log.users.length > 0)
        tabs.push({ label: 'Users', type: 'users' });

    if (data?.sync_log.albums && data.sync_log.albums.length > 0)
        tabs.push({ label: 'Albums', type: 'albums' });

    if (data?.sync_log.playlists && data.sync_log.playlists.length > 0)
        tabs.push({ label: 'Playlists', type: 'playlists' });

    if (data?.lidarr_sync_log && Object.keys(data.lidarr_sync_log).length > 0)
        tabs.push({ label: 'Lidarr', type: 'lidarr' });

    if (data?.slskd_sync_log && Object.keys(data.slskd_sync_log).length > 0)
        tabs.push({ label: 'SLSKD', type: 'slskd' });

    if (data?.sync_log.mqtt && data.sync_log.mqtt.length > 0)
        tabs.push({ label: 'MQTT', type: 'mqtt' });

    tabs.push({ label: 'Output', type: 'output' });

    return (
        <Paper sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="logs tabs">
                    {tabs.map((tab, index) => (
                        <Tab key={tab.type} label={tab.label} id={`logs-tab-${index}`} />
                    ))}
                </Tabs>
                <Box sx={{ pr: 2 }}>
                    <Button variant="outlined" color="error" size="small" onClick={onClearLogsClick} disabled={clearing}>
                        {clearing ? 'Clearing...' : 'Clear Logs'}
                    </Button>
                </Box>
            </Box>

            {tabs.map((tab, index) => (
                <TabPanel key={tab.type} value={tabValue} index={index}>
                    {tab.type === 'overview' && renderOverview()}
                    {tab.type === 'users' && renderSyncTypeLogs('users')}
                    {tab.type === 'albums' && renderSyncTypeLogs('albums')}
                    {tab.type === 'playlists' && renderSyncTypeLogs('playlists')}
                    {tab.type === 'lidarr' && renderLidarrDetailLogs()}
                    {tab.type === 'slskd' && renderSlskdDetailLogs()}
                    {tab.type === 'mqtt' && renderSyncTypeLogs('mqtt')}
                    {tab.type === 'output' && renderOutput()}
                </TabPanel>
            ))}
        </Paper>
    );
}