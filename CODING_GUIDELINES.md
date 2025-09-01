# Coding Guidelines for Spotify-to-Plex Project

This document outlines the comprehensive coding standards, patterns, and preferences for the Spotify-to-Plex project. These guidelines focus on **how I write code** - the specific patterns, file organization, and coding style preferences that ensure consistency across all development work.

---

## Project Architecture

### Monorepo Structure
- **Use pnpm workspaces** with clear separation between `apps/` and `packages/`
- **Package naming**: `@spotify-to-plex/[package-name]` convention
- **Workspace dependencies**: Use `workspace:*` format
- **TypeScript project references** for efficient builds

```
spotify-to-plex/
├── apps/                    # Application-level code
│   ├── web/                # Next.js frontend application  
│   └── sync-worker/        # Background sync worker
├── packages/               # Shared libraries and utilities
│   ├── shared-types/       # Common TypeScript types
│   ├── shared-utils/       # Utility functions
│   ├── plex-helpers/       # Plex-specific utilities
│   └── http-client/        # HTTP request utilities
└── config/                 # TypeScript configurations
```

### Package Organization Standards
- Each package MUST have consistent structure: `src/`, `dist/`, `package.json`, `tsconfig.json`
- **NO barrel exports** - each type and function must be imported with full path
- Separate server-side and client-side utilities clearly
- Shared types MUST be in dedicated `@spotify-to-plex/shared-types` package

---

## **CRITICAL: NO Barrel Files Policy**

### **Barrel Files Are Strictly Forbidden**

This project enforces a strict **NO barrel files** policy:

- **NO `index.ts` files** for re-exporting modules
- **NO `export * from` patterns** 
- **ALL imports MUST use full paths** to specific files
- **Each file exports exactly ONE function OR ONE type**

```typescript
// ✅ CORRECT - Full path imports required (NO 'src' in path)
import { filterUnique } from '@spotify-to-plex/shared-utils/array/filterUnique';
import { TrackLink } from '@spotify-to-plex/shared-types/common/TrackLink';

// ❌ FORBIDDEN - 'src' in import paths
import { filterUnique } from '@spotify-to-plex/shared-utils/src/array/filterUnique';
import { TrackLink } from '@spotify-to-plex/shared-types/src/common/TrackLink';

// ❌ FORBIDDEN - Barrel imports not allowed
import { filterUnique, TrackLink } from '@spotify-to-plex/shared-utils';
import * as utils from '@spotify-to-plex/shared-utils';
```

### Benefits of NO Barrel Files
- **Explicit dependencies**: Every import shows exactly which file is used
- **Better tree shaking**: Bundlers can eliminate unused code more effectively
- **Clearer debugging**: Stack traces point to exact source files
- **Prevents circular dependencies**: Full paths make dependency chains visible
- **Faster builds**: TypeScript doesn't need to resolve barrel exports

---

## File Organization Patterns

### Utility File Structure
Utilities are organized into **domain-specific directories** within `src/`:

```
packages/shared-utils/src/
├── array/                  # Array manipulation utilities
│   └── filterUnique.ts    # One function per file
├── cache/                  # Caching utilities
│   └── getCachedTrackLink.ts
├── spotify/               # Spotify-specific utilities  
│   ├── getAccessToken.ts
│   ├── getSpotifyData.ts
│   └── refreshAccessTokens.ts
├── validation/            # Validation utilities
│   ├── validateMatchFilter.ts
│   └── validateSearchApproaches.ts
└── utils/                 # General utilities
    ├── getAPIUrl.ts
    └── getStorageDir.ts
```

### Directory Naming Patterns
- **Domain-based grouping**: `spotify/`, `plex/`, `tidal/`, `validation/`
- **Function-based grouping**: `array/`, `cache/`, `utils/`
- **Always plural for collections**: `functions/`, `utils/`, `validation/`

---

## One Function Per File Rule

### **CRITICAL: Each File Contains Exactly One Function OR One Type**

This is a fundamental pattern throughout the codebase - every utility function gets its own file, and every type gets its own file:

```typescript
// ✅ CORRECT - filterUnique.ts
export function filterUnique<T>(val: T, index: number, array: T[]): boolean {
    return array.indexOf(val) === index;
}

// ✅ CORRECT - createSearchString.ts  
export function createSearchString(input: string) {
    const result = input
        .toLowerCase()
        .replace(new RegExp(/[àáâãäå]/g), "a")
        .replace(new RegExp(/æ/g), "ae")
        // ... more replacements
        .trim();
    return result;
}
```

### Benefits of One-Function-Per-File and One-Type-Per-File
- **Clear imports**: `import { filterUnique } from './array/filterUnique'`
- **Easy discovery**: Function/type location is predictable from name
- **Focused files**: Each file has single responsibility
- **Better organization**: Related functions and types grouped by domain directory
- **NO barrel files**: Full path imports ensure explicit dependencies

### File Naming for Functions and Types
- **File name MUST match export name**: `getAccessToken.ts` exports `getAccessToken`, `TrackLink.ts` exports `TrackLink`
- **camelCase for function files**: `getCachedTrackLink.ts`, `refreshAccessTokens.ts`
- **PascalCase for type files**: `TrackLink.ts`, `SearchConfig.ts`
- **Descriptive names**: File name should clearly indicate function/type purpose

---

## File and Directory Naming

### File Naming Conventions
- **camelCase** for utility files: `getCachedTrackLink.ts`, `createSearchString.ts`
- **PascalCase** for React components: `SearchAnalyzer.tsx`, `PlexConnection.tsx`
- **PascalCase** for TypeScript types: `TrackLink.ts`, `SearchConfig.ts`
- **kebab-case** for directories: `music-search-config/`, `text-processing/`

### Variable and Function Naming
- **camelCase** for variables and functions: `searchResponse`, `onAnalyseSongMatchClick`
- **SCREAMING_SNAKE_CASE** for constants: `DEFAULT_MUSIC_SEARCH_CONFIG`
- **PascalCase** for types and interfaces: `TrackLink`, `SearchConfig`

---

## Async/Await Preferences

### **CRITICAL: ALL Async Operations MUST Use errorBoundary**

Every single async operation in React components MUST be wrapped with the `errorBoundary` helper:

```typescript
// ✅ CORRECT - Required pattern for ALL async operations
const onSaveClick = useCallback(() => {
    errorBoundary(async () => {
        const result = await saveData();
        await updateConfig();
        enqueueSnackbar('Saved successfully');
    });
}, []);

// ✅ CORRECT - useEffect with async operations
useEffect(() => {
    errorBoundary(async () => {
        const result = await axios.get('/api/data');
        setData(result.data);
        setLoading(false);
    });
}, []);

// ✅ CORRECT - Event handlers with async operations
const onDeleteClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const { id } = e.currentTarget.dataset;
    errorBoundary(async () => {
        await axios.delete(`/api/items/${id}`);
        await reloadData();
    });
}, []);

// ❌ FORBIDDEN - Direct async without errorBoundary
const badHandler = useCallback(async () => {
    await saveData(); // Will not handle errors properly
}, []);
```

### errorBoundary Pattern Rules
- **ALWAYS wrap** async operations in React components with `errorBoundary`
- **Centralized error handling** - errors are automatically shown to user
- **Optional cleanup function** as second parameter for loading states
- **Available in**: `@/helpers/errors/errorBoundary`

```typescript
// ✅ With cleanup function
const onSaveClick = useCallback(() => {
    errorBoundary(async () => {
        setLoading(true);
        await saveData();
    }, () => {
        setLoading(false); // Cleanup on error
    });
}, []);
```

### **ALWAYS Prefer async/await over Promises**

Throughout the codebase, async/await is consistently preferred over `.then()/.catch()` chains:

```typescript
// ✅ CORRECT - API utility functions with async/await
export async function getAccessToken(): Promise<string> {
    const response = await AxiosRequest.post(url, data);
    return response.data.access_token;
}

// ❌ AVOID - Promise chains (use async/await instead)
export function getAccessToken(): Promise<string> {
    return AxiosRequest.post(url, data)
        .then(response => response.data.access_token)
        .catch(error => {
            throw error;
        });
}
```

### Async Function Patterns
- **React components**: MUST use `errorBoundary` wrapper for all async operations
- **Utility functions**: Use direct async/await with try/catch if needed
- **Return types**: Always specify `Promise<T>` return types for async functions

---

## TypeScript Patterns

### Type Definitions
- **ALWAYS prefer `type` over `interface`** (enforced by ESLint rule `@typescript-eslint/consistent-type-definitions`)
- Use optional properties with `?` syntax consistently
- Utilize union types and discriminated unions effectively

```typescript
// ✅ CORRECT - Use type declarations
export type SearchConfig = {
    filterOutWords?: string[];
    searchApproaches?: string[];
    textProcessing?: TextProcessingConfig;
}

// ❌ INCORRECT - Don't use interfaces
export interface SearchConfig {
    filterOutWords?: string[];
}
```

### Response Type Patterns
- Response types use descriptive naming pattern:

```typescript
export type GetSpotifyTrackResponse = Track
export type GetPlexPlaylistResponse = {
    key: Playlist["key"];
    guid: Playlist["guid"];
    title: Playlist["title"];
}
```

### Generic Usage
- Use generics for reusable utility functions
- Follow `T`, `U`, `V` convention for type parameters

```typescript
export function filterUnique<T>(val: T, index: number, array: T[]): boolean {
    return array.indexOf(val) === index;
}
```

---

## React Component Patterns

### Component Structure Requirements
- **MUST use functional components exclusively** (class components forbidden by ESLint)
- **MUST export components as default exports**
- **MUST destructure props** (required by ESLint)
- **SHOULD use React.memo** for performance when receiving props

```typescript
// ✅ CORRECT - Functional component with proper structure
export default function SearchAnalyzer() {
    const [loading, setLoading] = useState(false);
    const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
    
    // Component logic here
    
    return (
        <>
            {/* component JSX */}
        </>
    );
}
```

### State Management Standards
- **useState** for local component state
- **useCallback** MANDATORY for ALL event handlers (strictly enforced by ESLint)
- **useMemo** for expensive computations
- **Custom hooks** for reusable logic

---

## Event Handler Requirements

### **CRITICAL: All Event Handlers MUST Use useCallback**

This is strictly enforced by ESLint rule `react/jsx-no-bind`. NO exceptions allowed.

```typescript
// ✅ CORRECT - Required pattern
const onClick = useCallback(() => {
    // handler logic
}, []);

return <div onClick={onClick}>Click me</div>;

// ❌ ABSOLUTELY FORBIDDEN - Will cause ESLint error
return <div onClick={() => {}}>Click me</div>;
return <div onClick={handleClick.bind(this)}>Click me</div>;
```

### Event Handler Patterns
- **ALWAYS use useCallback** for event handlers
- **Include proper dependencies** in useCallback dependency array
- **Use descriptive names**: `onAnalyseSongMatchClick`, `onSaveChangesClick`

```typescript
// ✅ CORRECT - Complete event handler pattern
const onChangeSpotifyInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSpotifyURI(e.target.value);
}, []);

const onSaveChangesClick = useCallback(() => {
    errorBoundary(async () => {
        // save logic
    });
}, [/* dependencies */]);

return (
    <>
        <input onChange={onChangeSpotifyInput} />
        <button onClick={onSaveChangesClick}>Save</button>
    </>
);
```

---

## Conditional Rendering Rules

### **CRITICAL: Explicit Boolean Coercion Required**

All conditional rendering MUST use explicit boolean coercion to prevent render leaks.

```typescript
// ✅ CORRECT - Required patterns
{!!loading && <CircularProgress />}
{!!newValue && <div>{newValue}</div>}
{!!connected && !!settings?.uri && <PlexConnection />}

// ❌ FORBIDDEN - Will cause ESLint error (react/jsx-no-leaked-render)
{loading && <CircularProgress />}
{newValue && <div>{newValue}</div>}
{connected && settings?.uri && <PlexConnection />}
```

### Conditional Rendering Best Practices
- **Use `!!` for boolean conversion** in all conditional renders
- **Use ternary operators** for conditional content with alternatives
- **Chain conditions** with `&&` after explicit boolean conversion

```typescript
// ✅ CORRECT - Complex conditional rendering
{!!connected && !!settings?.uri &&
    <>
        <Component1 />
        <Component2 />
    </>
}

// ✅ CORRECT - Ternary with explicit boolean conversion  
{!!isLoading ? <Spinner /> : <Content />}
```

---

## API Route Patterns

### Route Structure Standards
- **Use `next-connect`** for route handling with typed request/response
- **Implement consistent error handling** using `generateError` helper
- **Use method-based routing** (GET, POST, PUT, DELETE)

```typescript
import { createRouter } from 'next-connect';
import type { NextApiRequest, NextApiResponse } from 'next';

const router = createRouter<NextApiRequest, NextApiResponse>()
    .get(async (_req, res) => {
        try {
            // GET implementation
            res.json(result);
        } catch (error) {
            console.error('Error getting resource:', error);
            res.status(500).json({ error: 'Failed to get resource' });
        }
    })
    .post(async (req, res) => {
        try {
            // POST implementation with validation
            if (!req.body.required_field) {
                return res.status(400).json({ error: 'Missing required field' });
            }
            // Process request...
        } catch (error) {
            console.error('Error creating resource:', error);
            res.status(500).json({ error: 'Failed to create resource' });
        }
    });

export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "Resource Name", err);
    }
});
```

### Request/Response Standards
- **Input validation** with early returns for invalid data
- **Consistent error responses** with descriptive messages
- **Proper HTTP status codes**: 400 for client errors, 500 for server errors
- **Type-safe response interfaces** exported alongside handlers

---

## Error Handling Standards

### Error Boundary Pattern
MUST use the centralized `errorBoundary` helper for all async operations:

```typescript
// ✅ REQUIRED - Error boundary usage
const onSaveClick = useCallback(() => {
    errorBoundary(async () => {
        await saveData();
        enqueueSnackbar('Saved successfully');
    }, () => {
        setLoading(false); // cleanup on error
    });
}, []);
```

### API Error Handling
- **Consistent error response format** across all endpoints
- **Method-specific error messages** based on HTTP method
- **Error logging** with descriptive context
- **Graceful degradation** for non-critical errors

```typescript
// Standard error generation pattern
export function generateError(req: NextApiRequest, res: NextApiResponse, subject: string, error: unknown) {
    let action: string;
    switch (req.method) {
        case "POST": action = "create"; break;
        case "PUT": action = "update"; break; 
        case "DELETE": action = "delete"; break;
        default: case "GET": action = 'load'; break;
    }
    
    if (typeof error === 'string') {
        res.status(400).json({ error });
    } else if (error instanceof Error) {
        res.status(400).json({ error: error.message });
    } else {
        res.status(400).json({ error: `Could not ${action} ${subject}` });
    }
}
```

---

## Import/Export Conventions

### Export Patterns
- **Named exports** required for utilities and types
- **Default exports** for React components and API route handlers
- **NO barrel exports** - `index.ts` files are forbidden
- **NO re-exports** - each import must use full path

```typescript
// ✅ CORRECT - Direct imports with full paths (NO 'src' in path)
import { Track } from '@spotify-to-plex/shared-types/common/Track';
import { getAccessToken } from '@spotify-to-plex/shared-utils/spotify/getAccessToken';

// ❌ FORBIDDEN - 'src' in import paths
import { Track } from '@spotify-to-plex/shared-types/src/common/Track';
import { getAccessToken } from '@spotify-to-plex/shared-utils/src/spotify/getAccessToken';

// ❌ FORBIDDEN - Barrel imports
import { Track } from '@spotify-to-plex/shared-types';
import { getAccessToken } from '@spotify-to-plex/shared-utils';
```

### Import Patterns
- **Full path imports** required - no barrel exports allowed
- **NO 'src' in import paths** - paths must exclude the 'src' directory
- **Grouped imports**: external libraries first, then internal modules
- **Type-only imports** when importing only types

```typescript
// ✅ CORRECT - Import organization with full paths (NO 'src' in path)
import { AxiosRequest } from '@spotify-to-plex/http-client/AxiosRequest';
import { generateError } from '@/helpers/errors/generateError';
import type { NextApiRequest, NextApiResponse } from 'next';
```

---

## Package Management

### Dependencies Standards
- **Use pnpm** as the package manager
- **Workspace dependencies** using `workspace:*` format
- **Peer dependencies** for shared packages appropriately
- **Separate dev dependencies** correctly

### Script Conventions
- **Consistent naming**: `build`, `dev`, `start`, `lint`, `type-check`
- **Workspace-aware scripts** using pnpm workspace commands
- **Build orchestration** with TypeScript project references

```json
{
    "scripts": {
        "build": "tsc --build",
        "build:packages": "tsc --build packages/*",
        "type-check": "pnpm -r run type-check",
        "lint": "npm run lint --workspaces --if-present"
    }
}
```

---

## Code Style and Formatting

### Indentation and Spacing
- **4-space indentation** consistently (enforced by ESLint)
- **No tabs** - spaces only
- **Consistent spacing** in object literals and function parameters

### Function Declaration Styles
- **Named function exports** for utilities and main functions
- **Arrow functions** for React event handlers (with useCallback)
- **Function declarations** for standalone functions

```typescript
// ✅ Utility functions - function declarations
export function compareTitles(a?: string, b?: string): boolean {
    // implementation
}

// ✅ React event handlers - arrow functions with useCallback
const onChangeInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
}, []);
```

---

## Code Quality Commands

### **ALWAYS Run These Commands Before Committing**

```bash
# Lint all code and fix auto-fixable issues
pnpm run lint

# Run TypeScript type checking across all packages  
pnpm run type-check
```

### ESLint Enforcement
The project uses strict ESLint rules that enforce all the patterns in this guide:

- **`react/jsx-no-bind`**: Forces useCallback for all event handlers
- **`react/jsx-no-leaked-render`**: Requires `!!` for conditional rendering
- **`@typescript-eslint/consistent-type-definitions`**: Enforces `type` over `interface`
- **4-space indentation** strictly enforced

### Pre-commit Checklist
1. ✅ `pnpm run lint` passes without errors
2. ✅ `pnpm run type-check` passes without errors  
3. ✅ All event handlers use useCallback
4. ✅ All conditional rendering uses `!!` coercion
5. ✅ One function per file for utilities

---

## Code Reuse and Duplication Prevention

### **CRITICAL: Search Before Creating**

Before implementing any new function or utility, you MUST search the existing codebase to prevent duplication:

**Required Search Process:**
1. **Search by function name** - Use Grep to find similar function names
2. **Search by functionality** - Look for functions that do similar operations
3. **Check domain directories** - Examine relevant utility directories first
4. **Review related files** - Check files in the same feature area

### Mandatory Pre-Implementation Checklist

```typescript
// ✅ REQUIRED - Search process before creating new function
// 1. Search for existing implementations
//    Grep: "formatDate", "dateFormat", "convertDate"
// 2. Check domain directories
//    Look in: utils/, date/, formatting/, helpers/
// 3. Review similar files
//    Check files that import date utilities
// 4. Only then create if truly needed

// If similar function exists - EXTEND or REFACTOR it
// If duplicate found - USE existing and remove duplicate
// If close match found - CONSOLIDATE into single function
```

### Anti-Duplication Rules

- **NEVER create duplicate functions** - always search first
- **CONSOLIDATE similar functions** - refactor into single, flexible implementation
- **EXTEND existing functions** - add parameters rather than create new functions
- **REMOVE redundant functions** - delete duplicates during refactoring
- **USE existing utilities** - don't reinvent common operations

### Examples

```typescript
// ❌ FORBIDDEN - Creating duplicate without searching
export function formatUserName(user: User): string {
    return `${user.firstName} ${user.lastName}`;
}

// Later in different file...
export function getUserFullName(user: User): string {
    return `${user.firstName} ${user.lastName}`;
}

// ✅ CORRECT - Single, well-named function
export function formatFullName(user: User): string {
    return `${user.firstName} ${user.lastName}`;
}
```

### Search Tools and Techniques

- **Use Grep extensively**: Search for function names, keywords, patterns
- **Check directory structure**: Navigate domain-specific directories
- **Review imports**: See what utilities other files are using
- **Use IDE search**: Global search for similar implementations
- **Check package exports**: Review what's available in shared packages

This prevents code bloat and ensures a clean, consolidated codebase.

---

## Fresh Rebuild Policy - NO Fallback/Legacy Code

### **CRITICAL: Complete Refactor Policy**

This project is undergoing a fresh rebuild with a strict **NO fallback/legacy code** policy:

- **NO fallback functions** - If refactoring changes a function signature, update ALL usage sites
- **NO legacy properties** - Remove old properties entirely when refactoring data structures  
- **NO compatibility layers** - Do not create wrappers for old implementations
- **NO deprecated code paths** - Remove old code completely rather than marking as deprecated
- **COMPLETE refactors ONLY** - When changing an implementation, change it everywhere at once

### Examples of Forbidden Patterns

```typescript
// ❌ FORBIDDEN - Fallback/compatibility functions
export function newFunction(data: NewType): Result {
    // implementation
}

export function oldFunction(data: OldType): Result {
    // Convert old to new format for compatibility
    return newFunction(convertOldToNew(data));
}

// ❌ FORBIDDEN - Fallback properties
export type Config = {
    newProperty: string;
    oldProperty?: string; // Keep for backward compatibility
}

// ❌ FORBIDDEN - Legacy code paths
function processData(input: any) {
    if (isNewFormat(input)) {
        return handleNewFormat(input);
    } else {
        // Legacy fallback
        return handleOldFormat(input);
    }
}
```

### Required Approach

```typescript
// ✅ CORRECT - Complete refactor, one implementation
export function processData(data: NewType): Result {
    // Single, clean implementation
    return handleNewFormat(data);
}

export type Config = {
    newProperty: string;
    // oldProperty completely removed
}
```

### Refactor Requirements

1. **Identify ALL usage sites** before changing any implementation
2. **Update ALL files simultaneously** in a single change
3. **Remove old code entirely** - do not comment out or mark as deprecated
4. **Update ALL type definitions** to use new structures
5. **Test the complete change** across the entire codebase

This ensures a clean, maintainable codebase without technical debt from legacy compatibility.

---

## Summary of Critical Requirements

### **MUST DO** (Enforced by ESLint - Will Break Build)
1. **useCallback for ALL event handlers** - zero exceptions
2. **`!!` for conditional rendering** - prevent render leaks
3. **errorBoundary for ALL async operations in React** - zero exceptions
4. **One function per file** for utilities
5. **Props destructuring** in components
6. **4-space indentation**
7. **Type over interface**
8. **Functional components only**
9. **NO 'src' in import paths** - exclude 'src' directory from all imports
10. **Complete refactors only** - NO fallback/legacy code allowed
11. **Search before creating** - MUST check for existing implementations first

### **SHOULD DO** (Best Practices)
1. Use React.memo for components with props
2. Use full path imports for all internal modules
3. Follow naming conventions strictly
4. Organize utilities by domain directories
5. Implement proper TypeScript typing

### **NEVER DO** (Forbidden)
1. Inline functions in JSX
2. Boolean conditions without explicit coercion
3. Class components
4. Interface declarations
5. Direct boolean evaluation in conditional rendering
6. Barrel files or index.ts exports
7. Re-export patterns (export * from)
8. Include 'src' in import paths
9. Create fallback/legacy code for compatibility
10. Create duplicate functions without searching existing codebase first

This comprehensive guide ensures consistency and quality across the entire Spotify-to-Plex codebase. All developers and AI code generators MUST follow these patterns without exception.