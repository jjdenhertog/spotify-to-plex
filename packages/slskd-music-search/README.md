# @spotify-to-plex/slskd-music-search

Library to find tracks in Soulseek music library using SLSKD API.

## Installation

```bash
npm install @spotify-to-plex/slskd-music-search
```

## Usage

```typescript
import { newTrackSearch, searchAlbum, analyze } from '@spotify-to-plex/slskd-music-search/functions';
import { createState } from '@spotify-to-plex/slskd-music-search/session/state';
import type { SlskdCredentials } from '@spotify-to-plex/slskd-music-search';

// Create session state
const credentials: SlskdCredentials = {
  baseUrl: 'http://localhost:5030',
  apiKey: 'your-api-key'
};

const state = createState(credentials, {
  maxResults: 50,
  minQuality: 70,
  preferredFormats: ['flac', 'mp3']
});

// Search for a track
const trackResults = await newTrackSearch(state, 'Artist Name', 'Track Title');

// Search for an album
const albumResults = await searchAlbum(state, 'Artist Name', 'Album Title');

// Analyze results
const analysis = analyze(trackResults);
console.log(`Found ${analysis.totalFiles} files with ${analysis.highQualityCount} high quality matches`);
```

## API Reference

See [Type Definitions](./src/types/README.md) for complete API documentation.

## License

MIT
