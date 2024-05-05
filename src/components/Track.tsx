import Check from "@mui/icons-material/Check";
import LibraryMusicSharp from "@mui/icons-material/LibraryMusicSharp";
import Warning from "@mui/icons-material/Warning";
import { Box, CircularProgress, Divider, Grid, IconButton, List, ListItem, Radio, RadioGroup, Sheet, Tooltip, Typography } from "@mui/joy";
import Image from "next/image";
import { useState } from "react";
import stringSimilarity from "string-similarity-js";

export type TrackProps = {
    loading: boolean
    trackName: string;
    artistName: string;
    reason: string;
    songs: {
        trackName: string
        artistName: string
        thumb: string
        tidal?: boolean
        album?: {
            title: string
            thumb: string
        }
    }[]
    songIdx: number
    setSongIdx?: (idx: number) => void
}
export default function Track(props: TrackProps) {
    const { loading, trackName, artistName, reason, songs = [], songIdx, setSongIdx } = props;
    const thumbSize = window.innerWidth < 400 ? 50 : 80;
    const [showSongs, setShowSongs] = useState<boolean>(false);
    const notFound = !loading && songs.length == 0;
    const { artistName: songArtistName = '', trackName: songTrackName = '', thumb, tidal } = songs[songIdx] ? songs[songIdx] : { thumb: undefined, tidal: false };
    const perfectMatch = songArtistName == '' || songTrackName == '' || stringSimilarity(`${songArtistName} - ${songTrackName}`, `${artistName} - ${trackName}`) > 0.9;


    return <Box p={1} position={'relative'}>
        <Grid container>
            <Grid style={{ maxWidth: thumbSize + 12 }}>
                <Sheet variant={loading ? "plain" : "soft"} sx={{ width: thumbSize, height: thumbSize, marginRight: 8, overflow: 'hidden', borderRadius: 3 }}>
                    {loading &&
                        <Box width={thumbSize} height={thumbSize} display={"flex"} justifyContent={"center"} alignItems={"center"}>
                            <CircularProgress size="sm" />
                        </Box>}
                    {notFound && <Box width={thumbSize} height={thumbSize} display={"flex"} gap={1} flexDirection={"column"} justifyContent={"center"} alignItems={"center"}>
                        <Warning />
                        <Typography variant="outlined" fontSize={'10px'}>Not found</Typography>
                    </Box>
                    }
                    {!!thumb && !loading && thumb &&
                        <img src={`${thumb}`} alt={trackName} width={thumbSize} height={thumbSize} />
                    }
                    {!thumb && !loading && !notFound && <Box width={thumbSize} height={thumbSize} display={"flex"} justifyContent={"center"} alignItems={"center"}>
                        <Check />
                    </Box>}
                    {tidal &&
                        <Box width={thumbSize - 10} height={thumbSize - 10} position={'absolute'} left={5} top={5} display={"flex"} justifyContent={"flex-end"} alignItems={"flex-end"}>
                            <Image src={'/img/icon-tidal-white.png'} alt="Tidal" width={15} height={15} />
                        </Box>
                    }
                </Sheet>
            </Grid>
            <Grid xs position={'relative'}>
                <Typography level="body-md" fontWeight={400}>{songTrackName || trackName}</Typography>
                <Typography level="body-sm" fontWeight={200}>{songArtistName || artistName}</Typography>
                <Typography level="body-sm" sx={{ color: "rgba(255,255,255,0.4)" }} fontWeight={100} fontSize={".8em"}>{reason}</Typography>
            </Grid>
            <Grid xs={1}>
                <Box display={'flex'} justifyContent={'flex-end'}>
                    {!notFound && !perfectMatch &&
                        <Tooltip size="sm" variant="outlined" title={<>
                            <Typography>Not a perfect match with:</Typography>
                            <Typography>{artistName} - {trackName}</Typography>
                        </>}>
                            <IconButton size="sm" onClick={() => setShowSongs(!showSongs)} sx={{ pl: .5, pr: .5 }}>
                                <Warning sx={{ fontSize: '1em' }} />
                            </IconButton>
                        </Tooltip>
                    }

                    {songs.length > 1 && !!setSongIdx &&
                        <IconButton size="sm" onClick={() => setShowSongs(!showSongs)} sx={{ pl: .5, pr: .5 }}>
                            <LibraryMusicSharp sx={{ fontSize: '1em' }} />
                            <Typography ml={.5} fontSize={'1em'} component={'span'}>{songs.length}</Typography>
                        </IconButton>
                    }
                </Box>
            </Grid>
        </Grid>
        {songs.length > 1 && showSongs &&
            <Box pl={4} marginTop={1}>
                <RadioGroup
                    value={`${songIdx}`}
                    onChange={(e) => {
                        if (typeof setSongIdx != 'undefined')
                            setSongIdx(Number(e.currentTarget.value))
                    }}
                >
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

                            return <ListItem variant="outlined" key={`${song.trackName}-${index}`} sx={{ boxShadow: 'sm' }}>
                                <Radio
                                    overlay
                                    value={`${index}`}
                                    label={<Box display={'block'}>
                                        <Box display={'flex'} gap={1}>
                                            <Box width={thumbSize} height={thumbSize} position={'relative'}>
                                                {song.thumb &&
                                                    <img src={song.thumb} alt={song.trackName} width={thumbSize} height={thumbSize} />
                                                }
                                                {song.tidal &&
                                                    <Box width={thumbSize - 10} height={thumbSize - 10} position={'absolute'} left={5} top={5} display={"flex"} justifyContent={"flex-end"} alignItems={"flex-end"}>
                                                        <Image src={'/img/icon-tidal-white.png'} alt="Tidal" width={15} height={15} />
                                                    </Box>
                                                }
                                            </Box>
                                            <Box>
                                                <Typography display={'block'} level="body-md">{song.trackName}</Typography>
                                                <Typography display={'block'} level="body-sm">{song.artistName}</Typography>
                                                {song.album &&
                                                    <Typography display={'block'} level="body-sm">{song.album.title}</Typography>
                                                }
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
            </Box>
        }
        <Divider sx={{ mt: 1, mb: 1 }} />
    </Box>
}
