import { errorBoundary } from "@/helpers/errors/errorBoundary";
import { Box, CircularProgress, Sheet, Typography } from "@mui/joy";
import axios from "axios";
import { SyncLog } from "cronjob/albums";
import { useEffect, useState } from "react";
import BMoment from "./BMoment";


export default function Logs() {

    const [loading, setLoading] = useState(true)
    const [logs, setLogs] = useState<SyncLog[]>([])

    useEffect(() => {

        errorBoundary(async () => {
            const result = await axios.get<SyncLog[]>('/api/logs')
            setLogs(result.data)
            setLoading(false)
        })
    }, [])

    return (<Sheet>
        {!!loading && <Box textAlign="center">
            <CircularProgress />
        </Box>}

        {!loading &&
            <>
                {logs.length == 0 && <>
                    <Typography level="h1">No logs found</Typography>
                    <Typography level="body-sm">There are no logs found yet, probably because you haven&apos;t automatically synced anything yet.</Typography>
                </>}

                {logs.length > 0 && <>
                    <Typography level="h1" mb={1}>Synchronisation logs</Typography>
                    {logs.map(item => {
                        const { start, end, error, id, title } = item;
                        const duration = Math.ceil((end ? end - start : 0) / 1000 / 60);
                        const dnf = !end

                        return <Sheet key={id} variant="soft" sx={{ mb: 1 }}>
                            <Box p={2}>
                                <Typography level="h2">{title}</Typography>
                                <Typography level="body-sm">Last sync: <BMoment date={start} variant="from-now" />  </Typography>
                                {!!dnf && <Typography color="danger" level="body-sm">Did not complete</Typography>}
                                {!!error && <Typography color="danger" level="body-sm">{error}</Typography>}
                                {!!duration && <Typography level="body-sm">Duration: {duration} minute{duration > 1 && 's'}</Typography>}
                            </Box>
                        </Sheet>
                    })}
                </>}
            </>
        }
    </Sheet>)
}