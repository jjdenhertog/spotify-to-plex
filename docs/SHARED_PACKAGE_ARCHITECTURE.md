# Comprehensive Shared Package Architecture Design

## Executive Summary

This architecture design addresses the critical technical debt identified in the duplicate code analysis:
- **31 duplicate types** across 8 files
- **18 duplicate helper files** (~3,000+ lines of code)
- **Sync-worker versions consistently superior** (67% have quality improvements)

The proposed architecture follows **Domain-Driven Design** principles to eliminate duplication while creating a maintainable, scalable monorepo structure optimized for the Spotify-to-Plex music synchronization domain.

## Package Architecture Overview

```
packages/
├── core/                    # Foundation layer - Pure domain logic
│   ├── shared-types/        # All type definitions (31 types consolidated)
│   ├── shared-utils/        # Pure utility functions (18 files consolidated)
│   ├── config/              # Configuration management
│   └── constants/           # Shared constants and enums
├── integrations/            # External API layer
│   ├── spotify-client/      # Spotify API + authentication
│   ├── plex-client/         # Plex API + authentication  
│   ├── tidal-client/        # Tidal integration + authentication
│   └── music-search/        # Cross-platform search (existing package)
├── business/                # Domain logic layer
│   ├── playlist-sync/       # Core synchronization algorithms
│   ├── track-matching/      # Track linking and caching logic
│   └── sync-orchestration/  # Workflow coordination
└── infrastructure/          # Technical services layer
    ├── http-client/         # HTTP client abstraction
    ├── encryption/          # Security utilities
    ├── logging/             # Centralized logging
    └── storage/             # Data persistence
```

## Detailed Package Specifications

### Core Layer Packages

#### packages/core/shared-types/
**Purpose**: Single source of truth for all type definitions
**Consolidates**: 31 duplicate types from 8 files

**Package Structure**:
```
shared-types/
├── src/
│   ├── index.ts              # Re-export all types
│   ├── spotify/
│   │   └── api.ts            # 9 Spotify types (GetSpotifyPlaylist, Track, Album, etc.)
│   ├── plex/
│   │   └── api.ts            # 16 Plex types (Metadata, Hub, Playlist, etc.)
│   ├── tidal/
│   │   └── api.ts            # 1 Tidal type (TidalCredentials)
│   ├── common/
│   │   ├── track.ts          # TrackLink type
│   │   └── sync.ts           # SyncLog type
│   └── dashboard/
│       └── index.ts          # 3 dashboard types (MQTTItem, PlaylistData, PlaylistItem)
├── package.json
└── tsconfig.json
```

**Migration Sources**:
- `apps/web/src/types/SpotifyAPI.ts` → `spotify/api.ts`
- `apps/sync-worker/src/types/SpotifyAPI.ts` → `spotify/api.ts`
- `apps/web/src/types/PlexAPI.ts` → `plex/api.ts`
- `apps/sync-worker/src/types/PlexAPI.ts` → `plex/api.ts`
- And all other duplicate type files...

**Dependencies**: None (pure types)
**Exports**: Organized by domain with barrel exports

#### packages/core/shared-utils/
**Purpose**: Pure utility functions without external dependencies
**Consolidates**: 18 duplicate helper files

**Package Structure**:
```
shared-utils/
├── src/
│   ├── index.ts              # Re-export all utilities
│   ├── http/
│   │   └── axios-request.ts  # AxiosRequest (EXACT DUPLICATE)
│   ├── security/
│   │   └── encryption.ts     # encryption (prefer sync-worker version)
│   ├── array/
│   │   └── filter-unique.ts  # filterUnique (EXACT DUPLICATE)
│   ├── cache/
│   │   └── track-link.ts     # getCachedTrackLink (prefer sync-worker)
│   └── url/
│       └── api-url.ts        # getAPIUrl utilities
├── package.json
└── tsconfig.json
```

**Migration Priority**: Use sync-worker versions (superior error handling)
**Dependencies**: `@spotify-to-plex/shared-types`

#### packages/core/config/
**Purpose**: Configuration management and environment handling

**Package Structure**:
```
config/
├── src/
│   ├── index.ts              # Main exports
│   ├── environment.ts        # Environment variable handling
│   ├── settings.ts           # Application settings
│   └── constants.ts          # Configuration constants
├── package.json
└── tsconfig.json
```

### Integration Layer Packages

#### packages/integrations/spotify-client/
**Purpose**: Complete Spotify API integration with authentication
**Quality**: Use sync-worker versions (production-ready with defensive programming)

**Package Structure**:
```
spotify-client/
├── src/
│   ├── index.ts              # Main client export
│   ├── client/
│   │   └── spotify-client.ts # Main client class
│   ├── auth/
│   │   ├── get-access-token.ts    # From sync-worker (explicit return type)
│   │   └── refresh-tokens.ts      # From sync-worker (enhanced null safety)
│   ├── api/
│   │   ├── get-spotify-data.ts    # From sync-worker (safe optional chaining)
│   │   └── get-spotify-playlist.ts # From sync-worker (comprehensive null safety)
│   └── types.ts              # Re-export from shared-types
├── package.json
└── tsconfig.json
```

**Dependencies**: 
- `@spotify-to-plex/shared-types`
- `@spotify-to-plex/shared-utils`  
- `@spotify-to-plex/http-client`

#### packages/integrations/plex-client/
**Purpose**: Plex API integration with playlist and media management

**Package Structure**:
```
plex-client/
├── src/
│   ├── index.ts              # Main client export
│   ├── client/
│   │   └── plex-client.ts    # Main client class
│   ├── playlist/
│   │   ├── add-items.ts      # addItemsToPlaylist (sync-worker version)
│   │   ├── remove-items.ts   # removeItemsFromPlaylist (identical)
│   │   ├── update-playlist.ts # updatePlaylist (identical)
│   │   └── store-playlist.ts # storePlaylist logic
│   ├── media/
│   │   ├── get-uri.ts        # getUri
│   │   └── poster.ts         # putPlaylistPoster
│   └── utils/
│       └── retry.ts          # handleOneRetryAttempt
├── package.json
└── tsconfig.json
```

#### packages/integrations/tidal-client/
**Purpose**: Tidal integration with authentication

**Package Structure**:
```
tidal-client/
├── src/
│   ├── index.ts              # Main client export
│   ├── auth/
│   │   └── get-credentials.ts # getTidalCredentials (sync-worker version)
│   └── types.ts              # Re-export from shared-types
├── package.json
└── tsconfig.json
```

### Business Layer Packages

#### packages/business/playlist-sync/
**Purpose**: Core synchronization algorithms and business logic

**Package Structure**:
```
playlist-sync/
├── src/
│   ├── index.ts              # Main sync exports
│   ├── sync/
│   │   ├── playlist-sync.ts  # Core playlist synchronization
│   │   └── album-sync.ts     # Album synchronization
│   ├── strategies/
│   │   ├── sync-strategy.ts  # Synchronization strategies
│   │   └── conflict-resolution.ts # Conflict handling
│   └── validation/
│       └── sync-validation.ts # Pre-sync validation
├── package.json
└── tsconfig.json
```

**Dependencies**: All integration clients

#### packages/business/track-matching/
**Purpose**: Track linking, caching, and matching algorithms

**Package Structure**:
```
track-matching/
├── src/
│   ├── index.ts              # Main matching exports
│   ├── matching/
│   │   ├── track-matcher.ts  # Core matching algorithms
│   │   └── similarity.ts     # Similarity scoring
│   ├── caching/
│   │   └── track-cache.ts    # Track link caching
│   └── linking/
│       └── cross-platform.ts # Cross-platform linking
├── package.json
└── tsconfig.json
```

### Infrastructure Layer Packages

#### packages/infrastructure/http-client/
**Purpose**: HTTP client abstraction with common configuration

**Package Structure**:
```
http-client/
├── src/
│   ├── index.ts              # Main client export
│   ├── client/
│   │   ├── base-client.ts    # Base HTTP client
│   │   └── authenticated-client.ts # Auth-aware client
│   ├── config/
│   │   └── client-config.ts  # HTTP client configuration
│   └── utils/
│       └── request-utils.ts  # Request utilities
├── package.json
└── tsconfig.json
```

## Package.json Templates

### Core Package Template (shared-types)
```json
{
  "name": "@spotify-to-plex/shared-types",
  "version": "1.0.0",
  "private": true,
  "description": "Shared type definitions for Spotify-to-Plex applications",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^8.8.0",
    "@typescript-eslint/parser": "^8.8.0",
    "eslint": "^8.57.0",
    "typescript": "^5.7.2"
  },
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  }
}
```

### Integration Package Template (spotify-client)
```json
{
  "name": "@spotify-to-plex/spotify-client",
  "version": "1.0.0",
  "private": true,
  "description": "Spotify API client with authentication",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "dependencies": {
    "@spotify-to-plex/shared-types": "workspace:*",
    "@spotify-to-plex/shared-utils": "workspace:*",
    "@spotify-to-plex/http-client": "workspace:*",
    "@spotify/web-api-ts-sdk": "^1.2.0",
    "axios": "^1.11.0"
  },
  "devDependencies": {
    "@types/node": "^20.19.11",
    "@typescript-eslint/eslint-plugin": "^8.8.0",
    "@typescript-eslint/parser": "^8.8.0",
    "eslint": "^8.57.0",
    "jest": "^29.7.0",
    "typescript": "^5.7.2"
  },
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  }
}
```

## Migration Strategy

### Phase 1: Foundation (Week 1)
1. Create `packages/core/shared-types` 
2. Migrate all 31 duplicate types using sync-worker versions where different
3. Update both apps to use shared types
4. Create `packages/core/shared-utils`
5. Migrate exact duplicates: AxiosRequest.ts, filterUnique.ts

### Phase 2: Integration Clients (Week 2)  
1. Create `packages/integrations/spotify-client`
2. Migrate Spotify helpers (use sync-worker versions for quality)
3. Create `packages/integrations/plex-client` 
4. Migrate Plex helpers
5. Create `packages/integrations/tidal-client`

### Phase 3: Business Logic (Week 3)
1. Create `packages/business/playlist-sync`
2. Extract sync logic from both apps
3. Create `packages/business/track-matching`
4. Consolidate matching algorithms

### Phase 4: Infrastructure (Week 4)
1. Create `packages/infrastructure/http-client`
2. Abstract HTTP concerns
3. Create remaining infrastructure packages
4. Full integration testing

## Dependencies and Import Structure

### Dependency Graph
```
Applications (web, sync-worker)
    ↓
Business Layer (playlist-sync, track-matching)
    ↓  
Integration Layer (spotify-client, plex-client, tidal-client)
    ↓
Infrastructure Layer (http-client, encryption, logging)
    ↓
Core Layer (shared-types, shared-utils, config)
```

### Import Examples
```typescript
// Before (duplicate imports)
import { SpotifyCredentials } from '../types/SpotifyAPI';
import { PlexAPI } from '../types/PlexAPI';

// After (shared imports)
import { SpotifyCredentials, PlexAPI } from '@spotify-to-plex/shared-types';
import { SpotifyClient } from '@spotify-to-plex/spotify-client';
import { PlaylistSync } from '@spotify-to-plex/playlist-sync';
```

## Quality Gates and Validation

### Code Quality Requirements
- All packages must have unit tests with >80% coverage  
- TypeScript strict mode enabled
- ESLint with consistent rules across packages
- Automated dependency validation

### Migration Validation
- Both applications must build successfully after each phase
- All existing functionality preserved
- No breaking changes to public APIs
- Performance benchmarks maintained

## Success Metrics

### Technical Debt Reduction
- **359+ lines** of duplicate code eliminated
- **31 duplicate types** consolidated to single source
- **18 helper files** deduplicated with quality improvements
- Maintenance overhead reduced by ~60%

### Architecture Benefits
- **Single source of truth** for all domain types
- **Improved code quality** using sync-worker's defensive programming
- **Clear separation of concerns** with domain-driven boundaries
- **Better testability** with isolated, focused packages
- **Enhanced developer experience** with consistent APIs

### Performance Impact
- Build time optimization through package-level caching
- Bundle size reduction through tree shaking
- Faster development cycles with focused testing

## Risk Mitigation

### Breaking Changes
- Use semantic versioning for all shared packages
- Implement gradual migration with parallel imports during transition
- Comprehensive integration testing at each phase

### Dependency Management  
- Ensure shared packages build before applications
- Use workspace protocol for internal dependencies
- Validate circular dependency prevention

This architecture design provides a robust foundation for eliminating technical debt while establishing a scalable, maintainable monorepo structure that supports the continued evolution of the Spotify-to-Plex platform.