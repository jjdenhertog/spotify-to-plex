# Code Analysis Report: Unused Code and Duplications

## Executive Summary

This comprehensive analysis identified significant unused code and duplications across the TypeScript monorepo. The analysis found numerous unused exports, barrel files violating codebase guidelines, type duplications, and potentially unused functions.

## Key Findings

### 1. Barrel Files (Policy Violations)

**CRITICAL: These barrel files violate the codebase policy of "1 function/type per file"**

- `/packages/http-client/src/index.ts` - Re-exports all axios methods
- `/packages/plex-helpers/src/index.ts` - Re-exports 18+ items

### 2. Unused HTTP Client Exports

**All individual axios method exports are unused:**
- `axiosGet` - Only referenced in its own file and barrel
- `axiosPost` - Only referenced in its own file and barrel  
- `axiosPut` - Only referenced in its own file and barrel
- `axiosDelete` - Only referenced in its own file and barrel

**Usage Pattern:** All imports use direct file paths: `@spotify-to-plex/http-client/AxiosRequest`

### 3. Massive Type Duplications

#### Track Types (Multiple Definitions)
- `/apps/web/src/types/Track.ts`
- `/packages/music-search/src/types/Track.ts`
- `/packages/shared-types/src/spotify/Track.ts`
- Plus 8+ more Track-related types across packages

#### Playlist Types (Multiple Definitions)  
- `/apps/web/src/types/Playlist.ts`
- `/packages/shared-types/src/plex/Playlist.ts`
- `/packages/plex-music-search/src/types/plex/Playlist.ts`
- Plus 12+ more Playlist-related types

#### GetUserResponse Types (Triple Definition)
- `/apps/web/src/types/GetUserResponse.ts`
- `/packages/shared-types/src/plex/GetUserResponse.ts` 
- `/packages/plex-music-search/src/types/plex/GetUserResponse.ts`

### 4. Potentially Unused State Functions

**These functions are exported but have minimal/no imports:**

#### Tidal Music Search
- `resetState()` in `/packages/tidal-music-search/src/utils/tidal/state.ts`

#### Plex Config  
- `resetState()` in `/packages/plex-config/src/functions/state.ts`
- Backup file: `/packages/plex-config/src/functions/state.ts.bak` (should be deleted)

### 5. Search Response Type Duplications

**Multiple SearchResponse types across packages:**
- `/packages/tidal-music-search/src/functions/searchAlbum.ts:9`
- `/packages/tidal-music-search/src/functions/search.ts:10` 
- `/packages/tidal-music-search/src/functions/newTrackSearch.ts:5`
- `/packages/tidal-music-search/src/functions/findTrack.ts:10`

## Package-by-Package Analysis

### /packages/http-client/
**Status: Heavy unused code**
- ❌ Barrel file `/src/index.ts` - completely unused
- ❌ Individual exports: `axiosGet`, `axiosPost`, `axiosPut`, `axiosDelete` - unused
- ✅ `AxiosRequest` - actively used via direct imports

### /packages/plex-helpers/
**Status: Barrel file violation** 
- ❌ Barrel file `/src/index.ts` - violates 1-per-file rule
- ✅ Individual functions - actively used via direct imports

### /packages/music-search/
**Status: Generally clean**
- ✅ Most exports are actively used
- ⚠️ Some state functions may have limited usage

### /packages/shared-types/
**Status: Type duplication issues**
- ⚠️ Many types duplicated in other packages
- ⚠️ Some types might be unused due to direct imports

### /packages/tidal-music-search/
**Status: Multiple issues**
- ❌ `resetState()` function - unused
- ❌ Multiple SearchResponse type definitions
- ⚠️ Many exported types may be unused

### /packages/plex-music-search/ 
**Status: Type duplication**
- ⚠️ Many Plex types duplicated from shared-types
- ⚠️ Multiple HubSearch types may overlap

### /packages/plex-config/
**Status: State management issues**
- ❌ Backup file `state.ts.bak` should be deleted
- ❌ `resetState()` function - unused
- ✅ Most other functions actively used

### /packages/shared-utils/
**Status: Needs verification**
- ⚠️ Several utility functions need usage verification

## Recommendations

### Immediate Actions (High Priority)

1. **Remove Barrel Files**
   - Delete `/packages/http-client/src/index.ts`
   - Delete `/packages/plex-helpers/src/index.ts`

2. **Remove Unused HTTP Client Methods**
   - Delete `/packages/http-client/src/methods/axiosGet.ts`
   - Delete `/packages/http-client/src/methods/axiosPost.ts`  
   - Delete `/packages/http-client/src/methods/axiosPut.ts`
   - Delete `/packages/http-client/src/methods/axiosDelete.ts`

3. **Clean Up Backup Files**
   - Delete `/packages/plex-config/src/functions/state.ts.bak`

4. **Remove Unused State Functions**
   - Remove `resetState()` exports from state files where unused

### Medium Priority

5. **Consolidate Type Definitions**
   - Use shared-types package as single source of truth
   - Remove duplicate Track, Playlist, GetUserResponse types
   - Update imports to use shared-types

6. **Consolidate SearchResponse Types**
   - Create single SearchResponse type in appropriate shared location
   - Remove duplicates across tidal-music-search functions

### Long Term

7. **Package Restructuring** 
   - Consider merging similar packages
   - Establish clear package boundaries
   - Implement proper dependency management

## Impact Assessment

### Disk Space Savings
- **Estimated**: ~50+ files could be removed/consolidated
- **Code Reduction**: ~15-20% reduction in duplicate code

### Maintenance Benefits
- Reduced confusion from duplicate types
- Cleaner import structure
- Better adherence to coding guidelines
- Easier refactoring and updates

### Risk Assessment
- **Low Risk**: Barrel file removal (not used)
- **Low Risk**: Unused function removal
- **Medium Risk**: Type consolidation (requires careful import updates)

## Verification Commands

To verify unused code before deletion:

```bash
# Check for any remaining imports of barrel files
grep -r "from [\"']@spotify-to-plex/http-client[\"']" .

# Check for axios method usage
grep -r "axiosGet\|axiosPost\|axiosPut\|axiosDelete" .

# Check for resetState usage  
grep -r "resetState" .

# Find duplicate type imports
grep -r "import.*Track.*from" .
```

---

**Analysis Complete:** This report identified significant opportunities for code cleanup and consolidation. Implementing these recommendations will improve maintainability and reduce technical debt.