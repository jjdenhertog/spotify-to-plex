# @spotify-to-plex/plex-helpers

Shared Plex helper functions for Spotify to Plex sync operations.

## Overview

This package consolidates duplicate Plex helper functions from both `apps/web` and `apps/sync-worker` into a single, modern, reusable package.

## Key Features

- **Modern async patterns**: All functions accept settings as parameters instead of accessing global state
- **Type safety**: Full TypeScript support with proper interfaces
- **Error handling**: Consistent error handling and retry mechanisms  
- **Backward compatibility**: Legacy wrappers maintain existing API contracts
- **Consolidation**: Eliminates duplication between web and sync-worker apps

## Migration from Legacy Patterns

### Before (Legacy)
```typescript
// Direct access to global plex instance
import { plex } from '@/library/plex';
import { getUri } from './getUri';

export async function addItemsToPlaylist(id: string, items: { key: string; source?: string; }[]) {
    if (!plex.settings.uri || !plex.settings.token)
        throw new Error('No Plex connection found');
        
    // ... implementation using plex.settings
}
```

### After (Modern)
```typescript
// Settings passed as parameters
import { addItemsToPlaylistWithSettings, PlexSettings } from '@spotify-to-plex/plex-helpers';

export async function addItemsToPlaylist(
    settings: PlexSettings,
    playlistId: string,
    items: PlaylistItem[]
) {
    return addItemsToPlaylistWithSettings(settings, getAPIUrl, playlistId, items);
}
```

## Available Functions

### Core Playlist Operations
- `addItemsToPlaylist()` - Add tracks to playlist
- `removeItemsFromPlaylist()` - Remove specific tracks from playlist  
- `storePlaylist()` - Create new playlist
- `updatePlaylist()` - Update playlist metadata
- `putPlaylistPoster()` - Set playlist poster image

### Utility Functions
- `getPlexUri()` - Generate Plex URIs for tracks
- `validatePlexSettings()` - Validate Plex connection settings
- `handleOneRetryAttempt()` - Single retry with delay
- `handleMultipleRetries()` - Multiple retries with exponential backoff

## TypeScript Interfaces

```typescript
interface PlexSettings {
    uri: string;
    token: string;
    id: string;
}

interface PlaylistItem {
    key: string;
    source?: string;
}

interface RetryConfig {
    maxRetries?: number;
    retryDelay?: number;
}
```

## Legacy Compatibility

All legacy functions are still available with `@deprecated` annotations:

```typescript
// Still works, but deprecated
import { addItemsToPlaylist } from '@spotify-to-plex/plex-helpers';
await addItemsToPlaylist(playlistId, items);

// Modern recommended approach  
import { addItemsToPlaylistWithSettings } from '@spotify-to-plex/plex-helpers';
await addItemsToPlaylistWithSettings(settings, playlistId, items);
```

## Migration Benefits

1. **Eliminated Duplication**: Single source of truth for Plex operations
2. **Better Testing**: Functions can be tested independently of global state
3. **Type Safety**: Full TypeScript support with proper interfaces
4. **Error Handling**: Consistent error handling across all operations
5. **Performance**: Configurable retry mechanisms with exponential backoff
6. **Maintainability**: Centralized logic easier to update and debug

## Usage in Apps

### Web App (`apps/web`)
```typescript
import { storePlaylistWithSettings } from '@spotify-to-plex/plex-helpers';
import { plex } from '@/library/plex';
import getAPIUrl from '@/helpers/getAPIUrl';

// Modern usage
const playlistId = await storePlaylistWithSettings(plex.settings, getAPIUrl, name, uri);
```

### Sync Worker (`apps/sync-worker`) 
```typescript
import { addItemsToPlaylistWithSettings } from '@spotify-to-plex/plex-helpers';
import { plex } from '../../library/plex';
import getAPIUrl from '../getAPIUrl';

// Modern usage with retry config
await addItemsToPlaylistWithSettings(
    plex.settings, 
    getAPIUrl,
    playlistId, 
    items, 
    { maxRetries: 3, retryDelay: 1000 }
);
```

## Development

```bash
# Build the package
pnpm run build

# Watch mode for development
pnpm run dev

# Clean build artifacts
pnpm run clean
```