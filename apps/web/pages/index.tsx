import Logo from "@/components/Logo";
import PlexConnection from "@/components/PlexConnection";
import PlexConnectionDialog from "@/components/PlexConnectionDialog";
import { errorBoundary } from "@/helpers/errors/errorBoundary";
import MainLayout from "@/layouts/MainLayout";
import { Assignment, People, PlaylistPlay, Tune } from "@mui/icons-material";
import { Alert, Box, Button, Card, CardActionArea, CardContent, Container, Divider, Paper, Typography } from "@mui/material";
import Grid2 from '@mui/material/Grid2';
import axios from "axios";
import { NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { enqueueSnackbar } from "notistack";
import { useCallback, useEffect, useState } from "react";

import { GetSettingsResponse } from "./api/settings";

const Page: NextPage = () => {

    const [settings, setSettings] = useState<GetSettingsResponse>();
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [plexDialogOpen, setPlexDialogOpen] = useState(false);
    const router = useRouter()

    useEffect(() => {
        errorBoundary(async () => {
            const settings = await axios.get<GetSettingsResponse>("/api/settings");
            setSettings(settings.data);
            setConnected(settings.data.loggedin);
            setLoading(false);
        }, undefined, true);
    }, []);

    const onPlexSettingsClick = useCallback(() => {
        setPlexDialogOpen(true);
    }, []);

    const onPlexDialogClose = useCallback(() => {
        setPlexDialogOpen(false);
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
            title: 'Plex Search Settings',
            description: 'Configure matching settings for Spotify to Plex search',
            icon: <Tune sx={{ fontSize: 40 }} />,
            path: '/plex/music-search-config'
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
                <Logo  />
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'action.hover' }}>

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

                    {!!connected && !!settings?.uri &&
                        <>
                            <Typography variant="h4" sx={{ mb: 3 }}>Spotify to Plex</Typography>
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
                                                    <Typography variant="h6" sx={{ mt: 2 }}>{item.title}</Typography>
                                                    <Typography variant="body2" color="text.secondary">{item.description}</Typography>
                                                </CardContent>
                                            </CardActionArea>
                                        </Card>
                                    </Grid2>
                                ))}
                            </Grid2>
                            <Divider sx={{ mb: 3, mt: 3 }} />
                            <Button variant="outlined" color="primary" onClick={onPlexSettingsClick}>Plex Settings</Button>
                        </>
                    }
                </Paper>
            </Container>
        </MainLayout>
        
        <PlexConnectionDialog open={plexDialogOpen} onClose={onPlexDialogClose} settings={settings} setSettings={setSettings} connected={connected} setConnected={setConnected} />
    </>);
};

export default Page;
