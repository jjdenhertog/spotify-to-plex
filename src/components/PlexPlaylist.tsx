import { errorBoundary } from "@/helpers/errors/errorBoundary";
import { GetPlexPlaylistIdResponse } from "@/pages/api/playlists/[id]";
import { GetTrackResponse } from "@/pages/api/tracks";
import { GetSpotifyAlbum, GetSpotifyPlaylist } from "@/types/SpotifyAPI";
import { Alert, Box, Button, Divider, Stack, Typography } from "@mui/joy";
import axios from "axios";
import { enqueueSnackbar } from "notistack";
import { useEffect, useState } from "react";
import PlexTrack from "./PlexTrack";


type Props = {
    playlist: GetSpotifyAlbum | GetSpotifyPlaylist
}


type TrackSelection = {
    artist: string
    name: string
    index: number
}

export default function PlexPlaylist(props: Props) {
    const { playlist } = props

    const pageSize = 30;
    const [page, setPage] = useState<number>(0);
    const [totalPages, setTotalPages] = useState<number>(0);

    const [saving, setSaving] = useState(false)

    const [tracksToLoad, setTracksToLoad] = useState<number>()
    const [tracksNotFound, setTracksNotFound] = useState<number>(0)
    const [tracksLoaded, setTracksLoaded] = useState<number>()
    const [loadingTracks, setLoadingTracks] = useState<boolean>(false);

    const [tracks, setTracks] = useState<GetTrackResponse[]>([]);
    const [trackSelections, setTrackSelections] = useState<TrackSelection[]>([])

    const [plexPlaylist, setPlexPlaylist] = useState<GetPlexPlaylistIdResponse>()

    // Check for existing playlists
    useEffect(() => {
        if (!playlist) return;

        setTotalPages(Math.ceil(playlist.tracks.length / pageSize))

        errorBoundary(async () => {
            const playlistResult = await axios.get<GetPlexPlaylistIdResponse>(`/api/playlists/${playlist.id}`)
            setPage(0);
            setPlexPlaylist(playlistResult.data)
        }, () => {
        }, true)
    }, [playlist])

    const loadPlaylistTracks = async (controller: AbortController, items: { artist: string, name: string, album?:string, alternative_artist?: string, alternative_name?: string }[]) => {

        const pageSize = 50;
        let curPage = 0;
        const pages = Math.ceil(items.length / pageSize);
        let results: GetTrackResponse[] = []

        setTracksToLoad(items.length);

        while (curPage < pages) {
            const startIndex = curPage * pageSize;
            setTracksLoaded(startIndex)
            const endIndex = startIndex + pageSize;
            try {
                const result = await axios.post<GetTrackResponse[]>('/api/tracks', {
                    items: items.slice(startIndex, endIndex)
                }, { signal: controller.signal })
                results = results.concat(result.data)
                setTracksNotFound(value => value + result.data.filter(item => item.Result.length == 0).length)
            } catch (e) {
                // Try again
                try {
                    const result = await axios.post<GetTrackResponse[]>('/api/tracks', {
                        items: items.slice(startIndex, endIndex)
                    }, { signal: controller.signal })
                    results = results.concat(result.data)
                    setTracksNotFound(value => value + result.data.filter(item => item.Result.length == 0).length)
                } catch (e) {
                    setTracksNotFound(value => value + pageSize)
                }
            }

            curPage++;
        }

        return results;
    }

    // Load tracks
    useEffect(() => {
        if (!playlist) return;

        setTracksNotFound(0)

        setLoadingTracks(true);
        const controller = new AbortController();
        errorBoundary(async () => {
            switch (playlist.type) {
                case "spotify-playlist":
                    {
                        const tracks = playlist.tracks.map(item => ({ artist: item.artist, name: item.name, album:item.album, alternative_artist: item.artists.length > 1 ? item.artists[1] : undefined, alternative_name: item.name }))
                        const result = await loadPlaylistTracks(controller, tracks)
                        setTracks(result);
                        setTrackSelections(result.map(item => ({ artist: item.artist, name: item.name, index: 0 })))
                    }
                    break;
                case "spotify-album":
                    {
                        const tracks = playlist.tracks.map(item => ({ artist: item.artist, name: item.name }))
                        const result = await loadPlaylistTracks(controller, tracks)
                        setTracks(result);
                        setTrackSelections(result.map(item => ({ artist: item.artist, name: item.name, index: 0 })))
                    }
                    break;
            }
            setLoadingTracks(false);
        }, () => {
            setLoadingTracks(false);
        }, true)
        return () => {
            controller.abort()
        }
    }, [playlist])


    const setTrackSelection = (artist: string, name: string, idx: number) => {
        setTrackSelections(items => items.map(item => {
            if (item.artist == artist && item.name == name)
                return { ...item, index: idx }
            return item;
        }))
    }
    const onPutPlaylistClick = () => {
        if (!playlist) return;

        const data: any = {
            type: playlist.type,
            id: playlist.id,
            name: playlist.name,
            items: []
        }
        for (let i = 0; i < tracks.length; i++) {
            const item = tracks[i];
            const trackSelectIdx = trackSelections.filter(selectionItem => selectionItem.artist == item.artist && selectionItem.name == item.name)[0]
            const song = item.Result[trackSelectIdx ? trackSelectIdx.index : 0];
            if (song)
                data.items.push({ key: song.key, source: song.source })
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

    }

    const visibleTracks = playlist.tracks.slice(page * pageSize, (page * pageSize) + pageSize)
    let curEnd = (page * pageSize) + pageSize;
    if (curEnd > playlist.tracks.length)
        curEnd = playlist.tracks.length;

    return (<Box mt={1}>
        <Box textAlign={"center"}>
            <Typography level="h2">{playlist.name}</Typography>
            <Typography level="body-sm" fontStyle={"italic"}>{playlist.tracks.length} songs {tracksNotFound > 0 ? `(${tracksNotFound} missing)` : ``}</Typography>
            {loadingTracks &&
                <Box mt={1} mb={1}>
                    <Alert size="sm" variant="outlined" sx={{ textAlign: 'center' }}>Loading tracks  ({tracksLoaded}/{tracksToLoad})</Alert>
                </Box>
            }
        </Box>
        <Divider sx={{ mt: 1, mb: 1 }} />
        <Box display={'flex'} justifyContent={'center'} gap={1}>
            <Button disabled={loadingTracks} loading={saving} onClick={onPutPlaylistClick}>{plexPlaylist ? "Update" : "Create"} playlist</Button>
            <Button component="a" disabled={!plexPlaylist} href={plexPlaylist?.link} target='_blank'>Open playlist</Button>
        </Box>
        <Divider sx={{ mt: 1, mb: 1 }} />
        <Stack>
            {totalPages > 0 &&
                <Box display={'flex'} mb={1} justifyContent={'space-between'}>
                    <Button disabled={page <= 0} onClick={() => setPage(page => page - 1)}>Previous</Button>
                    <Box>
                        Showing {page * pageSize} - {curEnd}
                    </Box>
                    <Button disabled={page >= totalPages - 1} onClick={() => setPage(page => page + 1)}>Next</Button>
                </Box>
            }
            {visibleTracks.map(track => {
                const data = tracks.filter(item => track.artist == item.artist && track.name == item.name)[0];
                const trackSelectIdx = trackSelections.filter(item => item.artist == track.artist && item.name == track.name)[0]
                const songIdx = trackSelectIdx ? trackSelectIdx.index : 0;
                return <PlexTrack key={`${playlist.id}-plex-${track.name}-${track.id}-${track.artist}`} loading={loadingTracks} track={track} setSongIdx={(idx) => setTrackSelection(data.artist, data.name, idx)} songIdx={songIdx} data={data} />
            })}
        </Stack>
    </Box>)
}