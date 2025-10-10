import Logo from "@/components/Logo";
import LidarrSettings from "@/components/LidarrSettings";
import SpotifyNavigation from "@/components/SpotifyNavigation";
import MainLayout from "@/layouts/MainLayout";
import { Container, Paper, Typography, Divider } from '@mui/material';
import { NextPage } from "next";
import Head from "next/head";

const Page: NextPage = () => {
    return (
        <>
            <Head>
                <title>Settings - Spotify to Plex</title>
            </Head>
            <MainLayout maxWidth="700px">
                <Container>
                    <Logo />
                    <SpotifyNavigation />
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'action.hover' }}>
                        <Typography variant="h4" sx={{ mt: 2, mb: 0.5 }}>
                            Settings
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 3 }}>
                            Configure integrations and advanced features.
                        </Typography>

                        <Divider sx={{ mb: 3 }} />

                        <LidarrSettings />

                        {/* Future settings sections go here */}
                    </Paper>
                </Container>
            </MainLayout>
        </>
    );
};

export default Page;
