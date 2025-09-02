# Task 4: Test Configuration Integration and Navigation Finalization

## Objective
Integrate the SearchAnalyzer component into the configuration page as a "Test Configuration" tab, remove the old search analyzer page, and finalize the overall navigation structure.

## Context
Users need immediate testing capability within the configuration interface to iterate quickly on their settings. This task moves the existing SearchAnalyzer into the configuration page and removes the old standalone testing page.

## Implementation Requirements

### 1. Create TestConfigurationTab Component

**File**: `src/components/TestConfigurationTab.tsx`

Move and enhance the existing SearchAnalyzer functionality:

```typescript
import { Box, Typography, TextField, Button, CircularProgress, Divider, Link, Paper } from '@mui/material';
import { Search as SearchIcon, Settings as SettingsIcon } from '@mui/icons-material';
import { useState, useCallback, Fragment } from 'react';
import { errorBoundary } from '@/helpers/errors/errorBoundary';
import axios from 'axios';
import type { SearchResponse, SearchQuery } from '@spotify-to-plex/plex-music-search/types/SearchResponse';
import type { PlexTrack } from '@spotify-to-plex/plex-music-search/types/PlexTrack';
import type { GetSpotifyTrackResponse } from '@/pages/api/spotify/track';

export default function TestConfigurationTab() {
    const [loading, setLoading] = useState(false);
    const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
    const [spotifyURI, setSpotifyURI] = useState('');

    const handleSpotifyInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSpotifyURI(e.target.value);
    }, []);

    const handleAnalyzeSongMatch = useCallback(() => {
        errorBoundary(
            async () => {
                setSearchResponse(null);
                setLoading(true);

                const spotifyTrack = await axios.post<GetSpotifyTrackResponse>('/api/spotify/track', {
                    search: spotifyURI
                });
                setLoading(false);

                const result = await axios.post('/api/plex/analyze', { item: spotifyTrack.data });
                setSearchResponse(result.data);
            },
            () => {
                setLoading(false);
            }
        );
    }, [spotifyURI]);

    const getRoundedSimilarity = useCallback((value: number) => {
        return `${Math.round(value * 100)}%`;
    }, []);

    return (
        <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
            {/* Header Section */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SearchIcon />
                    Test Your Configuration
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                    Test how your current configuration processes and matches tracks. This helps you fine-tune 
                    your settings for better matching results.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    When reporting issues, please share a screenshot of the results from this page at{' '}
                    <Link href="https://github.com/jjdenhertog/spotify-to-plex/issues" target="_blank" color="warning">
                        GitHub Issues
                    </Link>
                    .
                </Typography>
            </Box>

            {/* Configuration Status */}
            <Paper variant="outlined" sx={{ p: 3, mb: 4, bgcolor: 'info.50', borderColor: 'info.200' }}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SettingsIcon fontSize="small" />
                    Current Configuration Status
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    The test will use your current saved configuration. Make sure to save any changes 
                    in the other tabs before testing.
                </Typography>
            </Paper>

            <Divider sx={{ mb: 4 }} />

            {/* Test Input Section */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Spotify Track Input</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Enter a Spotify URL or URI to test how it matches with your Plex library:
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 0.5, color: 'text.secondary' }}>
                        • Spotify URL: https://open.spotify.com/track/7KwZNVEaqikRSBSpyhXK2j
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                        • Spotify URI: spotify:track:7KwZNVEaqikRSBSpyhXK2j
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                    <TextField
                        fullWidth
                        label="Spotify URL or URI"
                        placeholder="Enter your Spotify URL or URI here..."
                        value={spotifyURI}
                        onChange={handleSpotifyInputChange}
                        disabled={loading}
                        sx={{ flexGrow: 1 }}
                    />
                    <Button
                        variant="contained"
                        onClick={handleAnalyzeSongMatch}
                        disabled={loading || !spotifyURI.trim()}
                        startIcon={<SearchIcon />}
                        sx={{ minWidth: 120 }}
                    >
                        Analyze
                    </Button>
                </Box>
            </Box>

            {/* Loading State */}
            {!!loading && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 8 }}>
                    <Box sx={{ textAlign: 'center' }}>
                        <CircularProgress sx={{ mb: 2 }} />
                        <Typography variant="body2" color="text.secondary">
                            Analyzing track and testing configuration...
                        </Typography>
                    </Box>
                </Box>
            )}

            {/* Results Section */}
            {!!searchResponse && (
                <Box>
                    <Divider sx={{ mb: 4 }} />
                    
                    {/* Search Queries Section */}
                    {!!searchResponse.queries && (
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                Search Queries Generated
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                These are the different queries generated based on your search approaches:
                            </Typography>
                            
                            {searchResponse.queries.map((item: SearchQuery, index: number) => {
                                const { approach, album, artist, title } = item;
                                
                                return (
                                    <Paper key={`query-${index}`} variant="outlined" sx={{ p: 3, mb: 2, bgcolor: 'grey.50' }}>
                                        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium' }}>
                                            Approach: {approach}
                                        </Typography>
                                        <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 1, alignItems: 'center' }}>
                                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                                                Artist:
                                            </Typography>
                                            <Typography variant="body2">{artist}</Typography>
                                            
                                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                                                Title:
                                            </Typography>
                                            <Typography variant="body2">{title}</Typography>
                                            
                                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                                                Album:
                                            </Typography>
                                            <Typography variant="body2">{album}</Typography>
                                        </Box>
                                    </Paper>
                                );
                            })}
                        </Box>
                    )}

                    {/* Search Results Section */}
                    {!!(searchResponse.result.length > 0) && (
                        <Box>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                Matching Results
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Found {searchResponse.result.filter(item => item.matching).length} matching track(s):
                            </Typography>

                            {searchResponse.result.map((item: PlexTrack) => {
                                const { title, artist, id, matching, reason } = item;

                                if (!matching) return null;

                                return (
                                    <Paper key={`analyze-${id}`} variant="outlined" sx={{ p: 3, mb: 3, bgcolor: 'success.50', borderColor: 'success.200' }}>
                                        <Typography variant="h6" sx={{ mb: 2, color: 'success.dark' }}>
                                            ✓ Match Found: {reason}
                                        </Typography>
                                        
                                        <Box sx={{ mb: 3 }}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                                                {title}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {artist.title}
                                            </Typography>
                                        </Box>

                                        <Typography variant="subtitle2" sx={{ mb: 2 }}>
                                            Matching Details:
                                        </Typography>
                                        
                                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 3 }}>
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 1 }}>
                                                    Artist
                                                </Typography>
                                                <Typography variant="caption" display="block">
                                                    Match: {matching.artist.match ? 'Yes' : 'No'}
                                                </Typography>
                                                <Typography variant="caption" display="block">
                                                    Contains: {matching.artist.contains ? 'Yes' : 'No'}
                                                </Typography>
                                                <Typography variant="caption" display="block">
                                                    Similarity: {getRoundedSimilarity(matching.artist.similarity)}
                                                </Typography>
                                            </Box>

                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 1 }}>
                                                    Title
                                                </Typography>
                                                <Typography variant="caption" display="block">
                                                    Match: {matching.title.match ? 'Yes' : 'No'}
                                                </Typography>
                                                <Typography variant="caption" display="block">
                                                    Contains: {matching.title.contains ? 'Yes' : 'No'}
                                                </Typography>
                                                <Typography variant="caption" display="block">
                                                    Similarity: {getRoundedSimilarity(matching.title.similarity)}
                                                </Typography>
                                            </Box>

                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 1 }}>
                                                    Album
                                                </Typography>
                                                <Typography variant="caption" display="block">
                                                    Match: {matching.album.match ? 'Yes' : 'No'}
                                                </Typography>
                                                <Typography variant="caption" display="block">
                                                    Contains: {matching.album.contains ? 'Yes' : 'No'}
                                                </Typography>
                                                <Typography variant="caption" display="block">
                                                    Similarity: {getRoundedSimilarity(matching.album.similarity)}
                                                </Typography>
                                            </Box>

                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 1 }}>
                                                    Artist in Title
                                                </Typography>
                                                <Typography variant="caption" display="block">
                                                    Match: {matching.artistInTitle.match ? 'Yes' : 'No'}
                                                </Typography>
                                                <Typography variant="caption" display="block">
                                                    Contains: {matching.artistInTitle.contains ? 'Yes' : 'No'}
                                                </Typography>
                                                <Typography variant="caption" display="block">
                                                    Similarity: {getRoundedSimilarity(matching.artistInTitle.similarity)}
                                                </Typography>
                                            </Box>

                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 1 }}>
                                                    Artist with Title
                                                </Typography>
                                                <Typography variant="caption" display="block">
                                                    Match: {matching.artistWithTitle.match ? 'Yes' : 'No'}
                                                </Typography>
                                                <Typography variant="caption" display="block">
                                                    Contains: {matching.artistWithTitle.contains ? 'Yes' : 'No'}
                                                </Typography>
                                                <Typography variant="caption" display="block">
                                                    Similarity: {getRoundedSimilarity(matching.artistWithTitle.similarity)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Paper>
                                );
                            })}
                        </Box>
                    )}

                    {/* No Results */}
                    {!!(searchResponse.result.length === 0) && (
                        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', bgcolor: 'warning.50', borderColor: 'warning.200' }}>
                            <Typography variant="h6" sx={{ mb: 1, color: 'warning.dark' }}>
                                No Matches Found
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                The track could not be matched with your current configuration. 
                                Try adjusting your text processing rules or search approaches.
                            </Typography>
                        </Paper>
                    )}
                </Box>
            )}
        </Box>
    );
}
```

### 2. Remove Old Search Analyzer Page

#### Delete the standalone page
**File to remove**: `pages/spotify/search-analyzer.tsx`

This file should be completely removed from the codebase.

#### Update navigation references
Search for and remove any navigation links that point to `/spotify/search-analyzer`:

**Places to check**:
- Look for navigation components or menus
- Check the home page for links  
- Search codebase for "search-analyzer" references

Use this search to find references:
```bash
# Search for references to the old analyzer page
rg -i "search.analyzer" --type tsx --type ts
rg -i "/spotify/search-analyzer" --type tsx --type ts
```

### 3. Update Main Configuration Page

#### Verify TestConfigurationTab Integration
In `pages/plex/music-search-config.tsx`, ensure the Test Configuration tab is properly integrated:

```typescript
{/* Test Configuration Tab */}
{tabValue === 3 && (
    <Card>
        <CardContent>
            <TestConfigurationTab />
        </CardContent>
    </Card>
)}
```

#### Update Import
Ensure the import is correct:
```typescript
import TestConfigurationTab from "@/components/TestConfigurationTab";
```

### 4. Enhanced Features for Test Tab

#### Add Quick Test Buttons (Optional Enhancement)
Add shortcuts for common test scenarios:

```typescript
// Add to TestConfigurationTab component
const handleQuickTest = useCallback((testTrack: string) => {
    setSpotifyURI(testTrack);
    // Could auto-trigger analysis
}, []);

// Example quick test buttons
<Box sx={{ mb: 3 }}>
    <Typography variant="body2" sx={{ mb: 1 }}>Quick Test Examples:</Typography>
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button 
            size="small" 
            variant="outlined" 
            onClick={() => handleQuickTest('https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh')}
        >
            Song with (Remaster)
        </Button>
        <Button 
            size="small" 
            variant="outlined" 
            onClick={() => handleQuickTest('https://open.spotify.com/track/7KwZNVEaqikRSBSpyhXK2j')}
        >
            Song with Features
        </Button>
    </Box>
</Box>
```

### 5. Update Page Metadata and Navigation

#### Update page description
In `pages/plex/music-search-config.tsx`, ensure the description mentions testing:

```typescript
<Typography variant="body1" sx={{ mb: 2, maxWidth: 600 }}>
    Configure how the system matches songs between Spotify and Plex. Use the "How It Works" tab 
    to understand the system, configure your settings, and test them immediately in the "Test Configuration" tab.
</Typography>
```

#### Add breadcrumb or navigation hint
Consider adding a note about the testing capability:

```typescript
// Could add after the main description
<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
    💡 Tip: After making configuration changes, use the Test tab to see how they affect matching results.
</Typography>
```

## CODING_GUIDELINES.md Compliance

### Required Patterns
- ✅ **useCallback for ALL event handlers** - All onClick, onChange handlers use useCallback
- ✅ **!! for conditional rendering** - All conditionals use explicit boolean coercion
- ✅ **errorBoundary for ALL async operations** - Used in handleAnalyzeSongMatch
- ✅ **Default export** for React component
- ✅ **Props destructuring** if props are added
- ✅ **4-space indentation** throughout

### File Organization  
- ✅ **PascalCase file naming** - TestConfigurationTab.tsx
- ✅ **NO 'src' in import paths** - All imports use @/ pattern
- ✅ **One component per file** - TestConfigurationTab contains only one component

## Testing Requirements

### Functional Testing
1. **Test integration** works within the configuration page
2. **Spotify input** accepts URLs and URIs correctly
3. **Analysis results** display all matching details
4. **Error handling** works for invalid inputs or API failures
5. **Loading states** display correctly during analysis

### Navigation Testing
1. **Old analyzer page** returns 404 after removal
2. **No broken links** remain in the application
3. **Tab switching** works smoothly with test tab
4. **Deep linking** to tabs works correctly

### Integration Testing
1. **Current configuration** is used for testing (not stale data)
2. **Results reflect** recent configuration changes
3. **Performance** acceptable with complex configurations

## Acceptance Criteria

### Functional Requirements
1. **Integrated testing** works within configuration interface
2. **All analyzer features** preserved and enhanced
3. **Results display** clearly shows matching process
4. **No broken navigation** after removing old page

### User Experience
1. **Intuitive workflow** - configure, then test immediately
2. **Clear results** with enhanced formatting and explanations
3. **Helpful guidance** for interpreting results
4. **Quick testing** options for common scenarios

### Technical Requirements
1. **Zero ESLint errors** following CODING_GUIDELINES.md
2. **TypeScript compliance** with proper types
3. **Performance** - no degradation from integration
4. **Clean removal** of old analyzer with no dangling references

## Implementation Notes

### Benefits of Integration
1. **Immediate feedback** - Test changes without page switching
2. **Context preservation** - Keep configuration visible while testing  
3. **Workflow optimization** - Configure → Test → Adjust → Test cycle
4. **Better UX** - Single location for all configuration needs

### Enhanced User Experience
1. **Visual improvements** - Better formatting and layout
2. **Status indicators** - Clear success/warning/error states
3. **Helpful descriptions** - Explain what each result means
4. **GitHub issue integration** - Easy reporting with screenshots

### File Changes Summary
```
New:
- src/components/TestConfigurationTab.tsx

Removed:
- pages/spotify/search-analyzer.tsx

Modified:
- pages/plex/music-search-config.tsx (import and integration)
- Any navigation components with old analyzer links
```

This task completes the configuration system by providing immediate testing capability, creating a seamless workflow for users to configure and validate their settings.