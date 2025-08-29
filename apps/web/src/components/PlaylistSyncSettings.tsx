import { errorBoundary } from "@/helpers/errors/errorBoundary";
import { filterUnique } from "@spotify-to-plex/shared-utils/array/filterUnique";
// MIGRATED: Updated to use shared utils package
import { SavedItem } from "@spotify-to-plex/shared-types/spotify/api";
// MIGRATED: Updated to use shared types package
import CloseIcon from '@mui/icons-material/Close';
import { Box, Button, Checkbox, Chip, CircularProgress, Divider, FormControlLabel, FormGroup, IconButton, Modal, TextField, Typography } from "@mui/material";
import axios from "axios";
import { enqueueSnackbar } from "notistack";
import { ChangeEvent, useCallback, useEffect, useState } from "react";

type Props = {
    readonly onClose: (reload?: boolean) => void
    readonly labels: string[],
    readonly items: SavedItem[]
}

export default function PlaylistItemSettings(props: Props) {
    const { items, labels, onClose } = props;
    const [autoSync, setAutoSync] = useState(false);
    const [days, setDays] = useState("2");
    const [loading, setLoading] = useState(false);

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
            setLoading(true);
            if (!items)
                return;

            const validateDays = Number(days)
            if (isNaN(validateDays) || validateDays < 0)
                throw new Error(`The value should not be lower than zero days.`)

            await axios.put(`/api/saved-items/`, {
                ids: items.map(item => item.id),
                sync: autoSync,
                sync_interval: days,
                label,
            })

            enqueueSnackbar(`Changes saved`)

            onClose(true)
        }, () => {
            setLoading(false);
        })

    }, [autoSync, days, items, label, onClose])

    //////////////////////////////
    // Close dialog
    //////////////////////////////
    const onCloseClick = useCallback(() => {
        onClose()
    }, [onClose])

    /////////////////////////////////////
    // Load item data
    /////////////////////////////////////
    useEffect(() => {
        if (!items || items.length == 0)
            return;

        const [firstItem] = items
        if (firstItem) {
            setAutoSync(!!firstItem.sync)
            setDays(firstItem.sync_interval ?? "2")
        }

        const labels = items
            .map(item => item.label || "")
            .filter(filterUnique)

        if (labels.length == 1 && labels[0])
            setLabel(labels[0])

    }, [items])

    const onEditLabelChipClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const labelValue = e.currentTarget.dataset.label;
        if (labelValue?.trim())
            setLabel(labelValue.trim())
    }, [])

    return (<Modal open>
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', maxWidth: 500, bgcolor: 'background.paper', p: 3, borderRadius: 1 }}>
            <IconButton size="small" onClick={onCloseClick} sx={{ position: 'absolute', right: 8, top: 8 }}>
                <CloseIcon fontSize="small" />
            </IconButton>
            {!!loading && <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
            </Box>}

            {!loading && <>

                <Typography variant="h6">Category name</Typography>
                <Typography variant="body2" mb={1}>This name can be used to group playlists and album and use it for sorting and other purposes.</Typography>
                <TextField
                    autoFocus
                    value={label}
                    onChange={onEditLabelChange}
                    size="small"
                    fullWidth
                />
                <Box sx={{ mt: 1 }}>
                    {labels.map(label => (
                        <Chip
                            variant="outlined"
                            size="small"
                            sx={{ mr: .5, mb: .5 }}
                            key={label}
                            data-label={label}
                            onClick={onEditLabelChipClick}
                            label={label}
                        />
                    ))}
                </Box>

                <Divider sx={{ mt: 2, mb: 2 }} />
                <Typography variant="h6">Sync settings</Typography>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="body1">Below you find the settings for the selected items.</Typography>
                </Box>

                <Box display="flex" gap={2}>
                    <FormGroup>
                        <FormControlLabel control={<Checkbox checked={autoSync} onChange={onAutoSyncChange} />} label="Automatic sync" />
                    </FormGroup>

                    {!!autoSync &&
                        <>
                            <Box>
                                <Divider orientation="vertical" />
                            </Box>
                            <Box>
                                <Typography variant="body1" mt={1.5} mb={1}>Sync interval (in days)</Typography>
                                <TextField type="number" value={days} size="small" onChange={onDaysChange} />
                            </Box>
                        </>

                    }
                </Box>

                <Divider sx={{ mt: 3, mb: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button variant="contained" onClick={onSaveChangesClick}>Save changes</Button>
                </Box>
            </>}
        </Box>
    </Modal >)
}