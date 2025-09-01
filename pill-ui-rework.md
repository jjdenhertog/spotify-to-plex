# Match Filters Pill UI Rework

## Overview

Transform the current text-based expression input into an intuitive, visual pill-based interface for match filter creation. This approach maintains the clean expression format internally while providing a user-friendly drag-and-drop style interface.

## Current State Analysis

### Current UI Implementation
- **TableEditor**: Uses `ExpressionInput` component with autocomplete
- **Expression Format**: Direct text input like `"artist:match AND title:contains"`
- **User Experience**: Requires knowledge of syntax, prone to typos
- **Current Space**: Single text field per row taking full width

### Current Expression Support
- **Fields**: `artist`, `title`, `album`, `artistWithTitle`, `artistInTitle`
- **Operations**: `:match`, `:contains`, `:similarity>=X`
- **Combinators**: Only `AND` (no OR support needed)
- **Thresholds**: `0.7`, `0.8`, `0.85`, `0.9` for similarity

## Proposed Pill UI Design

### Visual Layout (Simplified)
```
┌─────────────────────────────────────────────────────────────────┐
│ Filter 1: [Artist: match] [Title: contains] [+] [🗑]           │
├─────────────────────────────────────────────────────────────────┤
│ Filter 2: [Artist: similarity≥85%] [Album: match] [+] [🗑]     │
├─────────────────────────────────────────────────────────────────┤
│ Filter 3: [Artist: ?] [+] [🗑]                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Key Insight**: AND connectors are **implicit** between pills - no need for explicit `[AND]` pills!

### Pill Types & Behavior

#### 1. Field Pills (Clickable) - Using Material-UI Chip
- **Component**: `<Chip>` from `@mui/material` (already used in codebase)
- **Appearance**: `[Artist: match]` with Material-UI styling
- **States**:
  - **Configured**: `[Artist: match]` - fully configured with solid background
  - **Unconfigured**: `[Artist: ?]` - needs operation selection with dashed border
- **Click Action**: Opens operation selection popup
- **Styling**: `variant="outlined"` for configured, `variant="outlined"` with custom dashed styling for unconfigured

#### 2. Add Pills (Clickable) - Material-UI Chip
- **Component**: `<Chip>` with `variant="outlined"`
- **Appearance**: `[+ Add Field]` with dashed border styling
- **Click Action**: Opens field selection popup
- **Position**: After all field pills in each row

#### 3. Delete Action - Material-UI IconButton
- **Component**: `<IconButton>` (already used in TableEditor)
- **Appearance**: `[🗑]` icon button at row end
- **Click Action**: Remove entire filter rule

## Popup Interactions

### Field Selection Popup
When clicking `[+]` add pill:
```
┌─────────────────────┐
│ Choose Field        │
├─────────────────────┤
│ ○ Artist            │
│ ○ Title             │
│ ○ Album             │
│ ○ Artist with Title │
│ ○ Artist in Title   │
└─────────────────────┘
```

### Operation Selection Popup
When clicking field pill (e.g., `[Artist: ?]`):
```
┌─────────────────────┐
│ Artist Matching     │
├─────────────────────┤
│ ○ Exact Match       │
│ ○ Contains          │
│ ○ Similarity        │
│   ○ 70%   ○ 80%    │
│   ● 85%   ○ 90%    │
└─────────────────────┘
```

**Similarity Options**:
- Radio buttons for common thresholds: 70%, 75%, 80%, 85%, 90%, 95%
- Selected threshold shown in pill: `[Artist: similarity≥85%]`

## User Experience Flow

### Creating a New Filter
1. User clicks "Add Filter Rule" button
2. New row appears with: `[Artist: ?] [+ Add Field] [🗑]`
3. User clicks `[Artist: ?]` → selects operation → becomes `[Artist: match]`
4. User clicks `[+ Add Field]` → selects field → adds `[Title: ?]` (AND is implicit)
5. User clicks `[Title: ?]` → selects operation → becomes `[Title: contains]`
6. Final result: `[Artist: match] [Title: contains] [+ Add Field] [🗑]`

### Modifying Existing Filter
1. User clicks any configured pill (e.g., `[Artist: match]`)
2. Operation popup opens with current selection highlighted
3. User changes selection → pill updates immediately
4. Expression string updates in real-time

### Adding More Conditions
1. User clicks `[+ Add Field]` after existing conditions
2. Field selection popup opens
3. New condition added automatically (AND is implicit between all pills)

## Technical Implementation

### Component Architecture

#### New Components to Create
```typescript
// Main pill-based editor replacing ExpressionInput
PillEditor: React.FC<{
  value: string;           // "artist:match AND title:contains"
  onChange: (value: string) => void;
  disabled?: boolean;
}>

// Individual field pill component using Material-UI Chip
FieldPill: React.FC<{
  field: string;           // "artist", "title", etc.
  operation?: string;      // "match", "contains", "similarity>=0.85"
  onClick: () => void;
  configured: boolean;     // true = "artist:match", false = "artist:?"
  disabled?: boolean;
}>

// Add new field pill using Material-UI Chip
AddPill: React.FC<{
  onClick: () => void;
  disabled?: boolean;
}>

// Field selection popup
FieldSelectorPopup: React.FC<{
  open: boolean;
  onClose: () => void;
  onSelect: (field: string) => void;
  availableFields: string[];
}>

// Operation selection popup
OperationSelectorPopup: React.FC<{
  open: boolean;
  onClose: () => void;
  field: string;           // "artist" for context
  currentOperation?: string;
  onSelect: (operation: string) => void;
}>
```

#### Data Flow Strategy

**Option 1: Expression-First (Recommended)**
- Internal state: expression string `"artist:match AND title:contains"`
- Parse to pills on render: `parseExpressionToPills(expression)`
- Update expression on pill changes: `pillsToExpression(pills)`
- Pro: Maintains current clean architecture
- Pro: JSON mode compatibility automatic

**Option 2: Object-First**
- Internal state: structured objects
- Convert to expression on save: `objectsToExpression(objects)`
- Pro: More explicit pill state management
- Con: Additional conversion layer

### Implementation Files

#### Core Components (3 new files)
```typescript
// /apps/web/src/components/PillEditor.tsx
// Main component replacing ExpressionInput in TableEditor

// /apps/web/src/components/pills/FieldPill.tsx
// Individual field pill component using Material-UI Chip

// /apps/web/src/components/pills/AddPill.tsx
// Add new field button component using Material-UI Chip
```

#### Popup Components (2 new files)
```typescript
// /apps/web/src/components/popups/FieldSelectorPopup.tsx
// Field selection popup (artist, title, etc.)

// /apps/web/src/components/popups/OperationSelectorPopup.tsx
// Operation selection popup (match, contains, similarity)
```

#### Utilities (2 new files)
```typescript
// /apps/web/src/utils/expressionToPills.ts
// Parse expression string to pill data structure

// /apps/web/src/utils/pillsToExpression.ts
// Convert pill data structure to expression string
```

### Expression Parsing Logic

#### Expression → Pills Parsing (Simplified)
```typescript
// Input: "artist:match AND title:contains"
// Output: [
//   { field: "artist", operation: "match", type: "field" },
//   { field: "title", operation: "contains", type: "field" }
// ]
// Note: AND connectors are implicit - not stored as separate pills

type PillData = 
  | { type: "field"; field: string; operation?: string }
  | { type: "add" };

function parseExpressionToPills(expression: string): PillData[] {
  if (!expression.trim()) return [{ type: "field", field: "artist" }];
  
  // Split by AND and filter out the "AND" tokens - we only need the conditions
  const conditions = expression.split(/\s+AND\s+/);
  const pills: PillData[] = [];
  
  conditions.forEach((condition) => {
    const [field, operation] = condition.split(":");
    pills.push({ type: "field", field: field?.trim() || "", operation: operation?.trim() });
  });
  
  return pills;
}
```

#### Pills → Expression Conversion (Simplified)
```typescript
function pillsToExpression(pills: PillData[]): string {
  return pills
    .filter(pill => pill.type === "field" && pill.operation) // Only complete field pills
    .map(pill => `${pill.field}:${pill.operation}`)
    .join(" AND "); // Automatically join with AND
}
```

### Visual Design Specifications

#### Material-UI Chip Based Design
```typescript
// Field Pills - Configured state
<Chip
  variant="outlined"
  size="small"
  label="Artist: match"
  onClick={handleFieldPillClick}
  sx={{
    mr: 1,
    mb: 0.5,
    backgroundColor: 'primary.50', // Light blue background
    borderColor: 'primary.300',
    '&:hover': {
      backgroundColor: 'primary.100',
      transform: 'translateY(-1px)',
    }
  }}
/>

// Field Pills - Unconfigured state  
<Chip
  variant="outlined"
  size="small"
  label="Artist: ?"
  onClick={handleFieldPillClick}
  sx={{
    mr: 1,
    mb: 0.5,
    backgroundColor: 'grey.50',
    borderColor: 'grey.400',
    borderStyle: 'dashed',
    color: 'grey.600',
    '&:hover': {
      backgroundColor: 'grey.100',
    }
  }}
/>

// Add Pills
<Chip
  variant="outlined"
  size="small"
  label="+ Add Field"
  onClick={handleAddPillClick}
  sx={{
    mr: 1,
    mb: 0.5,
    backgroundColor: 'transparent',
    borderColor: 'primary.300',
    borderStyle: 'dashed',
    color: 'primary.600',
    '&:hover': {
      backgroundColor: 'primary.50',
    }
  }}
/>
```

#### Popup Styling (Material-UI Based)
```typescript
// Use Material-UI Popover/Dialog components with Menu/MenuItem
<Popover
  open={open}
  anchorEl={anchorEl}
  onClose={onClose}
  anchorOrigin={{
    vertical: 'bottom',
    horizontal: 'left',
  }}
>
  <Box sx={{ minWidth: 200, maxHeight: 300, p: 1 }}>
    {fields.map((field) => (
      <MenuItem
        key={field.value}
        onClick={() => handleSelect(field.value)}
        selected={field.value === selectedField}
        sx={{
          borderRadius: 1,
          mb: 0.5,
          '&.Mui-selected': {
            backgroundColor: 'primary.50',
            color: 'primary.700',
          }
        }}
      >
        <ListItemText 
          primary={field.label}
          secondary={field.description}
        />
      </MenuItem>
    ))}
  </Box>
</Popover>
```

## Integration with Existing Code

### TableEditor Updates
```typescript
// Replace ExpressionInput with PillEditor
<TableCell sx={{ width: '100%' }}>
  <PillEditor 
    value={filter} 
    onChange={createExpressionChangeHandler(index)} 
    disabled={disabled}
  />
</TableCell>
```

### Maintain JSON Mode Compatibility
- PillEditor works with same expression strings
- JSON mode continues to work unchanged
- Switch between UI/JSON modes seamlessly

## Implementation Strategy

### Phase 1: Core Pill Components (Week 1)
1. **Create base pill components** (FieldPill, AddPill using Material-UI Chip)
2. **Build simplified parsing utilities** (expressionToPills, pillsToExpression - no connector logic needed)
3. **Basic PillEditor container** with static pill rendering
4. **Unit tests** for parsing utilities

### Phase 2: Interactive Functionality (Week 1-2)
1. **Field selection popup** with all available fields
2. **Operation selection popup** with radio buttons for similarity
3. **Click handlers** for pill interactions
4. **Add/remove pill functionality**

### Phase 3: Integration & Polish (Week 2)
1. **Replace ExpressionInput** in TableEditor with PillEditor
2. **Styling and animations** for smooth user experience
3. **Edge case handling** (empty states, validation)
4. **Accessibility** (keyboard navigation, screen reader support)

### Phase 4: Testing & Refinement (Week 2-3)
1. **End-to-end testing** with existing filter configurations
2. **Performance optimization** for large filter sets
3. **User experience refinements** based on testing
4. **Documentation updates**

## Expected Benefits

### User Experience Improvements
- **Visual Clarity**: Clear separation of fields, operations, and combinators
- **Reduced Errors**: No syntax mistakes possible with guided UI
- **Faster Editing**: Click-to-configure vs typing expressions
- **Intuitive Flow**: Natural left-to-right reading pattern

### Developer Benefits
- **Maintainable**: Clear component separation and responsibilities
- **Testable**: Individual pill components easily unit tested
- **Flexible**: Easy to add new fields or operations
- **Compatible**: Works with existing expression format

### Technical Advantages
- **Clean Architecture**: Maintains expression-based internal format
- **JSON Compatibility**: Seamless switching between UI and JSON modes
- **Type Safety**: Strong TypeScript typing throughout
- **Performance**: Efficient re-rendering with React memo optimizations

## File Changes Summary

### New Files (7 files)
- `/apps/web/src/components/PillEditor.tsx`
- `/apps/web/src/components/pills/FieldPill.tsx` (using Material-UI Chip)
- `/apps/web/src/components/pills/AddPill.tsx` (using Material-UI Chip)
- `/apps/web/src/components/popups/FieldSelectorPopup.tsx` (using Material-UI Popover/Menu)
- `/apps/web/src/components/popups/OperationSelectorPopup.tsx` (using Material-UI Popover/Menu)
- `/apps/web/src/utils/expressionToPills.ts` (simplified - no connector logic)
- `/apps/web/src/utils/pillsToExpression.ts` (simplified - auto-join with AND)

### Modified Files (1 file)
- `/apps/web/src/components/TableEditor.tsx` - Replace ExpressionInput with PillEditor

### Removed Files (0 files)
- ExpressionInput.tsx remains for potential fallback/advanced mode

## Quality Requirements

### Code Standards (Following CODING_GUIDELINES.md)
- ✅ **One component per file**: Each pill component in separate file
- ✅ **Full path imports**: No barrel exports, explicit imports
- ✅ **Type over interface**: Use type definitions consistently
- ✅ **useCallback for handlers**: Memoized event handlers
- ✅ **Functional components**: React.FC with proper typing

### Testing Requirements
- ✅ **Unit tests**: Expression parsing utilities
- ✅ **Component tests**: Pill interactions and state changes
- ✅ **Integration tests**: Full filter creation workflow
- ✅ **Type checking**: `pnpm -r run type-check` passes
- ✅ **Linting**: `pnpm -r run lint` passes

### Accessibility Requirements
- ✅ **Keyboard navigation**: Tab through pills, enter to open popups
- ✅ **Screen reader support**: Proper ARIA labels and descriptions
- ✅ **Focus management**: Clear focus indicators and logical flow
- ✅ **Color contrast**: Meet WCAG AA standards

## Conclusion

The pill-based UI approach transforms the match filter configuration from a text-based syntax challenge into an intuitive, visual workflow. By maintaining the expression format internally, we preserve all existing functionality while dramatically improving the user experience.

**Key Value Propositions:**
- **Zero Learning Curve**: Visual interface requires no syntax knowledge
- **Error Prevention**: Impossible to create invalid expressions
- **Faster Workflows**: Click-based configuration vs typing
- **Clean Architecture**: Maintains existing expression-based backend
- **Material-UI Integration**: Uses existing design system and components
- **Simplified Logic**: No complex connector management - AND is implicit
- **Future Extensible**: Easy to add new fields or operation types

This implementation balances user experience improvements with technical simplicity, following the "lean & clean" philosophy while leveraging the existing Material-UI design system for consistency and maintainability.