# Comprehensive Migration Plan: Monorepo Package Consolidation

## Executive Summary

This migration plan addresses the consolidation of **31 duplicate types** and **18 duplicate helper files** (~3,000+ lines of code) into a well-architected shared package system. The plan prioritizes **sync-worker versions** (67% have superior quality) and follows a **risk-minimized, incremental approach**.

## Migration Overview

### Technical Debt Being Addressed
- **31 duplicate types** across 8 files (SpotifyAPI, PlexAPI, TidalAPI, etc.)
- **18 duplicate helper files** with quality inconsistencies
- **359+ lines of duplicate code** requiring dual maintenance
- **Inconsistent error handling** between web and sync-worker versions

### Architecture Target
- **4-layer architecture**: Core → Infrastructure → Integration → Business
- **Domain-driven package boundaries** following music sync domain
- **Single source of truth** for all shared code
- **Quality improvements** using sync-worker's defensive programming

## Phase-by-Phase Migration Strategy

### Phase 1: Foundation Layer (Week 1)
**Goal**: Establish core type system and basic utilities  
**Risk Level**: LOW - Pure types with no runtime dependencies

#### 1.1 Create shared-types Package (Days 1-2)
```bash
# Create package structure
mkdir -p packages/core/shared-types/src/{spotify,plex,tidal,common,dashboard}

# Migrate exact duplicate types (ZERO risk)
cp apps/sync-worker/src/types/SpotifyAPI.ts packages/core/shared-types/src/spotify/api.ts
cp apps/sync-worker/src/types/PlexAPI.ts packages/core/shared-types/src/plex/api.ts  
cp apps/sync-worker/src/types/TidalAPI.ts packages/core/shared-types/src/tidal/api.ts
cp apps/sync-worker/src/types/TrackLink.ts packages/core/shared-types/src/common/track.ts
cp apps/sync-worker/src/types/SyncLog.ts packages/core/shared-types/src/common/sync.ts

# Dashboard types
cp -r apps/sync-worker/src/types/dashboard/* packages/core/shared-types/src/dashboard/
```

**Quality Assurance**:
- All types are 100% identical between apps
- No logic changes required
- TypeScript compilation validates correctness

#### 1.2 Update Applications to Use Shared Types (Days 2-3)
```bash
# Install shared-types in both apps
pnpm add @spotify-to-plex/shared-types --workspace=@spotify-to-plex/web
pnpm add @spotify-to-plex/shared-types --workspace=@spotify-to-plex/sync-worker

# Update all import statements (automated with codemod)
npx jscodeshift --parser=typescript apps/web/src --transform=migrate-type-imports.ts
npx jscodeshift --parser=typescript apps/sync-worker/src --transform=migrate-type-imports.ts
```

**Validation Steps**:
```bash
# Verify both apps build successfully
pnpm run build:web
pnpm run build:sync-worker

# Run type checking
pnpm run type-check:web  
pnpm run type-check:sync-worker

# Execute test suites
pnpm run test:web
pnpm run test:sync-worker
```

#### 1.3 Create shared-utils Package (Days 3-4)
```bash
# Create package structure  
mkdir -p packages/core/shared-utils/src/{http,security,array,cache,url}

# Migrate EXACT duplicates first (ZERO risk)
cp apps/sync-worker/src/helpers/AxiosRequest.ts packages/core/shared-utils/src/http/axios-request.ts
cp apps/sync-worker/src/helpers/filterUnique.ts packages/core/shared-utils/src/array/filter-unique.ts

# Migrate quality-improved versions (sync-worker preferred)  
cp apps/sync-worker/src/helpers/encryption.ts packages/core/shared-utils/src/security/encryption.ts
cp apps/sync-worker/src/helpers/getCachedTrackLink.ts packages/core/shared-utils/src/cache/track-link.ts
```

**Quality Rationale**:
- **AxiosRequest.ts**: 100% identical - no decision needed
- **filterUnique.ts**: 100% identical - no decision needed  
- **encryption.ts**: Sync-worker adds validation (4 lines) - safer
- **getCachedTrackLink.ts**: Sync-worker uses optional chaining - more defensive

#### 1.4 Phase 1 Cleanup (Day 5)
```bash
# Remove duplicate files from both apps
rm apps/web/src/types/{SpotifyAPI,PlexAPI,TidalAPI,TrackLink,SyncLog}.ts
rm -rf apps/web/src/types/dashboard/
rm apps/sync-worker/src/types/{SpotifyAPI,PlexAPI,TidalAPI,TrackLink,SyncLog}.ts  
rm -rf apps/sync-worker/src/types/dashboard/

# Remove migrated utilities
rm apps/web/src/helpers/{AxiosRequest,filterUnique,encryption,getCachedTrackLink}.ts
rm apps/sync-worker/src/helpers/{AxiosRequest,filterUnique,encryption,getCachedTrackLink}.ts
```

**Success Metrics for Phase 1**:
- ✅ 31 duplicate types eliminated
- ✅ 4 exact duplicate utilities consolidated  
- ✅ Both apps build and test successfully
- ✅ ~200 lines of duplicate code removed

---

### Phase 2: Integration Layer (Week 2)  
**Goal**: Consolidate API client helpers with quality improvements  
**Risk Level**: MEDIUM - Business logic with external API dependencies

#### 2.1 Create spotify-client Package (Days 1-2)
```bash
mkdir -p packages/integrations/spotify-client/src/{client,auth,api}

# Migrate Spotify helpers (prefer sync-worker versions for quality)
cp apps/sync-worker/src/helpers/spotify/getAccessToken.ts packages/integrations/spotify-client/src/auth/
cp apps/sync-worker/src/helpers/spotify/getSpotifyData.ts packages/integrations/spotify-client/src/api/  
cp apps/sync-worker/src/helpers/spotify/getSpotifyPlaylist.ts packages/integrations/spotify-client/src/api/
cp apps/sync-worker/src/helpers/spotify/refreshAccessTokens.ts packages/integrations/spotify-client/src/auth/
```

**Quality Improvements Preserved**:
- **getAccessToken.ts**: Explicit return type annotations, null checks
- **getSpotifyData.ts**: Optional chaining for safe property access (`result.images[0]?.url`)
- **getSpotifyPlaylist.ts**: Comprehensive null safety, invalid track filtering  
- **refreshAccessTokens.ts**: Enhanced user validation, access token checking

#### 2.2 Create plex-client Package (Days 2-3)  
```bash
mkdir -p packages/integrations/plex-client/src/{client,playlist,media,utils}

# Migrate Plex helpers
cp apps/sync-worker/src/helpers/plex/addItemsToPlaylist.ts packages/integrations/plex-client/src/playlist/add-items.ts
cp apps/sync-worker/src/helpers/plex/removeItemsFromPlaylist.ts packages/integrations/plex-client/src/playlist/remove-items.ts
cp apps/sync-worker/src/helpers/plex/updatePlaylist.ts packages/integrations/plex-client/src/playlist/update-playlist.ts
cp apps/sync-worker/src/helpers/plex/handleOneRetryAttempt.ts packages/integrations/plex-client/src/utils/retry.ts
cp apps/sync-worker/src/helpers/plex/putPlaylistPoster.ts packages/integrations/plex-client/src/media/poster.ts
cp apps/sync-worker/src/helpers/plex/getUri.ts packages/integrations/plex-client/src/media/get-uri.ts

# Handle storePlaylist.ts - web version has different logic
# Copy both versions and create abstraction
cp apps/web/src/helpers/plex/storePlaylist.ts packages/integrations/plex-client/src/playlist/store-playlist-web.ts
cp apps/sync-worker/src/helpers/plex/storePlaylist.ts packages/integrations/plex-client/src/playlist/store-playlist-worker.ts
```

#### 2.3 Create tidal-client Package (Days 3-4)
```bash
mkdir -p packages/integrations/tidal-client/src/{auth,client}

# Migrate Tidal helpers (prefer sync-worker for type safety)  
cp apps/sync-worker/src/helpers/tidal/getTidalCredentials.ts packages/integrations/tidal-client/src/auth/get-credentials.ts
```

**Quality Improvements**:
- **getTidalCredentials.ts**: Explicit Promise return type, proper undefined returns

#### 2.4 Create http-client Infrastructure Package (Days 4-5)
```bash
mkdir -p packages/infrastructure/http-client/src/{client,config,utils}

# Abstract AxiosRequest into reusable HTTP client
# (Already migrated in Phase 1, now create wrapper)
```

**Success Metrics for Phase 2**:
- ✅ All Spotify helpers consolidated with quality improvements  
- ✅ All Plex helpers consolidated with defensive programming
- ✅ Tidal integration consolidated with better typing
- ✅ HTTP client abstraction created
- ✅ ~1,500 lines of duplicate code eliminated

---

### Phase 3: Business Logic Layer (Week 3)
**Goal**: Extract and consolidate domain-specific business logic  
**Risk Level**: MEDIUM - Core business algorithms

#### 3.1 Create playlist-sync Package (Days 1-3)
```bash
mkdir -p packages/business/playlist-sync/src/{sync,strategies,validation}

# Extract sync logic from both applications
# Analyze utils/ directories for sync-related functions
cp apps/sync-worker/src/utils/getSavedPlaylists.ts packages/business/playlist-sync/src/sync/
cp apps/sync-worker/src/utils/loadSpotifyData.ts packages/business/playlist-sync/src/sync/
cp apps/sync-worker/src/utils/getSyncLogs.ts packages/business/playlist-sync/src/sync/

# Create unified sync orchestration
```

#### 3.2 Create track-matching Package (Days 3-5) 
```bash
mkdir -p packages/business/track-matching/src/{matching,caching,linking}

# Extract track matching and caching logic
cp apps/sync-worker/src/utils/getCachedPlexTracks.ts packages/business/track-matching/src/caching/
cp apps/sync-worker/src/utils/putPlexTracks.ts packages/business/track-matching/src/caching/
cp apps/sync-worker/src/utils/findMissingTidalTracks.ts packages/business/track-matching/src/matching/
cp apps/sync-worker/src/utils/findMissingTidalAlbums.ts packages/business/track-matching/src/matching/
```

**Success Metrics for Phase 3**:
- ✅ Business logic extracted from applications
- ✅ Clear domain boundaries established  
- ✅ Reusable sync algorithms created
- ✅ Track matching consolidated

---

### Phase 4: Infrastructure & Integration (Week 4)
**Goal**: Complete infrastructure packages and final integration  
**Risk Level**: LOW - Final cleanup and optimization

#### 4.1 Create Remaining Infrastructure Packages (Days 1-2)
```bash  
# Create encryption package
mkdir -p packages/infrastructure/encryption/src
# (encryption.ts already migrated in Phase 1)

# Create logging package  
mkdir -p packages/infrastructure/logging/src
# Extract logging patterns from both apps

# Create storage package
mkdir -p packages/infrastructure/storage/src  
# Extract file system operations
```

#### 4.2 Update Applications to Use All Packages (Days 2-4)
```bash
# Update package.json dependencies for both apps
# Replace all remaining duplicate imports with shared packages
# Comprehensive testing and validation
```

#### 4.3 Final Cleanup and Documentation (Days 4-5)
```bash
# Remove all remaining duplicate files
# Update documentation and developer guides  
# Performance benchmarking
# Security audit of consolidated packages
```

**Success Metrics for Phase 4**:  
- ✅ Complete elimination of all duplicate code
- ✅ Both applications using shared packages exclusively
- ✅ Performance maintained or improved
- ✅ Comprehensive test coverage

---

## File Migration Matrix

### Types Migration (31 files → 8 packages)
| Source Files | Target Package | Strategy | Risk |
|-------------|----------------|----------|------|
| SpotifyAPI.ts (both apps) | shared-types/spotify/api.ts | Direct copy (identical) | LOW |
| PlexAPI.ts (both apps) | shared-types/plex/api.ts | Direct copy (identical) | LOW |  
| TidalAPI.ts (both apps) | shared-types/tidal/api.ts | Direct copy (identical) | LOW |
| TrackLink.ts (both apps) | shared-types/common/track.ts | Direct copy (identical) | LOW |
| SyncLog.ts (both apps) | shared-types/common/sync.ts | Direct copy (identical) | LOW |
| dashboard/* (both apps) | shared-types/dashboard/ | Direct copy (identical) | LOW |

### Utilities Migration (18 files → multiple packages)  
| Source Files | Target Package | Quality Decision | Risk |
|-------------|----------------|------------------|------|
| AxiosRequest.ts | shared-utils/http/ | Identical versions | LOW |
| filterUnique.ts | shared-utils/array/ | Identical versions | LOW |
| encryption.ts | shared-utils/security/ | Sync-worker (better validation) | LOW |
| getCachedTrackLink.ts | shared-utils/cache/ | Sync-worker (optional chaining) | LOW |
| spotify/* helpers | spotify-client/src/ | Sync-worker (defensive programming) | MEDIUM |
| plex/* helpers | plex-client/src/ | Sync-worker (null safety) | MEDIUM |
| tidal/* helpers | tidal-client/src/ | Sync-worker (type safety) | LOW |

## Risk Mitigation Strategies

### Code Quality Assurance
```bash
# Automated testing at each phase
pnpm run test:packages    # Unit tests for all packages
pnpm run type-check       # TypeScript validation  
pnpm run lint:packages    # Code quality checks
pnpm run build:packages   # Build verification
```

### Integration Testing
```bash
# End-to-end testing after each phase
pnpm run test:e2e:web           # Web application functionality
pnpm run test:e2e:sync-worker   # Background worker functionality  
pnpm run test:integration       # Cross-package integration
```

### Rollback Strategy  
- **Git branching**: Each phase in separate branch with ability to rollback
- **Package versioning**: Semantic versioning for all shared packages
- **Gradual cutover**: Parallel imports during transition periods
- **Feature flags**: Toggle between old and new implementations

### Performance Monitoring
```bash
# Bundle size analysis
pnpm run analyze:bundle:web        # Web app bundle analysis
pnpm run analyze:bundle:sync-worker # Worker bundle analysis

# Build performance  
pnpm run benchmark:build           # Build time comparison
pnpm run benchmark:type-check      # Type checking performance
```

## Validation Checklist

### Phase Completion Criteria
- [ ] **Phase 1**: All type imports use shared-types package
- [ ] **Phase 2**: All API helpers use integration packages  
- [ ] **Phase 3**: Business logic extracted to domain packages
- [ ] **Phase 4**: Zero duplicate files remaining

### Quality Gates
- [ ] **Type Safety**: `pnpm run type-check` passes for all packages
- [ ] **Code Quality**: `pnpm run lint` passes with zero warnings
- [ ] **Test Coverage**: >80% coverage for all shared packages  
- [ ] **Build Success**: All applications build without errors
- [ ] **Functionality**: All existing features work identically

### Success Metrics
- [ ] **Technical Debt**: 359+ lines of duplicate code eliminated
- [ ] **Maintenance**: Single source of truth for all shared code
- [ ] **Quality**: Sync-worker's defensive programming patterns adopted
- [ ] **Architecture**: Clean domain-driven package boundaries  
- [ ] **Performance**: Build times improved through package caching

## Timeline Summary

| Phase | Duration | Risk Level | Deliverables |
|-------|----------|------------|--------------|
| **Phase 1** | Week 1 | LOW | Types + Basic Utils (31 types, 4 utils) |
| **Phase 2** | Week 2 | MEDIUM | Integration Clients (14 helpers) | 
| **Phase 3** | Week 3 | MEDIUM | Business Logic Packages |
| **Phase 4** | Week 4 | LOW | Infrastructure + Final Integration |

**Total Duration**: 4 weeks  
**Total Risk**: LOW-MEDIUM (incremental approach minimizes risk)  
**Total Impact**: HIGH (eliminates all technical debt, improves maintainability)

This migration plan provides a **systematic, low-risk approach** to consolidating the monorepo while **preserving and improving code quality** through the adoption of sync-worker's superior defensive programming patterns.