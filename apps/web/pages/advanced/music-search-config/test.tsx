import { Box, Button, Card, CardContent, Divider, TextField, Typography } from "@mui/material"
import { NextPage } from "next"
import MusicSearchConfigLayout from "@/components/layouts/MusicSearchConfigLayout"
import TrackAnalyzer from "@/components/TrackAnalyzer"
import { useState, useRef, ElementRef, useEffect, useCallback } from "react"

const STORAGE_KEY = 'spotify-test-track-id';

const TestConfigPage: NextPage = () => {
    const [spotifyId, setSpotifyId] = useState('');

    const trackAnalyzerRef = useRef<ElementRef<typeof TrackAnalyzer>>(null);

    useEffect(() => {
        const savedId = localStorage.getItem(STORAGE_KEY);
        if (savedId) {
            setSpotifyId(savedId);
        }
    }, []);

    // Save Spotify ID to localStorage whenever it changes
    const handleIdChange = (value: string) => {
        setSpotifyId(value);
        if (value.trim()) {
            localStorage.setItem(STORAGE_KEY, value.trim());
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    };

    const handleAnalyzePlex = useCallback(() => {
        if (!spotifyId.trim()) return;

        trackAnalyzerRef.current?.analyze(spotifyId.trim(), 'plex');
    }, [spotifyId]);

    const handleAnalyzeTidal = useCallback(() => {
        if (!spotifyId.trim()) return;

        trackAnalyzerRef.current?.analyze(spotifyId.trim(), 'tidal');
    }, [spotifyId]);

    const extractSpotifyId = (input: string): string => {
        // Handle Spotify URLs like: https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC
        const urlRegex = /spotify\.com\/track\/([\dA-Za-z]+)/;
        const urlMatch = urlRegex.exec(input);
        if (urlMatch?.[1]) return urlMatch[1];

        // Handle Spotify URIs like: spotify:track:4uLU6hMCjMI75M1A2tKUQC
        const uriRegex = /spotify:track:([\dA-Za-z]+)/;
        const uriMatch = uriRegex.exec(input);
        if (uriMatch?.[1]) return uriMatch[1];

        // Return as-is if it looks like a track ID
        return input.trim();
    };

    const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.target;
        const trackId = extractSpotifyId(value);
        handleIdChange(trackId);
    }, []);
    
    return (
        <MusicSearchConfigLayout activeTab="test" title="Test Configuration">
            <Card>
                <CardContent>
                    <Box sx={{ p: 3 }}>
                        <Typography variant="h5" sx={{ mb: 3 }}>
                            Track Analysis Testing
                        </Typography>

                        <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                            Enter a Spotify track ID, URL, or URI to analyze how it matches with your Plex library using your current search configuration.
                        </Typography>

                        <TextField fullWidth value={spotifyId} onChange={handleInputChange} placeholder="e.g., 4uLU6hMCjMI75M1A2tKUQC or https://open.spotify.com/track/..." />
                        <Box pt={1}>
                            <Button variant="contained" onClick={handleAnalyzePlex} disabled={!spotifyId.trim()} sx={{ mr: 1 }}>
                                Analyze Track in Plex
                            </Button>
                            <Button variant="contained" onClick={handleAnalyzeTidal} disabled={!spotifyId.trim()}>
                                Analyze Track in Tidal
                            </Button>
                        </Box>

                        <Divider sx={{ my: 2 }} />
                        <TrackAnalyzer ref={trackAnalyzerRef} />
                    </Box>
                </CardContent>
            </Card>
        </MusicSearchConfigLayout>
    )
}

export default TestConfigPage