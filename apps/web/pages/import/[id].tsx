import Logo from "@/components/Logo";
import PlexPlaylist from "@/components/PlexPlaylist";
import { errorBoundary } from "@/helpers/errors/errorBoundary";
import MainLayout from "@/layouts/MainLayout";
import { GetSpotifyAlbum, GetSpotifyPlaylist, SavedItem } from "@/types/SpotifyAPI";
import { ChevronLeft } from "@mui/icons-material";
import { Box, Button, CircularProgress, Container, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import axios from "axios";
import { NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";

const Page: NextPage = () => {
    const [loading, setLoading] = useState(true);
    const [playlist, setPlaylist] = useState<GetSpotifyAlbum | GetSpotifyPlaylist>()
    const [fast, setFast] = useState(false)
    const [showOptimizer, setShowOptimizer] = useState(false)
    const router = useRouter();

    useEffect(() => {
        if (!router.isReady) return;

        errorBoundary(async () => {

            setLoading(true)
            if (typeof router.query.id != 'string')
                throw new Error(`ID expected.`)

            const result = await axios.get<GetSpotifyAlbum | GetSpotifyPlaylist>(`/api/spotify/items/${router.query.id}`)
            if (result.data.tracks.length > 100)
                setShowOptimizer(true)

            const savedItems = await axios.get<[SavedItem]>(`/api/saved-items?id=${router.query.id}`)
             
            const [savedItem] = savedItems.data
            if (!savedItem)
                throw new Error(`Could not find saved item`)

            setPlaylist({
                ...result.data,
                user_title: savedItem.title
            })
            setLoading(false)
        })

    }, [router.isReady, router.query.id])

    const onUseNormalClick = useCallback(() => {
        setFast(false)
        setShowOptimizer(false)
    }, [])
    const onUseFastClick = useCallback(() => {
        setFast(true)
        setShowOptimizer(false)
    }, [])


    return (<>
        <Head>
            <title>Spotify to Plex</title>
        </Head>
        <MainLayout maxWidth="700px">
            <Container>
                <Logo />


                {!!loading && <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, maxWidth: 300, border: '2px solid rgba(255,255,255,0.5)', borderRadius: '4px', p: 2, textAlign: 'center' }}>
                        <CircularProgress size={20} />
                        <Typography variant="body1">Loading Spotify data...</Typography>
                    </Box>
                </Box>}

                {!loading && !!playlist && !!showOptimizer &&
                    <Dialog open onClose={onUseNormalClick}>
                        <DialogTitle>Large playlist detected</DialogTitle>
                        <DialogContent>
                            <Typography variant="body2">
                                You are trying to match a large playlist with Plex. With the normal (more thorough) approach this will take a very long time. Using the fast approach it will do a more inaccurate search but it will be a lot faster.
                            </Typography>
                            <Typography variant="body2">Which option do you want to use?</Typography>
                        </DialogContent>
                        <DialogActions>
                            <Button variant="contained" onClick={onUseFastClick}>Fast</Button>
                            <Button variant="outlined" onClick={onUseNormalClick}>Normal</Button>
                        </DialogActions>
                    </Dialog>
                }

                {!loading && !!playlist && !showOptimizer &&
                    <>
                        <Button
                            component="a"
                            href="/spotify"
                            variant="outlined"
                            color="inherit"
                            size="small"
                            startIcon={<ChevronLeft />}
                        >
                            Back
                        </Button>
                        <PlexPlaylist playlist={playlist} fast={fast} />
                    </>
                }
            </Container>
        </MainLayout >

    </>
    )
}

export default Page;
