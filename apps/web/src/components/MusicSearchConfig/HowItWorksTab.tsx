import { Box, Card, CardContent, Divider, Typography } from '@mui/material';
import ProcessingStep from './ProcessingStep';

const HowItWorksTab= () => {

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom fontWeight="bold">
                System Overview
            </Typography>
            <Typography variant="body1">
                The Music Search Configuration system matches tracks from your Spotify playlists to tracks in your Plex media library. There are mainy cases when the naming in Spotify is not the same as the naming in Plex. This is where the configuration comes in. Trying to match based on different scenario&apos;s.
            </Typography>

            <Divider sx={{ my: 4 }} />

            {/* Visual Flow Diagram */}
            <Typography variant="h5" gutterBottom fontWeight="bold">
                Processing Flow
            </Typography>
            <Box
                sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', md: 'row' },
                    alignItems: { xs: 'stretch', md: 'center' },
                    justifyContent: 'center',
                    my: 4,
                    gap: { xs: 1, md: 0 },
                }}>
                <ProcessingStep title="Spotify Track" description="Source metadata" />
                <ProcessingStep title="Text Processing" description="Clean & normalize" />
                <ProcessingStep title="Search Approaches" description="Multiple strategies" />
                <ProcessingStep title="Match Filters" description="Quality scoring" />
                <ProcessingStep title="Plex Match" description="Final result" isLast />
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* Component Explanations */}
            <Typography variant="h5" gutterBottom fontWeight="bold">
                System Components
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 4 }}>
                <Card elevation={2}>
                    <CardContent>
                        <Typography variant="h6" fontWeight="bold" color="primary">
                            Text Processing
                        </Typography>
                        <Typography variant="body2" pb={1}>
                            Cleans and normalizes track metadata by removing special characters and other content (like &quot;Remaster&quot;, &quot;Deluxe Edition&quot;), and standardizing text formatting. 
                        </Typography>
                        <Typography variant="body2">
                            <strong>Examples:</strong> &quot;Song (Remaster)&quot; → &quot;song&quot;, 
                            &quot;Track - 2023 Mix&quot; → &quot;track&quot;
                        </Typography>
                    </CardContent>
                </Card>

                <Card elevation={2}>
                    <CardContent>
                        <Typography variant="h6" fontWeight="bold" color="primary">
                            Search Approaches
                        </Typography>
                        <Typography variant="body2" pb={1}>
                            Apply different search approaches to find matches.
                        </Typography>
                        <Typography variant="body2">
                            <strong>Strategies:</strong> Exact match, filtered, trimmed, filtered and trimmed
                        </Typography>
                    </CardContent>
                </Card>

                <Card elevation={2}>
                    <CardContent>
                        <Typography variant="h6" fontWeight="bold" color="primary">
                            Match Filters
                        </Typography>
                        <Typography variant="body2" pb={1}>
                            Applies quality filters to rank potential matches based on matching songs, artist and albums. 
                        </Typography>
                    </CardContent>
                </Card>
            </Box>

        </Box>
    );
};

export default HowItWorksTab;