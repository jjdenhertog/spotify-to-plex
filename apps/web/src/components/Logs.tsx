/* eslint-disable react/no-multi-comp */
import { errorBoundary } from "@/helpers/errors/errorBoundary";
import { Alert, Box, Button, CircularProgress, Paper, Tab, Tabs, TextField, Typography } from "@mui/material";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { GetLogsResponse } from "../../pages/api/logs";
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

export default function fLogs() {
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

    const formatDuration = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        }

        return `${seconds}s`;

    };

    const renderSyncLogs = () => {
        if (!data?.sync_log || Object.keys(data.sync_log).length === 0) {
            return (
                <>
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="outlined"
                            color="error"
                            onClick={handleClearLogs}
                            disabled={clearing}
                        >
                            {clearing ? 'Clearing...' : 'Clear Logs'}
                        </Button>
                    </Box>
                    <Alert severity="info">
                        No synchronization logs found. Logs will appear here after your first sync.
                    </Alert>
                </>
            );
        }

        // Convert sync_log object to array and sort by start time (descending)
        const syncEntries = Object.entries(data.sync_log)
            .map(([id, log]: [string, any]) => ({ id, ...log }))
            .sort((a, b) => (b.start || 0) - (a.start || 0))
            .slice(0, 100); // Limit to 100 entries

        return (
            <Box>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        variant="outlined"
                        color="error"
                        onClick={handleClearLogs}
                        disabled={clearing}
                    >
                        {clearing ? 'Clearing...' : 'Clear Logs'}
                    </Button>
                </Box>
                {syncEntries.map((log) => {
                    const duration = log.end && log.start ? log.end - log.start : null;

                    return (
                        <Paper key={log.id} elevation={0} sx={{ mb: 2, p: 2, bgcolor: 'action.hover' }}>
                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                                <Typography variant="h6">{log.title || log.type || 'Sync Operation'}</Typography>
                            </Box>

                            <Box sx={{ display: 'grid', gap: 0.5 }}>
                                {log.start ? <Typography variant="body2" color="text.secondary">
                                    Started: <BMoment date={log.start} format="D MMMM YYYY HH:mm" />
                                </Typography> : null}

                                {duration ? <Typography variant="body2" color="text.secondary">
                                    Duration: {formatDuration(duration)}
                                </Typography> : null}

                                {log.error ? <Typography variant="body2" color="error">
                                    Error: {log.error}
                                </Typography> : null}

                                {log.details ? <Typography variant="body2" color="text.secondary">
                                    Details: {JSON.stringify(log.details)}
                                </Typography> : null}
                            </Box>
                        </Paper>
                    );
                })}
            </Box>
        );
    };

    const renderMissingTracks = (content: string, platform: string) => {
        if (!content || content.trim() === '') {
            return (
                <Alert severity="info">
                    No missing tracks found for {platform}.
                </Alert>
            );
        }

        return (
            <Box>
                <TextField
                    multiline
                    fullWidth
                    value={content}
                    variant="outlined"
                    minRows={5}
                    maxRows={20}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            backgroundColor: 'action.hover'
                        }
                    }}
                />
            </Box>
        );
    };

    const renderLidarrLogs = () => {
        if (!data?.lidarr_sync_log || Object.keys(data.lidarr_sync_log).length === 0) {
            return (
                <Alert severity="info">
                    No Lidarr synchronization logs found. Logs will appear here after albums are sent to Lidarr.
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
                    const statusColor = log.status === 'success' ? 'success.main' :
                                       log.status === 'error' ? 'error.main' : 'warning.main';

                    return (
                        <Paper key={log.id} elevation={0} sx={{ mb: 2, p: 2, bgcolor: 'action.hover' }}>
                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                                <Typography variant="h6">{log.album_name}</Typography>
                                <Typography variant="caption" sx={{ color: statusColor }}>
                                    {log.status?.toUpperCase()}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'grid', gap: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Artist: {log.artist_name}
                                </Typography>

                                {log.start ? (
                                    <Typography variant="body2" color="text.secondary">
                                        Started: <BMoment date={log.start} format="D MMMM YYYY HH:mm" />
                                    </Typography>
                                ) : null}

                                {duration ? (
                                    <Typography variant="body2" color="text.secondary">
                                        Duration: {formatDuration(duration)}
                                    </Typography>
                                ) : null}

                                {log.error ? (
                                    <Typography variant="body2" color="error">
                                        Error: {log.error}
                                    </Typography>
                                ) : null}

                                {log.musicbrainz_album_id ? (
                                    <Typography variant="body2" color="text.secondary">
                                        MusicBrainz Album ID: {log.musicbrainz_album_id}
                                    </Typography>
                                ) : null}
                            </Box>
                        </Paper>
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

    return (
        <Paper sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="logs tabs">
                    <Tab label="Sync Logs" />
                    <Tab label="Missing Spotify Tracks" />
                    <Tab label="Missing Tidal Tracks" />
                    <Tab label="Lidarr Sync" />
                </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
                {renderSyncLogs()}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
                {renderMissingTracks(data?.missing_tracks_spotify || '', 'Spotify')}
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
                {renderMissingTracks(data?.missing_tracks_tidal || '', 'Tidal')}
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
                {renderLidarrLogs()}
            </TabPanel>
        </Paper>
    );
}