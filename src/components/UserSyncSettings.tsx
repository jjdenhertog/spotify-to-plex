import { errorBoundary } from "@/helpers/errors/errorBoundary";
import { GetSpotifyUserResponse } from "@/pages/api/spotify/users";
import CloseIcon from '@mui/icons-material/Close';
import { Box, Button, CircularProgress, Divider, FormControl, FormHelperText, FormLabel, IconButton, Modal, Switch, TextField, Typography } from "@mui/material";
import axios from "axios";
import { enqueueSnackbar } from "notistack";
import { ChangeEvent, useCallback, useEffect, useState } from "react";

type Props = {
    readonly onClose: (reload?: boolean) => void
    readonly user: GetSpotifyUserResponse
}

export default function UserSyncSettings(props: Props) {
    const { user } = props;
    const [autoSync, setAutoSync] = useState(false);
    const [label, setLabel] = useState('')
    const [recentContext, setRecentContext] = useState(false);
    const [loading] = useState(false);

    //////////////////////////////
    // Making changes
    //////////////////////////////
    const onLabelChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setLabel(e.target.value)
    }, [])

    const onSwitchChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        switch (e.target.dataset.id) {
            case "autosync":
                setAutoSync(e.target.checked)
                break;
            case "recent-context":
                setRecentContext(e.target.checked)
                break;
        }
    }, [])

    const onSaveChangesClick = useCallback(() => {

        errorBoundary(async () => {
            if (!user)
                return;

            await axios.put(`/api/spotify/users/`, {
                id: user.id,
                sync: autoSync,
                label,
                recent_context: recentContext
            })

            enqueueSnackbar(`[${user.name}] Changes saved`)

             
            props.onClose(true)
        })

    }, [user, autoSync, label, recentContext, props])

    //////////////////////////////
    // Close dialog
    //////////////////////////////
    const onClose = useCallback((_e: unknown, reason: string) => {
        if (reason == 'closeClick')
             
            props.onClose()
    }, [props])

    /////////////////////////////////////
    // Load item data
    /////////////////////////////////////
    useEffect(() => {

        setAutoSync(!!user.sync)
        setRecentContext(!!user.recentContext)
        setLabel(user.label || "")
    }, [user])

    const hasChanges = (
        (user.label || "") != label ||
        !!(Boolean(user?.sync) != autoSync) ||
        !!(Boolean(user?.recentContext) != recentContext)
    )

    return (<Modal open onClose={onClose}>
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', maxWidth: 500, bgcolor: 'background.paper', p: 3, borderRadius: 1 }}>
            <IconButton
                size="small"
                onClick={(e) => onClose(e, 'closeClick')}
                sx={{ position: 'absolute', right: 8, top: 8 }}
            >
                <CloseIcon fontSize="small" />
            </IconButton>
            {!!loading && <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
            </Box>}

            {!loading && <>
                <Typography variant="h6">Sync settings</Typography>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="body1">Below you find the settings for the selected items.</Typography>
                </Box>

                <FormControl sx={{ mb: 2 }}>
                    <FormLabel component="legend">Automatic sync</FormLabel>
                    <FormHelperText>When enabled, this item will be synced automatically.</FormHelperText>
                    <Switch
                        checked={autoSync}
                        onChange={onSwitchChange}
                        color="success"
                    />
                </FormControl>

                {!!autoSync &&
                    <FormControl sx={{ mb: 2 }}>
                        <FormLabel component="legend">Label</FormLabel>
                        <FormHelperText>Created playlists will get this label</FormHelperText>
                        <TextField
                            size="small"
                            value={label}
                            onChange={onLabelChange}
                        />
                    </FormControl>
                }

                <Divider sx={{ mt: 1, mb: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button variant="contained" disabled={!hasChanges} onClick={onSaveChangesClick}>Save changes</Button>
                </Box>
            </>}
        </Box>
    </Modal>)
}