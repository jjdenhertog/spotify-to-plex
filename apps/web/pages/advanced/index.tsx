import Logo from "@/components/Logo";
import PlexConnectionDialog from "@/components/PlexConnectionDialog";
import MainLayout from "@/layouts/MainLayout";
import { Assignment, Tune } from "@mui/icons-material";
import { Button, Card, CardActionArea, CardContent, Container, Divider, Paper, Typography } from "@mui/material";
import Grid2 from '@mui/material/Grid2';
import { NextPage } from "next";
import Head from "next/head";
import { useCallback, useState } from "react";

import SpotifyNavigation from "@/components/SpotifyNavigation";

const Page: NextPage = () => {

    const [plexDialogOpen, setPlexDialogOpen] = useState(false);

    const onPlexSettingsClick = useCallback(() => {
        setPlexDialogOpen(true);
    }, []);

    const onPlexDialogClose = useCallback(() => {
        setPlexDialogOpen(false);
    }, []);

    const menuItems = [
        {
            title: 'Plex Search Settings',
            description: 'Configure matching settings for Spotify to Plex search',
            icon: <Tune sx={{ fontSize: 40 }} />,
            path: '/advanced/music-search-config'
        },
        {
            title: 'Logs',
            description: 'View system logs and sync history',
            icon: <Assignment sx={{ fontSize: 40 }} />,
            path: '/advanced/logs'
        }
    ];

    return (<>
        <Head>
            <title>Spotify to Plex</title>
        </Head>
        <MainLayout maxWidth="700px">
            <Container>
                <Logo />
                <SpotifyNavigation />
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'action.hover' }}>

                    <Typography variant="h4" sx={{ mt: 2, mb: 0.5 }}>
                        Advanced
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 3 }}>
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
                </Paper>
            </Container>
        </MainLayout>

        {!!plexDialogOpen && <PlexConnectionDialog onClose={onPlexDialogClose} />}
    </>);
};

export default Page;
