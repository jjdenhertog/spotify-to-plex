# Monorepo Migration Guide: Aligning with Industry Standards

## Table of Contents
1. [Current State Analysis](#current-state-analysis)
2. [Industry Standards Comparison](#industry-standards-comparison)
3. [Migration Strategy](#migration-strategy)
4. [Tool-Specific Alignments](#tool-specific-alignments)
5. [Benefits of Migration](#benefits-of-migration)
6. [Migration Checklist](#migration-checklist)

## Current State Analysis

### What You Have: A Hybrid Monorepo

Your project is technically a monorepo but doesn't fully leverage monorepo benefits. Here's the current structure:

```
spotify-to-plex/
├── apps/                    # Partially used
│   ├── sync-worker/        # Has package.json but minimal content
│   └── web/                # Has package.json but no actual code
├── packages/               # Mix of internal and published packages
│   ├── plex-music-search/  # Published to NPM (@jjdenhertog/*)
│   ├── shared/             # Internal (@spotify-to-plex/*)
│   └── ...
├── cronjob/                # Should be in apps/sync-worker
├── pages/                  # Next.js app at root (should be in apps/)
├── src/                    # Application code at root
├── package.json            # Main app + workspace orchestration mixed
├── pnpm-workspace.yaml     # ✅ Proper workspace config
└── turbo.json              # ✅ Build orchestration
```

### Key Issues

1. **Root Directory Pollution**: The main Next.js application lives at the root instead of in `apps/web/`
2. **Inconsistent Package Scoping**: Mix of `@jjdenhertog/*` (published) and `@spotify-to-plex/*` (internal)
3. **Unclear Boundaries**: Business logic scattered between root and packages
4. **Incomplete App Migration**: `apps/web` and `apps/sync-worker` exist but aren't properly utilized
5. **Mixed Dependency References**: Using `file:` protocol instead of workspace protocol consistently

## Industry Standards Comparison

### Turborepo Standard Structure

Turborepo, created by Vercel, recommends:

```
my-turborepo/
├── apps/
│   ├── web/                # Next.js app
│   │   ├── src/
│   │   ├── pages/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── api/                # API server
│   └── worker/             # Background jobs
├── packages/
│   ├── ui/                 # Shared UI components
│   ├── config/             # Shared configurations
│   ├── database/           # Database utilities
│   └── shared/             # Common utilities
├── turbo.json              # Turborepo config
├── package.json            # Root orchestration only
└── pnpm-workspace.yaml     # Workspace config
```

### Nx Monorepo Structure

Nx, by Nrwl, structures projects as:

```
nx-workspace/
├── apps/
│   ├── my-app/
│   │   └── src/
│   └── my-app-e2e/
├── libs/                   # Shared libraries
│   ├── ui/
│   ├── data-access/
│   └── feature/
├── nx.json                 # Nx configuration
└── workspace.json          # Workspace configuration
```

### Lerna Structure

Lerna focuses on package publishing:

```
lerna-repo/
├── packages/
│   ├── package-a/
│   ├── package-b/
│   └── package-c/
├── lerna.json              # Lerna config
└── package.json            # Workspace root
```

### Rush Structure

Microsoft's Rush for enterprise monorepos:

```
rush-repo/
├── apps/
│   └── my-app/
├── libraries/
│   └── my-lib/
├── common/                 # Rush-specific configs
│   └── config/
└── rush.json               # Rush configuration
```

## Migration Strategy

### Phase 1: Restructure Applications (Priority: High)

#### 1.1 Move Root Application to apps/web

```bash
# Create proper web app structure
mkdir -p apps/web/src apps/web/pages

# Move application files
mv pages/* apps/web/pages/
mv src/* apps/web/src/
mv public apps/web/
mv next.config.js apps/web/
mv next-env.d.ts apps/web/
```

#### 1.2 Create Dedicated package.json for Web App

```json
// apps/web/package.json
{
  "name": "@spotify-to-plex/web",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint src pages --max-warnings 50"
  },
  "dependencies": {
    "@spotify-to-plex/shared": "workspace:*",
    "@spotify-to-plex/plex-music-search": "workspace:*",
    // ... other deps
  }
}
```

#### 1.3 Move Cronjobs to sync-worker

```bash
# Move cronjob files
mv cronjob/* apps/sync-worker/src/jobs/

# Update imports in sync-worker
# Change from @/helpers to @spotify-to-plex/shared
```

**Note:** This migration focuses on restructuring only. Converting these cronjobs to a persistent background service would be a separate task that can be done after the monorepo migration is complete.

### Phase 2: Standardize Package Scoping (Priority: High)

#### 2.1 Decision Point: Internal vs External Packages

**Option A: All Internal** (Recommended)
- Keep all packages under `@spotify-to-plex/*` scope
- Simplifies dependency management
- Better for private projects

**Option B: Separate Published Packages**
```
packages/
├── internal/              # @spotify-to-plex/* scope
│   ├── shared/
│   └── database/
└── published/             # @jjdenhertog/* scope
    └── plex-music-search/
```

#### 2.2 Update Package References

```json
// Root package.json - BEFORE
{
  "dependencies": {
    "@jjdenhertog/plex-music-search": "file:packages/plex-music-search"
  }
}

// Root package.json - AFTER
{
  "dependencies": {
    "@spotify-to-plex/plex-music-search": "workspace:*"
  }
}
```

### Phase 3: Configure TypeScript Project References (Priority: Medium)

#### 3.1 Root tsconfig.json

```json
// tsconfig.json (root)
{
  "files": [],
  "references": [
    { "path": "./apps/web" },
    { "path": "./apps/sync-worker" },
    { "path": "./packages/shared" },
    { "path": "./packages/plex-music-search" }
  ]
}
```

#### 3.2 Package tsconfig.json Template

```json
// packages/shared/tsconfig.json
{
  "extends": "../../config/typescript/base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "tsBuildInfoFile": "./dist/.tsbuildinfo"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

#### 3.3 App tsconfig.json Template

```json
// apps/web/tsconfig.json
{
  "extends": "../../config/typescript/react.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src", "pages", "next-env.d.ts"],
  "references": [
    { "path": "../../packages/shared" },
    { "path": "../../packages/plex-music-search" }
  ]
}
```

### Phase 4: Optimize Build Pipeline (Priority: Medium)

#### 4.1 Enhanced Turbo Configuration

```json
// turbo.json
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
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"],
      "cache": true
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
    "clean": {
      "cache": false
    }
  }
}
```

#### 4.2 Root Package.json Scripts

```json
// package.json (root)
{
  "name": "@spotify-to-plex/monorepo",
  "private": true,
  "scripts": {
    // Development
    "dev": "turbo run dev",
    "dev:web": "turbo run dev --filter=@spotify-to-plex/web",
    "dev:worker": "turbo run dev --filter=@spotify-to-plex/sync-worker",
    
    // Building
    "build": "turbo run build",
    "build:packages": "turbo run build --filter='./packages/*'",
    
    // Testing & Quality
    "test": "turbo run test",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check",
    
    // Utilities
    "clean": "turbo run clean && rm -rf node_modules",
    "format": "prettier --write \"**/*.{ts,tsx,md,json}\"",
    
    // Docker
    "docker:build": "docker buildx build --platform=linux/amd64,linux/arm64 -t spotify-to-plex .",
    "docker:push": "npm run docker:build -- --push"
  }
}
```

### Phase 5: Dependency Management (Priority: Low)

#### 5.1 Centralize Common Dependencies

```json
// package.json (root) - Common dependencies
{
  "devDependencies": {
    // Shared dev tools
    "@types/node": "^20.19.11",
    "typescript": "^5.3.0",
    "eslint": "^9.33.0",
    "prettier": "^3.0.0",
    "turbo": "latest"
  }
}
```

#### 5.2 Package-Specific Dependencies

```json
// packages/shared/package.json
{
  "dependencies": {
    "axios": "^1.11.0"  // Only what this package needs
  },
  "devDependencies": {}  // Inherits from root
}
```

## Tool-Specific Alignments

### Aligning with Turborepo

Turborepo excels at:
- **Incremental builds**: Only rebuilds what changed
- **Remote caching**: Share build cache across team
- **Parallel execution**: Runs tasks concurrently

Your current setup needs:
1. ✅ Already have `turbo.json`
2. ❌ Need to move apps to `apps/` folder
3. ❌ Need consistent workspace protocol usage
4. ⚠️  Could improve pipeline definitions

### Aligning with pnpm Workspaces

pnpm workspace benefits:
- **Efficient disk usage**: Shared dependency storage
- **Strict dependency resolution**: No phantom dependencies
- **Fast installations**: Hard links instead of copies

Your current setup:
1. ✅ Using pnpm with workspace config
2. ❌ Not using workspace protocol consistently
3. ❌ Mixed with NPM workspace config in root package.json

Recommended pnpm-workspace.yaml:
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'config/*'    # If you add shared configs
  - 'tools/*'      # If you add tooling
```

### Aligning with Nx (Alternative Option)

If considering Nx instead of Turborepo:

```bash
# Convert to Nx
npx nx@latest init

# Nx provides:
# - Computation caching
# - Distributed task execution
# - Powerful code generation
# - Dependency graph visualization
```

Nx advantages:
- Better for large enterprise monorepos
- Built-in generators for common patterns
- Advanced affected commands
- Plugin ecosystem

### Aligning with Changesets (For Publishing)

If you need to publish packages:

```bash
# Add changesets
pnpm add -D @changesets/cli

# Initialize
pnpm changeset init
```

Configuration:
```json
// .changeset/config.json
{
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch"
}
```

## Benefits of Migration

### 1. Developer Experience

**Current Issues:**
- Confusion about where code belongs
- Inconsistent import paths
- Unclear boundaries between apps and packages

**After Migration:**
- Clear separation of concerns
- Predictable file locations
- Consistent import patterns
- Better IDE support with TypeScript references

### 2. Build Performance

**Current State:**
- Everything rebuilds even for small changes
- No clear dependency graph
- Manual orchestration needed

**After Migration:**
- Incremental builds with Turborepo
- Parallel task execution
- Cached builds (local and remote)
- 50-80% faster CI/CD pipelines

### 3. Code Sharing & Reusability

**Current State:**
- Unclear what's shared vs. app-specific
- Mixed concerns in root directory
- Difficult to extract reusable components

**After Migration:**
- Clear package boundaries
- Easy to share code between apps
- Version-controlled internal packages
- Better testability of isolated packages

### 4. Scalability

**Current State:**
- Hard to add new applications
- Mixing concerns makes it hard to scale
- No clear patterns for new features

**After Migration:**
- Easy to add new apps (just create apps/new-app)
- Clear patterns for new packages
- Better team collaboration (clear ownership)
- Supports growing codebase

### 5. CI/CD Optimization

**Current State:**
- Tests and builds run for everything
- No smart detection of changes
- Longer deployment times

**After Migration:**
```yaml
# Example GitHub Actions with Turborepo
- name: Build affected
  run: pnpm turbo run build --filter=[HEAD^1]

- name: Test affected
  run: pnpm turbo run test --filter=[HEAD^1]
```

### 6. Type Safety

**Current State:**
- TypeScript can't optimize across packages
- Slower type checking
- Potential runtime errors from mismatched types

**After Migration:**
- TypeScript project references enable:
  - Incremental compilation
  - Better cross-package type checking
  - Faster IDE performance
  - Build-time type safety

## Migration Checklist

### Prerequisites
- [ ] Backup current codebase
- [ ] Ensure all tests pass
- [ ] Document current build process
- [ ] Communicate changes to team

### Phase 1: Core Restructuring
- [ ] Create `apps/web/src` directory structure
- [ ] Move `pages/` to `apps/web/pages/`
- [ ] Move `src/` to `apps/web/src/`
- [ ] Move `public/` to `apps/web/public/`
- [ ] Move Next.js config files to `apps/web/`
- [ ] Create `apps/web/package.json`
- [ ] Update imports in web app files

### Phase 2: Sync Worker Migration
- [ ] Move `cronjob/` to `apps/sync-worker/src/jobs/`
- [ ] Update sync worker package.json
- [ ] Update import paths in sync worker
- [ ] Test sync worker functionality
- [ ] Update any cron scheduling configurations (if using external scheduler)

### Phase 3: Root Cleanup
- [ ] Update root package.json (remove app dependencies)
- [ ] Update root tsconfig.json (use references)
- [ ] Remove app-specific configs from root
- [ ] Update .gitignore if needed

### Phase 4: Package Standardization
- [ ] Decide on package scoping strategy
- [ ] Update all package.json files with correct scope
- [ ] Replace `file:` with `workspace:*` protocol
- [ ] Update all import statements

### Phase 5: Build Pipeline
- [ ] Update turbo.json with optimized pipeline
- [ ] Add package-specific build scripts
- [ ] Configure TypeScript project references
- [ ] Test incremental builds

### Phase 6: Testing & Validation
- [ ] Run `pnpm install` from root
- [ ] Run `pnpm build` to build all packages
- [ ] Run `pnpm dev` to test development mode
- [ ] Run `pnpm test` to ensure tests pass
- [ ] Run `pnpm lint` to check code quality
- [ ] Test Docker build if applicable

### Phase 7: Documentation
- [ ] Update README with new structure
- [ ] Document build commands
- [ ] Update contribution guidelines
- [ ] Create package-specific READMEs

### Phase 8: CI/CD Updates
- [ ] Update GitHub Actions/CI pipelines
- [ ] Configure build caching
- [ ] Update deployment scripts
- [ ] Test automated deployments

## Example Migration Commands

```bash
# 1. Create new structure
mkdir -p apps/web/{src,pages,public}
mkdir -p apps/sync-worker/src/jobs

# 2. Move files (adjust paths as needed)
mv pages/* apps/web/pages/
mv src/* apps/web/src/
mv public/* apps/web/public/
mv next.config.js next-env.d.ts apps/web/
mv cronjob/* apps/sync-worker/src/jobs/

# 3. Update package.json files
# (Manual editing required)

# 4. Clean and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# 5. Update imports (example with sed)
# Update @/helpers to @spotify-to-plex/shared
find apps packages -name "*.ts" -o -name "*.tsx" | \
  xargs sed -i '' 's|@/helpers/|@spotify-to-plex/shared/|g'

# 6. Build everything
pnpm build

# 7. Run in development
pnpm dev
```

## Common Pitfalls to Avoid

1. **Don't mix concerns**: Keep apps in `apps/`, packages in `packages/`
2. **Don't use relative imports across packages**: Use package names
3. **Don't forget to update CI/CD**: Many build scripts will need updating
4. **Don't skip TypeScript references**: They provide significant performance benefits
5. **Don't publish private packages**: Mark internal packages as `"private": true`

## Future Improvements (Post-Migration)

After completing the monorepo migration, consider these architectural improvements as separate tasks:

1. **Convert Cronjobs to Background Service**
   - Transform scripts into a persistent service with internal scheduling
   - Add health checks and monitoring
   - Implement proper error handling and recovery
   - Deploy as separate container/process

2. **Add E2E Testing App**
   - Create `apps/e2e` with Playwright or Cypress
   - Integrate with CI/CD pipeline
   - Test critical user flows

3. **Extract More Shared Packages**
   - Create `packages/config` for shared configurations
   - Create `packages/types` for TypeScript type definitions
   - Create `packages/utils` for common utilities

4. **Implement Package Versioning**
   - Add changesets for published packages
   - Automate version bumping and changelog generation
   - Set up automated publishing pipeline

## Conclusion

Migrating to a proper monorepo structure will:
- Improve developer experience with clear boundaries
- Speed up builds with proper caching and incremental compilation
- Make the codebase more maintainable and scalable
- Align with industry best practices and tooling

The migration can be done incrementally, starting with Phase 1 (restructuring) which provides immediate benefits. Each subsequent phase builds upon the previous, allowing you to migrate at your own pace while maintaining a working application throughout the process.