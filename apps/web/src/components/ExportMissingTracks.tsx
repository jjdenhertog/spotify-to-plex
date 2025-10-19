/* eslint-disable @typescript-eslint/no-loop-func */
/* eslint-disable max-lines */
import { errorBoundary } from "@/helpers/errors/errorBoundary";
import { GetTidalTracksResponse } from "@/pages/api/tidal";
import { Track } from "@spotify-to-plex/shared-types/spotify/Track";
import CloseIcon from '@mui/icons-material/Close';
import { Alert, Box, Button, CircularProgress, Dialog, Divider, IconButton, Typography } from "@mui/material";
import axios from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PlexPlaylistProps } from "./PlexPlaylist";
import LidarrAlbumDialog from './LidarrAlbumDialog';
import MissingTrack, { MissingTrackHandle } from './MissingTrack';

type Props = {
    readonly onClose: () => void,
    readonly tracks: Track[]
    readonly playlist: PlexPlaylistProps["playlist"]
}

export default function ExportMissingTracks(props: Props) {

    const { onClose, tracks, playlist } = props;
    const { type } = playlist;

    ///////////////////////////////////////////////
    // Tidal Tracks
    ///////////////////////////////////////////////=
    const [tidalTracks, setTidalTracks] = useState<GetTidalTracksResponse[]>([])

    ///////////////////////////////////////////////
    // Lidarr
    ///////////////////////////////////////////////
    const [lidarrDialogOpen, setLidarrDialogOpen] = useState(false);
    const [lidarrEnabled, setLidarrEnabled] = useState(false);

    ///////////////////////////////////////////////
    // SLSKD
    ///////////////////////////////////////////////
    const [slskdEnabled, setSlskdEnabled] = useState(false);
    const [sendingToSlskd, setSendingToSlskd] = useState(false);
    const trackRefs = useRef<(MissingTrackHandle | null)[]>([]);

    const setTrackRefs = useCallback((index: number) => (ref: MissingTrackHandle | null) => {
        trackRefs.current[index] = ref;
    }, []);

    ///////////////////////////////////////////////
    // Pagination
    ///////////////////////////////////////////////
    const pageSize = 10;
    const totalPages = Math.ceil(tracks.length / pageSize)
    const [page, setPage] = useState<number>(0);
    const prevPageClick = useCallback(() => {
        setPage(prev => prev - 1)
    }, [])
    const nextPageClick = useCallback(() => {
        setPage(prev => prev + 1)
    }, [])

    const visibleTracks = tracks.slice(page * pageSize, (page * pageSize) + pageSize)
    let curEnd = (page * pageSize) + pageSize;
    if (curEnd > tracks.length)
        curEnd = tracks.length;


    ///////////////////////////////////////////////
    // Tidal
    ///////////////////////////////////////////////
    const abortController = useRef<AbortController>(new AbortController())
    const [hasLoadedTidalTracks, setHasLoadedTidalTracks] = useState(false)
    const [tracksToLoad, setTracksToLoad] = useState<number>()
    const [tracksLoaded, setTracksLoaded] = useState<string[]>([])
    const [loadingTracks, setLoadingTracks] = useState<boolean>(false);

    const missingTidalTracks = useMemo(() => {
        const result: Track[] = []

        for (let i = 0; i < tracks.length; i++) {
            const track = tracks[i];
            if (!track)
                continue;

            const tidalTrack = tidalTracks.find(item => item.id === track.id)
            if (!tidalTrack || tidalTrack.tidal_ids?.length === 0)
                result.push(track);
        }

        return result;
    }, [tidalTracks, tracks])

    const loadTidalTracks = useCallback(async (items: Track[]) => {
        const pageSize = 1;
        let curPage = 0;
        const pages = Math.ceil(items.length / pageSize);

        setTracksLoaded([])
        setTracksToLoad(items.length);

        while (curPage < pages) {
            const startIndex = curPage * pageSize;
            const endIndex = startIndex + pageSize;
            const tracksToLoad = items.slice(startIndex, endIndex);
            try {
                const result = await axios.post<GetTidalTracksResponse[]>('/api/tidal', {
                    type,
                    items: tracksToLoad,
                }, { signal: abortController.current.signal })

                setTidalTracks(prev => [...prev, ...result.data]);
                setTracksLoaded(prev => [...prev, ...tracksToLoad.map(item => item.id)])
            } catch (_error) {
            }
            curPage++;
        }
    }, [type])

    const onCancelClick = useCallback(() => {
        abortController.current.abort();
    }, [])

    const onLoadTidalLinksClick = useCallback(() => {
        errorBoundary(async () => {
            setLoadingTracks(true)

            abortController.current = new AbortController()

            switch (type) {
                case "spotify-album":

                    const { id, title } = playlist;
                    const result = await axios.post<GetTidalTracksResponse[]>('/api/tidal', {
                        type,
                        album: {
                            id,
                            title
                        },
                        items: tracks,
                    }, { signal: abortController.current.signal })

                    setTidalTracks(prev => [...prev, ...result.data]);
                    setTracksLoaded(prev => [...prev, ...tracks.map(item => item.id)])

                    break;
                case "spotify-playlist":
                    await loadTidalTracks(missingTidalTracks)
                    break;
            }

            setLoadingTracks(false)
            setHasLoadedTidalTracks(true)
        }, () => {
            setLoadingTracks(false)
            setHasLoadedTidalTracks(true)
        })
    }, [loadTidalTracks, missingTidalTracks, playlist, tracks, type])

    const onOpenLidarrDialog = useCallback(() => {
        setLidarrDialogOpen(true);
    }, []);

    const onCloseLidarrDialog = useCallback(() => {
        setLidarrDialogOpen(false);
    }, []);

    const handleSendPageToSlskd = useCallback(async () => {
        setSendingToSlskd(true);

        // Sequential processing through refs
        for (let i = 0; i < trackRefs.current.length; i++) {
            const ref = trackRefs.current[i];
            if (ref) 
                await ref.sendToSlskd();
        }

        setSendingToSlskd(false);
    }, []);

    const onSendPageToSlskdClick = useCallback(() => {
        handleSendPageToSlskd();
    }, [handleSendPageToSlskd]);

    // Extract unique albums for Lidarr
    const uniqueAlbums = useMemo(() => {
        const albumMap = new Map<string, { artist_name: string; album_name: string; spotify_album_id: string }>();

        tracks.forEach(track => {
            // Skip tracks without valid album_id
            if (!track.album_id || track.album_id === 'unknown') {
                return;
            }

            // Use first artist as album artist
            const artist = track.artists[0] || 'Unknown Artist';
            const album = track.album?.trim() || 'Unknown Album';
            const key = `${artist}|${album}`;

            if (!albumMap.has(key)) {
                albumMap.set(key, {
                    artist_name: artist,
                    album_name: album,
                    spotify_album_id: track.album_id
                });
            }
        });

        return Array.from(albumMap.values());
    }, [tracks]);

    ///////////////////////////////////////////////
    // Load cached tracks
    ///////////////////////////////////////////////
    const [loading, setLoading] = useState(true)
    const [canUseTidal, setCanUseTidal] = useState(false)
    useEffect(() => {

        errorBoundary(async () => {

            const validResult = await axios.get<{ ok: boolean }>('/api/tidal/valid')
            if (!validResult.data.ok) {
                setLoading(false)

                return;
            }

            setCanUseTidal(true)

            // Load cached tracks
            const cachedResult = await axios.post<GetTidalTracksResponse[]>('/api/tidal/cached', {
                items: tracks,
            })
            const cachedTracks = cachedResult.data;
            if (cachedTracks && cachedTracks.length > 0)
                setTidalTracks(prev => prev.concat(cachedTracks));

            setLoading(false)
        }, () => {
            setLoading(false)
        })

    }, [tracks])

    // Check if Lidarr is enabled
    useEffect(() => {
        errorBoundary(async () => {
            const result = await axios.get('/api/lidarr/settings');
            setLidarrEnabled(result.data.enabled);
        });
    }, []);

    // Check if SLSKD is enabled
    useEffect(() => {
        errorBoundary(async () => {
            const result = await axios.get('/api/slskd/settings');
            setSlskdEnabled(result.data.enabled);
        });
    }, []);

    const hasTidalTracks = tidalTracks.some(item => item.tidal_ids && item.tidal_ids.length > 0)

    return (<>
        <Dialog open onClose={onClose}>
            <Box sx={{ maxWidth: 600, p: 2, position: 'relative' }}>
                <IconButton size="small" onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
                    <CloseIcon fontSize="small" />
                </IconButton>
                {!!loading && <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 5 }}>
                    <CircularProgress />
                </Box>}

                {!loading &&
                    <>
                        <Typography variant="h6">Missing tracks</Typography>
                        <Typography variant="body2">
                            Below you find an overview of all missing tracks of the current selection.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                            {!!(tracks.length > 0) &&
                                <>
                                    <form method="POST" action="/api/download" target="_blank" >
                                        <input type="hidden" name="type" value="spotify" />
                                        <input type="hidden" name="tracks" value={tracks.map(item => item.id)} />
                                        <Button variant="outlined" type="submit">
                                            Download Spotify links
                                        </Button>
                                    </form>
                                    {!!((missingTidalTracks.length > 0) && !hasLoadedTidalTracks) &&
                                        <Button disabled={loadingTracks || !canUseTidal} onClick={onLoadTidalLinksClick} variant="outlined">Load Tidal links</Button>
                                    }

                                    {((!!hasTidalTracks && !!hasLoadedTidalTracks) || missingTidalTracks.length === 0) &&
                                        <form method="POST" action="/api/download" target="_blank" >
                                            <input type="hidden" name="type" value="tidal" />
                                            <input type="hidden" name="tracks" value={tracks.map(item => item.id)} />
                                            <Button variant="outlined" type="submit">
                                                Download Tidal links
                                            </Button>
                                        </form>
                                    }

                                    {!!lidarrEnabled && uniqueAlbums.length > 0 && (
                                        <Button variant="outlined" onClick={onOpenLidarrDialog}>
                                            Send to Lidarr ({uniqueAlbums.length} albums)
                                        </Button>
                                    )}

                                    {!!slskdEnabled && visibleTracks.length > 0 && (
                                        <Button variant="outlined" onClick={onSendPageToSlskdClick} disabled={sendingToSlskd}>
                                            {sendingToSlskd ? 'Sending...' : `Send Page to SLSKD (${visibleTracks.length} tracks)`}
                                        </Button>
                                    )}
                                </>
                            }
                        </Box>
                        {!canUseTidal &&
                            <Alert severity="warning" sx={{ fontWeight: 'normal', mt: 1 }}>
                                You have not added Tidal credentials. Visit Github for more info.
                            </Alert>
                        }
                        <Divider sx={{ mt: 1, mb: 2 }} />

                        {!!loadingTracks &&
                            <Box >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, border: '2px solid rgba(255,255,255,0.5)', borderRadius: '4px', p: 2, textAlign: 'center' }}>
                                    <Box sx={{ alignItems: 'center' }}>
                                        <CircularProgress color="inherit" size="small" />
                                    </Box>
                                    <Box sx={{ flexGrow: 1, display: 'flex', gap: 1, justifyContent: 'space-between' }}>
                                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Processed {tracksLoaded.length} of {tracksToLoad} Tidal tracks</Typography>
                                        <Typography onClick={onCancelClick} variant="body2" sx={{ textDecoration: 'underline', textUnderlineOffset: '2px', textDecorationThickness: '1px', cursor: 'pointer', color: 'primary.main' }}>cancel</Typography>
                                    </Box>
                                </Box>
                            </Box>
                        }

                        {!loadingTracks && tidalTracks.length > 0 && missingTidalTracks.length > 0 &&
                            <Box sx={{ mt: 1, mb: 1 }}>
                                <Alert variant="outlined" severity="warning">
                                    <Box sx={{ p: 1 }}>
                                        <Typography mb={.5} variant="h6" color="warning">{missingTidalTracks.length} Tidal tracks not found</Typography>
                                        <Typography mb={1} variant="body2">
                                            Not all Tidal tracks could be found.
                                        </Typography>
                                    </Box>
                                </Alert>
                            </Box>
                        }

                        <Box>
                            {visibleTracks.map((item, index) => {
                                const tidalTrack = tidalTracks.find(tidalTrack => tidalTrack.id === item.id);

                                return <MissingTrack key={item.id} ref={setTrackRefs(index)} track={item} tidalTrack={tidalTrack} slskdEnabled={slskdEnabled} />;
                            })}

                            {totalPages > 1 &&
                                <Box mt={1} display="flex" justifyContent="space-between">
                                    <Button size="small" variant="outlined" color="inherit" disabled={page <= 0 || sendingToSlskd} onClick={prevPageClick}>Previous</Button>
                                    <Button size="small" variant="outlined" color="inherit" disabled={page >= totalPages - 1 || sendingToSlskd} onClick={nextPageClick}>Next</Button>
                                </Box>
                            }


                        </Box>
                    </>
                }
            </Box>
        </Dialog>
        {lidarrDialogOpen ? <LidarrAlbumDialog onClose={onCloseLidarrDialog} albums={uniqueAlbums} /> : null}
    </>)
}