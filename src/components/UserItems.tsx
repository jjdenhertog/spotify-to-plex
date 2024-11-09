import { errorBoundary } from "@/helpers/errors/errorBoundary";
import { GetSpotifyUserResponse } from "@/pages/api/spotify/users";
import { GetSpotifyAlbum, GetSpotifyPlaylist, SpotifySavedItem } from "@/types/SpotifyAPI";
import { Add, Check } from "@mui/icons-material";
import { Box, Button, CircularProgress, Divider, IconButton, Input, Modal, ModalClose, ModalDialog, Sheet, Tooltip, Typography } from "@mui/joy";
import axios from "axios";
import { enqueueSnackbar } from "notistack";
import { ChangeEvent, useCallback, useEffect, useState } from "react";

type Props = {
    readonly onClose: () => void,
    readonly user: GetSpotifyUserResponse
    readonly type: 'albums' | 'playlists'
}

export default function UserItems(props: Props) {

    const { type, user } = props;
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

    const onClose = useCallback((_event: unknown, reason: string) => {
        const { onClose } = props;
        if (reason == 'closeClick')
            onClose()

    }, [props])

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

            errorBoundary(async () => {
                // Add loading
                setAddingItems(prev => [...prev, item.id])

                await axios.post<SpotifySavedItem[]>(`/api/saved-items`, { id: searchId, user_id, label })
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
                    const idx = prev.indexOf(item.id);
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


    return (<Modal open onClose={onClose}  >
        <ModalDialog sx={{ width: 500, overflowY: 'auto', gap: 0 }} >
            <ModalClose />
            {!!loading && <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
            </Box>}

            {!loading &&
                <>
                    <Typography level="h1" mb={.5}>Items</Typography>
                    <Typography level="body-md">Below you find an overview of all the {type} that you have saved in Spotify.</Typography>
                    <Divider sx={{ mt: 2, mb: 2 }} />
                    <Sheet color="neutral" variant="soft" sx={{ p: 2 }}>
                        <Typography level="h2" sx={{ mb: .5 }} >Label name</Typography>
                        <Typography level="body-sm" sx={{ mb: 1 }}> This label will be connected to any items added.</Typography>
                        <Input value={label} sx={{ maxWidth: 200 }} placeholder="Add label" onChange={onEditLabelChange} />
                    </Sheet>
                    <Divider sx={{ mt: 2, mb: 2 }} />
                    <Box>
                        {visibleItems.map(item => {
                            return <Sheet variant="soft" key={item.id} sx={{ p: 1, mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box component="img" src={item.image} height={40} />
                                    <Box>
                                        <Typography level="body-md" sx={{ lineHeight: '1em' }}>{item.title}</Typography>
                                        {!!item.private && <Typography level="body-sm">Private</Typography>}
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                    {!!item.added &&
                                        <IconButton disabled variant="solid" size="sm" color="success"><Check sx={{ fontSize: '1em' }} /></IconButton>
                                    }

                                    {!item.added &&
                                        <>
                                            {addingItems.indexOf(item.id) > -1 ?
                                                <IconButton disabled variant="outlined" size="sm" ><CircularProgress size="sm" /></IconButton>
                                                :
                                                <Tooltip title="Add"><IconButton data-id={item.id} onClick={onAddClick} variant="outlined" size="sm" ><Add sx={{ fontSize: '1em' }} /></IconButton></Tooltip>
                                            }
                                        </>
                                    }
                                </Box>
                            </Sheet>
                        })}

                        {totalPages > 1 &&
                            <Box mt={1} display="flex" justifyContent="space-between">
                                <Button size="sm" variant="outlined" color="neutral" disabled={page <= 0} onClick={prevPageClick}>Previous</Button>
                                <Button size="sm" variant="outlined" color="neutral" disabled={page >= totalPages - 1} onClick={nextPageClick}>Next</Button>
                            </Box>
                        }


                    </Box>
                </>
            }
        </ModalDialog>
    </Modal>)
}