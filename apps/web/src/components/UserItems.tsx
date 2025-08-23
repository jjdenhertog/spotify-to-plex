import { errorBoundary } from "@/helpers/errors/errorBoundary";
import { GetSpotifyUserResponse } from "@/pages/api/spotify/users";
import { GetSpotifyAlbum, GetSpotifyPlaylist, SavedItem } from "@spotify-to-plex/shared-types";
// MIGRATED: Updated to use shared types package
import { Add, Check } from "@mui/icons-material";
import CloseIcon from '@mui/icons-material/Close';
import { Box, Button, CircularProgress, Divider, IconButton, Modal, Paper, TextField, Tooltip, Typography } from "@mui/material";
import axios from "axios";
import { enqueueSnackbar } from "notistack";
import { ChangeEvent, useCallback, useEffect, useState } from "react";

type Props = {
    readonly onClose: (event: React.MouseEvent | React.KeyboardEvent | Record<string, never>, reason?: string) => void,
    readonly user: GetSpotifyUserResponse
    readonly type: 'albums' | 'playlists'
}

export default function UserItems(props: Props) {

    const { type, user, onClose: propsOnClose } = props;
    const [items, setItems] = useState<(GetSpotifyAlbum | GetSpotifyPlaylist)[]>([])

    ///////////////////////////////////////////////
    // Load items
    ///////////////////////////////////////////////
    const [loading, setLoading] = useState(true)
    useEffect(() => {
        errorBoundary(async () => {
            const result = await axios.get(`/api/spotify/users/${user.id}/items?type=${type}`)
            setItems(result.data);
            setLoading(false)
        }, () => {
            setLoading(false)
        })

    }, [type, user.id])

    const handleClose = useCallback((event: React.MouseEvent | React.KeyboardEvent | Record<string, never>, reason?: string) => {
        if (reason == 'closeClick')
            propsOnClose(event, reason)

    }, [propsOnClose])
    
    const handleCloseClick = useCallback((e: React.MouseEvent) => {
        handleClose(e, 'closeClick')
    }, [handleClose])

    ///////////////////////////////////////////////
    // Modify labels
    ///////////////////////////////////////////////
    const [label, setLabel] = useState('')
    const onEditLabelChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setLabel(e.target.value)
    }, [])

    ///////////////////////////////////////////////
    // Adding item
    ///////////////////////////////////////////////
    const [addingItems, setAddingItems] = useState<string[]>([])
    const onAddClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        const { id } = e.currentTarget.dataset;
        const { id: user_id } = user;

        const item = items.find(item => item.id == id)
        if (item) {
            let searchId = 'spotify:'
            if (type == 'albums')
                searchId += 'album:'

            if (type == 'playlists')
                searchId += 'playlist:'

            searchId += id;

            const itemId = item.id

            errorBoundary(async () => {
                // Add loading
                setAddingItems(prev => [...prev, itemId])

                await axios.post<SavedItem[]>(`/api/saved-items`, { id: searchId, user_id, label })
                enqueueSnackbar(`Added ${item.title}`)
                // Set added item to added
                setItems(prev => prev.map(item => {

                    if (item.id != id)
                        return item;

                    return {
                        ...item,
                        added: true
                    }
                }))

                // Remove loading
                setAddingItems(prev => {
                    const idx = prev.indexOf(itemId);
                    if (idx != -1)
                        prev.splice(idx, 1)

                    return prev;
                })
            }, () => {
                setAddingItems(prev => {
                    const idx = prev.indexOf(itemId);
                    if (idx != -1)
                        prev.splice(idx, 1)

                    return prev;
                })
            })
        }
    }, [items, label, type, user])



    ///////////////////////////////////////////////
    // Pagination
    ///////////////////////////////////////////////
    const pageSize = 8;
    const totalPages = Math.ceil(items.length / pageSize)
    const [page, setPage] = useState<number>(0);
    const prevPageClick = useCallback(() => {
        setPage(prev => prev - 1)
    }, [])
    const nextPageClick = useCallback(() => {
        setPage(prev => prev + 1)
    }, [])

    const visibleItems = items.slice(page * pageSize, (page * pageSize) + pageSize)
    let curEnd = (page * pageSize) + pageSize;
    if (curEnd > items.length)
        curEnd = items.length;


    return (<Modal open onClose={handleClose}>
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', maxWidth: 600, bgcolor: 'background.paper', p: 3, borderRadius: 1 }}>
            <IconButton
                size="small"
                onClick={handleCloseClick}
                sx={{ position: 'absolute', right: 8, top: 8 }}
            >
                <CloseIcon fontSize="small" />
            </IconButton>
            {!!loading && <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
            </Box>}

            {!loading &&
                <>
                    <Typography variant="h6">Add {type}</Typography>
                    <Typography variant="body1">Below you find an overview of all the {type} that you have saved in Spotify.</Typography>
                    <Divider sx={{ mt: 2, mb: 2 }} />
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'action.hover' }}>
                        <Typography variant="h6" sx={{ mb: 0.5 }}>Label name</Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>This label will be connected to any items added.</Typography>
                        <TextField
                            value={label}
                            size="small"
                            sx={{ maxWidth: 200 }}
                            placeholder="Change label"
                            onChange={onEditLabelChange}
                        />
                    </Paper>
                    <Divider sx={{ mt: 2, mb: 2 }} />
                    <Box>
                        {visibleItems.map(item => {
                            return <Paper elevation={0} key={item.id} sx={{ p: 1, mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, bgcolor: 'action.hover' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box component="img" src={item.image} height={40} />
                                    <Box>
                                        <Typography variant="body1" sx={{ lineHeight: '1em' }}>{item.title}</Typography>
                                        {!!item.private && <Typography variant="body2">Private</Typography>}
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                    {!!item.added &&
                                        <IconButton disabled size="small" color="success"><Check sx={{ fontSize: '1em' }} /></IconButton>
                                    }

                                    {!item.added &&
                                        <>
                                            {addingItems.indexOf(item.id) > -1 ?
                                                <IconButton disabled size="small" ><CircularProgress size={20} /></IconButton>
                                                :
                                                <Tooltip title="Add"><IconButton data-id={item.id} onClick={onAddClick} size="small" ><Add sx={{ fontSize: '1em' }} /></IconButton></Tooltip>
                                            }
                                        </>
                                    }
                                </Box>
                            </Paper>
                        })}

                        {totalPages > 1 &&
                            <Box mt={1} display="flex" justifyContent="space-between">
                                <Button size="small" variant="outlined" disabled={page <= 0} onClick={prevPageClick}>Previous</Button>
                                <Button size="small" variant="outlined" disabled={page >= totalPages - 1} onClick={nextPageClick}>Next</Button>
                            </Box>
                        }


                    </Box>
                </>
            }
        </Box>
    </Modal>)
}