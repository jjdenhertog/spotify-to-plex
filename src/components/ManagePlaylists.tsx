import { errorBoundary } from "@/helpers/errors/errorBoundary";
import { filterUnique } from "@/helpers/filterUnique";
import { SpotifySavedItem } from "@/types/SpotifyAPI";
import { Close, KeyboardArrowRightSharp, QueueMusic, Settings, Sync, SyncDisabled } from "@mui/icons-material";
import { Box, Button, Chip, CircularProgress, Divider, IconButton, Input, Modal, ModalClose, ModalDialog, Sheet, Tooltip, Typography } from "@mui/joy";
import axios from "axios";
import { enqueueSnackbar } from "notistack";
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import PlaylistSyncSettings from "./PlaylistSyncSettings";

export default function ManagePlaylists() {
    const [loading, setLoading] = useState(true)
    const [spotifyInput, setSpotifyInput] = useState<string>('')
    const [items, setItems] = useState<SpotifySavedItem[]>([])
    const [generating, setGenerating] = useState<boolean>(false);

    ///////////////////////////////
    // Load data
    ///////////////////////////////
    useEffect(() => {
        errorBoundary(async () => {
            const result = await axios.get<SpotifySavedItem[]>(`/api/saved-items`)
            setItems(result.data)
            setLoading(false)
        }, () => {
            setLoading(false)
        })
    }, [])

    const labels = useMemo(() => {
        return items
            .map(item => item.label || "")
            .filter(item => !!item)
            .filter(filterUnique)
    }, [items])

    ///////////////////////////////
    // Add Item
    ///////////////////////////////
    const onChangeSpotifyInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setSpotifyInput(e.currentTarget.value)
    }, [])

    const onAddPlaylistClick = useCallback(() => {
        errorBoundary(async () => {
            setGenerating(true);

            const result = await axios.post<SpotifySavedItem[]>(`/api/saved-items`, {
                search: spotifyInput
            })
            setItems(result.data)
            setSpotifyInput('')
            setGenerating(false);

        }, () => {
            setGenerating(false);
        })
    }, [spotifyInput])

    ///////////////////////////////
    // Delete Item
    ///////////////////////////////
    const onDeleteItemClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {

        const { id } = e.currentTarget.dataset;
        if (id) {
            errorBoundary(async () => {
                const result = await axios.delete<SpotifySavedItem[]>(`/api/saved-items?id=${id}`)
                setItems(result.data)
                enqueueSnackbar(`Item removed`)
            })
        }
    }, [])

    ///////////////////////////////
    // Settings Item
    ///////////////////////////////
    const [editItem, setEditItem] = useState<SpotifySavedItem | null>(null)
    const onEditItemClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {

        const { id } = e.currentTarget.dataset;
        if (id) {
            const savedItem = items.find(item => item.id == id)
            if (savedItem)
                setEditItem(savedItem)
        }

    }, [items])
    const onCloseEditItem = useCallback((reload?: boolean) => {
        setEditItem(null)

        if (reload) {
            errorBoundary(async () => {
                const result = await axios.get<SpotifySavedItem[]>(`/api/saved-items`)
                setItems(result.data)
            })
        }
    }, [])

    ///////////////////////////////////////////////
    // Modify labels
    ///////////////////////////////////////////////
    const [labelName, setLabelName] = useState('')
    const [editLabel, setEditLabel] = useState<SpotifySavedItem | null>(null)

    const saveLabel = useCallback((label: string) => {
        errorBoundary(async () => {
            if (!editLabel)
                return;

            await axios.put(`/api/saved-items/`, {
                id: editLabel.id,
                label
            })

            const result = await axios.get<SpotifySavedItem[]>(`/api/saved-items`)
            setItems(result.data)

            setEditLabel(null)
            enqueueSnackbar(`Label changed to ${label}`)
        })
    }, [editLabel])

    const onEditLabelClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        const { id } = e.currentTarget.dataset
        if (typeof id == 'string') {
            // Find label
            const item = items.find(item => item.id == id)
            if (item) {
                setEditLabel(item)
                setLabelName(item.label || "")
            }
        }
    }, [items])
    const onEditLabelClose = useCallback(() => {
        setEditLabel(null)
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


    return (<>
        {loading ?
            <Box sx={{ textAlign: 'center', p: 2 }}><CircularProgress /></Box>
            :
            <>
                <Typography mb={.5} level="body-sm">Add any existing Spotify Playlist or Album. Once added you can sync it with Plex or change settings for the automated synchronisation. </Typography>


                <Divider sx={{ mt: 2, mb: 2 }} />
                <Typography mb={1} level="h2">Add Playlist or Album</Typography>
                <Typography mb={1} level="body-md">The following inputs are supported:</Typography>
                <Typography level="body-md" mt={1} mb={.5} sx={{ fontSize: ".9em" }} startDecorator={<KeyboardArrowRightSharp sx={{ fontSize: "1.1em" }} />}>Spotify URL &#40;e.g. https://open.spotify.com/playlist/37i9dQZF1EQqA6klNdJvwx &#41;</Typography>
                <Typography level="body-md" mb={2} sx={{ fontSize: ".9em" }} startDecorator={<KeyboardArrowRightSharp sx={{ fontSize: "1.1em" }} />}>Spotify URI &#40;e.g. spotify:playlist:37i9dQZF1EQqA6klNdJvwx &#41;</Typography>
                <Input placeholder="Enter your Spotify URL/URI here.." disabled={generating} value={spotifyInput} onChange={onChangeSpotifyInput} />
                <Box mt={1}>
                    <Button size="sm" disabled={generating} onClick={onAddPlaylistClick}>Add item</Button>
                </Box>
                <Divider sx={{ mt: 2, mb: 2 }} />
                {items.length > 0 &&
                    <>
                        <Typography level="h2" mt={2} mb={.5}>List</Typography>
                        {items.map(item => {
                            return <Sheet variant="soft" key={item.id} sx={{ p: 1, mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box component="img" src={item.image} height={40} />
                                    <Box>
                                        <Typography level="body-lg">{item.title}</Typography>
                                        <Box sx={{ display: 'flex', gap: .5, alignItems: 'center' }}>
                                            <Typography level="body-xs" sx={{ color: 'rgba(255,255,255,0.4)' }}>{item.type == 'spotify-album' ? 'album' : 'playlist'}</Typography>
                                            {item.sync ?
                                                <Tooltip color="neutral" title={`Automatically synced every ${item.sync_interval ?? "24"} hours`}><Sync sx={{ fontSize: '1.2em', color: 'rgba(255,255,255,0.4)' }} /></Tooltip>
                                                :
                                                <Tooltip color="neutral" title="Not automatically synced"><SyncDisabled sx={{ fontSize: '1.2em', color: 'rgba(255,255,255,0.4)' }} /></Tooltip>
                                            }
                                            <Chip size="sm" variant='outlined' sx={{ fontWeight: '100', fontSize: '.9em' }} slotProps={{ action: { 'data-id': item.id } }} onClick={onEditLabelClick}>{item.label || 'Add label'}</Chip>
                                        </Box>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                    <Tooltip title="Open Plex importer"><IconButton component='a' variant="outlined" color="primary" size="sm" href={`/import/${item.id}`}><QueueMusic sx={{ fontSize: '1em' }} /></IconButton></Tooltip>
                                    <Tooltip title="Settings"><IconButton data-id={item.id} onClick={onEditItemClick} variant="outlined" size="sm" ><Settings sx={{ fontSize: '1em' }} /></IconButton></Tooltip>
                                    <Tooltip title="Delete item"><IconButton data-id={item.id} onClick={onDeleteItemClick} variant="outlined" size="sm" ><Close sx={{ fontSize: '1em' }} /></IconButton></Tooltip>
                                </Box>
                            </Sheet>
                        })}
                    </>
                }


            </>
        }

        <PlaylistSyncSettings item={editItem} open={!!editItem} onClose={onCloseEditItem} />

        {!!editLabel && <Modal open onClose={onEditLabelClose} disableEscapeKeyDown disablePortal>
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
        </Modal>}
    </>
    )
}

