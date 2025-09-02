import React from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Divider,
    Card,
    CardContent,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

interface ProcessingStepProps {
    title: string;
    description: string;
    isLast?: boolean;
}

const ProcessingStep: React.FC<ProcessingStepProps> = ({ title, description, isLast = false }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Paper
            elevation={2}
            sx={{
                p: 2,
                minWidth: 140,
                textAlign: 'center',
                bgcolor: 'primary.light',
                color: 'primary.contrastText',
            }}
        >
            <Typography variant="subtitle2" fontWeight="bold">
                {title}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                {description}
            </Typography>
        </Paper>
        {!isLast && (
            <ArrowForwardIcon
                sx={{
                    mx: 2,
                    color: 'primary.main',
                    fontSize: 32,
                }}
            />
        )}
    </Box>
);

const HowItWorksTab: React.FC = () => {
    const exampleSteps = [
        {
            step: '1. Original Track',
            input: 'Song Title (Remaster)',
            output: 'Song Title (Remaster)',
            description: 'Raw track title from Spotify',
        },
        {
            step: '2. Text Processing',
            input: 'Song Title (Remaster)',
            output: 'song title',
            description: 'Remove parentheses, convert to lowercase',
        },
        {
            step: '3. Search Approach',
            input: 'song title',
            output: 'Multiple search variants',
            description: 'Exact, fuzzy, partial matches attempted',
        },
        {
            step: '4. Match Filters',
            input: 'Multiple candidates',
            output: 'Best match',
            description: 'Apply duration, year, popularity filters',
        },
        {
            step: '5. Final Result',
            input: 'Best match',
            output: 'Plex track',
            description: 'Matched track in your Plex library',
        },
    ];

    return (
        <Box sx={{ p: 3 }}>
            {/* System Overview */}
            <Typography variant="h5" gutterBottom fontWeight="bold">
                System Overview
            </Typography>
            <Typography variant="body1" paragraph>
                The Music Search Configuration system intelligently matches tracks from your Spotify playlists 
                to tracks in your Plex media library. It uses a multi-stage processing pipeline that cleans 
                track metadata, applies various search strategies, and filters results to find the best matches.
            </Typography>
            <Typography variant="body1" paragraph>
                This system is designed to handle the complexities of music metadata, including different 
                naming conventions, remasters, special editions, and variations in track information between 
                streaming services and local libraries.
            </Typography>

            <Divider sx={{ my: 4 }} />

            {/* Visual Flow Diagram */}
            <Typography variant="h5" gutterBottom fontWeight="bold">
                Processing Flow
            </Typography>
            <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: { xs: 'stretch', md: 'center' },
                justifyContent: 'center',
                my: 4,
                gap: { xs: 1, md: 0 },
            }}>
                <ProcessingStep
                    title="Spotify Track"
                    description="Source metadata"
                />
                <ProcessingStep
                    title="Text Processing"
                    description="Clean & normalize"
                />
                <ProcessingStep
                    title="Search Approaches"
                    description="Multiple strategies"
                />
                <ProcessingStep
                    title="Match Filters"
                    description="Quality scoring"
                />
                <ProcessingStep
                    title="Plex Match"
                    description="Final result"
                    isLast={true}
                />
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
                        <Typography variant="body2" paragraph>
                            Cleans and normalizes track metadata by removing special characters, 
                            parenthetical content (like "Remaster", "Deluxe Edition"), and 
                            standardizing text formatting. This step ensures consistent comparison 
                            between different sources.
                        </Typography>
                        <Typography variant="body2">
                            <strong>Examples:</strong> "Song (Remaster)" → "song", 
                            "Track - 2023 Mix" → "track"
                        </Typography>
                    </CardContent>
                </Card>

                <Card elevation={2}>
                    <CardContent>
                        <Typography variant="h6" fontWeight="bold" color="primary">
                            Search Approaches
                        </Typography>
                        <Typography variant="body2" paragraph>
                            Employs multiple search strategies to find matches: exact matching for 
                            perfect matches, fuzzy matching for similar titles with minor differences, 
                            and partial matching for abbreviated or extended titles.
                        </Typography>
                        <Typography variant="body2">
                            <strong>Strategies:</strong> Exact match, Levenshtein distance, 
                            substring matching, word-order independence
                        </Typography>
                    </CardContent>
                </Card>

                <Card elevation={2}>
                    <CardContent>
                        <Typography variant="h6" fontWeight="bold" color="primary">
                            Match Filters
                        </Typography>
                        <Typography variant="body2" paragraph>
                            Applies quality filters to rank potential matches based on duration 
                            similarity, release year proximity, artist matching, and album context. 
                            Only the highest-scoring matches are considered valid.
                        </Typography>
                        <Typography variant="body2">
                            <strong>Filters:</strong> Duration tolerance, year range, 
                            artist similarity, album matching
                        </Typography>
                    </CardContent>
                </Card>
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* Real Example Walkthrough */}
            <Typography variant="h5" gutterBottom fontWeight="bold">
                Example Processing Steps
            </Typography>
            <Typography variant="body2" paragraph color="text.secondary">
                Here's how a typical track moves through the matching pipeline:
            </Typography>
            
            <TableContainer component={Paper} elevation={2}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'primary.light' }}>
                            <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                Processing Step
                            </TableCell>
                            <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                Input
                            </TableCell>
                            <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                Output
                            </TableCell>
                            <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                                Description
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {exampleSteps.map((row, index) => (
                            <TableRow key={index} sx={{ '&:nth-of-type(odd)': { bgcolor: 'action.hover' } }}>
                                <TableCell>
                                    <Typography variant="body2" fontWeight="bold">
                                        {row.step}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" fontFamily="monospace">
                                        {row.input}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" fontFamily="monospace">
                                        {row.output}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">
                                        {row.description}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                <Typography variant="body2" color="info.contrastText">
                    <strong>Pro Tip:</strong> The configuration tabs allow you to fine-tune each of these 
                    processing steps to better match your specific library organization and naming conventions.
                </Typography>
            </Box>
        </Box>
    );
};

export default HowItWorksTab;