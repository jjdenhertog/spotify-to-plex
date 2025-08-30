import { errorBoundary } from "@/helpers/errors/errorBoundary";
import { GetPlexPlaylistIdResponse } from "@/pages/api/playlists/[id]";
import { GetSpotifyAlbum, GetSpotifyPlaylist, Track } from "@spotify-to-plex/shared-types/spotify/api";
// MIGRATED: Updated to use shared types package
import type { SearchResponse } from "@spotify-to-plex/plex-music-search/types/SearchResponse";
import { Edit, Refresh } from "@mui/icons-material";
import CloseIcon from '@mui/icons-material/Close';
import { Alert, Box, Button, CircularProgress, Divider, IconButton, Input, Modal, Paper, Stack, Tooltip, Typography } from "@mui/material";
import axios from "axios";
import { enqueueSnackbar } from "notistack";
import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import ExportMissingTracks from "./ExportMissingTracks";
import PlexTrack from "./PlexTrack";

export type PlexPlaylistProps = {
    readonly playlist: GetSpotifyAlbum | GetSpotifyPlaylist
    readonly fast: boolean
}

type TrackSelection = {
    artist: string
    title: string
    idx: number
}

export default function PlexPlaylist(props: PlexPlaylistProps) {
    const { playlist, fast } = props

    ///////////////////////////////////////////////
    // Pagination
    ///////////////////////////////////////////////
    const pageSize = 30;
    const [page, setPage] = useState<number>(0);
    const [totalPages, setTotalPages] = useState<number>(0);
    const prevPageClick = useCallback(() => {
        setPage(prev => prev - 1)
    }, [])
    const nextPageClick = useCallback(() => {
        setPage(prev => prev + 1)
    }, [])

    ///////////////////////////////////////////////
    // Load existing Plex Playlist
    ///////////////////////////////////////////////
    const [plexPlaylist, setPlexPlaylist] = useState<GetPlexPlaylistIdResponse>()
    useEffect(() => {
        if (!playlist) return;

        setTotalPages(Math.ceil(playlist.tracks.length / pageSize))

        errorBoundary(async () => {
            const playlistResult = await axios.get<GetPlexPlaylistIdResponse>(`/api/playlists/${playlist.id}`)
            setPage(0);
            setPlexPlaylist(playlistResult.data)
        }, undefined, true)

    }, [playlist])

    ///////////////////////////////////////////////
    // Matching playlist tracks with Plex
    ///////////////////////////////////////////////

    const [tracksToLoad, setTracksToLoad] = useState<number>()
    const [tracksLoaded, setTracksLoaded] = useState<string[]>([])
    const [loadingTracks, setLoadingTracks] = useState<boolean>(false);

    const [tracks, setTracks] = useState<SearchResponse[]>([]);
    const [trackSelections, setTrackSelections] = useState<TrackSelection[]>([])

    const abortController = useRef<AbortController>(new AbortController())

    const loadPlaylistTracks = useCallback(async (items: Track[]) => {
        const pageSize = 5;
        let curPage = 0;
        const pages = Math.ceil(items.length / pageSize);

        setTracksToLoad(items.length);

        while (curPage < pages) {
            const startIndex = curPage * pageSize;
            const endIndex = startIndex + pageSize;
            const tracksToLoad = items.slice(startIndex, endIndex);
            try {
                const result = await axios.post<SearchResponse[]>('/api/plex/tracks', {
                    items: tracksToLoad,
                    type: playlist.type,
                    fast
                }, { signal: abortController.current.signal })

                setTracks(prev => prev.concat(result.data));
                setTracksLoaded(prev => [...prev, ...tracksToLoad.map(item => item.id)])
            } catch (_error) {
            }
            curPage++;
        }
    }, [playlist.type, fast])

    const onCancelClick = useCallback(() => {
        abortController.current.abort();
    }, [])

    // Load tracks
    useEffect(() => {
        if (!playlist) return;

        setTracks([])
        setTracksLoaded([])
        setTrackSelections([])
        setLoadingTracks(true);

        abortController.current = new AbortController();

        errorBoundary(async () => {
            const tracks = playlist.tracks.map(item => ({ id: item.id, artists: item.artists, title: item.title, album: item.album }))

            switch (playlist.type) {
                case "spotify-album":
                    // Search for album
                    const result = await axios.post<SearchResponse[]>('/api/plex/tracks', {
                        items: tracks,
                        type: playlist.type,
                        album: playlist.id,
                    }, { signal: abortController.current.signal })

                    setTracks(result.data);
                    setTracksLoaded(tracks.map(item => item.id))
                    break;
                case "spotify-playlist":

                    // Load cached tracks
                    const cachedResult = await axios.post<SearchResponse[]>('/api/plex/cached', {
                        items: tracks,
                    }, { signal: abortController.current.signal })
                    const cachedTracks = cachedResult.data;
                    if (cachedTracks && cachedTracks.length > 0)
                        setTracks(prev => prev.concat(cachedTracks));

                    setTracksToLoad(tracks.length);
                    const toLoadTracks = cachedTracks ? tracks.filter(item => !cachedTracks.some(cachedItem => cachedItem.id === item.id)) : tracks;
                    if (toLoadTracks.length > 0)
                        await loadPlaylistTracks(toLoadTracks)

                    break;
            }
            setLoadingTracks(false);
        }, () => {

            setLoadingTracks(false);
        }, true)


        // Ensure requests get cancled
        const controller = abortController.current;

        return () => {
            controller.abort()
        }

    }, [loadPlaylistTracks, playlist])

    useEffect(() => {
        const handleBeforeUnload = (_event: BeforeUnloadEvent) => {
            abortController.current.abort()
        };
        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [loadingTracks])


    ///////////////////////////////////
    // Force reloading
    ///////////////////////////////////
    const onForceRefreshClick = useCallback(() => {
        setTracksLoaded([])
        setTrackSelections([])
        setLoadingTracks(true);

        abortController.current = new AbortController();

        errorBoundary(async () => {
            const tracks = playlist.tracks.map(item => ({ id: item.id, artists: item.artists, title: item.title, album: item.album }))
            switch (playlist.type) {
                case "spotify-album":
                    const result = await axios.post<SearchResponse[]>('/api/plex/tracks', {
                        items: tracks,
                        type: playlist.type
                    }, { signal: abortController.current.signal })

                    setTracks(result.data);
                    setTracksLoaded(tracks.map(item => item.id))
                    break;

                case "spotify-playlist":
                    await loadPlaylistTracks(tracks)
                    break;
            }
            setLoadingTracks(false);
        }, () => {
            setLoadingTracks(false);

        }, true)


    }, [loadPlaylistTracks, playlist.tracks, playlist.type])

    ///////////////////////////////////
    // Set selected track index
    ///////////////////////////////////
    const onSetSongIndex = useCallback((artist: string, track: string, idx: number) => {
        if (trackSelections.some(item => item.artist === artist && item.title === track)) {
            setTrackSelections(items => items.map(item => {
                if (item.artist === artist && item.title === track)
                    return { ...item, idx }

                return item;
            }))
        } else {
            setTrackSelections(prev => [...prev, { artist, title: track, idx }])
        }
    }, [trackSelections])

    ///////////////////////////////////////////////
    // Modify Playlist name
    ///////////////////////////////////////////////
    const [newPlaylistName, setNewPlaylistName] = useState(playlist.user_title)
    const [playlistName, setPlaylistName] = useState(playlist.user_title)

    const [showEditPlaylistName, setShowEditPlaylistName] = useState(false)
    const onEditPlaylistNameClick = useCallback(() => {
        setShowEditPlaylistName(prev => !prev)
    }, [])
    const onPlaylistNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.value)
            setNewPlaylistName(e.target.value)
    }, [])
    const onSavePlaylistNameClick = useCallback(() => {
        errorBoundary(async () => {

            if (!newPlaylistName)
                return;

            await axios.put(`/api/saved-items/`, {
                ids: [playlist.id],
                title: newPlaylistName,
            })

            setPlaylistName(newPlaylistName)
            enqueueSnackbar(`Changes saved`)
            setShowEditPlaylistName(false)
        })
    }, [playlist, newPlaylistName])
    ///////////////////////////////////////////////
    // Saving playlists
    ///////////////////////////////////////////////
    const [saving, setSaving] = useState(false)
    const onPutPlaylistClick = useCallback(() => {
        if (!playlist) return;

        const data: { type: string; id: string; name: string | undefined; thumb: string; items: { key: string; source?: string }[] } = {
            type: playlist.type,
            id: playlist.id,
            name: newPlaylistName,
            thumb: playlist.image,
            items: []
        }

        for (let i = 0; i < tracks.length; i++) {
            const item = tracks[i];
            if (!item)
                continue;

            const trackSelectIdx = trackSelections.find(selectionItem => selectionItem.artist === item?.artist && selectionItem.title === item?.title)
            const song = item.result?.[trackSelectIdx ? trackSelectIdx.idx : 0];
            if (song)
                data.items.push({ key: song.id, source: song.source })
        }

        setSaving(true)
        errorBoundary(async () => {
            if (plexPlaylist) {
                await axios.put<GetPlexPlaylistIdResponse>(`/api/playlists/${playlist.id}`, data)
                enqueueSnackbar("Playlist updated")
            } else {
                const result = await axios.post<GetPlexPlaylistIdResponse>('/api/playlists', data)
                setPlexPlaylist(result.data);
                enqueueSnackbar("Playlist created")
            }

            setSaving(false)
        }, () => {
            setSaving(false)
        })

    }, [playlist, newPlaylistName, plexPlaylist, trackSelections, tracks])

    const visibleTracks = playlist.tracks.slice(page * pageSize, (page * pageSize) + pageSize)
    let curEnd = (page * pageSize) + pageSize;
    if (curEnd > playlist.tracks.length)
        curEnd = playlist.tracks.length;

    //////////////////////////////////////////////
    // Handle missing tracks
    //////////////////////////////////////////////
    const [showExportMissingTracks, setShowExportMissingTracks] = useState(false)
    const onExportMissingClick = useCallback(() => {
        setShowExportMissingTracks(prev => !prev)
    }, [])
    const missingTracks = useMemo(() => {
        if (!playlist)
            return [];

        return playlist.tracks
            .filter(item => {
                return tracks.some(track => track.title === item.title && item.artists.indexOf(track.artist) > - 1 && track.result.length === 0)
            })

    }, [playlist, tracks])

    return (<>

        {!!loadingTracks &&
            <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, border: '2px solid rgba(255,255,255,0.5)', borderRadius: '4px', p: 2, textAlign: 'center' }}>
                    <Box sx={{ alignItems: 'center' }}>
                        <CircularProgress size={20} />
                    </Box>
                    <Box sx={{ flexGrow: 1, display: 'flex', gap: 1, justifyContent: 'space-between' }}>
                        {playlist.type === 'spotify-playlist' ?
                            <Typography variant="body1" sx={{ color: 'text.secondary' }}>Processed {tracksLoaded.length} of {tracksToLoad} tracks</Typography>
                            :
                            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                                Searching for album...
                            </Typography>
                        }
                        <Typography onClick={onCancelClick} variant="body1" sx={{ textDecoration: 'underline', textUnderlineOffset: '2px', textDecorationThickness: '1px', cursor: 'pointer', color: 'primary.main' }}>cancel</Typography>
                    </Box>
                </Box>
            </Box>
        }


        <Paper elevation={1} sx={{ p: 2, mb: 1, mt: 1, position: 'relative' }}>
            {!!loadingTracks &&
                <>
                    <Typography variant="h6" sx={{ mb: 0.5 }}>Playlist loading...</Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        We are trying to match all the songs from the playlist with your library.
                    </Typography>
                </>
            }
            {!loadingTracks &&
                <>
                    <Typography variant="h6" sx={{ mb: 0.5 }}>Playlist loaded</Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        We finished matching all songs from the playlist with your library. Any succesfull matches are cached to improve performance the next time this playlist is opened.
                    </Typography>
                </>
            }

            {!loadingTracks &&
                <Tooltip title='Refresh all songs (ignoring cache).'>
                    <IconButton size="small" sx={{ position: 'absolute', right: 2, top: 2 }} onClick={onForceRefreshClick}><Refresh /></IconButton>
                </Tooltip>
            }

            <Box sx={{ display: 'flex', gap: 1 }}>
                <Button disabled={loadingTracks || saving} onClick={onPutPlaylistClick}>{plexPlaylist ? "Update" : "Create"} playlist</Button>
                <Button component="a" disabled={!plexPlaylist} href={plexPlaylist?.link} target='_blank'>Open playlist</Button>
            </Box>
        </Paper>

        {playlist?.type === 'spotify-album' &&
            <Box sx={{ mt: 1, mb: 1 }}>
                <Alert variant="outlined" color="warning">
                    <Box sx={{ p: 1 }}>
                        <Typography variant="h6" sx={{ m: 0, mb: 0.5 }} color="warning">Album detected</Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            You have added an album to your list. While you can use this album to create a playlist, you don&apos;t neccesarily need to. In most cases the album is already present in your library as an album.
                        </Typography>
                        <Typography variant="body2">
                            If you setup syncing for an album you will get the reports, even if you don&apos;t create a playlist for it.
                        </Typography>
                    </Box>
                </Alert>
            </Box>
        }

        {!!(missingTracks.length > 0) && !loadingTracks &&
            <Box sx={{ mt: 1, mb: 1 }}>
                <Alert variant="outlined" color="warning">
                    <Box sx={{ p: 1 }}>
                        {playlist.type === 'spotify-playlist' &&
                            <Typography variant="h6" sx={{ mb: 0.5 }} color="warning">{missingTracks.length} tracks not found</Typography>
                        }
                        {playlist.type === 'spotify-album' &&
                            <Typography variant="h6" sx={{ mb: 0.5 }} color="warning">
                                Album not found or incomplete
                            </Typography>
                        }
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            Some tracks are not matching up, these are missing in your library or the naming in your library is a bit different than expected.
                        </Typography>
                        <Button variant="outlined" color="warning" size="small" onClick={onExportMissingClick}>View missing Files</Button>
                    </Box>
                </Alert>
            </Box>
        }

        {missingTracks.length === 0 && !loadingTracks &&
            <Box sx={{ mt: 1, mb: 1 }}>
                <Alert variant="outlined" color="success">
                    <Box sx={{ p: 1 }}>
                        <Typography variant="h6" sx={{ mb: 0.5 }} color="success">All tracks matched</Typography>
                        <Typography variant="body2">
                            Each track is present in your Plex library.
                        </Typography>
                    </Box>
                </Alert>
            </Box>
        }

        <Paper elevation={1} sx={{ p: 2, bgcolor: 'primary.light' }}>
            <Box textAlign="center">
                <Box sx={{ display: 'flex', gap: .5, transform: 'translateX(20px)', justifyContent: 'center', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ m: 0, p: 0 }}>{playlistName}</Typography>
                    <IconButton onClick={onEditPlaylistNameClick} sx={{ '&:hover': { background: 'none' } }} size="small"><Edit /></IconButton>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', alignItems: 'center' }}>
                    {playlistName !== playlist.title && <Typography variant="body2" sx={{ fontStyle: 'italic' }}>{playlist.title} -</Typography>}
                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>{playlist.tracks.length} songs</Typography>
                </Box>
            </Box>

            <Divider sx={{ mt: 1, mb: 1 }} />
            <Stack>
                {totalPages > 1 &&
                    <Box display="flex" mb={1} justifyContent="space-between">
                        <Button variant="contained" disabled={page <= 0} onClick={prevPageClick}>Previous</Button>
                        <Box>Showing {page * pageSize} - {curEnd}</Box>
                        <Button variant="contained" disabled={page >= totalPages - 1} onClick={nextPageClick}>Next</Button>
                    </Box>
                }
                {visibleTracks.map(track => {
                    const data = tracks.find(item => track.artists.indexOf(item.artist) > -1 && track.title === item.title)
                    const trackSelectIdx = trackSelections.find(item => track.artists.indexOf(item.artist) > -1 && item.title === track.title)
                    const songIdx = trackSelectIdx ? trackSelectIdx.idx : 0;
                    const loading = loadingTracks && !(tracksLoaded.some(item => item === track.id))

                    return <PlexTrack
                        key={`${playlist.id}-plex-${track.title}-${track.id}}`}
                        loading={loading}
                        track={track}
                        setSongIdx={onSetSongIndex}
                        songIdx={songIdx}
                        data={data}
                        fast={fast}
                    />
                })}
            </Stack>
        </Paper>

        {!!showEditPlaylistName &&
            <Modal open onClose={onEditPlaylistNameClick}>
                <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', maxWidth: 400, bgcolor: 'background.paper', p: 3, borderRadius: 1 }}>
                    <IconButton size="small" onClick={onEditPlaylistNameClick} sx={{ position: 'absolute', right: 8, top: 8 }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                    <Typography variant="h6">
                        Playlist name
                    </Typography>
                    <Typography variant="body1">
                        This will be the name in your Plex library.
                    </Typography>
                    <Input value={newPlaylistName} onChange={onPlaylistNameChange} />
                    <Button variant="contained" onClick={onSavePlaylistNameClick} sx={{ mt: 2 }}>Save</Button>
                </Box>
            </Modal>
        }

        {!!showExportMissingTracks && missingTracks.length > 0 &&
            <ExportMissingTracks onClose={onExportMissingClick} tracks={missingTracks} playlist={playlist} />
        }

    </>)

}