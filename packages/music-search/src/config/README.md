# Music Search Configuration System - Simplified

## Overview

This simplified configuration system provides an easy-to-use, maintainable way to manage music search behavior using function strings in JSON, replacing the previous complex compilation system.

## Key Components

### 1. Configuration Types (`config.ts`)
- **MusicSearchConfig**: Complete configuration structure
- **MatchFilterConfig**: Simple filter with reason and function string
- **TextProcessingConfig**: Text processing arrays and flags
- **PlatformSearchConfig**: Platform-specific search approaches

### 2. Default Configuration (`default-config.ts`)
- Contains ALL current hardcoded values as function strings
- Preserves exact thresholds, reason strings (including typos)
- Maintains filter priority order
- Includes Plex vs Tidal differences

### 3. Configuration Manager (`music-search-config-manager.ts`)
- Simple JSON loader and saver
- Converts function strings to runtime functions using Function constructor
- Caching for performance
- Graceful fallback to defaults

## Integration Strategy

### With Existing Singleton Pattern

The MusicSearch class maintains its singleton pattern but now uses function strings:

```typescript
// Current usage (unchanged)
const musicSearch = MusicSearch.getInstance();

// New usage with configuration
const configManager = MusicSearchConfigManager.create({ 
  storageDir: settingsDir 
});
const runtimeFilters = await configManager.getRuntimeFilters();
musicSearch.config = { matchFilters: runtimeFilters };
```

## Configuration File Structure

Default location: `{settingsDir}/music-search.json`

```json
{
  "matchFilters": [
    {
      "reason": "Full match on Artist & Title",
      "filter": "(item) => item.matching.artist.match && item.matching.title.match"
    },
    {
      "reason": "Artist matches and Title has 80% similarity",
      "filter": "(item) => item.matching.artist.match && (item.matching.title.similarity ?? 0) >= 0.8"
    }
  ],
  "textProcessing": {
    "filterOutWords": ["original mix", "radio edit"],
    "filterOutQuotes": ["'", "\""],
    "cutOffSeparators": ["(", "["],
    "processing": {
      "filtered": false,
      "cutOffSeperators": false,
      "removeQuotes": false
    }
  },
  "searchApproaches": {
    "plex": [
      { "id": "normal", "filtered": false, "trim": false },
      { "id": "filtered", "filtered": true, "trim": false, "removeQuotes": true }
    ],
    "tidal": [
      { "id": "normal", "filtered": false, "trim": false },
      { "id": "filtered", "filtered": true, "trim": false }
    ]
  }
}
```

## Usage Examples

### Basic Configuration Loading

```typescript
import { MusicSearchConfigManager, DEFAULT_MUSIC_SEARCH_CONFIG } from '@spotify-to-plex/music-search';

const configManager = MusicSearchConfigManager.create({
  storageDir: '/path/to/config'
});

// Get compiled runtime filters
const filters = await configManager.getRuntimeFilters();
musicSearch.setMusicSearchConfig(await configManager.getConfig());
```

### Configuration Updates

```typescript
// Update specific filters
await configManager.updateConfig({
  matchFilters: [
    {
      reason: "Custom filter",
      filter: "(item) => (item.matching.artist.similarity ?? 0) >= 0.9"
    }
  ]
});
```

## Function String Format

Function strings are simple JavaScript expressions that take an `item` parameter:

```javascript
// Basic field checks
"(item) => item.matching.artist.match"
"(item) => item.matching.title.contains"

// Similarity thresholds
"(item) => (item.matching.artist.similarity ?? 0) >= 0.8"

// Complex combinations
"(item) => item.matching.artist.match && item.matching.title.contains"
```

## Compatibility

- ✅ Maintains existing MusicSearch singleton pattern
- ✅ Preserves all current matching behavior exactly
- ✅ Simple JSON configuration
- ✅ Function strings are easy to read and edit
- ✅ Fallback to defaults when configuration missing/invalid
- ✅ Safe function evaluation using Function constructor

## Error Handling

- Configuration file missing → Use default configuration
- Configuration file invalid → Log error, use defaults
- Function string compilation fails → Return false filter, log warning
- Storage directory missing → Create directory automatically

## Performance Considerations

- Configuration loaded once and cached
- Function strings compiled once per configuration change
- Atomic file operations prevent corruption
- Minimal memory footprint
- ~100 lines of code vs previous 700+ lines