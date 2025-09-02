# Match Filter Conversion Utilities

This directory contains utilities to convert between expression string format and UI-friendly format for match filters, enabling dual-mode editing capabilities.

## Files

- `convertMatchFiltersJsonToUI.ts` - Convert expression strings to structured UI format
- `convertMatchFiltersUIToJson.ts` - Convert UI format back to expression strings
- `index.ts` - Export all functions and types
- `README.md` - This documentation

## Usage

```typescript
import { 
    convertMatchFiltersJsonToUI, 
    convertMatchFiltersUIToJson,
    validateUIMatchFilterConfig
} from '../utils/matchFilters';

// Convert expression to UI format
const uiConfig = convertMatchFiltersJsonToUI("artist:match AND title:contains");

// Validate UI configuration
const validation = validateUIMatchFilterConfig(uiConfig);

// Convert back to expression
const expression = convertMatchFiltersUIToJson(uiConfig);
```

## UI Format Structure

The UI format uses a hierarchical structure optimized for table/form editing:

```typescript
type UIMatchFilterConfig = {
    rules: UIMatchFilterRule[];
    globalCombinator?: 'AND' | 'OR'; // How multiple rules are combined
};

type UIMatchFilterRule = {
    id: string;
    conditions: UIMatchFilterCondition[];
    combinator: 'AND' | 'OR'; // How conditions within the rule are combined
    name?: string; // Display name
};

type UIMatchFilterCondition = {
    id: string;
    field: 'artist' | 'title' | 'album' | 'artistWithTitle' | 'artistInTitle';
    operation: 'match' | 'contains' | 'similarity';
    threshold?: number; // For similarity operations (0-1)
};
```

## Conversion Examples

### Simple AND Expression
**Input:** `"artist:match AND title:contains"`
**Output:** Single rule with two conditions joined by AND

### Simple OR Expression  
**Input:** `"artist:match OR title:match"`
**Output:** Two rules, each with one condition, joined by OR at global level

### Complex Expression
**Input:** `"artist:match AND title:contains OR album:similarity>=0.9"`
**Output:** Two rules joined by OR:
- Rule 1: artist:match AND title:contains
- Rule 2: album:similarity>=0.9

### Similarity with Threshold
**Input:** `"artist:similarity>=0.8"`
**Output:** Single condition with threshold value 0.8

## Features

- **Round-trip conversion** - Converting to UI and back preserves original meaning
- **Validation** - Built-in validation for UI format with detailed error messages
- **Type safety** - Full TypeScript type definitions
- **Error handling** - Graceful handling of malformed expressions
- **ID generation** - Automatic generation of unique IDs for UI components

## Testing

Run the test suite:
```bash
npx tsx tests/utils/matchFilters/matchFilters.test.ts
```

The tests verify:
- Conversion accuracy for various expression types
- Round-trip consistency
- Validation logic
- Edge cases (empty expressions, malformed input)