import Logo from "@/components/Logo";
import SyncTrigger from "@/components/SyncTrigger";
import SpotifyNavigation from "@/components/SpotifyNavigation";
import MainLayout from "@/layouts/MainLayout";
import { Container, Paper, Typography } from '@mui/material';
import { NextPage } from "next";
import Head from "next/head";


const Page: NextPage = () => {
    return (
        <>
            <Head>
                <title>
                    Manual Sync - Spotify to Plex
                </title>
            </Head>
            <MainLayout maxWidth="900px">
                <Container>
                    <Logo  />
                    <SpotifyNavigation  />
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'action.hover' }}>
                        <Typography variant="h4" sx={{ mt: 2, mb: 0.5 }}>
                            Manual Synchronization
                        </Typography>

                        <Typography variant="body1" sx={{ mb: 3, maxWidth: 700 }}>
                            Manually trigger synchronization processes. These run in the background and can be monitored via the Logs page.
                        </Typography>
                        <SyncTrigger  />
                    </Paper>
                </Container>
            </MainLayout>
        </>
    );
};

export default Page;
