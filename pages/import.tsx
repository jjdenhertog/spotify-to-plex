import PlexPlaylist from "@/components/PlexPlaylist";
import { errorBoundary } from "@/helpers/errors/errorBoundary";
import MainLayout from "@/layouts/MainLayout";
import { GetSpotifyAlbum, GetSpotifyPlaylist } from "@/types/SpotifyAPI";
import { ChevronLeft, KeyboardArrowRightSharp } from "@mui/icons-material";
import { Box, Button, Divider, Input, Sheet, Typography } from "@mui/joy";
import axios from "axios";
import { NextPage } from "next";
import Head from "next/head";
import { useState } from "react";

const Page: NextPage = () => {
    const [generating, setGenerating] = useState<boolean>(false);
    const [spotifyInput, setSpotifyInput] = useState<string>('')
    const [playlist, setPlaylist] = useState<GetSpotifyAlbum | GetSpotifyPlaylist>()
    const onGenerateClick = () => {
        errorBoundary(async () => {
            setGenerating(true);

            const result = await axios.post<GetSpotifyAlbum | GetSpotifyPlaylist>(`/api/spotify`, {
                search: spotifyInput
            })
            setPlaylist(result.data)
            setGenerating(false);

        }, () => {
            setGenerating(false);
        })
    }
    const sendDisabled = String(spotifyInput).length < 8;
    return (<>
        <Head>
            <title>Spotify to Plex</title>
        </Head>
        <MainLayout>
            <Sheet sx={{ minHeight: "calc(100vh - 120px)" }}>
                <Sheet>

                    <Box maxWidth={600} p={2} margin={"0 auto"}>
                        <Button component="a" href="/" variant="outlined" color="neutral" size="sm" startDecorator={<ChevronLeft />}>Back</Button>
                        <Typography level="h1" mt={2} mb={.5}>Import Spotify Playlist</Typography>
                        <Typography mb={1} level="body-md">It currently supports the following input:</Typography>
                        <Typography level="body-md" mt={1} mb={.5} sx={{ fontSize: ".9em" }} startDecorator={<KeyboardArrowRightSharp sx={{ fontSize: "1.1em" }} />}>Spotify URL &#40;e.g. https://open.spotify.com/playlist/37i9dQZF1EQqA6klNdJvwx &#41;</Typography>
                        <Typography level="body-md" mb={.5} sx={{ fontSize: ".9em" }} startDecorator={<KeyboardArrowRightSharp sx={{ fontSize: "1.1em" }} />}>Spotify URI &#40;e.g. spotify:playlist:37i9dQZF1EQqA6klNdJvwx &#41;</Typography>
                        <Box mt={2}>
                            <Typography level="body-sm" >Note: Automated Spotify playlists differs per user and per country.</Typography>
                        </Box>
                        <Box mt={2}>
                            <Input placeholder="Enter your Spotify URL/URI here.." disabled={generating} value={spotifyInput} onChange={(e) => setSpotifyInput(e.currentTarget.value)} />
                            <Box mt={1}>
                                <Button loading={generating} size="sm" disabled={!!sendDisabled} onClick={onGenerateClick}>Import playlist</Button>
                            </Box>
                        </Box>
                    </Box>
                </Sheet>
                <Sheet>
                    <Box maxWidth={600} p={3} margin={"0 auto"}>
                        {playlist && <>
                            <Divider sx={{ mb: 2 }} />
                            <PlexPlaylist playlist={playlist} />
                        </>
                        }
                    </Box>
                </Sheet>
            </Sheet>
        </MainLayout >

    </>
    )
}

export default Page;
