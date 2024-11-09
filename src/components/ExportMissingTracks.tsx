import { errorBoundary } from "@/helpers/errors/errorBoundary";
import { GetTidalTracksResponse } from "@/pages/api/tidal";
import { Track } from "@/types/SpotifyAPI";
import { Alert, Box, Button, CircularProgress, Divider, Modal, ModalClose, ModalDialog, Typography } from "@mui/joy";
import axios from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PlexPlaylistProps } from "./PlexPlaylist";

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
            const tidalTrack = tidalTracks.find(item => item.id == track.id)
            if (!tidalTrack || tidalTrack.tidal_ids?.length == 0)
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

    const hasTidalTracks = tidalTracks.some(item => item.tidal_ids && item.tidal_ids.length > 0)

    return (<Modal open onClose={onClose} disableEscapeKeyDown disablePortal>
        <ModalDialog sx={{ maxWidth: 600 }}>
            <ModalClose />
            {!!loading && <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
            </Box>}

            {!loading &&
                <>
                    <Typography level="h1">Missing tracks</Typography>
                    <Typography level="body-md">Below you find an overview of all missing tracks of the current selection.</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {tracks.length > 0 &&
                            <>
                                <form method="POST" action="/api/download" target="_blank" >
                                    <input type="hidden" name="type" value="spotify" />
                                    <input type="hidden" name="tracks" value={tracks.map(item => item.id)} />
                                    <Button variant="outlined" type="submit">Download Spotify links</Button>
                                </form>
                                {(missingTidalTracks.length > 0 && !hasLoadedTidalTracks) &&
                                    <Button disabled={loadingTracks || !canUseTidal} onClick={onLoadTidalLinksClick} variant="outlined">Load Tidal links</Button>
                                }

                                {((!!hasTidalTracks && !!hasLoadedTidalTracks) || missingTidalTracks.length == 0) &&
                                    <form method="POST" action="/api/download" target="_blank" >
                                        <input type="hidden" name="type" value="tidal" />
                                        <input type="hidden" name="tracks" value={tracks.map(item => item.id)} />
                                        <Button variant="outlined" type="submit">Download Tidal links</Button>
                                    </form>
                                }
                            </>
                        }
                    </Box>
                    {!canUseTidal &&
                        <Alert sx={{ fontWeight: 'normal' }} color="warning">You have not added Tidal credentials. Visit Github for more info.</Alert>
                    }
                    <Divider sx={{ mt: 1, mb: 2 }} />

                    {!!loadingTracks &&
                        <Box >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, border: '2px solid rgba(255,255,255,0.5)', borderRadius: '4px', p: 2, textAlign: 'center' }}>
                                <Box sx={{ alignItems: 'center' }}>
                                    <CircularProgress color="neutral" size="sm" />
                                </Box>
                                <Box sx={{ flexGrow: 1, display: 'flex', gap: 1, justifyContent: 'space-between' }}>
                                    <Typography level="body-md" sx={{ color: 'rgba(255,255,255,0.7)' }}>Processed {tracksLoaded.length} of {tracksToLoad} Tidal tracks</Typography>
                                    <Typography onClick={onCancelClick} level="body-md" sx={{ textDecoration: 'underline', textUnderlineOffset: '2px', textDecorationThickness: '1px', cursor: 'pointer', color: 'var(--joy-palette-primary-400)' }}>cancel</Typography>
                                </Box>
                            </Box>
                        </Box>
                    }

                    {!loadingTracks && tidalTracks.length > 0 && missingTidalTracks.length > 0 &&
                        <Box sx={{ mt: 1, mb: 1 }}>
                            <Alert variant="outlined" color="warning">
                                <Box sx={{ p: 1 }}>
                                    <Typography mb={.5} level="h2" color="warning">{missingTidalTracks.length} Tidal tracks not found</Typography>
                                    <Typography mb={1} level="body-sm">Not all Tidal tracks could be found.</Typography>
                                </Box>
                            </Alert>
                        </Box>
                    }

                    <Box>

                        {visibleTracks.map(item => {

                            const tidalTrack = tidalTracks.find(tidalTrack => tidalTrack.id == item.id)

                            return <>
                                <Box key={item.id}
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        '& .btn': { visibility: 'hidden' },
                                        '&:hover .btn': { visibility: 'visible' },
                                        gap: 1,
                                        mb: 1
                                    }}>

                                    <Box>
                                        <Typography level="body-md" color={!!tidalTrack && !!tidalTrack.tidal_ids && tidalTrack.tidal_ids.length == 0 ? 'warning' : undefined}>
                                            {item.title}
                                        </Typography>
                                        <Typography level="body-xs">
                                            {item.artists.join(', ')}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                        <Box>
                                            {!!tidalTrack && !!tidalTrack.tidal_ids && tidalTrack.tidal_ids.length > 0 &&
                                                <Button component="a" href={`https://tidal.com/browse/track/${tidalTrack.tidal_ids[0]}`} target="_blank" className="btn" color="neutral" variant="outlined" size="sm" sx={{ fontSize: '.8em' }}>Tidal</Button>
                                            }
                                        </Box>
                                        <Box>
                                            <Button component="a" href={`https://open.spotify.com/track/${item.id}`} target="_blank" className="btn" color="neutral" variant="outlined" size="sm" sx={{ fontSize: '.8em' }}>Spotify</Button>
                                        </Box>
                                    </Box>
                                </Box>
                                <Divider sx={{ mt: 1, mb: 1 }} />
                            </>

                        })}

                        {totalPages > 1 &&
                            <Box mt={1} display="flex" justifyContent="space-between">
                                <Button size="sm" variant="outlined" color="neutral" disabled={page <= 0} onClick={prevPageClick}>Previous</Button>
                                <Button size="sm" variant="outlined" color="neutral" disabled={page >= totalPages} onClick={nextPageClick}>Next</Button>
                            </Box>
                        }


                    </Box>
                </>
            }
        </ModalDialog>
    </Modal>)
}