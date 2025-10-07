import PlexConnection from "@/components/PlexConnection";
import { Close } from "@mui/icons-material";
import { Alert, Box, Dialog, DialogContent, DialogTitle, IconButton, Typography } from "@mui/material";
import { useEffect, useState } from "react";

import { GetSettingsResponse } from "../../pages/api/settings";
import { errorBoundary } from "@/helpers/errors/errorBoundary";
import axios from "axios";
import { useRouter } from "next/router";
import { enqueueSnackbar } from "notistack";

type PlexConnectionDialogProps = {
    readonly onClose: () => void;
}

const PlexConnectionDialog = (props: PlexConnectionDialogProps) => {

    const { onClose } = props;

    const [settings, setSettings] = useState<GetSettingsResponse>();
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter()

    useEffect(() => {
        errorBoundary(async () => {
            const settings = await axios.get<GetSettingsResponse>("/api/settings");
            setSettings(settings.data);
            setConnected(settings.data.loggedin);
            setLoading(false);
        }, undefined, true);
    }, []);


    useEffect(() => {
        if (!router.isReady) return;

        if (router.query.plex) {
            errorBoundary(async () => {
                const result = await axios.post<{ ok: boolean; }>('/api/auth/verify');
                if (result.data.ok) {
                    setLoading(true);
                    const settings = await axios.get<GetSettingsResponse>("/api/settings");
                    if (settings.data.loggedin)
                        setSettings(settings.data);

                    setConnected(settings.data.loggedin);
                    setLoading(false);

                    enqueueSnackbar("Plex connection verified", { variant: "success" });

                }

                router.replace("/", undefined, { shallow: true });
            });
        }
    }, [router, router.isReady]);


    return (
        <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Plex Server Connection
                <IconButton onClick={onClose} size="small">
                    <Close />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                {!!loading &&
                    <Box display="flex" justifyContent="center">
                        <Alert severity="info" sx={{ ml: 2 }}>
                            Checking your connection with Plex
                        </Alert>
                    </Box>
                }

                {!loading && <>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Select your Plex Media Server to enable music synchronization.
                    </Typography>
                    <PlexConnection settings={settings} setSettings={setSettings} connected={connected} setConnected={setConnected} />
                </>
                }
            </DialogContent>
        </Dialog>
    );
};

export default PlexConnectionDialog;