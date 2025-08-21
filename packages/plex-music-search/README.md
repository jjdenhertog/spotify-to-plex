# @jjdenhertog/plex-music-search

Library to find tracks in Plex music libraries.

## Installation

```bash
npm install @jjdenhertog/plex-music-search
```

## Usage

```typescript
import { PlexMusicSearch } from '@jjdenhertog/plex-music-search';

const search = new PlexMusicSearch({
    plexUrl: 'http://localhost:32400',
    plexToken: 'your-token'
});

const results = await search.search('artist name');
```