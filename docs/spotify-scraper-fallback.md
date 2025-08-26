# SpotifyScraper Fallback Implementation

## Overview
This document describes the fallback logic implemented in `getSpotifyPlaylist.ts` to use SpotifyScraper when the Spotify API fails.

## Implementation Details

### Files Modified
- `apps/web/src/helpers/spotify/getSpotifyPlaylist.ts` - Added fallback logic
- `apps/web/.env.example` - Added SPOTIFY_SCRAPER_URL configuration

### Fallback Flow
1. **Primary Request**: Attempt to fetch playlist data using Spotify API
2. **Error Handling**: If Spotify API fails, catch the error and log a warning
3. **Fallback Request**: Call `getSpotifyPlaylistFallback()` function
4. **Response Transformation**: Convert SpotifyScraper response to match `GetSpotifyPlaylist` interface
5. **Graceful Failure**: If both services fail, return `undefined`

### Environment Configuration
Add the following to your `.env.local` file:
```bash
# SpotifyScraper Fallback Service (Optional)
# URL to SpotifyScraper service for fallback when Spotify API fails  
SPOTIFY_SCRAPER_URL=http://localhost:3001
```

### API Contract
The fallback service expects:
- **Endpoint**: `POST /api/scrape/playlist`
- **Request Body**:
  ```json
  {
    "url": "https://open.spotify.com/playlist/{id}",
    "simplified": boolean
  }
  ```
- **Response Format**:
  ```json
  {
    "success": true,
    "data": {
      "id": "string",
      "name": "string", 
      "owner": {
        "display_name": "string"
      },
      "images": [
        {
          "url": "string"
        }
      ],
      "tracks": {
        "items": [
          {
            "track": {
              "id": "string",
              "name": "string",
              "artists": [
                {
                  "name": "string"
                }
              ],
              "album": {
                "name": "string"
              }
            }
          }
        ]
      }
    }
  }
  ```

### Error Handling
1. **Missing Configuration**: If `SPOTIFY_SCRAPER_URL` is not set, logs warning and throws error
2. **Request Timeout**: 30-second timeout for scraping operations
3. **Invalid Response**: Validates response has `success: true` and `data` properties
4. **Network Errors**: Catches and logs axios errors, then re-throws
5. **Graceful Degradation**: Returns `undefined` if both services fail

### Data Transformation
The fallback function transforms SpotifyScraper responses to match the expected `GetSpotifyPlaylist` interface:

```typescript
{
  type: "spotify-playlist",
  id: string,
  title: string,
  owner: string, 
  image: string,
  tracks: Array<{
    id: string,
    title: string,
    artist: string,
    album: string,
    artists: string[]
  }>
}
```

### Logging
- **Warning**: When Spotify API fails and fallback is attempted
- **Info**: When fallback request is initiated and succeeds
- **Error**: When both services fail or scraper returns invalid data

### Performance Considerations
- **Timeout**: 30-second timeout for scraping (longer than typical API calls)
- **Memory**: Handles large playlists with potentially thousands of tracks
- **Retry Logic**: No automatic retries (handled by caller if needed)

### Testing
The implementation has been validated for:
- ✅ TypeScript compilation
- ✅ Correct type interfaces
- ✅ Environment variable handling
- ✅ Response transformation logic
- ✅ Error handling paths

### Usage Example
```typescript
import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import getSpotifyPlaylist from "./getSpotifyPlaylist";

// Set environment variable
process.env.SPOTIFY_SCRAPER_URL = "http://localhost:3001";

const api = SpotifyApi.withCredentials(/*...*/);
const playlist = await getSpotifyPlaylist(api, "playlist-id", false);

// Will automatically fallback to SpotifyScraper if Spotify API fails
```