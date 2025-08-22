import Logo from "@/components/Logo";
import MainLayout from "@/layouts/MainLayout";
import { ChevronLeft } from "@mui/icons-material";
import { Button, Container, Paper, Typography } from "@mui/material";
import { NextPage } from "next";
import Head from "next/head";

const Page: NextPage = () => {

    return (
        <>
            <Head>
                <title>Plex Connection - Spotify to Plex</title>
            </Head>
            <MainLayout maxWidth="700px">
                <Container>
                    <Logo />
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'action.hover' }}>
                        <Button component="a" href="/" variant="outlined" color="inherit" size="small" startIcon={<ChevronLeft />}> Back</Button>

                        <Typography variant="h4" sx={{ mt: 2, mb: 0.5 }}>
                            Plex Connection
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 3, maxWidth: 500 }}>
                            Manage your Plex Media Server connection settings.
                        </Typography>

                    </Paper>
                </Container>
            </MainLayout>
        </>
    );
};

export default Page; 