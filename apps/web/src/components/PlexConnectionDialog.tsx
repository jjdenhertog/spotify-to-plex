import PlexConnection from "@/components/PlexConnection";
import { Close } from "@mui/icons-material";
import { Dialog, DialogContent, DialogTitle, IconButton, Typography } from "@mui/material";
import { Dispatch, SetStateAction } from "react";

import { GetSettingsResponse } from "../../pages/api/settings";

type PlexConnectionDialogProps = {
    readonly open: boolean;
    readonly onClose: () => void;
    readonly settings: GetSettingsResponse | undefined;
    readonly setSettings: Dispatch<SetStateAction<GetSettingsResponse | undefined>>;
    readonly connected: boolean;
    readonly setConnected: Dispatch<SetStateAction<boolean>>;
}

const PlexConnectionDialog = ({
    open,
    onClose,
    settings,
    setSettings,
    connected,
    setConnected
}: PlexConnectionDialogProps) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Plex Server Connection
                <IconButton onClick={onClose} size="small">
                    <Close  />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Select your Plex Media Server to enable music synchronization.
                </Typography>
                <PlexConnection settings={settings} setSettings={setSettings} connected={connected} setConnected={setConnected} />
            </DialogContent>
        </Dialog>
    );
};

export default PlexConnectionDialog;