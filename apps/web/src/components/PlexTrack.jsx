import { Check, LibraryMusicSharp, Warning } from "@mui/icons-material";
import { Box, CircularProgress, Divider, FormControlLabel, IconButton, ListItem, Paper, Radio, RadioGroup, Tooltip, Typography } from "@mui/material";
import { useCallback, useMemo, useState } from "react";
import stringSimilarity from "string-similarity-js";
import TrackAnalyzer from "./TrackAnalyzer";
export default function PlexTrack(props) {
    const { loading, track, data, songIdx, setSongIdx, fast = false } = props;
    const songs = useMemo(() => {
        if (!data)
            return [];
        return data.result.map((item) => {
            const thumbUrl = item.image && item.image.indexOf('rovicorp') == -1 ? `/api/plex/image?path=${item.image}` : '';
            const albumThumbUrl = item.album?.image && item.image.indexOf('rovicorp') == -1 ? `/api/plex/image?path=${item.album.image}` : '';
            return {
                trackTitle: item.title,
                artistName: item.artist.title,
                thumb: thumbUrl,
                album: item.album ? {
                    title: item.album.title,
                    thumb: albumThumbUrl
                } : undefined
            };
        });
    }, [data]);
    const { id, title: trackTitle, artists: artistNames, reason: _reason } = track;
    const { artistName: songArtistName = '', trackTitle: songTrackTitle = '', thumb: _thumb } = songs[songIdx] ?? { thumb: undefined };
    const thumbSize = window.innerWidth < 400 ? 50 : 80;
    const _isLoading = loading && songs.length == 0;
    const _notFound = !loading && songs.length == 0;
    ////////////////////////////////////
    // Handle multiple song results
    ////////////////////////////////////
    const [showSongs, setShowSongs] = useState(false);
    const onShowSongsClick = useCallback(() => {
        setShowSongs(prev => !prev);
    }, []);
    const onChangeSongIdx = useCallback((e) => {
        const songIdx = Number(e.currentTarget.value);
        if (setSongIdx)
            setSongIdx(artistNames[0], trackTitle, songIdx);
    }, [artistNames, setSongIdx, trackTitle]);
    ////////////////////////////////////
    // Handle not perfect songs
    ////////////////////////////////////
    const _perfectMatch = songArtistName == '' || songTrackTitle == '' || stringSimilarity(`${songArtistName} - ${songTrackTitle}`, `${artistNames.join(', ')} - ${trackTitle}`) > 0.9;
    const [showMatchAnalyser, setShowMatchAnalyser] = useState(false);
    const onNotPerfectMatchClick = useCallback(() => {
        setShowMatchAnalyser(prev => !prev);
    }, []);
    return (<Box>
        <Paper elevation={0} sx={{ p: 1, mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, bgcolor: 'action.hover' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box>
                    <Typography variant="body1">{trackTitle}</Typography>
                    <Typography variant="caption">{artistNames.join(', ')}</Typography>
                </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {!!loading && <CircularProgress size={20}/>}
                {!loading && <>
                    {!!data && data.result.length > 0 &&
                <>
                            {!!data && data.result.length > 1 &&
                        <Tooltip title="Multiple matches found">
                                    <IconButton size="small" onClick={onShowSongsClick}><LibraryMusicSharp sx={{ fontSize: '1em' }}/></IconButton>
                                </Tooltip>}
                            <Tooltip title="Song found">
                                <IconButton size="small" color="success"><Check sx={{ fontSize: '1em' }}/></IconButton>
                            </Tooltip>
                        </>}
                    {!!data && data.result.length == 0 &&
                <Tooltip title="Song not found">
                            <IconButton size="small" color="warning" onClick={onNotPerfectMatchClick}><Warning sx={{ fontSize: '1em' }}/></IconButton>
                        </Tooltip>}
                </>}
            </Box>
        </Paper>

        {!!showSongs && <Box>
            <RadioGroup value={songIdx.toString()} onChange={onChangeSongIdx} sx={{ gap: 2 }}>
                {songs.map((song, index) => {
                return <ListItem key={`${id}-${song.trackTitle}`} sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        boxShadow: 1,
                        py: 1
                    }}>
                        <FormControlLabel value={`${index}`} control={<Radio />} label={<Box display="flex" gap={1}>
                                    <Box width={thumbSize} height={thumbSize} position="relative">
                                        {!!song.thumb && <img src={song.thumb} alt={song.trackTitle} width={thumbSize} height={thumbSize}/>}
                                    </Box>
                                    <Box>
                                        <Typography display="block" variant="body1">{song.trackTitle}</Typography>
                                        <Typography display="block" variant="body2">{song.artistName}</Typography>
                                        {!!song.album && <Typography display="block" variant="body2">{song.album.title}</Typography>}
                                    </Box>
                                </Box>}/>
                    </ListItem>;
            })}
            </RadioGroup>
        </Box>}
        <Divider sx={{ mt: 1, mb: 1 }}/>

        {!!showMatchAnalyser &&
            <TrackAnalyzer track={track} onClose={onNotPerfectMatchClick} fast={fast}/>}
    </Box>);
}
//# sourceMappingURL=PlexTrack.jsx.map