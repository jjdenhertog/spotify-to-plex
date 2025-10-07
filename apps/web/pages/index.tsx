import Logo from "@/components/Logo";
import ManagePlaylists from "@/components/ManagePlaylists";
import PlexConnection from "@/components/PlexConnection";
import SpotifyNavigation from "@/components/SpotifyNavigation";
import { errorBoundary } from "@/helpers/errors/errorBoundary";
import MainLayout from "@/layouts/MainLayout";
import { Alert, Box, Container, Paper, Typography } from '@mui/material';
import axios from "axios";
import { NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { enqueueSnackbar } from "notistack";
import { useEffect, useState } from "react";
import { GetSettingsResponse } from "./api/settings";

const Page: NextPage = () => {

    const [settings, setSettings] = useState<GetSettingsResponse>();
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter()

    useEffect(() => {
        errorBoundary(async () => {
            const settings = await axios.get<GetSettingsResponse>("/api/settings");
            setSettings(settings.data);
            setConnected(settings.data.loggedin);
            setLoading(false);
        }, undefined, true);
    }, []);


    useEffect(() => {
        if (!router.isReady) return;

        if (router.query.plex) {
            errorBoundary(async () => {
                const result = await axios.post<{ ok: boolean; }>('/api/auth/verify');
                if (result.data.ok) {
                    setLoading(true);
                    const settings = await axios.get<GetSettingsResponse>("/api/settings");
                    if (settings.data.loggedin)
                        setSettings(settings.data);

                    setConnected(settings.data.loggedin);
                    setLoading(false);

                    enqueueSnackbar("Plex connection verified", { variant: "success" });

                }

                router.replace("/", undefined, { shallow: true });
            });
        }
    }, [router, router.isReady]);


    return (
        <>
            <Head>
                <title>
                    Manage Playlists - Spotify to Plex
                </title>
            </Head>
            <MainLayout maxWidth="700px">
                <Container>
                    <Logo />

                    {!!loading &&
                        <Box display="flex" justifyContent="center">
                            <Alert severity="info" sx={{ ml: 2 }}>
                                Checking your connection with Plex
                            </Alert>
                        </Box>
                    }

                    {!connected && !loading &&
                        <PlexConnection settings={settings} setSettings={setSettings} connected={connected} setConnected={setConnected} />
                    }

                    {!!connected && !settings?.uri &&
                        <PlexConnection settings={settings} setSettings={setSettings} connected={connected} setConnected={setConnected} />
                    }

                    {!!connected && !!settings?.uri && <>
                        <SpotifyNavigation />
                        <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'action.hover' }}>
                            <Typography variant="h4" sx={{ mt: 2, mb: 0.5 }}>
                                Manage Playlists & Albums
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 1, maxWidth: 500 }}>
                                Manage your Spotify playlists and albums synchronization with Plex.
                            </Typography>
                        </Paper>

                        <ManagePlaylists />
                    </>
                    }
                </Container>
            </MainLayout>
        </>
    );
};

export default Page; 