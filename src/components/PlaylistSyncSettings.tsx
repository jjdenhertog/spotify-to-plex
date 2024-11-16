import { errorBoundary } from "@/helpers/errors/errorBoundary";
import { SavedItem } from "@/types/SpotifyAPI";
import { Box, Button, Divider, FormControl, FormHelperText, FormLabel, Input, Modal, ModalClose, ModalDialog, Switch, Typography } from "@mui/joy";
import axios from "axios";
import { enqueueSnackbar } from "notistack";
import { ChangeEvent, useCallback, useEffect, useState } from "react";

type Props = {
    readonly onClose: (reload?: boolean) => void
    readonly items: SavedItem[]
}

export default function PlaylistSyncSettings(props: Props) {
    const { items } = props;
    const [autoSync, setAutoSync] = useState(false);
    const [days, setDays] = useState("2");

    ///////////////////////////////////////////////
    // Modify labels
    ///////////////////////////////////////////////
    const [label, setLabel] = useState('')
    const onEditLabelChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setLabel(e.target.value)
    }, [])

    //////////////////////////////
    // Making changes
    //////////////////////////////
    const onAutoSyncChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setAutoSync(e.target.checked)
    }, [])

    const onDaysChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.value)
            setDays(e.target.value)
    }, [])

    const onSaveChangesClick = useCallback(() => {

        errorBoundary(async () => {
            if (!items)
                return;

            const validateDays = Number(days)
            if (isNaN(validateDays) || validateDays < 0)
                throw new Error(`The value should not be lower than zero days.`)

            await axios.put(`/api/saved-items/`, {
                ids: items.map(item => item.id),
                sync: autoSync,
                sync_interval: days,
                label: (items.length > 1 && label.trim() != '') ? label : undefined
            })

            enqueueSnackbar(`Changes saved`)

            // eslint-disable-next-line react/destructuring-assignment
            props.onClose(true)
        })

    }, [autoSync, days, items, label, props])

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
        if (!items)
            return;

        // eslint-disable-next-line @typescript-eslint/prefer-destructuring
        const firstItem = items[0]

        if (firstItem) {
            setAutoSync(!!firstItem.sync)
            setDays(firstItem.sync_interval ?? "2")
        }

    }, [items])

    return (<Modal open onClose={onClose} disableEscapeKeyDown disablePortal>
        <ModalDialog sx={{ maxWidth: '400px' }}>
            <ModalClose />

            {items ? <>
                <Typography level="h1">{items.length > 1 ? "Settings" : items[0].title}</Typography>
                <Typography level="body-md">The settings below are only used while synchronizing this item. These are ignored during manual syncing.</Typography>

                {items.length > 1 &&
                    <>
                        <Divider />
                        <FormControl orientation="horizontal" sx={{ justifyContent: 'space-between' }}>
                            <div>
                                <FormLabel>Label</FormLabel>
                                <FormHelperText sx={{ mt: 0 }}>This label will be connected<br />to any items added.</FormHelperText>
                            </div>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>

                                <Input
                                    sx={{ width: 100 }}
                                    value={label}
                                    placeholder="Add label"
                                    onChange={onEditLabelChange}
                                />

                            </Box>
                        </FormControl>
                    </>
                }
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
                                <FormLabel>Interval (days)</FormLabel>
                                <FormHelperText sx={{ mt: 0 }}>Read the sync instruction on Github for extra information.</FormHelperText>
                            </div>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>

                                <Input
                                    sx={{ width: 100 }}
                                    type="number"
                                    value={days}
                                    slotProps={{
                                        input: {
                                            min: 0
                                        }
                                    }}

                                    onChange={onDaysChange}
                                    endDecorator={<Typography level="body-xs">day{days == '1' ? '' : 's'}</Typography>}
                                />

                            </Box>
                        </FormControl>
                    }

                    <Divider sx={{ mt: 1, mb: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button onClick={onSaveChangesClick}>Save changes</Button>
                    </Box>
                </Box>

            </> : null
            }
        </ModalDialog>
    </Modal>)
}