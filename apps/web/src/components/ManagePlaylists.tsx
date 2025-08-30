 
import { errorBoundary } from "@/helpers/errors/errorBoundary";
import { filterUnique } from "@spotify-to-plex/shared-utils/array/filterUnique";
// MIGRATED: Updated to use shared utils package
import { SavedItem } from "@spotify-to-plex/shared-types/spotify/api";
// MIGRATED: Updated to use shared types package
import { Box, Button, CircularProgress, Divider, Link, Paper, TextField, Typography } from "@mui/material";
import Grid from '@mui/material/Grid2';
import axios from "axios";
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useClearSelection, useSelection } from "react-selection-manager";
import ManagePlaylistItem from "./ManagePlaylistItem";
import PlaylistItemSettings from "./PlaylistSyncSettings";

export default function ManagePlaylists() {
    const [loading, setLoading] = useState(true)
    const [searchInput, setSearchInput] = useState<string>('')
    const [items, setItems] = useState<SavedItem[]>([])
    const [generating, setGenerating] = useState<boolean>(false);
    const selectedItems = useSelection()
    const clearSelection = useClearSelection();

    ///////////////////////////////
    // Load data
    ///////////////////////////////
    useEffect(() => {
        errorBoundary(async () => {
            const result = await axios.get<SavedItem[]>(`/api/saved-items`)
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

    const groupedItems = useMemo(() => {
        // Sort labels alphabetically but keep "Uncategorized" at the beginning
        const sortedLabels = Array.from(new Set(items.map(item => item.label || "Uncategorized")))
            .sort((a, b) => {
                if (a === "Uncategorized") return -1;

                if (b === "Uncategorized") return 1;

                return a.localeCompare(b);
            });

        const groups: Record<string, SavedItem[]> = {};

        sortedLabels.forEach(label => {
            groups[label] = [];
        });

        items.forEach(item => {
            const label = item?.label || "Uncategorized";
            if (groups[label]) {
                groups[label].push(item);
            }
        });

        return groups;
    }, [items]);

    const orderedIds = useMemo(() => {
        const ids: string[] = [];
        Object.entries(groupedItems).forEach(([_, groupItems]) => {
            groupItems.forEach(item => {
                ids.push(item.id);
            });
        });

        return ids;
    }, [groupedItems]);

    const reloadSavedItems = useCallback(() => {
        errorBoundary(async () => {
            const result = await axios.get<SavedItem[]>(`/api/saved-items`)
            setItems(result.data)
        })
    }, [])

    ///////////////////////////////
    // Add Item
    ///////////////////////////////
    const onChangeSpotifyInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setSearchInput(e.currentTarget.value)
    }, [])

    const onAddPlaylistClick = useCallback(() => {
        errorBoundary(async () => {
            setGenerating(true);

            const result = await axios.post<SavedItem[]>(`/api/saved-items`, {
                search: searchInput
            })
            setItems(result.data)
            setSearchInput('')
            setGenerating(false);

        }, () => {
            setGenerating(false);
        })
    }, [searchInput])

    //////////////////////////////////
    // Selecting multiple
    //////////////////////////////////
    const [editMultipleItems, setEditMultipleItems] = useState<SavedItem[]>([])
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

    return (<>
        {loading ?
            <Box sx={{ textAlign: 'center', p: 2 }}><CircularProgress /></Box>
            :
            <>
                <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'action.hover' }}>
                    <Box maxWidth={560} >
                        <Typography mb={.5} variant="body2">Add any existing Spotify Playlist or Album. Once added you can sync it with Plex or change settings for the automated synchronisation. </Typography>
                        <Divider sx={{ mt: 2, mb: 2 }} />
                        <Typography mb={1} variant="h6">Add Playlist or Album</Typography>
                        <Typography mb={1} variant="body2">The following inputs are supported:</Typography>
                        <Box component="ul" sx={{ mt: 1, mb: 2, pl: 2, fontSize: ".9em" }}>
                            <Box component="li" sx={{ mb: 0.5 }}>Spotify URL &#40;e.g. https://open.spotify.com/playlist/37i9dQZF1EQqA6klNdJvwx &#41;</Box>
                            <Box component="li" sx={{ mb: 0.5 }}>Spotify URI &#40;e.g. spotify:playlist:37i9dQZF1EQqA6klNdJvwx &#41;</Box>
                            <Box component="li">Plex Content id, for <Link href="https://github.com/jjdenhertog/spotify-to-plex/blob/main/README.md#dashboarding" target="_blank">dashboarding</Link> &#40;e.g. /library/metadata/12345 &#41;</Box>
                        </Box>
                        <TextField
                            fullWidth
                            placeholder="Enter your Spotify URL/URI or Plex ID here.."
                            disabled={generating}
                            value={searchInput}
                            onChange={onChangeSpotifyInput}
                            variant="outlined"
                            size="small" />
                        <Box mt={1}>
                            <Button size="small" disabled={generating} onClick={onAddPlaylistClick}>Add item</Button>
                        </Box>
                    </Box>
                </Paper>
                <Divider sx={{ mt: 2, mb: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: "flex-end", mb: 1 }}>
                    <Button disabled={selectedItems.size === 0} onClick={onEditSettingsClick} size="small" sx={{ height: 30 }} variant="outlined">Edit selected items</Button>
                </Box>
                <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'action.hover' }}>
                    {!!(Object.keys(groupedItems).length > 0) &&
                        <>
                            {Object.entries(groupedItems).map(([label, groupItems]) => (
                                <Box key={label} sx={{ mb: 4 }}>
                                    <Typography variant="h6" sx={{ mb: 2 }}>{label}</Typography>
                                    <Grid container spacing={2}>
                                        {groupItems.map(item => (
                                            <Grid size={{ xs: 6, sm: 4, md: 4, lg: 3 }} key={item.id}>
                                                <ManagePlaylistItem item={item} orderedIds={orderedIds} labels={labels} reloadSavedItems={reloadSavedItems} />
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Box>
                            ))}
                        </>
                    }
                </Paper>
            </>
        }

        {!!(editMultipleItems.length > 0) && <PlaylistItemSettings items={editMultipleItems} labels={labels} onClose={onCloseMultipleEditItem} />}
    </>
    )
}
