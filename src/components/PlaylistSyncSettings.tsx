import { errorBoundary } from "@/helpers/errors/errorBoundary";
import { SpotifySavedItem } from "@/types/SpotifyAPI";
import { Box, Button, Divider, FormControl, FormHelperText, FormLabel, Input, Modal, ModalClose, ModalDialog, Switch, Typography } from "@mui/joy";
import axios from "axios";
import { enqueueSnackbar } from "notistack";
import { ChangeEvent, useCallback, useEffect, useState } from "react";

type Props = {

    readonly onClose: (reload?: boolean) => void
    readonly open: boolean,
    readonly item: SpotifySavedItem | null
}

export default function PlaylistSyncSettings(props: Props) {
    const { open, item } = props;
    const [autoSync, setAutoSync] = useState(false);
    const [hours, setHours] = useState("24");

    //////////////////////////////
    // Making changes
    //////////////////////////////
    const onAutoSyncChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setAutoSync(e.target.checked)
    }, [])

    const onHoursChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.value)
            setHours(e.target.value)
    }, [])

    const onSaveChangesClick = useCallback(() => {

        errorBoundary(async () => {
            if (!item)
                return;

            const validateHours = Number(hours)
            if (isNaN(validateHours) || validateHours < 2)
                throw new Error(`The value should not be lower than two hours, due to API limitations.`)

            await axios.put(`/api/saved-items/`, {
                id: item.id,
                sync: autoSync,
                sync_interval: hours
            })

            enqueueSnackbar(`[${item.title}] Changes saved`)

            // eslint-disable-next-line react/destructuring-assignment
            props.onClose(true)
        })

    }, [autoSync, hours, item, props])

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
        if (!item)
            return;

        setAutoSync(!!item.sync)
        setHours(item.sync_interval ?? "24")

    }, [item])

    const hasChanges = (
        !!(Boolean(item?.sync) != autoSync) ||
        !!((item?.sync_interval ?? "24") != hours)
    )

    return (<Modal open={open} onClose={onClose} disableEscapeKeyDown disablePortal>
        <ModalDialog sx={{ maxWidth: '400px' }}>
            <ModalClose />

            {item ? <>
                <Typography level="h1">{item.title}</Typography>
                <Typography level="body-md">The settings below are only used while synchronizing this item. These are ignored during manual syncing.</Typography>
                <Divider sx={{ mt: 1, mb: 1 }} />
                <Box>
                    <FormControl orientation="horizontal" sx={{ justifyContent: 'space-between', mb: 3 }}>
                        <FormLabel>Automatic syncing</FormLabel>
                        <Switch
                            checked={autoSync}
                            onChange={onAutoSyncChange}
                            color={autoSync ? 'success' : 'neutral'}
                            variant={autoSync ? 'solid' : 'outlined'}
                            endDecorator={autoSync ? 'On' : 'Off'}
                            slotProps={{
                                endDecorator: {
                                    sx: {
                                        minWidth: 24,
                                    },
                                },
                            }}
                        />
                    </FormControl>

                    {!!autoSync &&
                        <FormControl orientation="horizontal" sx={{ justifyContent: 'space-between' }}>
                            <div>
                                <FormLabel>Interval (hours)</FormLabel>
                                <FormHelperText sx={{ mt: 0 }}>Read the sync instruction on Github for extra information.</FormHelperText>
                            </div>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>

                                <Input
                                    sx={{ width: 100 }}
                                    type="number"
                                    value={hours}
                                    slotProps={{
                                        input: {
                                            min: 2
                                        }
                                    }}

                                    onChange={onHoursChange}
                                    endDecorator={<Typography level="body-xs">hrs</Typography>}
                                />

                            </Box>
                        </FormControl>
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