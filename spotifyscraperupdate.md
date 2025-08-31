# Spotify Scraper Service Enhancement Instructions

## Objective
Modify the `SpotifyScraperService` class in `apps/spotify-scraper/spotify_scraper_service.py` to enrich playlist track data with complete album information while maintaining raw output compatibility and handling failures gracefully.

## Current Implementation Analysis
The current `scrape_playlist()` method:
- Uses `self.scraper.get_playlist_info(url)` to get basic playlist data
- Returns raw data without transformation
- Provides incomplete track data (missing album information)

## Required Changes

### 1. Import Required Classes
Add the following import to the existing imports:
```python
from spotify_scraper.utils.common import SpotifyBulkOperations
```

### 2. Modify the scrape_playlist() Method
Replace the existing `scrape_playlist()` method implementation with enhanced version that:

#### Core Logic:
1. Get initial playlist data using existing `self.scraper.get_playlist_info(url)`
2. Extract track URIs from the playlist data
3. Use **individual track requests** (NOT bulk operations due to rate limiting concerns)
4. Enrich each track in the original data structure with complete album information
5. Maintain fallback to basic track data if individual requests fail

#### Implementation Strategy:
- **Preserve original structure**: Keep all existing fields in `raw_data`
- **Enrich in-place**: Add album data to existing track objects in `raw_data['tracks']`
- **Graceful fallback**: If `get_track_info()` fails for a track, keep the original basic track data
- **No bulk operations**: Use individual `get_track_info()` calls for each track
- **Raw output preservation**: Return enhanced data in the same structure format

### 3. Enhancement Process

For each track in `raw_data['tracks']`:
1. Extract the track URI from the basic track data
2. Call `self.scraper.get_track_info(track_uri)` to get complete track information
3. If successful, merge the complete album data into the existing track object
4. If failed, log the error and keep the original basic track data
5. Continue processing remaining tracks

### 4. Data Merging Strategy

When merging complete track data:
- **Preserve all original fields** from the playlist embed format
- **Add new album information** from the complete track data:
  - `album.name`
  - `album.uri`
  - `album.images`
  - `album.release_date`
  - Any other album metadata available
- **Handle field conflicts** by preferring complete track data over embed data
- **Maintain data types** and structure consistency

### 5. Error Handling Requirements

- **Individual track failures**: Log error but continue with basic track data
- **Complete service failures**: Maintain existing exception behavior
- **Rate limiting**: Let the library handle rate limiting internally
- **Network issues**: Graceful degradation to basic track data

### 6. Logging Enhancement

Add appropriate logging:
- Info log when starting track enrichment process
- Debug logs for each successful track enrichment
- Warning logs for failed track enrichments (with fallback)
- Info log with summary of enrichment results

### 7. Performance Considerations

- **Sequential processing**: Process tracks one by one to avoid rate limiting
- **Early termination**: Don't fail entire playlist if some tracks can't be enriched
- **Memory efficiency**: Update tracks in-place rather than creating new data structures

## Key Library Information

### Available Methods:
- `self.scraper.get_playlist_info(url)` - Returns basic playlist with embed track format
- `self.scraper.get_track_info(track_uri)` - Returns complete track data with full album info
- Track URIs are available in the basic track data as `track['uri']`

### Data Structure Differences:

**Basic track data (from playlist embed):**
```python
{
    "uri": "spotify:track:...",
    "title": "Song Name",
    "subtitle": "Artist Name", 
    "duration": 202492,
    # Missing album data
}
```

**Complete track data (from individual track request):**
```python
{
    "id": "6BwPGnbrypJUEXnrS99f5t",
    "name": "Paint The Town Red",
    "uri": "spotify:track:6BwPGnbrypJUEXnrS99f5t",
    "artists": [{"name": "Doja Cat", "uri": "spotify:artist:..."}],
    "album": {
        "name": "Paint The Town Red", 
        "uri": "spotify:album:4XNaabm8i75N8ehM6Xkq3a",
        "images": [{"url": "https://...", "width": 640, "height": 640}],
        "release_date": "2023-08-04"
    },
    "duration_ms": 196041,
    "preview_url": "https://..."
}
```

## Success Criteria

1. **Backwards compatibility**: Enhanced method returns same structure as before
2. **Enhanced data**: Tracks now include complete album information when available
3. **Graceful degradation**: Failed individual requests don't break the entire playlist
4. **Raw output preservation**: No data transformation, just enrichment
5. **Future-proof**: Implementation uses library's raw outputs without custom parsing
6. **Rate limit friendly**: Uses individual requests instead of bulk operations

## Implementation Notes for Docker Environment

**IMPORTANT**: This service runs in a Docker container, making direct testing difficult. Therefore:

### Code Analysis Focus
- **Prioritize code review** over runtime testing
- **Analyze existing patterns** in the codebase thoroughly before making changes
- **Verify import paths** and method signatures against the library documentation
- **Double-check variable names** and data structure access patterns
- **Ensure proper exception handling** without relying on runtime verification

### Pre-Implementation Analysis Required
1. **Study the existing `spotify_scraper_service.py`** structure and patterns
2. **Examine the raw data structure** returned by `get_playlist_info()` 
3. **Verify the SpotifyClient class methods** and their expected parameters
4. **Analyze logging patterns** used elsewhere in the codebase
5. **Check error handling approaches** used in similar methods

### Code Quality Verification
Instead of runtime testing, focus on:
1. **Syntax correctness** - Ensure all Python syntax is valid
2. **Import verification** - Confirm all imports are available and correct
3. **Method signature compatibility** - Match existing patterns
4. **Data structure consistency** - Preserve original data structure format
5. **Exception handling completeness** - Handle all potential failure points
6. **Logging appropriateness** - Match existing logging levels and formats

### Static Analysis Approach
- **Trace data flow** through the enhanced method logic
- **Verify fallback paths** work correctly in error scenarios
- **Ensure no breaking changes** to existing method interface
- **Confirm memory efficiency** of in-place data enrichment
- **Validate error propagation** maintains existing behavior patterns