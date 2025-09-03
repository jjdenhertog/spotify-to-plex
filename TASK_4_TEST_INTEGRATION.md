# Task 4: Test Configuration Integration and Navigation Finalization

## Objective
Integrate the existing TrackAnalyzer functionality into the configuration page as a "Test Configuration" tab, remove the old search analyzer page, and finalize the overall navigation structure.

## Context
Users need immediate testing capability within the configuration interface to iterate quickly on their settings. This task adapts the existing TrackAnalyzer component (currently a modal) into a tab within the configuration page and removes the old standalone testing page.

**IMPORTANT**: This is NOT about building a new test environment. This is about adapting the existing `src/components/TrackAnalyzer.tsx` component from a modal format into a tab format within the configuration page.

## Implementation Requirements

### 1. Create TestConfigurationTab Component

**File**: `src/components/TestConfigurationTab.tsx`

**Base the component on the existing TrackAnalyzer pattern** (`src/components/TrackAnalyzer.tsx`). Convert it from modal format to tab content format.

**Key Differences from Original Task**:
- **API Approach**: Use the existing `/api/plex/analyze` endpoint directly (like TrackAnalyzer does)
- **Input Format**: Accept track objects `{id, artists: string[], title: string}` rather than Spotify URLs
- **Data Flow**: Single API call, not two-step Spotify→Plex process
- **UI Simplicity**: Focus on essential functionality, not complex status systems

```typescript
import { errorBoundary } from "@/helpers/errors/errorBoundary";
import type { SearchResponse } from "@spotify-to-plex/plex-music-search/types/SearchResponse";
import type { PlexTrack } from "@spotify-to-plex/plex-music-search/types/PlexTrack";
import { Box, CircularProgress, Divider, Typography, TextField, Button, Paper, Link } from "@mui/material";
import { Search as SearchIcon } from '@mui/icons-material';
import axios from "axios";
import { Fragment, useState, useCallback } from "react";

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
            } catch (error) {
                console.error('Error analyzing track:', error);
            } finally {
                setLoading(false);
            }
        });
    }, [testTrack]);

    const getRoundedSimilarity = useCallback((value: number) => {
        return `${Math.round(value * 100)}%`;
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

            {/* Test Input */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Track Data Input</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Enter track data in JSON format to test matching:
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', mb: 2 }}>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Track JSON"
                        value={testTrack}
                        onChange={handleTestTrackChange}
                        disabled={loading}
                        placeholder='{"id": "test", "artists": ["Artist Name"], "title": "Song Title"}'
                    />
                    <Button
                        variant="contained"
                        onClick={handleAnalyzeTrack}
                        disabled={loading || !testTrack.trim()}
                        startIcon={<SearchIcon />}
                        sx={{ minWidth: 120 }}
                    >
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
                    <Typography variant="h6" sx={{ mb: 1 }}>Results</Typography>
                    {searchResponse.result.map(({ id, title, artist, matching, reason }: PlexTrack) => {
                        if (!matching) return null;

                        return (
                            <Fragment key={`analyze-${id}`}>
                                <Box>
                                    <Typography variant="h6" sx={{ mb: 1 }}>Reason for match: {reason}</Typography>
                                    <Typography variant="body1">{title}</Typography>
                                    <Typography variant="body2">{artist.title}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                    <Box>
                                        <Typography variant="body1">Artist</Typography>
                                        <Typography variant="body2">Match: {matching.artist.match ? "Yes" : "No"}</Typography>
                                        <Typography variant="body2">Contains: {matching.artist.contains ? "Yes" : "No"}</Typography>
                                        <Typography variant="body2">Similarity: {getRoundedSimilarity(matching.artist.similarity)}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body1">Artist in Title</Typography>
                                        <Typography variant="body2">Match: {matching.artistInTitle.match ? "Yes" : "No"}</Typography>
                                        <Typography variant="body2">Contains: {matching.artistInTitle.contains ? "Yes" : "No"}</Typography>
                                        <Typography variant="body2">Similarity: {getRoundedSimilarity(matching.artistInTitle.similarity)}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body1">Artist with Title</Typography>
                                        <Typography variant="body2">Match: {matching.artistWithTitle.match ? "Yes" : "No"}</Typography>
                                        <Typography variant="body2">Contains: {matching.artistWithTitle.contains ? "Yes" : "No"}</Typography>
                                        <Typography variant="body2">Similarity: {getRoundedSimilarity(matching.artistWithTitle.similarity)}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body1">Title</Typography>
                                        <Typography variant="body2">Match: {matching.title.match ? "Yes" : "No"}</Typography>
                                        <Typography variant="body2">Contains: {matching.title.contains ? "Yes" : "No"}</Typography>
                                        <Typography variant="body2">Similarity: {getRoundedSimilarity(matching.title.similarity)}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body1">Album</Typography>
                                        <Typography variant="body2">Match: {matching.album.match ? "Yes" : "No"}</Typography>
                                        <Typography variant="body2">Contains: {matching.album.contains ? "Yes" : "No"}</Typography>
                                        <Typography variant="body2">Similarity: {getRoundedSimilarity(matching.album.similarity)}</Typography>
                                    </Box>
                                </Box>
                                <Divider sx={{ mt: 1, mb: 1 }} />
                            </Fragment>
                        );
                    })}
                </>
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

### 4. Enhanced Features for Test Tab (Optional)

Add quick test buttons for common scenarios:

```typescript
// Add to TestConfigurationTab component
const handleQuickTest = useCallback((testTrack: string) => {
    setTestTrack(testTrack);
    // Could auto-trigger analysis
}, []);

// Example quick test buttons
<Box sx={{ mb: 3 }}>
    <Typography variant="body2" sx={{ mb: 1 }}>Quick Test Examples:</Typography>
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button 
            size="small" 
            variant="outlined" 
            onClick={() => handleQuickTest('{"id": "test1", "artists": ["The Beatles"], "title": "Hey Jude (Remastered 2009)"}')}
        >
            Song with (Remaster)
        </Button>
        <Button 
            size="small" 
            variant="outlined" 
            onClick={() => handleQuickTest('{"id": "test2", "artists": ["Ed Sheeran", "Justin Bieber"], "title": "I Don\'t Care"}')}
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

#### Add navigation hint
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
- ✅ **errorBoundary for ALL async operations** - Used in handleAnalyzeTrack
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