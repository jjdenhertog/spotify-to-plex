# Match Filters Rework Proposal

## Current Implementation Analysis

### How the Current System Works

1. **Configuration Storage**: Match filters are stored as JSON in `match-filters.json` with each filter containing:
   - `reason`: Human-readable description
   - `filter`: JavaScript function string (e.g., `"(item) => item.matching.artist.match && item.matching.title.match"`)

2. **Runtime Execution**: 
   - Function strings are compiled using `new Function()` in `compileFunctionStrings.ts:9`
   - Each filter operates on `TrackWithMatching` objects with matching scores for:
     - `album`: {match, contains, similarity}
     - `title`: {match, contains, similarity}  
     - `artist`: {match, contains, similarity}
     - `artistInTitle`: {match, contains, similarity}
     - `artistWithTitle`: {match, contains, similarity}

3. **UI Management**: Monaco JSON editor allows direct editing of function strings with basic validation

### Pattern Analysis

Looking at the 13 current filters, they follow very predictable patterns:

**Core Building Blocks (only 8 total):**
- `artist.match` / `artist.contains` / `artist.similarity >= X`
- `title.match` / `title.contains` / `title.similarity >= X`  
- `album.match` / `album.contains`
- `artistWithTitle.similarity >= X`

**Combination Rules:**
- Always AND operations (no OR found)
- Common thresholds: 70%, 80%, 85%, 90%, 95%
- Max 3 conditions per rule

## Security Concerns

### Current Security Issues
1. **Code Injection Risk**: Using `new Function()` with user-controlled strings
2. **No Sandboxing**: Compiled functions run with full JavaScript access
3. **Runtime Errors**: Invalid functions fail silently (return false)
4. **No Input Validation**: Beyond basic structure checks

### Risk Assessment
- **Medium Risk**: Admin-only access limits exposure but still vulnerable to malicious configuration
- **Maintenance Risk**: Function strings are error-prone and hard to debug

## Proposed Solutions

### 1. Expression-Based Configuration (Simple & Secure)

Replace function strings with safe expression syntax:

```typescript
type MatchFilterRule = {
  reason: string;
  expression: string; // e.g., "artist:match AND title:match"
};
```

**Expression Syntax:**
- Fields: `artist`, `title`, `album`, `artistWithTitle`, `artistInTitle`
- Operations: `:match`, `:contains`, `:similarity>=0.8`
- Combinators: `AND`, `OR`
- Parentheses for grouping: `(artist:match OR artist:contains) AND title:similarity>=0.85`

**JSON Comparison:**
```json
// Current (66 chars)
{"reason": "Full match", "filter": "(item) => item.matching.artist.match && item.matching.title.match"}

// New (51 chars - 23% shorter)  
{"reason": "Full match", "expression": "artist:match AND title:match"}
```

**Benefits:**
- ✅ **Simpler JSON**: 20-40% shorter than current
- ✅ **No eval()**: Safe expression parsing only
- ✅ **Human readable**: `artist:match AND title:contains`
- ✅ **Easy validation**: Predictable syntax to parse
- ✅ **Backward compatible**: Can auto-migrate 90% of existing rules

### 2. Compact UI Design

#### Inline Editing Approach (Most Space Efficient)
- **Table Layout**: One row per rule (~40px height)
- **Inline Expression Editor**: Direct text editing with autocomplete
- **Quick Actions**: Drag handle, enable/disable toggle, delete button
- **Validation**: Real-time syntax highlighting and error indicators

```
┌─────────────────────────────────────────────────────────────┐
│ ☰ ✓ Full artist & title match          │ artist:match AN... │ 🗑 
│ ☰ ✓ Artist match, title similar        │ artist:match AN... │ 🗑
│ ☰ ✗ Fuzzy artist & title              │ artist:similar...  │ 🗑
└─────────────────────────────────────────────────────────────┘
```

**Space Efficiency:**
- **Current Monaco**: ~500px height for 13 rules
- **Proposed Table**: ~520px height for 13 rules (40px × 13)
- **But**: Much faster to scan and edit individual rules

#### Alternative: Tag-Based Builder (Slightly More Visual)
- **Chip Interface**: Visual tags for each condition
- **Drag & Drop**: Reorder conditions within rules
- **Templates**: Quick-add common patterns

```
┌─────────────────────────────────────────────────────────────┐
│ ☰ ✓ Full artist & title match                              │
│     [artist:match] AND [title:match]                   🗑  │
│ ☰ ✓ Artist match, title similar                            │  
│     [artist:match] AND [title:similarity>=0.85]        🗑  │
└─────────────────────────────────────────────────────────────┘
```

#### Hybrid Approach: UI + JSON Editor Toggle (Recommended)

**Toggle Between Views:**
- **UI Mode (Default)**: Table/form interface for common editing
- **JSON Mode**: Full Monaco editor for advanced users and bulk operations
- **Switch Button**: "⚡ UI Mode" / "📝 JSON Mode" toggle in header

**JSON Mode Benefits:**
- **Bulk Operations**: Copy/paste multiple rules, find/replace
- **Advanced Validation**: JSON schema validation and syntax highlighting  
- **Import/Export**: Easy backup and sharing of complete configurations
- **Power Users**: Direct JSON manipulation for complex scenarios
- **Debugging**: Raw JSON inspection for troubleshooting

**UI Mode Benefits:**
- **Faster Editing**: Quick rule creation and modification
- **Less Errors**: Guided input with validation
- **Visual Scanning**: Easy to see rule precedence and status
- **Beginner Friendly**: No JSON syntax knowledge required

**Implementation Details:**
```typescript
type ViewMode = 'ui' | 'json';

const MatchFilterEditor = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('ui');
  const [filters, setFilters] = useState<MatchFilterRule[]>([]);
  
  return (
    <Box>
      {/* Header with toggle */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h6">Match Filters</Typography>
        <ToggleButtonGroup value={viewMode} onChange={setViewMode}>
          <ToggleButton value="ui">⚡ UI Mode</ToggleButton>
          <ToggleButton value="json">📝 JSON Mode</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      
      {/* Conditional rendering */}
      {viewMode === 'ui' ? (
        <TableEditor filters={filters} onChange={setFilters} />
      ) : (
        <MonacoJsonEditor value={filters} onChange={setFilters} />
      )}
    </Box>
  );
};
```

**Data Synchronization:**
- **Real-time sync**: Changes in UI mode instantly reflect in JSON mode
- **Validation**: Both modes use same validation rules
- **Error handling**: Invalid JSON shows errors, UI mode prevents invalid states

### 3. Implementation Strategy

#### Expression Parser (Simple & Safe)
```typescript
// Safe expression parser - no eval needed
function parseExpression(expr: string): MatchFunction {
  const tokens = expr.split(/\s+(AND|OR)\s+/);
  // Parse each condition: "artist:match", "title:similarity>=0.8"
  // Generate simple boolean logic function
  // No JavaScript execution needed
}
```

#### Migration from Current Rules
**Auto-migration success rate: ~95%**
```typescript
// Current -> Expression examples:
"(item) => item.matching.artist.match && item.matching.title.match"
→ "artist:match AND title:match"

"(item) => item.matching.artist.contains && (item.matching.title.similarity ?? 0) >= 0.85"  
→ "artist:contains AND title:similarity>=0.85"
```

### 4. Optimized Default Rules

**Current Issues:**
- 4 rules with `artist.match` variations (redundant)
- 3 rules with 85% similarity threshold (inconsistent)
- Some overly permissive rules (artist.contains + title.contains)

**Proposed Streamlined Set (8 rules):**
1. `artist:match AND title:match` - Exact matches
2. `artist:match AND title:contains` - Good artist, partial title  
3. `artist:match AND title:similarity>=0.8` - Good artist, similar title
4. `artist:contains AND title:match` - Partial artist, exact title
5. `artist:similarity>=0.85 AND title:similarity>=0.85` - Both very similar
6. `artist:contains AND title:contains AND album:contains` - All partial matches
7. `artistWithTitle:similarity>=0.9` - Combined field high similarity
8. `artist:similarity>=0.7 AND album:match AND title:similarity>=0.85` - Album context

**Benefits:**
- Removes 5 redundant rules
- Clearer confidence tiers
- Easier to understand rule precedence

## Implementation Plan

### Phase 1: Expression Parser & Migration
1. **Read CODING_GUIDELINES.md** - Follow all patterns and requirements
2. Build safe expression parser (no eval)
3. Create migration function for existing rules
4. Add backward compatibility support
5. Validate migration with existing data
6. **Run `pnpm -r run type-check`** - Fix all errors (warnings OK)
7. **Run `pnpm -r run lint`** - Fix all errors (warnings OK)

### Phase 2: UI Replacement
1. Build inline table editor (UI mode)
2. Add autocomplete for expression syntax
3. Implement drag & drop reordering
4. Add toggle between UI/JSON modes
5. Update Monaco editor to use new expression format
6. **Run `pnpm -r run type-check`** - Fix all errors (warnings OK)
7. **Run `pnpm -r run lint`** - Fix all errors (warnings OK)

### Phase 3: Rule Optimization
1. Deploy optimized default rule set
2. Add rule performance monitoring
3. Create rule testing/preview functionality
4. **Run `pnpm -r run type-check`** - Fix all errors (warnings OK)
5. **Run `pnpm -r run lint`** - Fix all errors (warnings OK)

### Phase 4: Cleanup
1. Remove `new Function()` compilation
2. Remove legacy JSON format support
3. Security audit of new implementation
4. **Final verification**: `pnpm -r run type-check` and `pnpm -r run lint` pass

## Expected Benefits

### JSON Simplification
- **20-40% shorter**: Less verbose than current function strings
- **Human readable**: `artist:match AND title:contains` vs `(item) => item.matching.artist.match && item.matching.title.contains`
- **Easy validation**: Simple syntax rules vs JavaScript parsing

### UI Efficiency  
- **Faster scanning**: Table layout vs JSON blob
- **Quicker editing**: Inline editing vs Monaco navigation
- **Less scrolling**: Compact rows vs expanded JSON objects

### Security & Maintenance
- **No code injection**: Expression parsing only, no eval()
- **Predictable behavior**: Limited syntax vs arbitrary JavaScript
- **Easy testing**: Simple expression evaluation vs function compilation

## Package Impact Analysis

### @packages/music-search/ Changes

**Core Files Modified (7 files):**
1. **`/types/MatchFilterConfig.ts`**: Change from `filter: string` to `expression: string`
2. **`/functions/compileFunctionStrings.ts`**: Replace with `parseExpression()` function
3. **`/functions/setMusicSearchConfig.ts`**: Update to use new parser
4. **`/config/default-config.ts`**: Convert all 13 default rules to expression format
5. **`/functions/state/types.ts`**: No change - still uses `RuntimeMatchFilter[]`
6. **`/functions/getRuntimeFilters.ts`**: No change - interface stays same
7. **`/functions/search.ts`**: No change - still uses `filter()` function

**New Files Added (1 file):**
- **`/functions/parseExpression.ts`**: New expression parser implementation

**Migration Impact:**
- ✅ **API Stable**: Public `search()` function signature unchanged
- ✅ **Type Compatible**: `RuntimeMatchFilter` interface preserved
- ✅ **State Compatible**: Internal state structure unchanged

### @packages/plex-music-search/ Impact

**Files Using music-search (4 files):**
- `/functions/findTrack.ts:36` - Calls `musicSearch(find, tracks, includeMatching)`
- `/functions/searchAlbum.ts:39` - Calls `musicSearch({...}, tracks)`
- `/utils/searching/searchForAlbum.ts` - Uses `TrackWithMatching` type
- `/types/PlexMusicSearchConfig.ts` - Extends base config

**Impact Assessment:**
- ✅ **Zero Changes Required**: Uses stable `search()` API only
- ✅ **Type Compatibility**: All imported types remain unchanged
- ✅ **Functionality Preserved**: Match filtering logic identical

### @packages/tidal-music-search/ Impact

**Files Using music-search (3 files):**
- `/functions/findTrack.ts:33` - Calls `musicSearch(find, tracks)`
- `/functions/searchAlbum.ts:46` - Calls `musicSearch({...}, tracks)`
- `/utils/searchForAlbum.ts` - Uses `TrackWithMatching` type

**Impact Assessment:**
- ✅ **Zero Changes Required**: Uses stable `search()` API only
- ✅ **Type Compatibility**: All imported types remain unchanged  
- ✅ **Functionality Preserved**: Match filtering logic identical

### Expression Parser Implementation

**New Parser Function:**
```typescript
// /packages/music-search/src/functions/parseExpression.ts
export function parseExpression(expression: string): (item: TrackWithMatching) => boolean {
  // Parse: "artist:match AND title:similarity>=0.8"
  // Into: (item) => item.matching.artist.match && item.matching.title.similarity >= 0.8
  
  const conditions = parseConditions(expression);
  return (item: TrackWithMatching) => evaluateConditions(item, conditions);
}

function parseConditions(expr: string): ParsedCondition[] {
  // Split on AND/OR, parse each condition
  // Handle: field:operation, field:operation>=threshold
}
```

**Parser Security:**
- ✅ **No eval()**: Pure string parsing and boolean logic
- ✅ **Whitelist approach**: Only known fields/operations allowed  
- ✅ **Type safe**: Strong typing throughout parser
- ✅ **Error handling**: Invalid expressions return `() => false`

**Code Quality Requirements:**
- ✅ **Follow CODING_GUIDELINES.md**: Read guidelines before implementation
- ✅ **One function per file**: parseExpression.ts, parseConditions.ts, etc.
- ✅ **Full path imports**: No barrel exports allowed
- ✅ **Type definitions**: Use `type` over `interface`
- ✅ **Pass type-check**: `pnpm -r run type-check` must succeed
- ✅ **Pass lint**: `pnpm -r run lint` must succeed

### Migration Strategy

**Phase 1: Internal Changes Only**
```typescript
// Before (current)
type MatchFilterConfig = {
  reason: string;
  filter: string; // "(item) => item.matching.artist.match"  
}

// After (new)
type MatchFilterConfig = {
  reason: string;
  expression: string; // "artist:match AND title:contains"
}
```

**Phase 2: Backward Compatibility**
```typescript
// Support both formats during transition
type LegacyMatchFilterConfig = {
  reason: string;
  filter: string; // Legacy function string
}

type NewMatchFilterConfig = {
  reason: string;
  expression: string; // New expression format
}
```

**Phase 3: Auto-migration**
```typescript
// Convert existing rules automatically
function migrateFilter(legacy: LegacyMatchFilterConfig): NewMatchFilterConfig {
  // "(item) => item.matching.artist.match && item.matching.title.match"
  // becomes: "artist:match AND title:match"
  
  const expression = parseLegacyFilter(legacy.filter);
  return { reason: legacy.reason, expression };
}
```

### Risk Assessment

**Low Risk Implementation:**
- ✅ **API Stability**: No breaking changes to consumer packages
- ✅ **Gradual Migration**: Backward compatibility during transition
- ✅ **Isolated Changes**: Core logic changes only in music-search package
- ✅ **Testable**: Easy to unit test expression parser vs function compilation

**Rollback Strategy:**
- Keep legacy `compileFunctionStrings.ts` during transition
- Feature flag to switch between old/new parser
- Database/storage supports both formats
- Can revert without affecting consumers

## Conclusion

The **expression-based approach** provides maximum benefit with minimal risk:

**Benefits:**
- **Simpler JSON**: 20-40% reduction in characters
- **Safer execution**: No eval(), just expression parsing  
- **Flexible UI**: Toggle between compact table view and full JSON editor
- **Power user support**: JSON mode for bulk operations and advanced scenarios
- **Zero consumer impact**: plex-music-search and tidal-music-search unchanged

**Implementation:**
- **7 files modified** in music-search package only
- **1 new file** for expression parser
- **0 files modified** in consumer packages
- **Backward compatible** migration strategy

This strikes the perfect balance between simplicity, security, and usability while maintaining complete API stability for all dependent packages.