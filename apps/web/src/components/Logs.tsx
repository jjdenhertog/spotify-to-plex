/* eslint-disable react/no-multi-comp */
import { errorBoundary } from "@/helpers/errors/errorBoundary";
import { Alert, Box, CircularProgress, Paper, Tab, Tabs, TextField, Typography } from "@mui/material";
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

    useEffect(() => {
        errorBoundary(async () => {
            const result = await axios.get<GetLogsResponse>('/api/logs');
            setData(result.data);
            setLoading(false);
        });
    }, []);

    const handleTabChange = useCallback((_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    }, []);

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
                <Alert severity="info">
                    No synchronization logs found. Logs will appear here after your first sync.
                </Alert>
            );
        }

        // Convert sync_log object to array and sort by start time (descending)
        const syncEntries = Object.entries(data.sync_log)
            .map(([id, log]: [string, any]) => ({ id, ...log }))
            .sort((a, b) => (b.start || 0) - (a.start || 0));

        return (
            <Box>
                {syncEntries.map((log) => {
                    const duration = log.end && log.start ? log.end - log.start : null;

                    return (
                        <Paper key={log.id} elevation={0} sx={{ mb: 2, p: 2, bgcolor: 'action.hover' }}>
                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                                <Typography variant="h6">{log.title || log.type || 'Sync Operation'}</Typography>
                            </Box>

                            <Box sx={{ display: 'grid', gap: 0.5 }}>
                                {log.start ? <Typography variant="body2" color="text.secondary">
                                    Started: <BMoment date={log.start} variant="date" />
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
        </Paper>
    );
}