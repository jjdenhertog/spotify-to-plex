import Logo from "@/components/Logo";
import SearchAnalyzer from "@/components/SearchAnalyzer";
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
                    Search Analyzer - Spotify to Plex
                </title>
            </Head>
            <MainLayout maxWidth="700px">
                <Container>
                    <Logo  />
                    <SpotifyNavigation  />
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'action.hover' }}>
                        <Typography variant="h4" sx={{ mt: 2, mb: 0.5 }}>Search Analyzer</Typography>
                        <Typography variant="body1" sx={{ mb: 1, maxWidth: 500 }}>
                            Analyze and debug Spotify to Plex search results.
                        </Typography>
                        <SearchAnalyzer  />
                    </Paper>
                </Container>
            </MainLayout>
        </>
    );
};

export default Page; 