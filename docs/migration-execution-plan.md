# Monorepo Migration Execution Plan

## Executive Summary

This document provides a comprehensive execution plan for migrating the Spotify-to-Plex project from its current hybrid monorepo structure to a fully compliant industry-standard monorepo following Turborepo and pnpm workspace best practices.

## Current State Analysis

### Project Structure Assessment
- **Root Application**: Next.js app currently lives at repository root (should be in `apps/web/`)
- **Package Management**: Well-structured packages with consistent `@spotify-to-plex/*` scoping
- **Workspace Configuration**: Basic pnpm workspaces configured but missing `apps/` directory
- **Sync Jobs**: Cronjob scripts in root-level directory (should be in `apps/sync-worker/`)
- **Build System**: Turborepo configured but not optimized for apps/packages separation

### Key Issues Identified
1. **Root Directory Pollution**: Main Next.js application mixed with monorepo orchestration files
2. **Inconsistent Structure**: Cronjob scripts not properly organized as an application
3. **Import Path Inconsistency**: Mix of relative imports (`@/`) and package imports
4. **Missing Apps Structure**: No clear separation between applications and shared packages
5. **Build Pipeline Suboptimal**: Turborepo not leveraging full monorepo capabilities

## Migration Strategy

### Phase 1: Core Restructuring (Priority: HIGH)
**Estimated Time: 2-3 hours**
**Risk Level: Medium**

#### 1.1 Create Apps Directory Structure
```bash
mkdir -p apps/web/{src,pages,public}
mkdir -p apps/sync-worker/src/{jobs,helpers,utils}
```

#### 1.2 Move Next.js Application
- `pages/` → `apps/web/pages/`
- `src/` → `apps/web/src/`  
- `public/` → `apps/web/public/`
- `next.config.js` → `apps/web/`
- `next-env.d.ts` → `apps/web/`

#### 1.3 Move Sync Worker Components
- `cronjob/*.ts` → `apps/sync-worker/src/jobs/`
- `cronjob/helpers/` → `apps/sync-worker/src/helpers/`
- `cronjob/utils/` → `apps/sync-worker/src/utils/`

#### 1.4 Create Application Package.json Files

**apps/web/package.json:**
```json
{
  "name": "@spotify-to-plex/web",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint src pages --max-warnings 50",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@spotify-to-plex/plex-music-search": "workspace:*",
    "@spotify-to-plex/tidal-music-search": "workspace:*",
    "@spotify-to-plex/open-spotify-sdk": "workspace:*",
    "@spotify-to-plex/music-search": "workspace:*"
  }
}
```

**apps/sync-worker/package.json:**
```json
{
  "name": "@spotify-to-plex/sync-worker",
  "version": "1.0.0", 
  "private": true,
  "scripts": {
    "build": "tsc",
    "sync:playlists": "npx ts-node --transpile-only -r tsconfig-paths/register src/jobs/playlists.ts",
    "sync:albums": "npx ts-node --transpile-only -r tsconfig-paths/register src/jobs/albums.ts",
    "sync:mqtt": "npx ts-node --transpile-only -r tsconfig-paths/register src/jobs/mqtt.ts",
    "sync:users": "npx ts-node --transpile-only -r tsconfig-paths/register src/jobs/users.ts"
  },
  "dependencies": {
    "@spotify-to-plex/plex-music-search": "workspace:*",
    "@spotify-to-plex/tidal-music-search": "workspace:*",
    "@spotify-to-plex/open-spotify-sdk": "workspace:*",
    "@spotify-to-plex/music-search": "workspace:*"
  }
}
```

### Phase 2: Dependency Management (Priority: HIGH)
**Estimated Time: 1-2 hours**
**Risk Level: Low**

#### 2.1 Update Workspace Configuration
**pnpm-workspace.yaml:**
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

#### 2.2 Clean Root Package.json
Remove application-specific dependencies, keep only:
- Monorepo orchestration tools (turbo, pnpm)
- Shared development dependencies (TypeScript, ESLint, Prettier)
- Build and deployment scripts

#### 2.3 Update Import Paths
- Replace `@/helpers/` with `@spotify-to-plex/shared/helpers/` (if creating shared package)
- Replace relative imports with proper package imports
- Update path mappings in tsconfig.json files

### Phase 3: TypeScript & Build Optimization (Priority: MEDIUM)
**Estimated Time: 2-3 hours**
**Risk Level: Low**

#### 3.1 TypeScript Project References
**Root tsconfig.json:**
```json
{
  "files": [],
  "references": [
    { "path": "./apps/web" },
    { "path": "./apps/sync-worker" },
    { "path": "./packages/plex-music-search" },
    { "path": "./packages/tidal-music-search" },
    { "path": "./packages/open-spotify-sdk" },
    { "path": "./packages/music-search" }
  ]
}
```

#### 3.2 Enhanced Turbo Configuration
**turbo.json:**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"],
      "cache": true
    },
    "dev": {
      "dependsOn": ["^build"],
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": [],
      "cache": true
    },
    "type-check": {
      "dependsOn": ["^build"],
      "outputs": [],
      "cache": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"],
      "cache": true
    }
  }
}
```

### Phase 4: Validation & Testing (Priority: HIGH)
**Estimated Time: 1-2 hours**
**Risk Level: High**

#### 4.1 Dependency Resolution Test
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

#### 4.2 Build Validation
```bash
pnpm build
pnpm dev # Test development mode
pnpm lint # Ensure code quality
```

#### 4.3 Sync Job Testing
```bash
cd apps/sync-worker
pnpm sync:playlists -- force
pnpm sync:albums -- force
```

#### 4.4 Docker & Deployment Updates
- Update Dockerfile to work with new apps structure
- Update CI/CD pipelines to build from apps/web
- Test Docker build process

## Risk Assessment & Mitigation

### High Risk Items
1. **Import Path Breakage**: All `@/` imports need updating
   - *Mitigation*: Systematic find-and-replace with testing at each step

2. **Build Configuration Issues**: Next.js config may need updates
   - *Mitigation*: Test builds frequently, maintain backward compatibility

3. **Production Deployment**: Docker and CI/CD need updates
   - *Mitigation*: Test in staging environment first

### Medium Risk Items
1. **TypeScript Compilation**: Project references may cause issues
   - *Mitigation*: Gradual rollout, fallback to previous structure

2. **Development Workflow**: Team needs to adapt to new structure  
   - *Mitigation*: Clear documentation and team training

### Low Risk Items
1. **Package Dependencies**: Already well structured
2. **Workspace Configuration**: Minimal changes needed

## Success Criteria

### Technical Validation
- [ ] All applications build successfully
- [ ] Development mode works without errors
- [ ] Sync jobs execute properly with new paths
- [ ] Type checking passes across all packages
- [ ] Docker builds complete successfully

### Performance Metrics
- [ ] Build times improve with incremental compilation
- [ ] Development startup time maintains or improves
- [ ] CI/CD pipeline duration reduces with better caching

### Team Adoption
- [ ] Clear documentation for new structure
- [ ] Team can navigate new directory structure
- [ ] Development workflow remains smooth

## Implementation Timeline

### Day 1: Preparation & Phase 1
- Morning: Backup current state, create branch
- Afternoon: Execute core restructuring (Phase 1)
- Evening: Initial testing and validation

### Day 2: Dependencies & Build Optimization  
- Morning: Update dependencies and imports (Phase 2)
- Afternoon: Configure TypeScript and Turbo (Phase 3)
- Evening: Comprehensive testing (Phase 4)

### Day 3: Deployment & Validation
- Morning: Update Docker and CI/CD
- Afternoon: Staging environment testing
- Evening: Production deployment preparation

## Rollback Strategy

If critical issues arise:
1. **Git Branch Rollback**: Revert to previous commit
2. **Selective Rollback**: Keep packages structure, revert apps only
3. **Gradual Rollback**: Move applications back to root incrementally

## Post-Migration Improvements

After successful migration, consider:
1. **Extract Shared Package**: Move common utilities to `packages/shared`
2. **Add E2E Testing**: Create `apps/e2e` for integration tests  
3. **Background Service**: Convert sync jobs from cron to persistent service
4. **Package Publishing**: Set up automated publishing for reusable packages

## Command Reference

### Migration Commands
```bash
# Create structure
mkdir -p apps/{web,sync-worker}/src

# Move files
mv pages apps/web/
mv src apps/web/
mv public apps/web/
mv cronjob/* apps/sync-worker/src/jobs/

# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Build and test
pnpm build
pnpm dev
```

### Development Commands (Post-Migration)
```bash
# Development
pnpm dev                    # All apps in dev mode
pnpm dev --filter=web       # Just web app
pnpm dev --filter=sync-worker # Just sync worker

# Building
pnpm build                  # Build all
pnpm build --filter=web     # Build web only

# Sync Jobs
pnpm --filter=sync-worker sync:playlists
pnpm --filter=sync-worker sync:albums
```

## Conclusion

This migration will transform the project into a best-practice monorepo that:
- Provides clear separation between applications and shared packages
- Enables better build performance through Turborepo caching
- Improves developer experience with proper TypeScript compilation
- Aligns with industry standards for scalability and maintainability
- Maintains all existing functionality while improving structure

The migration is designed to be incremental and safe, with clear rollback options at each phase. Following this plan will result in a more maintainable, scalable, and performant codebase.