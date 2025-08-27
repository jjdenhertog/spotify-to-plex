import Logo from "@/components/Logo";
import MainLayout from "@/layouts/MainLayout";
import PlexConnection from "@/components/PlexConnection";
import { ChevronLeft, Settings, Tune } from "@mui/icons-material";
import { Button, Container, Paper, Typography, Box, Card, CardContent, CardActions, Divider } from "@mui/material";
import { NextPage } from "next";
import Head from "next/head";
import { useState, useEffect } from "react";
import { GetSettingsResponse } from "../api/settings";
import axios from "axios";
import { errorBoundary } from "@/helpers/errors/errorBoundary";

const Page: NextPage = () => {
    const [settings, setSettings] = useState<GetSettingsResponse | undefined>();
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        errorBoundary(async () => {
            const settings = await axios.get<GetSettingsResponse>("/api/settings");
            setSettings(settings.data);
            setConnected(settings.data.loggedin);
        }, undefined, true);
    }, []);

    return (
        <>
            <Head>
                <title>Plex Configuration - Spotify to Plex</title>
            </Head>
            <MainLayout maxWidth="800px">
                <Container>
                    <Logo />
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'action.hover', mb: 3 }}>
                        <Button component="a" href="/" variant="outlined" color="inherit" size="small" startIcon={<ChevronLeft />}>
                            Back
                        </Button>

                        <Typography variant="h4" sx={{ mt: 2, mb: 0.5 }}>
                            Plex Configuration
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 1, maxWidth: 600 }}>
                            Configure your Plex Media Server connection and music search settings.
                        </Typography>
                    </Paper>

                    {/* Connection Settings */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <Settings color="primary" />
                                <Typography variant="h6">Server Connection</Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Connect to your Plex Media Server to enable music synchronization.
                            </Typography>
                            
                            <PlexConnection 
                                settings={settings}
                                setSettings={setSettings}
                                connected={connected}
                                setConnected={setConnected}
                            />
                        </CardContent>
                    </Card>

                    <Divider sx={{ my: 3 }} />

                    {/* Advanced Settings */}
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <Tune color="secondary" />
                                <Typography variant="h6">Advanced Configuration</Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Fine-tune how music tracks are matched and searched between Spotify and Plex.
                            </Typography>
                            
                            <Card variant="outlined">
                                <CardContent>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                                        Music Search Configuration
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        Configure matching filters, text processing, and search approaches for optimal track matching.
                                    </Typography>
                                </CardContent>
                                <CardActions>
                                    <Button 
                                        component="a" 
                                        href="/plex/music-search-config"
                                        variant="contained"
                                        size="small"
                                    >
                                        Configure Search
                                    </Button>
                                </CardActions>
                            </Card>
                        </CardContent>
                    </Card>
                </Container>
            </MainLayout>
        </>
    );
};

export default Page; 