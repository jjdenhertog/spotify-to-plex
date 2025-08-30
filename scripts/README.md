# JSX Restyling Tools

## Overview

This directory contains tools for automatically reformatting JSX/TSX components based on prop count and complexity.

## Scripts

### `jsx-restyler.js` - Primary Restyling Tool
Main implementation with comprehensive JSX parsing and reformatting capabilities.

**Features:**
- Formats components with ≤6 props to single line
- Preserves complex formatting (multi-line sx objects, spread operators)
- Handles both self-closing and components with children
- Recursive directory processing
- Comprehensive error handling

**Usage:**
```bash
# Process single file
node jsx-restyler.js path/to/Component.tsx

# Process entire directory
node jsx-restyler.js ../apps/web/src/components

# Show help
node jsx-restyler.js --help
```

### `jsx-restyler-v2.js` - Enhanced Version
Improved parsing with better regex patterns and validation.

**Improvements:**
- More accurate prop counting
- Better handling of complex objects
- Enhanced validation
- Cleaner single-line formatting

### `apply-restyling.js` - Application Tool
Convenience script for applying restyling to the entire web application.

**Features:**
- Dry run mode to preview changes
- Processes apps/web/src directory
- Comprehensive reporting
- Safe file handling with backups

**Usage:**
```bash
# Preview changes (dry run)
node apply-restyling.js --dry-run

# Apply changes
node apply-restyling.js

# Show help
node apply-restyling.js --help
```

### `jsx-parser-utils.js` - Utility Functions
Advanced JSX parsing utilities for complex use cases.

**Features:**
- AST-like parsing capabilities
- Token-based component analysis
- Validation utilities
- Configuration presets

### Testing Scripts

- `jsx-restyler-test.js` - Basic unit tests
- `test-real-components.js` - Tests against real project components

## Reformatting Rules

### Single Line Format (≤6 props)
```jsx
// Before
<Button
    variant="contained"
    color="primary"
    onClick={handleClick}
    disabled={loading}
    size="small"
>
    Save
</Button>

// After  
<Button variant="contained" color="primary" onClick={handleClick} disabled={loading} size="small">Save</Button>
```

### Multi-Line Format (>6 props or complex)
```jsx
// Preserved (>6 props)
<TextField
    id="name"
    label="Name"
    value={value}
    onChange={onChange}
    variant="outlined"
    fullWidth
    required
    error={hasError}
    helperText={errorText}
/>

// Preserved (complex sx)
<Box
    sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    }}
>
```

### Special Cases Preserved

1. **Multi-line sx objects**
2. **Spread operators** (`{...props}`)
3. **Arrow function props** (`onClick={() => doSomething()}`)
4. **Comments in props**
5. **Very long object values** (>80 characters)

## Package Configuration

The `package.json` includes convenient npm scripts:

```bash
npm test                    # Run tests
npm run format             # Format current directory
npm run format:components  # Format components directory
npm run format:pages       # Format pages directory
npm run format:all         # Format entire src directory
```

## Integration with Git

**Recommended workflow:**
1. Run dry run to preview changes
2. Apply reformatting
3. Review with `git diff`
4. Commit changes with descriptive message

## Error Handling

- Safe file processing with try-catch
- Validation of JSX syntax
- Backup creation for destructive operations
- Comprehensive error reporting

## Performance

- Efficient regex-based parsing
- Minimal memory footprint
- Fast processing of large codebases
- Concurrent file processing support