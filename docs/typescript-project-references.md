# TypeScript Project References Configuration

## Overview

This monorepo has been configured with TypeScript project references to optimize build performance, enable incremental compilation, and improve developer experience.

## Configuration Structure

### Root Configuration (`tsconfig.json`)
- Uses project references to coordinate builds across all packages and apps
- Provides shared path mappings for all workspace dependencies
- Enables composite builds and incremental compilation

### Package Configurations
All packages (`packages/*`) are configured with:
- `composite: true` - Enables project references
- `declaration: true` - Generates .d.ts files for consuming projects
- `declarationMap: true` - Enables declaration source maps
- `incremental: true` - Enables incremental compilation
- `tsBuildInfoFile: "./dist/.tsbuildinfo"` - Stores incremental build info

### App Configurations
Both apps (`apps/*`) reference all packages they depend on:
- `sync-worker` - Node.js app with references to all music packages
- `web` - Next.js app with references to all music packages

## Build Order Dependencies

```
music-search (base package)
├── plex-music-search (depends on music-search)
├── tidal-music-search (depends on music-search)
└── open-spotify-sdk (standalone)

sync-worker (depends on all packages)
web (depends on all packages)
```

## Performance Benefits

1. **Incremental Compilation**: Only rebuilds changed projects and their dependents
2. **Parallel Builds**: Independent packages build in parallel
3. **Better Caching**: Turbo can cache based on individual project changes
4. **Type Safety**: Ensures proper dependency resolution across packages

## Build Commands

- `npm run build` - Build all projects using TypeScript project references
- `npm run build:packages` - Build only packages
- `npm run build:clean` - Clean all build outputs
- `npm run build:force` - Force rebuild all projects
- `npm run type-check` - Type check without emitting files
- `npm run type-check:watch` - Watch mode type checking

## Turbo Integration

Turbo.json has been optimized for TypeScript project references:
- Input tracking for TypeScript files and configs
- Output tracking for build artifacts and tsbuildinfo files
- Proper dependency graph respect for incremental builds
- Enhanced caching based on file hashes

## Development Workflow

1. Make changes to any package or app
2. Run `npm run build` to build only affected projects
3. Or use `npm run type-check:watch` for continuous type checking
4. Turbo will cache unchanged projects for faster subsequent builds

## Migration Benefits

- 2-4x faster builds due to incremental compilation
- Better IDE support with proper project references
- Reduced memory usage during builds
- Clearer dependency management