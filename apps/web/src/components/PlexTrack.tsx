/* eslint-disable custom/jsx-single-line-props */
import type { SearchResponse } from "@spotify-to-plex/plex-music-search/types/SearchResponse";
import type { PlexTrack as PlexTrackType } from "@spotify-to-plex/plex-music-search/types/PlexTrack";
import { Check, Edit, LibraryMusicSharp, Warning } from "@mui/icons-material";
import { Box, CircularProgress, Divider, FormControlLabel, IconButton, ListItem, Paper, Radio, RadioGroup, Tooltip, Typography } from "@mui/material";
import { ChangeEvent, useCallback, useMemo, useState } from "react";
import ManualSearchPopup from "./popups/ManualSearchPopup";
type Props = {
    readonly loading: boolean
    readonly track: {
        id: string
        artists: string[];
        title: string;
        reason?: string;
    }
    readonly data?: SearchResponse
    readonly songIdx: number
    readonly setSongIdx?: (artist: string, name: string, trackId: string, idx: number) => void
    readonly onManualSelect?: (spotifyId: string, title: string, artist: string, track: PlexTrackType) => void
}
export default function PlexTrack(props: Props) {

    const { loading, track, data, songIdx, setSongIdx, onManualSelect } = props;

    const songs = useMemo(() => {

        if (!data)
            return []

        return data.result.map((item: PlexTrackType) => {
            const thumbUrl = item.image && item.image.indexOf('rovicorp') === -1 ? `/api/plex/image?path=${item.image}` : '';
            const albumThumbUrl = item.album?.image && item.image.indexOf('rovicorp') === -1 ? `/api/plex/image?path=${item.album.image}` : '';

            return {
                trackTitle: item.title,
                artistName: item.artist.title,
                thumb: thumbUrl,
                album: item.album ? {
                    title: item.album.title,
                    thumb: albumThumbUrl
                } : undefined
            }
        })
    }, [data])


    const {
        id,
        title: trackTitle,
        artists: artistNames,
        reason: _reason
    } = track

    const {
        thumb: _thumb
    } = songs[songIdx] ?? { thumb: undefined };



    const thumbSize = window.innerWidth < 400 ? 50 : 80;

    ////////////////////////////////////
    // Handle manual match
    ////////////////////////////////////
    const [showManualSearch, setShowManualSearch] = useState(false);
    const onShowManualSearchClick = useCallback(() => {
        setShowManualSearch(true)
    }, [])
    const onCloseManualSearch = useCallback(() => {
        setShowManualSearch(false)
    }, [])
    const onManualSelectTrack = useCallback((selected: PlexTrackType) => {
        setShowManualSearch(false)

        if (onManualSelect)
            onManualSelect(id, trackTitle, artistNames[0] ?? 'Unknown', selected)
    }, [onManualSelect, id, trackTitle, artistNames])

    ////////////////////////////////////
    // Handle multiple song results
    ////////////////////////////////////
    const [showSongs, setShowSongs] = useState(false);
    const onShowSongsClick = useCallback(() => {
        setShowSongs(prev => !prev)
    }, [])
    const onChangeSongIdx = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        console.log('onChangeSongIdx', e.currentTarget.value)

        const songIdx = Number(e.currentTarget.value)
        if (setSongIdx && artistNames[0])
            setSongIdx(artistNames[0], trackTitle, id, songIdx)

    }, [artistNames, setSongIdx, trackTitle, id])

    ////////////////////////////////////
    // Handle not perfect songs
    ////////////////////////////////////
    const onNotPerfectMatchClick = useCallback(() => {
        // Save track ID to localStorage for the test page to pick up
        localStorage.setItem('spotify-test-track-id', id);
        // Navigate to test page in new tab
        const url = `/advanced/music-search-config/test`;
        window.open(url, '_blank');
    }, [id])

    return (<Box>
        <Paper elevation={0} sx={{ p: 1, mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, bgcolor: 'action.hover' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                <Box sx={{ minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <img src="/img/spotify.png" alt="Spotify" width={14} height={14} />
                        <Typography variant="body1">{trackTitle}</Typography>
                    </Box>
                    <Typography variant="caption">{artistNames.join(', ')}</Typography>
                    {!!songs[songIdx] &&
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                            <img src="/img/plex.png" alt="Plex" width={14} height={14} />
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {songs[songIdx].trackTitle} — {songs[songIdx].artistName}
                            </Typography>
                        </Box>
                    }
                </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {!!loading && <CircularProgress size={20} />}
                {!loading && <>
                    <Tooltip title="Match manually">
                        <IconButton size="small" onClick={onShowManualSearchClick}><Edit sx={{ fontSize: '1em' }} /></IconButton>
                    </Tooltip>
                    {!!data && data.result.length > 0 &&
                        <>
                            {!!data && data.result.length > 1 &&
                                <Tooltip title="Multiple matches found">
                                    <IconButton size="small" onClick={onShowSongsClick}><LibraryMusicSharp sx={{ fontSize: '1em' }} /></IconButton>
                                </Tooltip>
                            }
                            <Tooltip title="Song found">
                                <IconButton size="small" color="success"><Check sx={{ fontSize: '1em' }} /></IconButton>
                            </Tooltip>
                        </>
                    }
                    {!!data && data.result.length === 0 &&
                        <Tooltip title="Song not found">
                            <IconButton size="small" color="warning" onClick={onNotPerfectMatchClick}><Warning sx={{ fontSize: '1em' }} /></IconButton>
                        </Tooltip>
                    }
                </>}
            </Box>
        </Paper>

        {!!showSongs && <Box>
            <RadioGroup value={`${songIdx}-list`} onChange={onChangeSongIdx} sx={{ gap: 2 }}>
                {songs.map((song: { trackTitle: string; artistName: string; thumb: string; album?: { title: string; thumb: string } }, index: number) => {
                    return <ListItem
                        key={`${id}-${song.trackTitle}-${index}`}
                        sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            boxShadow: 1,
                            py: 1
                        }}
                    >
                        
                        <FormControlLabel
                            value={`${index}`}
                            control={<Radio checked={songIdx === index} />}
                            label={<Box display="flex" gap={1}>
                                <Box
                                    width={thumbSize}
                                    height={thumbSize}
                                    position="relative">
                                    {!!song.thumb &&
                                        <img
                                            src={song.thumb}
                                            alt={song.trackTitle}
                                            width={thumbSize}
                                            height={thumbSize}
                                        />}
                                </Box>
                                <Box>
                                    <Typography display="block" variant="body1">{song.trackTitle}</Typography>
                                    <Typography display="block" variant="body2">{song.artistName}</Typography>
                                    {!!song.album && <Typography display="block" variant="body2">{song.album.title}</Typography>}
                                </Box>
                            </Box>
                            }
                        />
                    </ListItem>
                })}
            </RadioGroup>
        </Box>}
        <Divider sx={{ mt: 1, mb: 1 }} />

        {!!showManualSearch &&
            <ManualSearchPopup
                title={trackTitle}
                artist={artistNames[0] ?? ''}
                onClose={onCloseManualSearch}
                onSelect={onManualSelectTrack}
            />
        }
    </Box>)
}