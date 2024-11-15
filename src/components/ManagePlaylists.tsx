/* eslint-disable no-eq-null */
import { errorBoundary } from "@/helpers/errors/errorBoundary";
import { filterUnique } from "@/helpers/filterUnique";
import { SpotifySavedItem } from "@/types/SpotifyAPI";
import { CloseRounded, KeyboardArrowRightSharp } from "@mui/icons-material";
import { Box, Button, CircularProgress, Divider, IconButton, Input, Option, Select, SelectStaticProps, Typography } from "@mui/joy";
import axios from "axios";
import React, { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useClearSelection, useSelection } from "react-selection-manager";
import ManagePlaylistItem from "./ManagePlaylistItem";
import PlaylistSyncSettings from "./PlaylistSyncSettings";

export default function ManagePlaylists() {
    const [loading, setLoading] = useState(true)
    const [spotifyInput, setSpotifyInput] = useState<string>('')
    const [items, setItems] = useState<SpotifySavedItem[]>([])
    const [generating, setGenerating] = useState<boolean>(false);
    const selectedItems = useSelection()
    const clearSelection = useClearSelection();

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
            .sort((a, b) => a.localeCompare(b))
    }, [items])

    const reloadSavedItems = useCallback(() => {
        errorBoundary(async () => {
            const result = await axios.get<SpotifySavedItem[]>(`/api/saved-items`)
            setItems(result.data)
        })
    }, [])

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

    //////////////////////////////////
    // Selecting multiple
    //////////////////////////////////
    const [editMultipleItems, setEditMultipleItems] = useState<SpotifySavedItem[]>([])
    const onEditSettingsClick = useCallback(() => {
        setEditMultipleItems(items.filter(item => selectedItems.has(item.id)))
    }, [items, selectedItems])
    const onCloseMultipleEditItem = useCallback((reload?: boolean) => {
        setEditMultipleItems([])
        clearSelection()

        if (reload)
            reloadSavedItems()
    }, [clearSelection, reloadSavedItems])


    //////////////////////////////////
    // Show selection
    //////////////////////////////////
    const [filterLabel, setFilterLabel] = useState<string | null>(null)
    const action: SelectStaticProps['action'] = React.useRef(null);
    const onSelectLabel = useCallback((_event: React.SyntheticEvent | null, newValue: string | null) => {
        setFilterLabel(newValue)
    }, []);
    const onClearButtonMouseDown = useCallback((e: React.SyntheticEvent) => {
        e.stopPropagation();
    }, [])
    const onClearButtonClick = useCallback(() => {
        setFilterLabel(null);
        action.current?.focusVisible();
    }, [])
    const visibleItems = filterLabel == null ? items : items.filter(item => item.label == filterLabel)

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
                <Typography level="body-md" mb={1} sx={{ fontSize: ".9em" }} startDecorator={<KeyboardArrowRightSharp sx={{ fontSize: "1.1em" }} />}>Spotify URI &#40;e.g. spotify:playlist:37i9dQZF1EQqA6klNdJvwx &#41;</Typography>
                <Typography level="body-md" mb={2} sx={{ fontSize: ".9em" }} startDecorator={<KeyboardArrowRightSharp sx={{ fontSize: "1.1em" }} />}>Plex Content id, for dashboarding &#40;e.g. /library/metadata/12345 &#41; </Typography>
                <Input placeholder="Enter your Spotify URL/URI here.." disabled={generating} value={spotifyInput} onChange={onChangeSpotifyInput} />
                <Box mt={1}>
                    <Button size="sm" disabled={generating} onClick={onAddPlaylistClick}>Add item</Button>
                </Box>
                <Divider sx={{ mt: 2, mb: 2 }} />
                {visibleItems.length > 0 &&
                    <>
                        <Box sx={{ display: 'flex', justifyContent: "space-between" }}>
                            <Typography level="h2" mt={2} mb={.5}>List</Typography>
                            <Box sx={{ display: "flex", gap: 1 }}>
                                <Select
                                    placeholder="Select label"
                                    size="sm"
                                    sx={{ height: 30 }}
                                    value={filterLabel}
                                    action={action}
                                    onChange={onSelectLabel}
                                    {...(filterLabel != null && {
                                        endDecorator: (
                                            <IconButton
                                                size="sm"
                                                variant="plain"
                                                style={{ height: 20, width: 20, minHeight: 20, minWidth: 20 }}
                                                color="neutral"
                                                onMouseDown={onClearButtonMouseDown}
                                                onClick={onClearButtonClick}
                                            >
                                                <CloseRounded style={{ fontSize: '1em' }} />
                                            </IconButton>
                                        ),
                                        indicator: null,
                                    })}
                                >
                                    <Option value="">Uncategorized</Option>
                                    {labels.map(item => <Option key={item} value={item}>{item}</Option>)}
                                </Select>
                                <Button disabled={selectedItems.size == 0} onClick={onEditSettingsClick} size="sm" sx={{ height: 30 }} color="neutral" variant="outlined">Edit</Button>
                            </Box>
                        </Box>
                        {visibleItems.map(item => <ManagePlaylistItem key={item.id} item={item} orderedIds={visibleItems.map(item => item.id)} labels={labels} reloadSavedItems={reloadSavedItems} />)}
                    </>
                }


            </>
        }

        {editMultipleItems.length > 0 && <PlaylistSyncSettings items={editMultipleItems} onClose={onCloseMultipleEditItem} />}
    </>
    )
}

