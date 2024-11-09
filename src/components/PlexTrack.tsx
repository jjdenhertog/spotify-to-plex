import { SearchResponse } from "@jjdenhertog/plex-music-search";
import { Check, LibraryMusicSharp, Warning } from "@mui/icons-material";
import { Box, CircularProgress, Divider, Grid, IconButton, List, ListItem, Radio, RadioGroup, Sheet, Tooltip, Typography } from "@mui/joy";
import { ChangeEvent, useCallback, useMemo, useState } from "react";
import stringSimilarity from "string-similarity-js";
import TrackAnalyzer from "./TrackAnalyzer";
type Props = {
    readonly loading: boolean
    readonly track: {
        id: string
        artists: string[];
        title: string;
        reason?: string;
    }
    readonly fast: boolean
    readonly data?: SearchResponse
    readonly songIdx: number
    readonly setSongIdx?: (artist: string, name: string, idx: number) => void
}
export default function PlexTrack(props: Props) {

    const { loading, track, data, songIdx, setSongIdx, fast = false } = props;

    const songs = useMemo(() => {

        if (!data)
            return []

        return data.result.map(item => {
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
            }
        })
    }, [data])


    const {
        id,
        title: trackTitle,
        artists: artistNames,
        reason
    } = track

    const {
        artistName: songArtistName = '',
        trackTitle: songTrackTitle = '',
        thumb
    } = songs[songIdx] ?? { thumb: undefined };



    const thumbSize = window.innerWidth < 400 ? 50 : 80;
    const isLoading = loading && songs.length == 0;
    const notFound = !loading && songs.length == 0;

    ////////////////////////////////////
    // Handle multiple song results
    ////////////////////////////////////
    const [showSongs, setShowSongs] = useState(false);
    const onShowSongsClick = useCallback(() => {
        setShowSongs(prev => !prev)
    }, [])
    const onChangeSongIdx = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const songIdx = Number(e.currentTarget.value)
        if (setSongIdx)
            setSongIdx(artistNames[0], trackTitle, songIdx)

    }, [artistNames, setSongIdx, trackTitle])

    ////////////////////////////////////
    // Handle not perfect songs
    ////////////////////////////////////
    const perfectMatch = songArtistName == '' || songTrackTitle == '' || stringSimilarity(`${songArtistName} - ${songTrackTitle}`, `${artistNames.join(', ')} - ${trackTitle}`) > 0.9;
    const [showMatchAnalyser, setShowMatchAnalyser] = useState(false)
    const onNotPerfectMatchClick = useCallback(() => {
        setShowMatchAnalyser(prev => !prev)
    }, [])

    return (<Box p={1} position="relative">
        <Grid container>
            <Grid style={{ maxWidth: thumbSize + 12 }}>
                <Sheet variant={isLoading ? "plain" : "soft"} sx={{ width: thumbSize, height: thumbSize, marginRight: 8, overflow: 'hidden', borderRadius: 3 }}>
                    {isLoading ? <Box width={thumbSize} height={thumbSize} display="flex" justifyContent="center" alignItems="center">
                        <CircularProgress size="sm" />
                    </Box> : null}
                    {notFound ? <Box width={thumbSize} height={thumbSize} display="flex" gap={1} flexDirection="column" justifyContent="center" alignItems="center">
                        <Warning />
                        <Typography variant="outlined" fontSize="10px">Not found</Typography>
                    </Box> : null
                    }
                    {!!thumb && !isLoading && thumb ? <img src={thumb} alt={trackTitle} width={thumbSize} height={thumbSize} /> : null
                    }
                    {!thumb && !isLoading && !notFound && <Box width={thumbSize} height={thumbSize} display="flex" justifyContent="center" alignItems="center">
                        <Check />
                    </Box>}
                </Sheet>
            </Grid>

            <Grid xs position="relative">
                <Typography level="body-md" fontWeight={400}>{songTrackTitle || trackTitle}</Typography>
                <Typography level="body-sm" fontWeight={200}>{songArtistName || artistNames}</Typography>
                <Typography level="body-sm" sx={{ color: "rgba(255,255,255,0.4)" }} fontWeight={100} fontSize=".8em">{reason}</Typography>
            </Grid>

            <Grid xs={1}>
                <Box display="flex" justifyContent="flex-end">
                    {!notFound && !perfectMatch &&
                        <Tooltip size="sm" variant="outlined" title={<Box sx={{ maxWidth: 300 }}>
                            <Typography>Not a perfect match, click for more info.</Typography>
                            <Typography>{artistNames.join(', ')} - {trackTitle}</Typography>
                        </Box>}>
                            <IconButton size="sm" onClick={onNotPerfectMatchClick} sx={{ pl: .5, pr: .5, '&:hover': { background: 'none' } }}>
                                <Warning sx={{ fontSize: '1em' }} />
                            </IconButton>
                        </Tooltip>
                    }
                    {songs.length > 1 && !!setSongIdx &&
                        <IconButton size="sm" onClick={onShowSongsClick} sx={{ pl: .5, pr: .5 }}>
                            <LibraryMusicSharp sx={{ fontSize: '1em' }} />
                            <Typography ml={.5} fontSize="1em" component="span">{songs.length}</Typography>
                        </IconButton>
                    }
                </Box>
            </Grid>
        </Grid>
        {songs.length > 1 && showSongs ? <Box pl={4} marginTop={1}>
            <RadioGroup value={`${songIdx}`} onChange={onChangeSongIdx}>
                <List
                    sx={{
                        minWidth: 240,
                        '--List-gap': '0.5rem',
                        '--ListItem-paddingY': '1rem',
                        '--ListItem-radius': '8px',
                        '--ListItemDecorator-size': '32px',
                    }}
                >
                    {songs.map((song, index) => {

                        return <ListItem variant="outlined" key={`${id}-${song.trackTitle}`} sx={{ boxShadow: 'sm' }}>
                            <Radio
                                overlay
                                value={`${index}`}
                                label={<Box display="block">
                                    <Box display="flex" gap={1}>
                                        <Box width={thumbSize} height={thumbSize} position="relative">
                                            {!!song.thumb && <img src={song.thumb} alt={song.trackTitle} width={thumbSize} height={thumbSize} />}
                                        </Box>
                                        <Box>
                                            <Typography display="block" level="body-md">{song.trackTitle}</Typography>
                                            <Typography display="block" level="body-sm">{song.artistName}</Typography>
                                            {!!song.album && <Typography display="block" level="body-sm">{song.album.title}</Typography>}
                                        </Box>
                                    </Box>
                                </Box>
                                }
                                slotProps={{
                                    action: ({ checked }) => ({
                                        sx: (theme) => ({
                                            ...(checked && {
                                                inset: -1,
                                                border: '2px solid',
                                                borderColor: theme.vars.palette.primary[500],
                                            }),
                                        }),
                                    }),
                                }}
                            />
                        </ListItem>
                    })}
                </List>
            </RadioGroup>
        </Box> : null
        }
        <Divider sx={{ mt: 1, mb: 1 }} />

        {!!showMatchAnalyser &&
            <TrackAnalyzer track={track} onClose={onNotPerfectMatchClick} fast={fast} />
        }
    </Box >)
}