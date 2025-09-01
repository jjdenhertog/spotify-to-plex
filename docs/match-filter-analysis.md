# Match Filter Expression Analysis & Pill UI Implementation Plan

## Current Architecture Analysis

### 1. Expression Format & Structure

The current system uses a **simplified string-based expression format** with the following pattern:

```typescript
// Type Definition
export type MatchFilterRule = string; // e.g., "artist:match AND title:contains"

// Examples from the code:
"artist:match"
"artist:match AND title:contains" 
"title:similarity>=0.8 OR album:contains"
```

### 2. Supported Fields
- **`artist`** - Artist name matching
- **`title`** - Track title matching  
- **`album`** - Album name matching
- **`artistWithTitle`** - Combined artist and title
- **`artistInTitle`** - Artist name found in title

### 3. Supported Operations
- **`:match`** - Exact match required
- **`:contains`** - Partial match (substring)
- **`:similarity>=X`** - Similarity threshold (0-1), e.g., `:similarity>=0.8`

### 4. Combinators
- **`AND`** - Both conditions must be true
- **`OR`** - Either condition can be true

### 5. Component Data Flow

```
MatchFilterEditorFixed (Container)
├── ViewMode Toggle (UI vs JSON)
├── TableEditor (UI Mode)
│   └── ExpressionInput (per filter)
│       ├── Autocomplete with suggestions
│       ├── Real-time validation
│       └── CustomOption/CustomPaper for display
└── MonacoJsonEditor (JSON Mode)
```

### 6. State Management Patterns

**MatchFilterEditorFixed.tsx:**
- Manages `jsonData` as the source of truth (array of strings)
- Converts between formats for UI display
- Handles save/load operations via API
- Uses `errorBoundary` wrapper for all async operations

**TableEditor.tsx:**
- Receives `MatchFilterRule[]` (strings) as props
- Simple CRUD operations (add/delete/modify filters)
- Uses memoized handlers following React best practices

**ExpressionInput.tsx:**
- Complex autocomplete with context-aware suggestions
- Real-time syntax validation with error reporting
- Debounced input with `inputValue` state separate from `value` prop

### 7. Material-UI Components Currently Used

```typescript
// From TableEditor.tsx
import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Tooltip, Button } from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';

// From ExpressionInput.tsx  
import { TextField, Autocomplete, Paper, Typography, Alert, Box } from '@mui/material';

// From CustomOption.tsx
import { Box, Chip, Typography } from '@mui/material';

// From MatchFilterEditorFixed.tsx
import { Box, Button, Typography, ToggleButtonGroup, ToggleButton, Paper, Divider } from '@mui/material';
import { Refresh, Save, TableChart, Code } from '@mui/icons-material';
```

### 8. Validation Logic

**ExpressionInput validation pattern:**
```typescript
const conditionPattern = /^(artist|title|album|artistWithTitle|artistInTitle):(match|contains|similarity(>=\d*\.?\d+)?)$/;
```

**MatchFilterEditorFixed validation:**
```typescript 
const validFieldPattern = /^(artist|title|album|artistWithTitle|artistInTitle):(match|contains|similarity>=\\d*\\.?\\d+)(\\s+(AND|OR)\\s+(artist|title|album|artistWithTitle|artistInTitle):(match|contains|similarity>=\\d*\\.?\\d+))*$/;
```

### 9. Event Handler Patterns

All components follow the **CODING_GUIDELINES.md** requirements:
- **ALL event handlers use `useCallback`** (enforced by ESLint)
- **Props destructuring** in component definitions
- **`errorBoundary`** wrapper for async operations
- **`!!` explicit boolean coercion** for conditional rendering

### 10. Architecture Strengths

1. **Clean separation**: UI editing vs raw JSON editing modes
2. **Type safety**: Strong TypeScript typing throughout
3. **Validation**: Real-time syntax checking with helpful error messages  
4. **Autocomplete**: Context-aware suggestions with categorization
5. **Consistent patterns**: Follows project coding guidelines strictly
6. **Error handling**: Centralized error boundary usage

## Recommendations for Pill UI Implementation

### 1. Preserve Existing Architecture

The current architecture is well-structured and should be **extended, not replaced**. The pill UI should be an **additional view mode** alongside the current table and JSON modes.

### 2. Expression Parsing Strategy

Create a dedicated parser utility that converts string expressions to a structured format for pill display:

```typescript
// Recommended parser utility structure
export type ParsedExpression = {
  conditions: ParsedCondition[];
  combinators: CombinatorType[];
};

export type ParsedCondition = {
  field: FieldType;
  operation: OperationType; 
  threshold?: number;
  displayText: string; // For pill labels
};

// Parser function
export function parseExpression(expression: string): ParsedExpression;
export function expressionToPills(parsed: ParsedExpression): PillData[];
export function pillsToExpression(pills: PillData[]): string;
```

### 3. Pill Component Architecture

```typescript
// Pill UI Components (following CODING_GUIDELINES.md patterns)
PillEditor.tsx              // Main container (similar to TableEditor.tsx)
├── PillContainer.tsx       // Visual pill container with drag/drop
├── FilterPill.tsx          // Individual pill component  
├── PillAddButton.tsx       // Add new pills interface
└── PillEditDialog.tsx      // Edit pill properties dialog
```

### 4. Material-UI Component Recommendations

Based on existing usage patterns, use:
- **`Chip`** - Already used in CustomOption.tsx, perfect for pills
- **`Box`** - For layout (heavily used throughout)
- **`Paper`** - For pill containers (consistent with existing design)
- **`IconButton`** - For delete/edit actions (matches TableEditor pattern)
- **`Dialog`** - For pill editing (follows Material-UI patterns)
- **`Autocomplete`** - Reuse existing autocomplete logic for adding pills

### 5. State Management Pattern

Follow the **exact same pattern** as TableEditor.tsx:

```typescript
type PillEditorProps = {
    readonly filters: MatchFilterRule[];  // Keep same interface
    readonly onChange: (filters: MatchFilterRule[]) => void;
    readonly disabled?: boolean;
};

// Internal state for pill representation
const [pillData, setPillData] = useState<PillData[]>([]);

// Convert between string expressions and pill data
const handlePillChange = useCallback((newPills: PillData[]) => {
    const newExpressions = newPills.map(pillsToExpression);
    onChange(newExpressions); // Keep same interface contract
}, [onChange]);
```

### 6. Integration with Existing Components

**Minimal changes required:**
1. **MatchFilterEditorFixed.tsx**: Add "Pill Mode" to the toggle button group
2. **TableEditor.tsx**: No changes needed
3. **ExpressionInput.tsx**: No changes needed  

The pill editor should be a **drop-in replacement** for TableEditor in UI mode.

### 7. Drag & Drop Implementation

Use `react-beautiful-dnd` (if not already included) or native HTML drag API:
- **Reorder pills** within the same expression
- **Drag pills between expressions** for complex reorganization
- **Visual feedback** during drag operations
- **Accessibility support** with keyboard navigation

### 8. Pill Visual Design

Follow the **existing Chip usage** in CustomOption.tsx:
- **Category-based coloring**: Different colors for field/operation/combinator
- **Size consistency**: Use 'small' size to match existing components  
- **Icon integration**: Use Material-UI icons for actions (edit, delete)
- **Hover states**: Consistent with existing button hover patterns

### 9. Error Handling & Validation

**Reuse existing validation logic:**
- Parse pills back to string expressions
- Run through existing `validateExpression` function
- Display errors in the same Alert format as ExpressionInput.tsx
- Highlight invalid pills with error styling

### 10. Accessibility Considerations

Following project patterns:
- **Proper ARIA labels** for all interactive elements
- **Keyboard navigation** for pill selection/editing
- **Screen reader support** with descriptive text
- **High contrast** pill styling for visibility

## Implementation Priority

1. **Phase 1**: Create basic pill parser utilities
2. **Phase 2**: Build core pill components (FilterPill, PillContainer)  
3. **Phase 3**: Implement PillEditor with CRUD operations
4. **Phase 4**: Add drag & drop functionality
5. **Phase 5**: Integrate with MatchFilterEditorFixed toggle
6. **Phase 6**: Polish UI and add advanced features

This approach ensures **minimal disruption** to the existing, well-architected system while providing a modern pill-based UI that enhances user experience.