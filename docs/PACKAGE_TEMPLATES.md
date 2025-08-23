# Package.json Templates for Shared Packages

## Core Layer Templates

### packages/core/shared-types/package.json
```json
{
  "name": "@spotify-to-plex/shared-types",
  "version": "1.0.0", 
  "private": true,
  "description": "Consolidated type definitions for Spotify, Plex, and Tidal APIs - eliminates 31 duplicate types",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist/**/*",
    "src/**/*"
  ],
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "clean": "rm -rf dist",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix", 
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "devDependencies": {
    "@types/jest": "^29.5.12",
    "@typescript-eslint/eslint-plugin": "^8.8.0", 
    "@typescript-eslint/parser": "^8.8.0",
    "eslint": "^8.57.0",
    "jest": "^29.7.0",
    "typescript": "^5.7.2"
  },
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  },
  "keywords": ["types", "spotify", "plex", "tidal", "api", "typescript"]
}
```

### packages/core/shared-utils/package.json
```json
{
  "name": "@spotify-to-plex/shared-utils",
  "version": "1.0.0",
  "private": true, 
  "description": "Pure utility functions - consolidates 18 duplicate helper files with quality improvements",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist/**/*",
    "src/**/*"
  ],
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "clean": "rm -rf dist",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "dependencies": {
    "@spotify-to-plex/shared-types": "workspace:*"
  },
  "devDependencies": {
    "@types/jest": "^29.5.12",
    "@types/node": "^20.19.11",
    "@typescript-eslint/eslint-plugin": "^8.8.0",
    "@typescript-eslint/parser": "^8.8.0", 
    "eslint": "^8.57.0",
    "eslint-plugin-unicorn": "^56.0.0",
    "jest": "^29.7.0",
    "typescript": "^5.7.2"
  },
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  },
  "keywords": ["utilities", "helpers", "encryption", "cache", "http"]
}
```

### packages/core/config/package.json  
```json
{
  "name": "@spotify-to-plex/config",
  "version": "1.0.0",
  "private": true,
  "description": "Centralized configuration management for environment variables and application settings",
  "main": "dist/index.js", 
  "types": "dist/index.d.ts",
  "files": [
    "dist/**/*",
    "src/**/*"
  ],
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "clean": "rm -rf dist",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "type-check": "tsc --noEmit",
    "test": "jest"
  },
  "dependencies": {
    "@spotify-to-plex/shared-types": "workspace:*",
    "fs-extra": "^11.3.1"
  },
  "devDependencies": {
    "@types/fs-extra": "^11.0.4",
    "@types/jest": "^29.5.12", 
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

## Integration Layer Templates

### packages/integrations/spotify-client/package.json
```json
{
  "name": "@spotify-to-plex/spotify-client", 
  "version": "1.0.0",
  "private": true,
  "description": "Spotify API client with authentication - uses sync-worker's superior defensive programming",
  "main": "dist/index.js",
  "types": "dist/index.d.ts", 
  "files": [
    "dist/**/*",
    "src/**/*"
  ],
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "clean": "rm -rf dist",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "type-check": "tsc --noEmit", 
    "test": "jest",
    "test:watch": "jest --watch",
    "test:integration": "jest --config jest.integration.config.js"
  },
  "dependencies": {
    "@spotify-to-plex/shared-types": "workspace:*",
    "@spotify-to-plex/shared-utils": "workspace:*",
    "@spotify-to-plex/http-client": "workspace:*",
    "@spotify/web-api-ts-sdk": "^1.2.0",
    "axios": "^1.11.0",
    "qs": "^6.14.0"
  },
  "devDependencies": {
    "@types/jest": "^29.5.12",
    "@types/node": "^20.19.11",
    "@types/qs": "^6.14.0",
    "@typescript-eslint/eslint-plugin": "^8.8.0",
    "@typescript-eslint/parser": "^8.8.0",
    "eslint": "^8.57.0",
    "jest": "^29.7.0",
    "typescript": "^5.7.2"
  },
  "engines": {
    "node": ">=18.0.0", 
    "pnpm": ">=8.0.0"
  },
  "keywords": ["spotify", "api", "client", "authentication", "music"]
}
```

### packages/integrations/plex-client/package.json
```json
{
  "name": "@spotify-to-plex/plex-client",
  "version": "1.0.0",
  "private": true,
  "description": "Plex API client for playlist and media management with consolidated helper functions",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist/**/*", 
    "src/**/*"
  ],
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch", 
    "clean": "rm -rf dist",
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
    "axios": "^1.11.0",
    "tough-cookie": "^4.1.4"
  },
  "devDependencies": {
    "@types/jest": "^29.5.12",
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
  },
  "keywords": ["plex", "api", "client", "playlist", "media"]
}
```

### packages/integrations/tidal-client/package.json
```json
{
  "name": "@spotify-to-plex/tidal-client",
  "version": "1.0.0",
  "private": true,
  "description": "Tidal API integration with authentication - enhanced TypeScript typing",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist/**/*",
    "src/**/*"
  ],
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "clean": "rm -rf dist", 
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "type-check": "tsc --noEmit",
    "test": "jest"
  },
  "dependencies": {
    "@spotify-to-plex/shared-types": "workspace:*",
    "@spotify-to-plex/shared-utils": "workspace:*",
    "@spotify-to-plex/http-client": "workspace:*"
  },
  "devDependencies": {
    "@types/jest": "^29.5.12",
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
  },
  "keywords": ["tidal", "api", "client", "music", "streaming"]
}
```

## Business Layer Templates

### packages/business/playlist-sync/package.json
```json
{
  "name": "@spotify-to-plex/playlist-sync", 
  "version": "1.0.0",
  "private": true,
  "description": "Core playlist synchronization algorithms and business logic",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist/**/*",
    "src/**/*"
  ],
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "clean": "rm -rf dist",
    "lint": "eslint src --ext .ts", 
    "lint:fix": "eslint src --ext .ts --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:integration": "jest --config jest.integration.config.js"
  },
  "dependencies": {
    "@spotify-to-plex/shared-types": "workspace:*",
    "@spotify-to-plex/shared-utils": "workspace:*",
    "@spotify-to-plex/spotify-client": "workspace:*",
    "@spotify-to-plex/plex-client": "workspace:*",
    "@spotify-to-plex/tidal-client": "workspace:*",
    "@spotify-to-plex/track-matching": "workspace:*",
    "string-similarity-js": "^2.1.4"
  },
  "devDependencies": {
    "@types/jest": "^29.5.12",
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
  },
  "keywords": ["sync", "playlist", "business-logic", "synchronization"]
}
```

### packages/business/track-matching/package.json
```json
{
  "name": "@spotify-to-plex/track-matching",
  "version": "1.0.0",
  "private": true,
  "description": "Track linking, caching, and cross-platform matching algorithms",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist/**/*",
    "src/**/*"
  ],
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "clean": "rm -rf dist",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "type-check": "tsc --noEmit", 
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "dependencies": {
    "@spotify-to-plex/shared-types": "workspace:*",
    "@spotify-to-plex/shared-utils": "workspace:*",
    "@spotify-to-plex/music-search": "workspace:*",
    "string-similarity-js": "^2.1.4"
  },
  "devDependencies": {
    "@types/jest": "^29.5.12",
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
  },
  "keywords": ["matching", "track", "caching", "similarity", "linking"]
}
```

## Infrastructure Layer Templates

### packages/infrastructure/http-client/package.json
```json
{
  "name": "@spotify-to-plex/http-client",
  "version": "1.0.0", 
  "private": true,
  "description": "HTTP client abstraction with common configuration and error handling",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist/**/*",
    "src/**/*"
  ],
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "clean": "rm -rf dist",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "dependencies": {
    "@spotify-to-plex/shared-types": "workspace:*",
    "@spotify-to-plex/config": "workspace:*", 
    "axios": "^1.11.0"
  },
  "devDependencies": {
    "@types/jest": "^29.5.12",
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
  },
  "keywords": ["http", "client", "axios", "api", "infrastructure"]
}
```

### packages/infrastructure/encryption/package.json
```json
{
  "name": "@spotify-to-plex/encryption",
  "version": "1.0.0",
  "private": true,
  "description": "Security and encryption utilities with enhanced validation - from sync-worker quality improvements",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist/**/*",
    "src/**/*"  
  ],
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "clean": "rm -rf dist",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:security": "jest --testNamePattern='security'"
  },
  "dependencies": {
    "@spotify-to-plex/shared-types": "workspace:*"
  },
  "devDependencies": {
    "@types/jest": "^29.5.12",
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
  },
  "keywords": ["encryption", "security", "crypto", "validation"]
}
```

## TypeScript Configuration Template

### packages/*/tsconfig.json
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "declarationMap": true,
    "composite": true,
    "incremental": true
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "dist",
    "node_modules",
    "**/*.test.ts",
    "**/*.spec.ts"
  ],
  "references": [
    // Add references to dependency packages
  ]
}
```

## Build and Dependency Configuration

### Updated Root package.json Scripts
```json
{
  "scripts": {
    "build:packages": "pnpm run --parallel build --filter=packages/*",
    "build:core": "pnpm run build --filter=@spotify-to-plex/shared-types --filter=@spotify-to-plex/shared-utils --filter=@spotify-to-plex/config",
    "build:integrations": "pnpm run --parallel build --filter=packages/integrations/*",
    "build:business": "pnpm run --parallel build --filter=packages/business/*", 
    "build:infrastructure": "pnpm run --parallel build --filter=packages/infrastructure/*",
    "test:packages": "pnpm run --parallel test --filter=packages/*",
    "lint:packages": "pnpm run --parallel lint --filter=packages/*",
    "type-check:packages": "pnpm run --parallel type-check --filter=packages/*"
  }
}
```

These templates provide:
1. **Consistent structure** across all packages
2. **Proper dependency management** using workspace protocol
3. **Comprehensive testing setup** with coverage
4. **Quality gates** with linting and type checking  
5. **Build optimization** with TypeScript project references
6. **Clear metadata** documenting consolidation benefits