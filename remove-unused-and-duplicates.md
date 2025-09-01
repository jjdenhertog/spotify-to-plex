# Remove Unused Code and Consolidate Duplicates

## Instructions
Analyze this TypeScript monorepo and perform ONLY these two actions:

1. **REMOVE UNUSED CODE**
   - Find all unused exports, types, functions, and imports
   - Delete them completely
   - DO NOT reorganize or refactor - just remove what's unused

2. **CONSOLIDATE DUPLICATES**
   - Find identical or nearly identical code across packages
   - For each duplicate found:
     - Determine which locations currently use each version
     - Choose the most appropriate location based on placement rules below
     - Move all usage to that single location
     - Delete the duplicate copies

## Placement Rules

### Types should go in `@spotify-to-plex/shared-types` when:
- Used by 2+ packages/apps
- Part of API contracts between packages
- Core domain types (Spotify, Plex, Tidal data structures)
- Configuration interfaces used across packages

### Types should stay in local package when:
- Only used within that single package
- Implementation details not exposed to other packages
- Package-specific helper/utility types

### Utilities should go in `@spotify-to-plex/shared-utils` when:
- Generic functions used by 2+ packages/apps
- Pure functions with no domain-specific dependencies
- Common validation, formatting, or transformation logic

### Utilities should stay in domain-specific packages when:
- Tightly coupled to domain logic (Plex helpers → `plex-helpers`)
- Require domain-specific dependencies
- Only used within that domain

## What NOT to do
- Do not reorganize package structure
- Do not create new abstractions
- Do not refactor existing code
- Do not change APIs unless removing unused parts
- Do not optimize or improve code quality
- Do not add documentation or comments

## Output Format
For each action taken, provide:
```
ACTION: REMOVED UNUSED / CONSOLIDATED DUPLICATE
FILE: exact/file/path.ts
DETAILS: what was removed/consolidated and why
USAGE: list of files that import this (if any)
```

## Validation
After changes:
- All imports must still resolve correctly
- No breaking changes to existing functionality
- TypeScript compilation must pass
- All tests must still pass
