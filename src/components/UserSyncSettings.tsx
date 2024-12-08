import { errorBoundary } from "@/helpers/errors/errorBoundary";
import { GetSpotifyUserResponse } from "@/pages/api/spotify/users";
import { Box, Button, Divider, FormControl, FormLabel, Input, Modal, ModalClose, ModalDialog, Switch, Typography } from "@mui/joy";
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

            // eslint-disable-next-line react/destructuring-assignment
            props.onClose(true)
        })

    }, [user, autoSync, label, recentContext, props])

    //////////////////////////////
    // Close dialog
    //////////////////////////////
    const onClose = useCallback((_e: unknown, reason: string) => {
        if (reason == 'closeClick')
            // eslint-disable-next-line react/destructuring-assignment
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

    return (<Modal open onClose={onClose} disableEscapeKeyDown disablePortal>
        <ModalDialog sx={{ maxWidth: '400px' }}>
            <ModalClose />

            {user ? <>
                <Typography level="h1">{user.name}</Typography>
                <Typography level="body-md">You can enable automatic syncing, which you can use to sync user specific playlists.</Typography>
                <Box sx={{ mt: 2 }}>
                    <FormControl orientation="horizontal" sx={{ justifyContent: 'space-between', mb: 2 }}>
                        <FormLabel>Automatic syncing</FormLabel>
                        <Switch
                            checked={autoSync}
                            onChange={onSwitchChange}
                            color={autoSync ? 'success' : 'neutral'}
                            variant={autoSync ? 'solid' : 'outlined'}
                            endDecorator={autoSync ? 'On' : 'Off'}
                            slotProps={{
                                input: { 'data-id': 'autosync' },
                                endDecorator: {
                                    sx: {
                                        minWidth: 24,
                                    },
                                },
                            }}
                        />
                    </FormControl>

                    {!!autoSync &&
                        <>
                            <Divider sx={{ mb: 2 }} />
                            <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between" }}>
                                <Box>
                                    <Typography level="h1">Label</Typography>
                                    <Typography level="body-sm">Created playlists will get this label</Typography>
                                </Box>
                                <Box sx={{ width: 100, display: 'flex', alignItems: 'center' }}>
                                    <Input value={label} size="sm" onChange={onLabelChange} />
                                </Box>
                            </Box>


                            <FormControl orientation="horizontal" sx={{ justifyContent: 'space-between', mb: 3 }}>
                                <FormLabel sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <Typography level="body-md" fontWeight="bold">Recently playlists or albums</Typography>
                                    <Typography level="body-sm" pr={3}>Syncs playlists and albums based on the last 50 played songs.</Typography>
                                </FormLabel>
                                <Switch
                                    checked={recentContext}
                                    onChange={onSwitchChange}
                                    color={recentContext ? 'success' : 'neutral'}
                                    variant={recentContext ? 'solid' : 'outlined'}
                                    endDecorator={recentContext ? 'On' : 'Off'}
                                    slotProps={{
                                        input: { 'data-id': 'recent-context' },
                                        endDecorator: {
                                            sx: {
                                                minWidth: 24,
                                            },
                                        },
                                    }}
                                />
                            </FormControl>

                        </>

                    }

                    <Divider sx={{ mt: 1, mb: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button disabled={!hasChanges} onClick={onSaveChangesClick}>Save changes</Button>
                    </Box>
                </Box>

            </> : null
            }
        </ModalDialog>
    </Modal>)
}