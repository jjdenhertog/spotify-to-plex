import Logo from "@/components/Logo";
import ManagePlaylists from "@/components/ManagePlaylists";
import SpotifyNavigation from "@/components/SpotifyNavigation";
import MainLayout from "@/layouts/MainLayout";
import { Container, Paper, Typography } from '@mui/material';
import { NextPage } from "next";
import Head from "next/head";

const Page: NextPage = () => {
    return (
        <>
            <Head>
                <title>Manage Playlists - Spotify to Plex</title>
            </Head>
            <MainLayout maxWidth="700px">
                <Container>
                    <Logo />
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
                </Container>
            </MainLayout>
        </>
    );
};

export default Page; 