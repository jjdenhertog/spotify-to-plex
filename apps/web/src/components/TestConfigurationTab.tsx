import { errorBoundary } from "@/helpers/errors/errorBoundary";
import type { SearchResponse } from "@spotify-to-plex/plex-music-search/types/SearchResponse";
import type { PlexTrack } from "@spotify-to-plex/plex-music-search/types/PlexTrack";
import { Box, CircularProgress, Divider, Typography, TextField, Button, Paper, Link } from "@mui/material";
import { Search as SearchIcon } from '@mui/icons-material';
import axios from "axios";
import { useState, useCallback } from "react";

export default function TestConfigurationTab() {
    const [loading, setLoading] = useState(false);
    const [searchResponse, setSearchResponse] = useState<SearchResponse>();
    const [testTrack, setTestTrack] = useState('{"id": "test1", "artists": ["The Beatles"], "title": "Hey Jude"}');

    const handleTestTrackChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setTestTrack(e.target.value);
    }, []);

    const handleAnalyzeTrack = useCallback(() => {
        errorBoundary(async () => {
            setSearchResponse(undefined);
            setLoading(true);

            try {
                const track = JSON.parse(testTrack);
                const result = await axios.post(`/api/plex/analyze`, {
                    item: track,
                    fast: false
                });

                setSearchResponse(result.data);
            } catch (_error) {
                // Error is already handled by errorBoundary
            } finally {
                setLoading(false);
            }
        });
    }, [testTrack]);

    const getRoundedSimilarity = useCallback((value: number) => {
        return `${Math.round(value * 100)}%`;
    }, []);

    const handleQuickTest1 = useCallback(() => {
        setTestTrack('{"id": "test1", "artists": ["The Beatles"], "title": "Hey Jude (Remastered 2009)"}');
    }, []);
    
    const handleQuickTest2 = useCallback(() => {
        setTestTrack('{"id": "test2", "artists": ["Ed Sheeran", "Justin Bieber"], "title": "I Don\'t Care"}');
    }, []);
    
    const handleQuickTest3 = useCallback(() => {
        setTestTrack('{"id": "test3", "artists": ["Queen"], "title": "Bohemian Rhapsody - Radio Edit"}');
    }, []);

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SearchIcon />
                Test Your Configuration
            </Typography>
            
            <Typography variant="body1" sx={{ mb: 2 }}>
                Test how your current configuration processes and matches tracks. This helps you fine-tune 
                your settings for better matching results.
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                When reporting issues, please share a screenshot of the results from this page at{' '}
                <Link href="https://github.com/jjdenhertog/spotify-to-plex/issues" target="_blank" color="warning">
                    GitHub Issues
                </Link>.
            </Typography>

            <Divider sx={{ mb: 3 }} />

            {/* Quick Test Examples */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                    Quick Test Examples:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button size="small" variant="outlined" onClick={handleQuickTest1}>
                        Song with (Remaster)
                    </Button>
                    <Button size="small" variant="outlined" onClick={handleQuickTest2}>
                        Song with Features
                    </Button>
                    <Button size="small" variant="outlined" onClick={handleQuickTest3}>
                        Song with Radio Edit
                    </Button>
                </Box>
            </Box>

            {/* Test Input */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Track Data Input</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Enter track data in JSON format to test matching:
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 2 }}>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Track JSON"
                        value={testTrack}
                        onChange={handleTestTrackChange}
                        disabled={loading}
                        placeholder='{"id": "test", "artists": ["Artist Name"], "title": "Song Title"}'
                        helperText='Format: {"id": "string", "artists": ["array"], "title": "string"}'
                    />
                    <Button variant="contained" onClick={handleAnalyzeTrack} disabled={loading || !testTrack.trim()} startIcon={<SearchIcon />} sx={{ minWidth: 120, height: 56 }}>
                        Analyze
                    </Button>
                </Box>
            </Box>

            {/* Loading State */}
            {!!loading && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 5 }}>
                    <CircularProgress />
                </Box>
            )}

            {/* Results */}
            {!loading && !!searchResponse && (
                <>
                    <Typography variant="h6" sx={{ mb: 2 }}>Results</Typography>
                    
                    {!!searchResponse.result && searchResponse.result.length === 0 && (
                        <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'warning.50' }}>
                            <Typography variant="body1">
                                No matches found for this track.
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Try adjusting your configuration settings or check if the track exists in your Plex library.
                            </Typography>
                        </Paper>
                    )}
                    
                    {searchResponse.result.map(({ id, title, artist, matching, reason }: PlexTrack) => {
                        if (!matching) return null;

                        return (
                            <Paper key={`analyze-${id}`} variant="outlined" sx={{ p: 2, mb: 2 }}>
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 0.5 }}>
                                        Matched Track
                                    </Typography>
                                    <Typography variant="body1">{title}</Typography>
                                    <Typography variant="body2" color="text.secondary">{artist.title}</Typography>
                                    {!!reason && (
                                        <Typography variant="body2" sx={{ mt: 1, color: 'success.main' }}>
                                            Match Reason: {reason}
                                        </Typography>
                                    )}
                                </Box>
                                
                                <Divider sx={{ my: 2 }} />
                                
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>Matching Details:</Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2 }}>
                                    <Box>
                                        <Typography variant="body2" fontWeight="bold">Artist</Typography>
                                        <Typography variant="body2">Match: {matching.artist.match ? "✅" : "❌"}</Typography>
                                        <Typography variant="body2">Contains: {matching.artist.contains ? "✅" : "❌"}</Typography>
                                        <Typography variant="body2">Similarity: {getRoundedSimilarity(matching.artist.similarity)}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" fontWeight="bold">Artist in Title</Typography>
                                        <Typography variant="body2">Match: {matching.artistInTitle.match ? "✅" : "❌"}</Typography>
                                        <Typography variant="body2">Contains: {matching.artistInTitle.contains ? "✅" : "❌"}</Typography>
                                        <Typography variant="body2">Similarity: {getRoundedSimilarity(matching.artistInTitle.similarity)}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" fontWeight="bold">Artist with Title</Typography>
                                        <Typography variant="body2">Match: {matching.artistWithTitle.match ? "✅" : "❌"}</Typography>
                                        <Typography variant="body2">Contains: {matching.artistWithTitle.contains ? "✅" : "❌"}</Typography>
                                        <Typography variant="body2">Similarity: {getRoundedSimilarity(matching.artistWithTitle.similarity)}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" fontWeight="bold">Title</Typography>
                                        <Typography variant="body2">Match: {matching.title.match ? "✅" : "❌"}</Typography>
                                        <Typography variant="body2">Contains: {matching.title.contains ? "✅" : "❌"}</Typography>
                                        <Typography variant="body2">Similarity: {getRoundedSimilarity(matching.title.similarity)}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" fontWeight="bold">Album</Typography>
                                        <Typography variant="body2">Match: {matching.album.match ? "✅" : "❌"}</Typography>
                                        <Typography variant="body2">Contains: {matching.album.contains ? "✅" : "❌"}</Typography>
                                        <Typography variant="body2">Similarity: {getRoundedSimilarity(matching.album.similarity)}</Typography>
                                    </Box>
                                </Box>
                            </Paper>
                        );
                    })}
                </>
            )}
        </Box>
    );
}