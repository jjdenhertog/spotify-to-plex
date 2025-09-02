# Task 3: Enhance Match Filters Editor with Shared Components

## Objective
Update the existing MatchFilterEditor to use the shared components and infrastructure created in Task 2, ensuring consistency across all editors.

## Context
The MatchFilterEditor already has UI/JSON toggle functionality and works well. This task focuses on refactoring it to use the shared `EditorHeader` component and `useDualModeEditor` hook for consistency, without breaking existing functionality.

## Current Implementation Analysis

The existing MatchFilterEditor has:
- ✅ Working UI/JSON toggle with `ToggleButtonGroup`
- ✅ `TableEditor` and `PillEditor` components for UI mode
- ✅ `MonacoJsonEditor` for JSON mode  
- ✅ Validation and save/reset functionality
- ✅ Proper error handling with `errorBoundary`

## Implementation Requirements

### 1. Refactor to Use Shared Components

#### Update MatchFilterEditor to Use EditorHeader
**File**: `src/components/MatchFilterEditor.tsx`

Replace the existing header section (lines 188-226) with the shared `EditorHeader` component:

```typescript
// Remove the existing header Box and replace with:
<EditorHeader
    title="Match Filters Configuration"
    viewMode={viewMode}
    onViewModeChange={handleViewModeChange}
    onSave={handleSaveClick}
    onReset={handleResetClick}
    disabled={loading}
/>
```

#### Add EditorHeader Import
Add to imports (around line 18):
```typescript
import EditorHeader from '@/components/EditorHeader';
```

#### Update handleViewModeChange Signature
The existing handler needs to match the EditorHeader expected signature:

```typescript
// Current signature:
const handleViewModeChange = useCallback((_event: React.MouseEvent<HTMLElement>, newMode: ViewMode | null) => {
    if (newMode) {
        setViewMode(newMode);
    }
}, []);

// This should work as-is, but verify the event type matches EditorHeader
```

### 2. Optional: Migrate to useDualModeEditor Hook

**Note**: This is optional since the current implementation works well. Only implement if you want full consistency.

If migrating to use the shared hook, you would need to:

1. **Create conversion functions** following one-function-per-file rule:

**File**: `src/utils/matchFilters/convertMatchFiltersJsonToUI.ts`
```typescript
import { MatchFilterRule } from '@/types/MatchFilterTypes';

export function convertMatchFiltersJsonToUI(json: MatchFilterRule[]): MatchFilterRule[] {
    return json; // Direct mapping for match filters
}
```

**File**: `src/utils/matchFilters/convertMatchFiltersUIToJson.ts`
```typescript
import { MatchFilterRule } from '@/types/MatchFilterTypes';

export function convertMatchFiltersUIToJson(ui: MatchFilterRule[]): MatchFilterRule[] {
    return ui; // Direct mapping for match filters
}
```

2. **Replace existing state management** with the hook:

```typescript
// Remove existing state and handlers, replace with:
const {
    viewMode,
    jsonData,
    uiData: expressionFilters,
    loading,
    validationError,
    editorRef,
    loadData,
    handleSave,
    handleReset,
    handleViewModeChange,
    handleUIDataChange
} = useDualModeEditor<MatchFilterRule[], MatchFilterRule[]>({
    loadEndpoint: '/api/plex/music-search-config/match-filters',
    saveEndpoint: '/api/plex/music-search-config/match-filters',
    validator: validateFilters, // Use existing validation function
    jsonToUI: convertMatchFiltersJsonToUI,
    uiToJSON: convertMatchFiltersUIToJson,
    initialData: []
});
```

3. **Update TableEditor onChange handler**:
```typescript
const handleTableChange = useCallback((newFilters: MatchFilterRule[]) => {
    handleUIDataChange(newFilters);
}, [handleUIDataChange]);
```

### 3. Maintain Existing Functionality

#### Keep UI Mode Description
Ensure the existing description remains:
```typescript
{viewMode === 'ui' ? (
    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Add filter expressions to match tracks. Filters are evaluated in order - the first matching filter wins.
    </Typography>
) : (
    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Edit raw JSON for advanced configurations. Each filter should have a 'reason' and 'expression' property. 
        Filters are evaluated in order - the first matching filter wins.
    </Typography>
)}
```

#### Keep Existing Schema
Maintain the current `matchFilterSchema` for JSON mode validation.

#### Preserve TableEditor and PillEditor Integration
Keep all existing UI mode functionality with `TableEditor` and `PillEditor` components.

### 4. Clean Up Redundant Code

After implementing shared components, remove any duplicate code:

1. **Remove duplicate header styling** if replaced with EditorHeader
2. **Remove duplicate button handlers** if using shared hook
3. **Keep domain-specific logic** like `convertToExpressionFormat` and `expressionFilters` useMemo

### 5. Update Imports

Ensure proper imports following CODING_GUIDELINES.md:

```typescript
// Add new imports:
import EditorHeader from '@/components/EditorHeader';

// If using shared hook:
import { useDualModeEditor } from '@/hooks/useDualModeEditor';
import { convertMatchFiltersJsonToUI } from '@/utils/matchFilters/convertMatchFiltersJsonToUI';
import { convertMatchFiltersUIToJson } from '@/utils/matchFilters/convertMatchFiltersUIToJson';

// Keep existing imports as needed:
import MonacoJsonEditor, { MonacoJsonEditorHandle } from './MonacoJsonEditor';
import TableEditor from './TableEditor';
import { MatchFilterRule, ViewMode } from '../types/MatchFilterTypes';
```

## Implementation Strategy

### Approach 1: Minimal Changes (Recommended)
1. **Only replace the header** with shared `EditorHeader` component
2. **Keep all existing logic** for state management and data handling
3. **Test thoroughly** to ensure no regression

### Approach 2: Full Migration (Optional)
1. **Migrate to shared hook** for complete consistency
2. **Create conversion utility functions** (following one-function-per-file rule)
3. **Update all handlers** to use shared patterns
4. **Extensive testing** required

## CODING_GUIDELINES.md Compliance

### Required Patterns (Already Compliant)
- ✅ **useCallback for ALL event handlers** - Already implemented
- ✅ **!! for conditional rendering** - Already implemented  
- ✅ **errorBoundary for ALL async operations** - Already implemented
- ✅ **Props destructuring** - Already implemented
- ✅ **Default export** - Already implemented

### New Requirements
- ✅ **NO 'src' in import paths** - Update any imports if needed
- ✅ **One function per file** - For any new conversion utilities
- ✅ **Shared components** - Use EditorHeader consistently

## Testing Requirements

### Functional Testing
1. **UI/JSON toggle** works exactly as before
2. **Save/Reset functionality** maintains existing behavior
3. **Validation** works for both UI and JSON modes
4. **TableEditor and PillEditor** integration unchanged
5. **All existing features** work without regression

### Visual Testing  
1. **Header styling** matches other editors (if using EditorHeader)
2. **Button placement** and sizing consistent
3. **No layout shifts** or visual regressions
4. **Responsive behavior** maintained

### Integration Testing
1. **Tab switching** works smoothly
2. **Data persistence** across mode changes
3. **Error handling** displays correctly
4. **Performance** no degradation

## Acceptance Criteria

### Functional Requirements
1. **Zero regression** - All existing functionality works exactly as before
2. **Consistent UI** - Header matches other editors if using EditorHeader
3. **Shared components** - Uses common infrastructure where appropriate

### Technical Requirements
1. **Zero ESLint errors** - Follows all CODING_GUIDELINES.md patterns
2. **TypeScript compliance** - Proper types throughout
3. **Import consistency** - No 'src' in import paths
4. **Code reuse** - Uses shared components appropriately

### Code Quality
1. **No duplicate code** - Remove redundant styling/handlers if applicable
2. **Consistent patterns** - Matches other editors' implementation style
3. **Maintainable** - Clear separation of concerns

## Implementation Notes

### Risk Mitigation
- **Test extensively** since this editor is already working well
- **Consider minimal changes first** (only EditorHeader) before full migration
- **Keep backup** of original implementation during refactoring

### Benefits
- **Visual consistency** across all editors
- **Shared maintenance** - Updates to EditorHeader benefit all editors
- **Code reduction** - Less duplicate header/button code

### File Changes Summary
```
Modified:
- src/components/MatchFilterEditor.tsx (update to use shared components)

New (if creating conversion utilities):  
- src/utils/matchFilters/convertMatchFiltersJsonToUI.ts
- src/utils/matchFilters/convertMatchFiltersUIToJson.ts
```

This task ensures the MatchFilterEditor is consistent with the other enhanced editors while maintaining its proven functionality.