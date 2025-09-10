import { errorBoundary } from "@/helpers/errors/errorBoundary";
import { Box, Button, CircularProgress, Paper, Typography } from "@mui/material";
import axios from "axios";
import { SyncLog } from "@spotify-to-plex/shared-types/common/sync";
import { useCallback, useEffect, useState } from "react";
import BMoment from "./BMoment";
import RefreshIcon from '@mui/icons-material/Refresh';


export default function Logs() {

    const [loading, setLoading] = useState(true)
    const [logs, setLogs] = useState<SyncLog[]>([])
    const [error, setError] = useState<string | null>(null)

    const fetchLogs = useCallback(() => {
        setLoading(true);
        setError(null);
        
        errorBoundary(async () => {
            const result = await axios.get<SyncLog[]>('/api/logs')
            setLogs(result.data)
            setLoading(false)
        }, (_err: unknown) => {
            // Handle error gracefully
            setError('Failed to load logs. Please try again later.');
            setLoading(false);
        });
    }, []);
    
    useEffect(() => {
        fetchLogs();
    }, [fetchLogs])
    
    const onRefreshClick = useCallback(() => {
        fetchLogs();
    }, [fetchLogs])

    return (<Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">Sync Logs</Typography>
            <Button startIcon={<RefreshIcon />} onClick={onRefreshClick} disabled={!!loading} variant="outlined" size="small">
                Refresh
            </Button>
        </Box>
        
        {!!loading && <Box textAlign="center">
            <CircularProgress />
        </Box>}
        
        {!!error && <Box>
            <Typography color="error" variant="body1">{error}</Typography>
            <Button onClick={onRefreshClick} variant="contained" size="small" sx={{ mt: 1 }}>
                Try Again
            </Button>
        </Box>}

        {!loading && !error &&
            <>
                {logs.length === 0 && <>
                    <Typography variant="h6">No logs found</Typography>
                    <Typography variant="body2">
                        There are no logs found yet, probably because you haven&apos;t automatically synced anything yet.
                    </Typography>
                </>}

                {!!(logs.length > 0) && <>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                        Synchronisation logs
                    </Typography>
                    {logs.map(item => {
                        const { start, end, error, id, title } = item;
                        const duration = Math.ceil((end ? end - start : 0) / 1000 / 60);
                        const dnf = !end

                        return <Paper key={id} elevation={0} sx={{ mb: 1, p: 2, bgcolor: 'action.hover' }}>
                            <Typography variant="h6">{title}</Typography>
                            <Typography variant="body2">Last sync: <BMoment date={start} variant="from-now" />  </Typography>
                            {!!dnf && <Typography color="error" variant="body2">Did not complete</Typography>}
                            {!!error && <Typography color="error" variant="body2">{error}</Typography>}
                            {!!duration && <Typography variant="body2">Duration: {duration} minute{duration > 1 ? 's' : ''}</Typography>}
                        </Paper>
                    })}
                </>}
            </>
        }
    </Paper>)
}