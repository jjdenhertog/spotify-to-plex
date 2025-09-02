# Task 0: Setup Structure and Create Placeholders

## Objective
Restructure the music search configuration page to support 4 tabs, create placeholder components, and establish the foundation for the enhanced system.

## Context  
Before implementing individual features, we need to reorganize the existing `music-search-config.tsx` page to support the new 4-tab structure and remove the old SearchAnalyzer from its current location.

## Implementation Requirements

### 1. Add URL-Based Tab Routing

We'll implement URL routing so each tab is accessible via direct URLs:
- `/plex/music-search-config` → Default to "How It Works" tab
- `/plex/music-search-config?tab=how-it-works` → How It Works tab
- `/plex/music-search-config?tab=processing` → Text Processing & Search Approaches tab
- `/plex/music-search-config?tab=match-filters` → Match Filters tab  
- `/plex/music-search-config?tab=test` → Test Configuration tab

### 2. Update Main Configuration Page Structure

**File**: `pages/plex/music-search-config.tsx`

#### Add URL Routing Logic
First, add the necessary imports and routing logic at the top of the component:

```typescript
import { useRouter } from 'next/router';
import { useEffect, useCallback } from 'react';

// Add this type definition
type TabKey = 'how-it-works' | 'processing' | 'match-filters' | 'test';

const Page: NextPage = () => {
    const router = useRouter();
    const [tabValue, setTabValue] = useState(0);
    
    // Tab mapping
    const tabKeyToIndex: Record<TabKey, number> = {
        'how-it-works': 0,
        'processing': 1,
        'match-filters': 2,
        'test': 3
    };
    
    const indexToTabKey: Record<number, TabKey> = {
        0: 'how-it-works',
        1: 'processing', 
        2: 'match-filters',
        3: 'test'
    };

    // Initialize tab from URL on component mount
    useEffect(() => {
        const urlTab = router.query.tab as TabKey;
        if (urlTab && tabKeyToIndex[urlTab] !== undefined) {
            setTabValue(tabKeyToIndex[urlTab]);
        } else {
            // Default to first tab and update URL
            router.replace('/plex/music-search-config?tab=how-it-works', undefined, { shallow: true });
        }
    }, [router]);

    // Update URL when tab changes
    const handleTabChange = useCallback((_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
        const tabKey = indexToTabKey[newValue];
        router.push(`/plex/music-search-config?tab=${tabKey}`, undefined, { shallow: true });
    }, [router, indexToTabKey]);
```

#### Modify Tab Structure  
Replace the existing 3-tab system with 4 tabs using URL routing:

```typescript
// Replace existing tabs (lines 186-190) with:
<Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }} variant="scrollable" scrollButtons="auto">
    <Tab label="How It Works" />
    <Tab label="Text Processing & Search Approaches" />
    <Tab label="Match Filters" />
    <Tab label="Test Configuration" />
</Tabs>
```

#### Update Tab Content Rendering
Replace the existing tab content (lines 192-218) with new structure:

```typescript
{/* How It Works Tab */}
{tabValue === 0 && (
    <Card>
        <CardContent>
            <HowItWorksTab />
        </CardContent>
    </Card>
)}

{/* Text Processing & Search Approaches Tab - COMBINED */}
{tabValue === 1 && (
    <Card>
        <CardContent>
            <TextProcessingAndSearchEditor />
        </CardContent>
    </Card>
)}

{/* Match Filters Tab */}
{tabValue === 2 && (
    <Card>
        <CardContent>
            <MatchFilterEditor />
        </CardContent>
    </Card>
)}

{/* Test Configuration Tab */}
{tabValue === 3 && (
    <Card>
        <CardContent>
            <TestConfigurationTab />
        </CardContent>
    </Card>
)}
```

#### Add New Component Imports
Add these imports at the top of the file (around line 2-6):

```typescript
import { useRouter } from 'next/router';
import { useEffect, useCallback } from 'react'; // Add to existing React imports
import HowItWorksTab from "@/components/HowItWorksTab";
import TextProcessingAndSearchEditor from "@/components/TextProcessingAndSearchEditor";
import TestConfigurationTab from "@/components/TestConfigurationTab";
// Keep existing imports:
import MatchFilterEditor from "@/components/MatchFilterEditor";
// Remove these imports (will be integrated into combined editor):
// import SearchApproachesEditor from "@/components/SearchApproachesEditor"; 
// import TextProcessingEditor from "@/components/TextProcessingEditor";
```

### 3. Create Placeholder Components

Create these placeholder components that will be implemented in subsequent tasks:

#### HowItWorksTab Placeholder
**File**: `src/components/HowItWorksTab.tsx`

```typescript
import { Box, Typography, Paper } from '@mui/material';

export default function HowItWorksTab() {
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
                How Music Search Configuration Works
            </Typography>
            <Paper variant="outlined" sx={{ p: 3, bgcolor: 'grey.50' }}>
                <Typography variant="body1">
                    📋 This educational overview will explain how Text Processing, Search Approaches, 
                    and Match Filters work together to find the best matches between Spotify and Plex tracks.
                </Typography>
                <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
                    🚧 Implementation coming in Task 1
                </Typography>
            </Paper>
        </Box>
    );
}
```

#### TextProcessingAndSearchEditor Placeholder
**File**: `src/components/TextProcessingAndSearchEditor.tsx`

```typescript
import { Box, Typography, Paper } from '@mui/material';

export default function TextProcessingAndSearchEditor() {
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
                Text Processing & Search Approaches Configuration
            </Typography>
            <Paper variant="outlined" sx={{ p: 3, bgcolor: 'grey.50' }}>
                <Typography variant="body1">
                    🔧 This combined editor will allow you to configure both text processing rules 
                    and search approaches with UI/JSON toggle functionality.
                </Typography>
                <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
                    🚧 Implementation coming in Task 2
                </Typography>
            </Paper>
        </Box>
    );
}
```

#### TestConfigurationTab Placeholder  
**File**: `src/components/TestConfigurationTab.tsx`

```typescript
import { Box, Typography, Paper } from '@mui/material';

export default function TestConfigurationTab() {
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
                Test Your Configuration
            </Typography>
            <Paper variant="outlined" sx={{ p: 3, bgcolor: 'grey.50' }}>
                <Typography variant="body1">
                    🧪 This integrated testing interface will allow you to test your configuration 
                    changes immediately with real Spotify tracks and see the matching process in detail.
                </Typography>
                <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
                    🚧 Implementation coming in Task 4
                </Typography>
            </Paper>
        </Box>
    );
}
```

### 4. Remove Old SearchAnalyzer Page

#### Delete the old search analyzer page
**File to remove**: `pages/spotify/search-analyzer.tsx`

This file should be completely removed as the SearchAnalyzer component will be moved to the TestConfigurationTab.

#### Update navigation (if needed)
Check if there are any navigation links pointing to `/spotify/search-analyzer` and remove them. Common places to check:
- Navigation components
- Menu systems  
- Home page links

### 5. Create Shared Infrastructure Placeholders

These will be implemented in subsequent tasks but create placeholders for organization:

#### Shared Hook Placeholder
**File**: `src/hooks/useDualModeEditor.ts`

```typescript
import { useState, useCallback } from 'react';

// Placeholder for shared dual-mode editor logic
// This will be implemented in Task 2
export function useDualModeEditor() {
    const [viewMode, setViewMode] = useState<'ui' | 'json'>('ui');
    
    const handleViewModeChange = useCallback(() => {
        // Implementation coming in Task 2
    }, []);
    
    return {
        viewMode,
        handleViewModeChange
    };
}
```

#### Shared Component Placeholders
**File**: `src/components/EditorHeader.tsx`

```typescript
import { Box, Typography } from '@mui/material';

type EditorHeaderProps = {
    readonly title: string;
};

export default function EditorHeader({ title }: EditorHeaderProps) {
    return (
        <Box sx={{ mb: 2 }}>
            <Typography variant="h6">{title}</Typography>
            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                🚧 Shared header implementation coming in Task 3
            </Typography>
        </Box>
    );
}
```

### 6. Update Page Description

In `pages/plex/music-search-config.tsx`, update the description text (around line 163-165):

```typescript
<Typography variant="body1" sx={{ mb: 2, maxWidth: 600 }}>
    Configure how the system matches songs between Spotify and Plex. Use the "How It Works" tab 
    to understand the system, then configure your settings and test them immediately.
</Typography>
```

### 7. CODING_GUIDELINES.md Compliance

#### Required Patterns for All Files
- ✅ **Default exports** for React components  
- ✅ **Functional components** only (no class components)
- ✅ **Props destructuring** where props are used
- ✅ **useCallback** for event handlers (will be implemented in later tasks)
- ✅ **!! conditional rendering** (will be implemented in later tasks)
- ✅ **4-space indentation** throughout

#### File Organization
- ✅ **PascalCase file naming** - All component files use PascalCase
- ✅ **NO 'src' in import paths** - All imports use @/components pattern
- ✅ **One component per file** - Each file contains only one component

## Testing the Changes

### 1. Verify Tab Structure and URL Routing
After implementing these changes:
1. Navigate to `/plex/music-search-config` → Should default to "How It Works" tab and redirect to `?tab=how-it-works`
2. Verify 4 tabs appear: "How It Works", "Text Processing & Search Approaches", "Match Filters", "Test Configuration"
3. Click each tab and verify:
   - URL updates to correct `?tab=` parameter
   - Placeholder content loads for each tab
   - Browser back/forward buttons work correctly
4. Test direct URL access:
   - `/plex/music-search-config?tab=processing` → Should load processing tab
   - `/plex/music-search-config?tab=match-filters` → Should load match filters tab
   - `/plex/music-search-config?tab=test` → Should load test tab
   - `/plex/music-search-config?tab=invalid` → Should default to first tab
5. Verify no console errors

### 2. Verify Old Page Removal
1. Confirm `/spotify/search-analyzer` returns 404 (page removed)
2. Check for any broken navigation links

### 3. Build and Lint Check
```bash
# Ensure no build errors
pnpm run type-check
pnpm run lint
```

## Acceptance Criteria

### Functional Requirements
1. **4-tab structure** loads correctly with placeholder content
2. **URL routing** works for all tabs with proper query parameters
3. **Tab navigation** works smoothly with URL updates
4. **Direct URL access** allows bookmarking and sharing specific tabs
5. **Browser navigation** (back/forward) works correctly
6. **Existing functionality** (Match Filters tab) still works
7. **Old search analyzer page** is properly removed

### Technical Requirements
1. **Zero ESLint errors** following CODING_GUIDELINES.md
2. **TypeScript compliance** with proper types
3. **No broken imports** or missing components
4. **Clean build** without warnings

### Code Organization
1. **Placeholder components** provide clear implementation roadmap
2. **File structure** follows established patterns
3. **Import paths** use correct format without 'src'
4. **Consistent naming** across all new files

## Implementation Notes

### Why This Task First?
1. **Establishes structure** for all subsequent tasks
2. **Allows parallel development** - other tasks can be implemented independently
3. **Immediate feedback** - users can see the new structure immediately
4. **Risk mitigation** - Structural changes are easier to debug when isolated
5. **URL accessibility** - Makes tabs bookmarkable and shareable from day one

### Rollback Plan
If issues arise:
1. Revert `pages/plex/music-search-config.tsx` to original 3-tab structure
2. Remove placeholder component files
3. Restore `pages/spotify/search-analyzer.tsx` if needed

This foundation task makes all subsequent tasks clean and focused on their specific functionality.