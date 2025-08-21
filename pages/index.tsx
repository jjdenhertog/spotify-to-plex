import Logo from "@/components/Logo";
import PlexConnection from "@/components/PlexConnection";
import { errorBoundary } from "@/helpers/errors/errorBoundary";
import MainLayout from "@/layouts/MainLayout";
import { Assignment, ChevronLeft, People, PlaylistPlay, Search } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import { Alert, Box, Button, Card, CardActionArea, CardContent, Container, Divider, Paper, Typography } from "@mui/material";
import Grid2 from '@mui/material/Grid2';
import axios from "axios";
import { NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { enqueueSnackbar } from "notistack";
import { useCallback, useEffect, useState } from "react";

import { GetAuthUrlResponse } from "./api/auth/url";
import { GetSettingsResponse } from "./api/settings";

const Page: NextPage = () => {

    const [settings, setSettings] = useState<GetSettingsResponse>();
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [creatingUrl, setCreatingUrl] = useState(false);
    const [editPlexConnection, setEditPlexConnection] = useState(false)
    const router = useRouter()

    useEffect(() => {
        errorBoundary(async () => {
            const settings = await axios.get<GetSettingsResponse>("/api/settings");
            setSettings(settings.data);
            setConnected(settings.data.loggedin);
            setLoading(false);
        }, undefined, true);
    }, []);

    const onPlexLoginClick = useCallback(() => {
        setCreatingUrl(true);
        errorBoundary(async () => {
            const result = await axios.post<GetAuthUrlResponse>('/api/auth/url', {
                callback: window.location.href
            });
            if (top)
                top.location.href = result.data.authUrl;
        }, () => {
            setCreatingUrl(false);
        });
    }, []);

    const onEditPlexConnectionClick = useCallback(() => {
        setEditPlexConnection(prev => !prev);
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

    const menuItems = [
        {
            title: 'Playlists & Albums',
            description: 'Manage your Spotify playlists and albums synchronization',
            icon: <PlaylistPlay sx={{ fontSize: 40 }} />,
            path: '/spotify/manage-playlists'
        },
        {
            title: 'Users',
            description: 'Manage Spotify user connections',
            icon: <People sx={{ fontSize: 40 }} />,
            path: '/spotify/manage-users'
        },
        {
            title: 'Search Analyzer',
            description: 'Debug Spotify to Plex search results',
            icon: <Search sx={{ fontSize: 40 }} />,
            path: '/spotify/search-analyzer'
        },
        {
            title: 'Logs',
            description: 'View system logs and sync history',
            icon: <Assignment sx={{ fontSize: 40 }} />,
            path: '/spotify/logs'
        }
    ];

    return (<>
        <Head>
            <title>Spotify to Plex</title>
        </Head>
        <MainLayout maxWidth="700px">
            <Container>
                <Logo />
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'action.hover' }}>

                    {!!loading &&
                        <Box display="flex" justifyContent="center">
                            <Alert severity="info" sx={{ ml: 2 }}>
                                Checking your connection with Plex
                            </Alert>
                        </Box>
                    }

                    {!connected && !loading &&

                        <Box textAlign="center">
                            <Typography variant="body1" sx={{ mb: 2 }}>
                                You need to login to Plex to continue.
                            </Typography>
                            <LoadingButton loading={creatingUrl} onClick={onPlexLoginClick} variant="contained" color="primary">
                                Login to Plex
                            </LoadingButton>
                        </Box>
                    }

                    {!!connected && (!settings?.uri || !!editPlexConnection) &&
                        <>
                            {!!editPlexConnection && <Button onClick={onEditPlexConnectionClick} variant="outlined" color="inherit" size="small" startIcon={<ChevronLeft />}>
                                Back
                            </Button>
                            }
                            <PlexConnection settings={settings} setSettings={setSettings} connected={connected} setConnected={setConnected} />
                        </>
                    }

                    {!!connected && !!settings?.uri && !editPlexConnection &&
                        <>
                            <Typography variant="h4" sx={{ mb: 3 }}>
                                Spotify to Plex
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 3, maxWidth: 500 }}>
                                Manage your Spotify connections, synchronization settings, and view system logs.
                            </Typography>
                            <Grid2 container spacing={2}>
                                {menuItems.map((item) => (
                                    <Grid2 size={{ xs: 12, sm: 6 }} key={item.path}>
                                        <Card>
                                            <CardActionArea component="a" href={item.path} sx={{ height: '100%' }}>
                                                <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', p: 3 }}>
                                                    {item.icon}
                                                    <Typography variant="h6" sx={{ mt: 2 }}>
                                                        {item.title}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {item.description}
                                                    </Typography>
                                                </CardContent>
                                            </CardActionArea>
                                        </Card>
                                    </Grid2>
                                ))}
                            </Grid2>
                            <Divider sx={{ mb: 3, mt: 3 }} />
                            <Button variant="outlined" color="primary" onClick={onEditPlexConnectionClick}>
                                Edit Plex Connection
                            </Button>
                        </>
                    }
                </Paper>
            </Container>
        </MainLayout>
    </>);
};

export default Page;
