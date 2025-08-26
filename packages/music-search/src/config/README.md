# Music Search Configuration System

## Overview

This configuration system provides a flexible, type-safe way to manage music search behavior while preserving all current hardcoded logic without any loss.

## Key Components

### 1. Configuration Types (`config.ts`)
- **MusicSearchConfig**: Complete configuration structure
- **MatchFilterConfig**: Structured representation of match filters
- **MatchCondition**: Boolean logic conditions (AND/OR combinations)
- **TextProcessingConfig**: Text processing arrays and flags
- **PlatformSearchConfig**: Platform-specific search approaches

### 2. Default Configuration (`default-config.ts`)
- Contains ALL current hardcoded values from the codebase
- Preserves exact thresholds, reason strings (including typos)
- Maintains filter priority order
- Includes Plex vs Tidal differences

### 3. Configuration Compiler (`config-compiler.ts`)
- Converts structured config into executable runtime functions
- Handles complex boolean logic (AND/OR combinations)
- Validates configuration structure and values
- Compiles to the exact same logic as current hardcoded filters

### 4. Configuration Manager (`music-search-config-manager.ts`)
- File-based configuration storage
- Atomic write operations
- Caching for performance
- Integration with existing PlexConfigManager pattern
- Graceful fallback to defaults

### 5. JSON Schema (`music-search.schema.json`)
- Complete validation schema
- IDE/editor support for configuration files
- API validation and documentation

## Integration Strategy

### With Existing Singleton Pattern

The MusicSearch class maintains its singleton pattern but now accepts configuration:

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

### With PlexConfigManager

The `ExtendedPlexConfigManager` provides unified configuration access:

```typescript
const configManager = ExtendedPlexConfigManager.create({
  storageDir: settingsDir,
  enableMusicSearchConfig: true
});

const musicSearchConfig = configManager.getMusicSearchConfig();
const runtimeFilters = await musicSearchConfig.getRuntimeFilters();
```

## Configuration File Structure

Default location: `{settingsDir}/music-search.json`

```json
{
  "matchFilters": [
    {
      "reason": "Full match on Artist & Title",
      "condition": {
        "type": "and",
        "left": { "field": "artist", "type": "match" },
        "right": { "field": "title", "type": "match" }
      }
    }
    // ... more filters
  ],
  "textProcessing": {
    "filterOutWords": ["original mix", "radio edit", ...],
    "filterOutQuotes": ["'", "\"", ...],
    "cutOffSeparators": ["(", "[", ...],
    "processing": {
      "filtered": false,
      "cutOffSeperators": false,
      "removeQuotes": false
    }
  },
  "searchApproaches": {
    "plex": [...],
    "tidal": [...]
  }
}
```

## Migration Plan

1. **Phase 1**: Add configuration system alongside existing hardcoded logic
2. **Phase 2**: Update all instantiation points to use configuration
3. **Phase 3**: Remove hardcoded logic after validation
4. **Phase 4**: Add web interface for configuration management

## Usage Examples

### Basic Configuration Loading

```typescript
import { MusicSearchConfigManager, DEFAULT_MUSIC_SEARCH_CONFIG } from '@spotify-to-plex/music-search';

const configManager = MusicSearchConfigManager.create({
  storageDir: '/path/to/config'
});

// Get compiled runtime filters
const filters = await configManager.getRuntimeFilters();
musicSearch.config = { matchFilters: filters };
```

### Configuration Validation

```typescript
const validation = await configManager.validateConfig();
if (!validation.isValid) {
  console.error('Configuration errors:', validation.errors);
}
```

### Configuration Updates

```typescript
// Update specific filters
await configManager.updateConfig({
  matchFilters: [
    {
      reason: "Custom filter",
      condition: {
        field: "artist",
        type: "similarity",
        threshold: 0.9
      }
    }
  ]
});
```

## Compatibility

- ✅ Maintains existing MusicSearch singleton pattern
- ✅ Preserves all current matching behavior exactly
- ✅ Supports gradual migration of instantiation points
- ✅ Fallback to defaults when configuration missing/invalid
- ✅ Type-safe configuration management
- ✅ JSON Schema validation support

## Error Handling

- Configuration file missing → Use default configuration
- Configuration file invalid → Log error, use defaults
- Configuration compilation fails → Throw descriptive error
- Storage directory missing → Create directory automatically

## Performance Considerations

- Configuration loaded once and cached
- Runtime filters compiled once per configuration change
- Atomic file operations prevent corruption
- Minimal memory footprint with readonly types