import { errorBoundary } from "@/helpers/errors/errorBoundary"
import { SavedItem } from "@/types/SpotifyAPI"
import { Close, QueueMusic, Settings, Sync, SyncDisabled } from "@mui/icons-material"
import { Box, Button, Chip, IconButton, Input, Modal, ModalClose, ModalDialog, Sheet, Tooltip, Typography } from "@mui/joy"
import axios from "axios"
import { enqueueSnackbar } from "notistack"
import { ChangeEvent, useCallback, useState } from "react"
import { useIsSelected, useSelectionEvent } from "react-selection-manager"
import PlaylistSyncSettings from "./PlaylistSyncSettings"

type Props = {
    readonly item: SavedItem,
    readonly orderedIds: string[],
    readonly labels: string[],
    readonly reloadSavedItems: () => void
}
export default function ManagePlaylistItem(props: Props) {
    const { item, orderedIds, labels, reloadSavedItems } = props;
    const layerSelected = useIsSelected(item.id)
    const onSelect = useSelectionEvent();

    const onCheckboxChange = useCallback((e: React.MouseEvent<HTMLSpanElement>) => {
        onSelect({
            id: item.id,
            type: "playlist",
            shiftKey: e.shiftKey,
            metaKey: e.metaKey,
            orderedIds
        });

    }, [item.id, onSelect, orderedIds])

    ///////////////////////////////
    // Settings Item
    ///////////////////////////////
    const [editItem, setEditItem] = useState(false)
    const onEditItemClick = useCallback((e: React.SyntheticEvent) => {
        e.preventDefault()
        e.stopPropagation();

        setEditItem(true)
    }, [])
    const onCloseEditItem = useCallback((reload?: boolean) => {
        setEditItem(false)
        if (reload)
            reloadSavedItems()
    }, [reloadSavedItems])

    ///////////////////////////////
    // Delete Item
    ///////////////////////////////
    const onDeleteItemClick = useCallback((e: React.SyntheticEvent) => {
        e.preventDefault()
        e.stopPropagation();

        errorBoundary(async () => {
            await axios.delete<SavedItem[]>(`/api/saved-items?id=${item.id}`)
            reloadSavedItems()
            enqueueSnackbar(`Item removed`)
        })
    }, [item, reloadSavedItems])

    ///////////////////////////////////////////////
    // Modify labels
    ///////////////////////////////////////////////
    const [labelName, setLabelName] = useState('')
    const [editLabel, setEditLabel] = useState(false)
    const saveLabel = useCallback((label: string) => {
        errorBoundary(async () => {
            await axios.put(`/api/saved-items/`, {
                ids: [item.id],
                label
            })

            reloadSavedItems()
            setEditLabel(false)
            enqueueSnackbar(`Label changed to ${label}`)
        })
    }, [item.id, reloadSavedItems])

    const onEditLabelClick = useCallback((e: React.SyntheticEvent) => {
        e.preventDefault()
        e.stopPropagation();

        setEditLabel(true)
        setLabelName(item.label || "")
    }, [item])
    const onEditLabelClose = useCallback(() => {
        setEditLabel(false)
    }, [])
    const onEditLabelChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setLabelName(e.target.value)
    }, [])
    const onEditLabelSaveClick = useCallback(() => {
        saveLabel(labelName)
    }, [labelName, saveLabel])
    const onEditLabelChipClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {

        const { label } = e.currentTarget.dataset;
        if (typeof label == 'string' && label.trim())
            saveLabel(label.trim())
    }, [saveLabel])

    return (
        <>
            <Sheet variant="soft" color={layerSelected ? "primary" : "neutral"} key={item.id} sx={{ p: 1, mb: 1, display: 'flex', alignItems: 'center', userSelect: 'none', justifyContent: 'space-between', gap: 1, cursor: 'pointer' }} onClick={onCheckboxChange}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }} >
                    <Box component="img" src={item.image} height={40} />
                    <Box>
                        <Typography level="body-lg">{item.title}</Typography>
                        <Box sx={{ display: 'flex', gap: .5, alignItems: 'center' }}>
                            {item.type == 'plex-media' ?
                                <Typography level="body-xs" sx={{ color: 'rgba(255,255,255,0.4)' }}>Plex media</Typography>
                                :
                                <>
                                    <Typography level="body-xs" sx={{ color: 'rgba(255,255,255,0.4)' }}>{item.type == 'spotify-album' ? 'album' : 'playlist'}</Typography>
                                    {item.sync ?
                                        <Tooltip color="neutral" title={`Automatically synced every ${item.sync_interval ?? "1"} days`}><Sync sx={{ fontSize: '1.2em', color: 'rgba(255,255,255,0.4)' }} /></Tooltip>
                                        :
                                        <Tooltip color="neutral" title="Not automatically synced"><SyncDisabled sx={{ fontSize: '1.2em', color: 'rgba(255,255,255,0.4)' }} /></Tooltip>
                                    }
                                </>
                            }
                            <Chip size="sm" variant='outlined' sx={{ fontWeight: '100', fontSize: '.9em' }} slotProps={{ action: { 'data-id': item.id } }} onClick={onEditLabelClick}>{item.label || 'Add label'}</Chip>
                        </Box>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                    {item.type != 'plex-media' &&
                        <>
                            <Tooltip title="Open Plex importer"><IconButton component='a' variant="outlined" color="primary" size="sm" href={`/import/${item.id}`}><QueueMusic sx={{ fontSize: '1em' }} /></IconButton></Tooltip>
                            <Tooltip title="Settings"><IconButton data-id={item.id} onClick={onEditItemClick} variant="outlined" size="sm" ><Settings sx={{ fontSize: '1em' }} /></IconButton></Tooltip>
                        </>
                    }
                    <Tooltip title="Delete item"><IconButton data-id={item.id} onClick={onDeleteItemClick} variant="outlined" size="sm" ><Close sx={{ fontSize: '1em' }} /></IconButton></Tooltip>
                </Box>
            </Sheet>

            {!!editItem && <PlaylistSyncSettings items={[item]} onClose={onCloseEditItem} />}

            {
                !!editLabel && <Modal open onClose={onEditLabelClose} disableEscapeKeyDown disablePortal>
                    <ModalDialog sx={{ maxWidth: '400px' }}>
                        <ModalClose />
                        <Typography level="h1">Label name</Typography>
                        <Typography level="body-md">This name can be used to group playlists and album and use it for sorting and other purposes.</Typography>
                        <Input autoFocus value={labelName} onChange={onEditLabelChange} />
                        <Box>
                            {labels.map(item => <Chip variant="outlined" size="sm" sx={{ mr: .5, mb: .5 }} key={item} slotProps={{ action: { 'data-label': item } }} onClick={onEditLabelChipClick}>{item}</Chip>)}
                        </Box>
                        <Box mt={.5}>
                            <Button size="sm" onClick={onEditLabelSaveClick}>Save Label</Button>
                        </Box>
                    </ModalDialog>
                </Modal>
            }
        </>
    )
}