import { Box, Button, CircularProgress, FormControlLabel, ListItem, Radio, RadioGroup, TextField, Typography, Divider } from "@mui/material";
import axios from "axios";
import { ChangeEvent, useCallback, useState } from "react";
import type { PlexTrack } from "@spotify-to-plex/plex-music-search/types/PlexTrack";

type Props = {
    readonly trackTitle: string;
    readonly artistNames: string[];
    readonly albumName?: string;
    readonly onClose: () => void;
    readonly onSelect: (track: PlexTrack) => void;
}

export default function ManualSearchPopup(props: Props) {
    const { trackTitle, artistNames, albumName, onClose, onSelect } = props;

    const [searchQuery, setSearchQuery] = useState<string>(`${artistNames[0] || ''} ${trackTitle}`.trim());
    const [loading, setLoading] = useState<boolean>(false);
    const [results, setResults] = useState<PlexTrack[]>([]);
    const [selectedIdx, setSelectedIdx] = useState<number>(0);
    const [error, setError] = useState<string>('');

    const thumbSize = typeof window !== 'undefined' && window.innerWidth < 400 ? 50 : 80;

    const onSearchChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.currentTarget.value);
    }, []);

    const onSearch = useCallback(async () => {
        if (!searchQuery.trim()) {
            setError('Please enter a search query');
            return;
        }

        setLoading(true);
        setError('');
        setResults([]);

        try {
            const response = await axios.post<PlexTrack[]>('/api/plex/manual-search', {
                query: searchQuery
            });

            if (response.data && response.data.length > 0) {
                setResults(response.data);
                setSelectedIdx(0);
            } else {
                setError('No tracks found. Try a different search.');
            }
        } catch (err) {
            console.error('Error searching:', err);
            setError('Failed to search the Plex library. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    const onSelectTrack = useCallback(() => {
        if (results[selectedIdx]) {
            onSelect(results[selectedIdx]);
            onClose();
        }
    }, [results, selectedIdx, onClose, onSelect]);

    const onRadioChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setSelectedIdx(Number(e.currentTarget.value));
    }, []);

    const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            onSearch();
        }
    }, [onSearch]);

    return (
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
                <Typography variant="h6" sx={{ mb: 1 }}>Manual Track Search</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Search for <strong>{trackTitle}</strong> by {artistNames.join(', ')}
                    {albumName && <> from <strong>{albumName}</strong></>}
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Search artist, title, album..."
                    value={searchQuery}
                    onChange={onSearchChange}
                    onKeyPress={handleKeyPress}
                    disabled={loading}
                />
                <Button
                    variant="contained"
                    onClick={onSearch}
                    disabled={loading || !searchQuery.trim()}
                >
                    {loading ? <CircularProgress size={24} /> : 'Search'}
                </Button>
            </Box>

            {albumName && (
                <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                        setSearchQuery(albumName);
                        setTimeout(() => onSearch(), 0);
                    }}
                    disabled={loading}
                >
                    Search by Album
                </Button>
            )}

            {error && (
                <Typography variant="body2" color="error">
                    {error}
                </Typography>
            )}

            {results.length > 0 && (
                <Box sx={{ maxHeight: 400, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                    <RadioGroup value={`${selectedIdx}`} onChange={onRadioChange}>
                        {results.map((track, index) => {
                            const thumbUrl = track.image && track.image.indexOf('rovicorp') === -1 ? `/api/plex/image?path=${track.image}` : '';

                            return (
                                <ListItem
                                    key={`manual-search-${track.id}-${index}`}
                                    sx={{
                                        p: 1,
                                        borderBottom: index < results.length - 1 ? '1px solid' : 'none',
                                        borderColor: 'divider',
                                        cursor: 'pointer',
                                        '&:hover': {
                                            bgcolor: 'action.hover'
                                        }
                                    }}
                                >
                                    <FormControlLabel
                                        value={`${index}`}
                                        control={<Radio checked={selectedIdx === index} />}
                                        label={
                                            <Box display="flex" gap={1} width="100%">
                                                <Box
                                                    width={thumbSize}
                                                    height={thumbSize}
                                                    position="relative"
                                                    flexShrink={0}
                                                >
                                                    {thumbUrl && (
                                                        <img
                                                            src={thumbUrl}
                                                            alt={track.title}
                                                            width={thumbSize}
                                                            height={thumbSize}
                                                            style={{ borderRadius: 4 }}
                                                        />
                                                    )}
                                                </Box>
                                                <Box sx={{ minWidth: 0 }}>
                                                    <Typography display="block" variant="body1" sx={{ wordBreak: 'break-word' }}>
                                                        {track.title}
                                                    </Typography>
                                                    <Typography display="block" variant="body2" color="text.secondary">
                                                        {track.artist?.title || 'Unknown Artist'}
                                                    </Typography>
                                                    {track.album && (
                                                        <Typography display="block" variant="body2" color="text.secondary">
                                                            {track.album.title}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        }
                                        sx={{ width: '100%' }}
                                    />
                                </ListItem>
                            );
                        })}
                    </RadioGroup>
                </Box>
            )}

            <Divider />

            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={onClose}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={onSelectTrack}
                    disabled={results.length === 0 || loading}
                >
                    Select Track
                </Button>
            </Box>
        </Box>
    );
}
