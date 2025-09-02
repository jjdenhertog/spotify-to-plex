# UI/JSON Editor Enhancement Proposal for Text Processing and Search Approaches Editors

## Executive Summary

This proposal outlines a **Lean & Clean** approach to enhance `TextProcessingEditor` and `SearchApproachesEditor` with UI/JSON toggle functionality, following the existing `MatchFilterEditor` pattern while respecting the project's coding guidelines.

## Current Architecture Analysis

### MatchFilterEditor Success Pattern

The `MatchFilterEditor` successfully implements:

1. **Toggle Infrastructure**: `viewMode` state with `ToggleButtonGroup` (UI/JSON modes)
2. **UI Components**: `TableEditor` + `PillEditor` for visual editing
3. **JSON Mode**: `MonacoJsonEditor` with schema validation
4. **Unified Save Logic**: Handles both modes with validation

### Data Structure Analysis

#### TextProcessingEditor Structure
```typescript
type TextProcessingConfig = {
    filterOutWords: string[];      // Words to remove when filtered=true
    filterOutQuotes: string[];     // Quote characters to remove when removeQuotes=true
    cutOffSeparators: string[];    // Separators to cut text at when trim=true
    processing: {
        filtered: boolean;
        cutOffSeperators: boolean;  // Note: typo preserved for compatibility
        removeQuotes: boolean;
    };
}
```
**UI Complexity**: Low - 3 string arrays + 3 boolean toggles

**Example Data**:
```json
{
  "filterOutWords": [
    "original mix", "radio edit", "single edit", "alternate mix",
    "remastered", "remaster", "single version", "retail mix", "quartet"
  ],
  "filterOutQuotes": ["'", "\"", "´", "`"],
  "cutOffSeparators": ["(", "[", "{", "-"]
}
```

#### SearchApproachesEditor Structure  
```typescript
type SearchApproachConfig = {
    id: string;           // Required
    filtered?: boolean;   // Optional flags
    trim?: boolean;
    removeQuotes?: boolean;
}[]
```
**UI Complexity**: Low - List of objects with 3 simple boolean flags

**Example Data**:
```json
[
  { "id": "normal", "filtered": false, "trim": false },
  { "id": "filtered", "filtered": true, "trim": false, "removeQuotes": true },
  { "id": "trimmed", "filtered": false, "trim": true },
  { "id": "filtered_trimmed", "filtered": true, "trim": true, "removeQuotes": true }
]
```

**Search Approach Behavior**:
- `filtered: true` → Uses `filterOutWords` to remove phrases like "remaster", "radio edit"
- `removeQuotes: true` → Uses `filterOutQuotes` to remove characters like `'`, `"`
- `trim: true` → Uses `cutOffSeparators` to cut text at characters like `(`, `[`, `-`

## Relationship Between Editors

### How Text Processing and Search Approaches Work Together

The **TextProcessingEditor** defines the rules and data, while **SearchApproachesEditor** defines when to apply them:

1. **Text Processing Configuration** → Defines the **WHAT**:
   - `filterOutWords`: What words/phrases to remove
   - `filterOutQuotes`: What quote characters to remove  
   - `cutOffSeparators`: What characters to cut text at

2. **Search Approaches Configuration** → Defines the **WHEN**:
   - `filtered: true` → Apply the `filterOutWords` rules
   - `removeQuotes: true` → Apply the `filterOutQuotes` rules
   - `trim: true` → Apply the `cutOffSeparators` rules

**Example Processing Flow**:
```
Original: "Song Title (Remaster)" 
├─ normal approach: filtered=false, trim=false → "Song Title (Remaster)"
├─ filtered approach: filtered=true, trim=false → "Song Title ()"  
├─ trimmed approach: filtered=false, trim=true → "Song Title "
└─ filtered_trimmed: filtered=true, trim=true → "Song Title"
```

Each search approach represents a different combination of text processing rules applied to find the best match.

## Implementation Strategy

### Core Principle: Lean & Clean
- **Minimal components** - reuse existing patterns
- **Compact layouts** - avoid excessive vertical space
- **Simple interactions** - no drag-and-drop complexity
- **Follow coding guidelines** - respect all established patterns

### 1. TextProcessingEditor UI Design

#### Layout Structure (Compact)
```
┌─ Text Processing Configuration ────────────────────────────┐
│  [UI Mode] [JSON Mode]                [Reset] [Save]       │
├────────────────────────────────────────────────────────────┤
│  ☑ Enable Word Filtering   ☑ Remove Quotes   ☑ Cut-off    │
├────────────────────────────────────────────────────────────┤
│  Filter Words: [original mix] [remaster] [+ Add Word]      │
│  Quotes:       ["] ['] [´] [`] [+ Add Quote]               │  
│  Separators:   [(] [[] [{] [-] [+ Add Separator]           │
└────────────────────────────────────────────────────────────┘
```

#### Required Components

**New Component: `StringArrayChipEditor`**
```typescript
// File: src/components/StringArrayChipEditor.tsx
type StringArrayChipEditorProps = {
    readonly label: string;
    readonly items: string[];
    readonly onChange: (items: string[]) => void;
    readonly placeholder?: string;
    readonly disabled?: boolean;
};

// Implementation follows CODING_GUIDELINES:
// - Default export for React component
// - useCallback for ALL event handlers  
// - Props destructuring required
// - !! for conditional rendering
```

**Features**:
- Display items as Material-UI `Chip` components with delete functionality
- `TextField` + "Add" button for new items
- Inline layout (horizontal) to save vertical space
- Validation to prevent empty/duplicate items

**Usage**:
```typescript
<StringArrayChipEditor 
    label="Filter Words"
    items={uiData.filterOutWords}
    onChange={handleFilterWordsChange}
    placeholder="Add word to filter (e.g., 'remaster')"
/>

<StringArrayChipEditor 
    label="Quote Characters"
    items={uiData.filterOutQuotes}
    onChange={handleFilterQuotesChange}
    placeholder="Add quote character (e.g., ')"
/>

<StringArrayChipEditor 
    label="Cut-off Separators"
    items={uiData.cutOffSeparators}
    onChange={handleCutOffSeparatorsChange}
    placeholder="Add separator (e.g., '(')"
/>
```

#### Data Conversion Logic
```typescript
// UI State Type
type TextProcessingUIData = {
    filterOutWords: string[];
    filterOutQuotes: string[];
    cutOffSeparators: string[];
    processing: {
        filtered: boolean;
        cutOffSeperators: boolean;
        removeQuotes: boolean;
    };
};

// Conversion functions (follow one-function-per-file rule)
// File: src/utils/textProcessing/convertTextProcessingJsonToUI.ts
export function convertTextProcessingJsonToUI(json: TextProcessingConfig): TextProcessingUIData {
    return json; // Direct mapping in this case
}

// File: src/utils/textProcessing/convertTextProcessingUIToJson.ts  
export function convertTextProcessingUIToJson(ui: TextProcessingUIData): TextProcessingConfig {
    return ui; // Direct mapping in this case
}
```

### 2. SearchApproachesEditor UI Design

#### Layout Structure (Compact)
```
┌─ Search Approaches Configuration ──────────────────────────┐
│  [UI Mode] [JSON Mode]                [Reset] [Save]       │
├────────────────────────────────────────────────────────────┤
│  ┌─ normal ────────────────────────────────────────── [×] ┐ │
│  │ ☐ Filtered  ☐ Trim  ☐ Remove Quotes                   │ │ 
│  └────────────────────────────────────────────────────────┘ │
│  ┌─ filtered ──────────────────────────────────────── [×] ┐ │
│  │ ☑ Filtered  ☐ Trim  ☑ Remove Quotes                   │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌─ trimmed ───────────────────────────────────────── [×] ┐ │
│  │ ☐ Filtered  ☑ Trim  ☐ Remove Quotes                   │ │
│  └────────────────────────────────────────────────────────┘ │
│  [+ Add Approach]                                           │
└────────────────────────────────────────────────────────────┘
```

#### Required Components

**New Component: `SearchApproachCard`**
```typescript  
// File: src/components/SearchApproachCard.tsx
type SearchApproachCardProps = {
    readonly approach: SearchApproachConfig;
    readonly onChange: (approach: SearchApproachConfig) => void;
    readonly onDelete: () => void;
    readonly disabled?: boolean;
};

// Features:
// - Paper/Card container with approach.id as title
// - TextField for editing approach.id
// - Row of FormControlLabel + Checkbox for: filtered, trim, removeQuotes
// - Delete button (IconButton with DeleteIcon)  
// - Compact horizontal layout for checkboxes
```

**Reuse Existing**: `Box`, `Paper`, `FormControlLabel`, `Checkbox`, `IconButton`, `TextField`

#### Data Conversion Logic
```typescript
// UI State matches JSON exactly (no conversion needed)
type SearchApproachUIData = SearchApproachConfig[];

// File: src/utils/searchApproaches/convertSearchApproachesJsonToUI.ts
export function convertSearchApproachesJsonToUI(json: SearchApproachConfig[]): SearchApproachUIData {
    return json; // Direct mapping
}

// File: src/utils/searchApproaches/convertSearchApproachesUIToJson.ts
export function convertSearchApproachesUIToJson(ui: SearchApproachUIData): SearchApproachConfig[] {
    return ui; // Direct mapping  
}
```

## Technical Implementation Details

### Shared Infrastructure

#### Reusable Hook: `useDualModeEditor`
```typescript
// File: src/hooks/useDualModeEditor.ts
// This hook centralizes the UI/JSON toggle logic used by all three editors

export function useDualModeEditor<TJson, TUI>(config: {
    readonly loadEndpoint: string;
    readonly saveEndpoint: string; 
    readonly validator: (data: TJson) => string | null;
    readonly jsonToUI: (json: TJson) => TUI;
    readonly uiToJSON: (ui: TUI) => TJson;
    readonly initialData: TJson;
}) {
    // Implementation follows CODING_GUIDELINES:
    // - errorBoundary for ALL async operations
    // - useCallback for ALL event handlers
    // - !! for conditional rendering checks
    // - Proper dependency arrays
}
```

#### Shared Header Component
```typescript
// File: src/components/EditorHeader.tsx  
type EditorHeaderProps = {
    readonly title: string;
    readonly viewMode: ViewMode;
    readonly onViewModeChange: (mode: ViewMode) => void;
    readonly onSave: () => void;
    readonly onReset: () => void;
    readonly disabled?: boolean;
};

// Reuses existing ToggleButtonGroup, Button components from MatchFilterEditor
```

### Component Structure Refactoring

#### TextProcessingEditor Refactoring
```typescript
// File: src/components/TextProcessingEditor.tsx
const TextProcessingEditor: React.FC<TextProcessingEditorProps> = ({ onSave }) => {
    // Use shared hook
    const {
        viewMode, 
        jsonData,
        uiData, 
        loading,
        validationError,
        handleViewModeChange,
        handleSave,
        handleReset,
        handleUIDataChange
    } = useDualModeEditor({
        loadEndpoint: '/api/plex/music-search-config/text-processing',
        saveEndpoint: '/api/plex/music-search-config/text-processing', 
        validator: validateTextProcessingConfig, // Import from existing validation
        jsonToUI: convertTextProcessingJsonToUI,
        uiToJSON: convertTextProcessingUIToJson,
        initialData: null
    });

    // Event handlers (MUST use useCallback per CODING_GUIDELINES)
    const handleProcessingSettingChange = useCallback((setting: keyof ProcessingSettings, value: boolean) => {
        handleUIDataChange({
            ...uiData,
            processing: { ...uiData.processing, [setting]: value }
        });
    }, [uiData, handleUIDataChange]);

    // Render logic with !! conditional rendering
    return (
        <Box>
            <EditorHeader 
                title="Text Processing Configuration"
                viewMode={viewMode}
                onViewModeChange={handleViewModeChange}
                onSave={handleSave}
                onReset={handleReset}
                disabled={loading}
            />
            
            {!!loading && <CircularProgress />}
            
            {viewMode === 'ui' ? (
                <Box sx={{ p: 2 }}>
                    {/* Boolean toggles row */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <FormControlLabel 
                            control={<Switch checked={uiData.processing.filtered} onChange={...} />}
                            label="Enable Word Filtering"
                        />
                        {/* More switches... */}
                    </Box>
                    
                    {/* String array editors */}
                    <StringArrayChipEditor 
                        label="Filter Words"
                        items={uiData.filterOutWords}
                        onChange={handleFilterWordsChange}
                    />
                    {/* More array editors... */}
                </Box>
            ) : (
                <MonacoJsonEditor 
                    ref={editorRef}
                    value={jsonData}
                    onChange={handleJSONDataChange}
                    schema={textProcessingSchema}
                    height={400}
                    error={validationError}
                />
            )}
        </Box>
    );
};

export default TextProcessingEditor;
```

#### SearchApproachesEditor Refactoring
```typescript
// File: src/components/SearchApproachesEditor.tsx
const SearchApproachesEditor: React.FC<SearchApproachesEditorProps> = ({ onSave }) => {
    // Use same shared hook pattern
    const { /* ... */ } = useDualModeEditor({
        loadEndpoint: '/api/plex/music-search-config/search-approaches',
        saveEndpoint: '/api/plex/music-search-config/search-approaches',
        validator: validateSearchApproaches, // Import from existing validation
        jsonToUI: convertSearchApproachesJsonToUI,
        uiToJSON: convertSearchApproachesUIToJson,
        initialData: []
    });

    // Event handlers for approach management
    const handleApproachChange = useCallback((index: number, newApproach: SearchApproachConfig) => {
        const newApproaches = [...uiData];
        newApproaches[index] = newApproach;
        handleUIDataChange(newApproaches);
    }, [uiData, handleUIDataChange]);

    const handleApproachDelete = useCallback((index: number) => {
        const newApproaches = uiData.filter((_, i) => i !== index);
        handleUIDataChange(newApproaches);
    }, [uiData, handleUIDataChange]);

    const handleAddApproach = useCallback(() => {
        const newApproach: SearchApproachConfig = {
            id: `approach-${Date.now()}`, // Generate unique ID
            filtered: false,
            trim: false,
            removeQuotes: false
        };
        handleUIDataChange([...uiData, newApproach]);
    }, [uiData, handleUIDataChange]);

    return (
        <Box>
            <EditorHeader 
                title="Search Approaches Configuration"
                viewMode={viewMode}
                onViewModeChange={handleViewModeChange}
                onSave={handleSave}
                onReset={handleReset}
                disabled={loading}
            />
            
            {viewMode === 'ui' ? (
                <Box sx={{ p: 2 }}>
                    {uiData.map((approach, index) => (
                        <SearchApproachCard
                            key={approach.id}
                            approach={approach}
                            onChange={(newApproach) => handleApproachChange(index, newApproach)}
                            onDelete={() => handleApproachDelete(index)}
                            disabled={loading}
                        />
                    ))}
                    
                    <Button 
                        onClick={handleAddApproach}
                        startIcon={<AddIcon />}
                        variant="outlined"
                        size="small"
                    >
                        Add Approach
                    </Button>
                </Box>
            ) : (
                <MonacoJsonEditor 
                    ref={editorRef}
                    value={jsonData}
                    onChange={handleJSONDataChange}
                    schema={searchApproachesSchema}
                    height={400}
                    error={validationError}
                />
            )}
        </Box>
    );
};

export default SearchApproachesEditor;
```

## File Structure (Following CODING_GUIDELINES)

### New Files Required

```
src/
├── components/
│   ├── EditorHeader.tsx              # Shared header for all editors
│   ├── StringArrayChipEditor.tsx     # String array editor with chips
│   └── SearchApproachCard.tsx        # Individual approach card
├── hooks/
│   └── useDualModeEditor.ts          # Shared dual-mode logic
└── utils/
    ├── textProcessing/
    │   ├── convertTextProcessingJsonToUI.ts
    │   └── convertTextProcessingUIToJson.ts
    └── searchApproaches/
        ├── convertSearchApproachesJsonToUI.ts
        └── convertSearchApproachesUIToJson.ts
```

### Import Patterns (NO 'src' in paths)
```typescript
// ✅ CORRECT - Full path imports without 'src'
import { EditorHeader } from '@/components/EditorHeader';
import { convertTextProcessingJsonToUI } from '@/utils/textProcessing/convertTextProcessingJsonToUI';
import { useDualModeEditor } from '@/hooks/useDualModeEditor';

// ❌ FORBIDDEN - 'src' in paths
import { EditorHeader } from '@/src/components/EditorHeader';
```

## Implementation Priority & Steps

### Step 1: Foundation Components (First)
1. Create `EditorHeader` component (reuse MatchFilterEditor pattern)
2. Create `useDualModeEditor` hook (extract common logic)
3. Create utility conversion functions (one function per file)

### Step 2: TextProcessingEditor Enhancement  
1. Create `StringArrayChipEditor` component
2. Refactor `TextProcessingEditor` to use dual-mode pattern
3. Test UI/JSON mode switching

### Step 3: SearchApproachesEditor Enhancement
1. Create `SearchApproachCard` component  
2. Refactor `SearchApproachesEditor` to use dual-mode pattern
3. Test approach management (add/edit/delete)

### Step 4: Integration & Polish
1. Ensure consistent styling across all editors
2. Validate error handling and edge cases
3. Verify all CODING_GUIDELINES compliance

## CODING_GUIDELINES Compliance Checklist

### MUST DO (Enforced)
- ✅ **useCallback for ALL event handlers** - zero exceptions
- ✅ **`!!` for conditional rendering** - prevent render leaks  
- ✅ **errorBoundary for ALL async operations** - in useDualModeEditor hook
- ✅ **One function per file** - conversion utils separated
- ✅ **Props destructuring** in all components
- ✅ **Default exports** for React components
- ✅ **NO 'src' in import paths** - all imports exclude 'src'
- ✅ **Complete refactors only** - no fallback/legacy code

### Component Patterns
- ✅ **Functional components only** - no class components
- ✅ **Type over interface** - all type definitions use `type`
- ✅ **Named exports for utilities** - conversion functions
- ✅ **errorBoundary wrapper** - for all async operations in components

### Anti-Patterns Avoided
- ❌ **NO inline functions in JSX** - all handlers use useCallback
- ❌ **NO barrel files** - each component imported with full path
- ❌ **NO direct boolean evaluation** - all conditionals use !!
- ❌ **NO duplicate functions** - reuse existing validation/patterns

## Success Metrics

1. **Code Consistency**: All new components follow established patterns
2. **Maintainability**: Shared logic reduces duplication across editors  
3. **User Experience**: Compact, intuitive UI modes for configuration
4. **Technical Debt**: Zero legacy code or compatibility layers introduced

## Conclusion

This proposal provides a **Lean & Clean** approach to enhance both editors with user-friendly interfaces while:

- **Respecting CODING_GUIDELINES**: Every implementation detail follows established patterns
- **Reusing existing components**: Material-UI components and established patterns
- **Maintaining simplicity**: No complex drag-and-drop or excessive features
- **Ensuring consistency**: Shared components and hooks across all editors
- **Following one-function-per-file**: All utilities properly separated

The modular design enables incremental implementation and maintains the codebase's high quality standards. Each component is designed to be maintainable, testable, and consistent with the project's architectural principles.