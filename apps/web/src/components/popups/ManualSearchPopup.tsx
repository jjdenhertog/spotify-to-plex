/* eslint-disable custom/jsx-single-line-props */
import { errorBoundary } from "@/helpers/errors/errorBoundary";
import type { PlexTrack } from "@spotify-to-plex/plex-music-search/types/PlexTrack";
import CloseIcon from '@mui/icons-material/Close';
import { Box, Button, CircularProgress, Dialog, IconButton, Paper, TextField, Typography } from "@mui/material";
import axios from "axios";
import { ChangeEvent, FormEvent, useCallback, useState } from "react";

type Props = {
    readonly title: string
    readonly artist: string
    readonly onClose: () => void
    readonly onSelect: (track: PlexTrack) => void
}

export default function ManualSearchPopup(props: Props) {

    const { title, artist, onClose, onSelect } = props;

    const [query, setQuery] = useState(`${artist} ${title}`);
    const [results, setResults] = useState<PlexTrack[]>([]);
    const [searching, setSearching] = useState(false);
    const [searched, setSearched] = useState(false);

    const onQueryChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setQuery(e.currentTarget.value)
    }, [])

    const onSubmit = useCallback((e: FormEvent) => {
        e.preventDefault();

        if (!query.trim())
            return;

        setSearching(true);
        errorBoundary(async () => {
            const result = await axios.post<PlexTrack[]>('/api/plex/manual-search', { query });
            setResults(result.data);
            setSearched(true);
            setSearching(false);
        }, () => {
            setSearching(false);
        }, true)
    }, [query])

    const onResultClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        const { trackId } = e.currentTarget.dataset;
        const track = results.find(item => item.id === trackId);

        if (track)
            onSelect(track);
    }, [results, onSelect])

    return (<Dialog open onClose={onClose} fullWidth maxWidth="sm">
        <Box sx={{ p: 2, position: 'relative' }}>
            <IconButton size="small" onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
                <CloseIcon fontSize="small" />
            </IconButton>
            <Typography variant="h6">
                Find the right track
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
                Search your library and pick the track this song should link to.
            </Typography>

            <form onSubmit={onSubmit}>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField size="small" fullWidth value={query} onChange={onQueryChange} placeholder="Artist and title" />
                    <Button type="submit" variant="contained" disabled={searching}>Search</Button>
                </Box>
            </form>

            {!!searching && <Box sx={{ textAlign: 'center', p: 2 }}><CircularProgress size={24} /></Box>}

            {!searching && !!searched && results.length === 0 &&
                <Typography variant="body2">
                    Nothing found in your library for this search.
                </Typography>
            }

            {!searching && results.map(track => (
                <Paper key={track.id} elevation={0} sx={{ p: 1, mb: 1, bgcolor: 'action.hover' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2">{track.title}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {track.artist.title}{track.album ? ` — ${track.album.title}` : ''}
                            </Typography>
                        </Box>
                        <Button size="small" variant="outlined" data-track-id={track.id} onClick={onResultClick}>Use this</Button>
                    </Box>
                </Paper>
            ))}
        </Box>
    </Dialog>)
}
