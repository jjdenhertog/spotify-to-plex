import Logo from "@/components/Logo";
import Logs from "@/components/Logs";
import SpotifyNavigation from "@/components/SpotifyNavigation";
import MainLayout from "@/layouts/MainLayout";
import { Container, Paper, Typography } from '@mui/material';
import Head from "next/head";
const Page = () => {
    return (<>
            <Head>
                <title>Logs - Spotify to Plex</title>
            </Head>
            <MainLayout maxWidth="700px">
                <Container>
                    <Logo />
                    <SpotifyNavigation />
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'action.hover' }}>
                        <Typography variant="h4" sx={{ mt: 2, mb: 0.5 }}>
                            System Logs
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 1, maxWidth: 500 }}>
                            View system logs and synchronization history.
                        </Typography>

                        <Logs />
                    </Paper>
                </Container>
            </MainLayout>
        </>);
};
export default Page;
//# sourceMappingURL=logs.jsx.map