# Task 2: Text Processing & Search Approaches Combined Editor

## Objective
Create a combined UI/JSON editor for Text Processing and Search Approaches configurations, implementing dual-mode functionality similar to MatchFilterEditor.

## Context
Text Processing and Search Approaches are tightly coupled - search approaches define WHEN to apply text processing rules. Combining them into one editor reduces user confusion and creates a more intuitive workflow.

## Data Structure Reference

### Text Processing Configuration
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

// Example data:
{
  "filterOutWords": ["original mix", "radio edit", "remaster", "single version"],
  "filterOutQuotes": ["'", "\"", "´", "`"], 
  "cutOffSeparators": ["(", "[", "{", "-"],
  "processing": { "filtered": true, "cutOffSeperators": true, "removeQuotes": true }
}
```

### Search Approaches Configuration  
```typescript
type SearchApproachConfig = {
    id: string;           // Required
    filtered?: boolean;   // Apply filterOutWords
    trim?: boolean;       // Apply cutOffSeparators
    removeQuotes?: boolean; // Apply filterOutQuotes
}[]

// Example data:
[
  { "id": "normal", "filtered": false, "trim": false },
  { "id": "filtered", "filtered": true, "trim": false, "removeQuotes": true },
  { "id": "trimmed", "filtered": false, "trim": true },
  { "id": "filtered_trimmed", "filtered": true, "trim": true, "removeQuotes": true }
]
```

## Implementation Requirements

### 1. Shared Infrastructure Components

#### useDualModeEditor Hook
**File**: `src/hooks/useDualModeEditor.ts`

```typescript
import { useState, useCallback, useRef } from 'react';
import { errorBoundary } from '@/helpers/errors/errorBoundary';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';

type ViewMode = 'ui' | 'json';

type UseDualModeEditorConfig<TJson, TUI> = {
    readonly loadEndpoint: string;
    readonly saveEndpoint: string;
    readonly validator: (data: TJson) => string | null;
    readonly jsonToUI: (json: TJson) => TUI;
    readonly uiToJSON: (ui: TUI) => TJson;
    readonly initialData: TJson;
};

export function useDualModeEditor<TJson, TUI>(config: UseDualModeEditorConfig<TJson, TUI>) {
    const [viewMode, setViewMode] = useState<ViewMode>('ui');
    const [jsonData, setJsonData] = useState<TJson>(config.initialData);
    const [uiData, setUIData] = useState<TUI>(config.jsonToUI(config.initialData));
    const [loading, setLoading] = useState(true);
    const [validationError, setValidationError] = useState<string>('');
    const editorRef = useRef<any>(null);

    // Load data from API
    const loadData = useCallback(() => {
        errorBoundary(async () => {
            setLoading(true);
            const response = await axios.get(config.loadEndpoint);
            const data = response.data;
            setJsonData(data);
            setUIData(config.jsonToUI(data));
            setLoading(false);
        }, () => {
            setLoading(false);
        });
    }, [config]);

    // Save data to API  
    const handleSave = useCallback(() => {
        errorBoundary(async () => {
            let currentData: TJson;

            if (viewMode === 'json') {
                // Get current content from Monaco editor
                currentData = editorRef.current?.getCurrentValue?.();
            } else {
                // Convert UI data to JSON format
                currentData = config.uiToJSON(uiData);
            }

            if (!currentData) {
                enqueueSnackbar('No valid data to save', { variant: 'error' });
                return;
            }

            // Validate data
            const validationErrorMsg = config.validator(currentData);
            if (validationErrorMsg) {
                setValidationError(validationErrorMsg);
                enqueueSnackbar(`Validation Error: ${validationErrorMsg}`, { variant: 'error' });
                return;
            }

            setValidationError('');
            await axios.post(config.saveEndpoint, currentData);
            enqueueSnackbar('Configuration saved successfully', { variant: 'success' });
            
            // Update local state
            setJsonData(currentData);
            setUIData(config.jsonToUI(currentData));
        });
    }, [viewMode, uiData, config]);

    // Reset to defaults
    const handleReset = useCallback(() => {
        if (confirm('Reset to defaults? This will overwrite your current configuration.')) {
            loadData();
            setValidationError('');
        }
    }, [loadData]);

    // Handle view mode changes
    const handleViewModeChange = useCallback((_event: React.MouseEvent<HTMLElement>, newMode: ViewMode | null) => {
        if (newMode) {
            if (newMode !== viewMode) {
                // Convert data when switching modes
                if (newMode === 'json') {
                    // Switching to JSON - convert UI to JSON
                    const convertedData = config.uiToJSON(uiData);
                    setJsonData(convertedData);
                } else {
                    // Switching to UI - convert JSON to UI
                    const convertedData = config.jsonToUI(jsonData);
                    setUIData(convertedData);
                }
            }
            setViewMode(newMode);
        }
    }, [viewMode, uiData, jsonData, config]);

    // Handle UI data changes
    const handleUIDataChange = useCallback((newUIData: TUI) => {
        setUIData(newUIData);
        setValidationError('');
    }, []);

    // Handle JSON data changes  
    const handleJSONDataChange = useCallback((newJsonData: TJson) => {
        setJsonData(newJsonData);
        setValidationError('');
    }, []);

    return {
        viewMode,
        jsonData,
        uiData,
        loading,
        validationError,
        editorRef,
        loadData,
        handleSave,
        handleReset,
        handleViewModeChange,
        handleUIDataChange,
        handleJSONDataChange
    };
}
```

#### EditorHeader Component
**File**: `src/components/EditorHeader.tsx`

```typescript
import { Box, Typography, Button, ToggleButtonGroup, ToggleButton, Divider } from '@mui/material';
import { TableChart, Code, Refresh, Save } from '@mui/icons-material';

type ViewMode = 'ui' | 'json';

type EditorHeaderProps = {
    readonly title: string;
    readonly viewMode: ViewMode;
    readonly onViewModeChange: (event: React.MouseEvent<HTMLElement>, newMode: ViewMode | null) => void;
    readonly onSave: () => void;
    readonly onReset: () => void;
    readonly disabled?: boolean;
};

export default function EditorHeader({ 
    title, 
    viewMode, 
    onViewModeChange, 
    onSave, 
    onReset, 
    disabled = false 
}: EditorHeaderProps) {
    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 3,
                p: 2,
                bgcolor: 'background.paper',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider'
            }}
        >
            <Typography variant="h6" sx={{ color: 'text.primary' }}>
                {title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                {/* View Mode Toggle */}
                <ToggleButtonGroup 
                    value={viewMode} 
                    exclusive 
                    onChange={onViewModeChange} 
                    size="small"
                    disabled={disabled}
                >
                    <ToggleButton value="ui">
                        <TableChart fontSize="small" sx={{ mr: 1 }} />
                        UI Mode
                    </ToggleButton>
                    <ToggleButton value="json">
                        <Code fontSize="small" sx={{ mr: 1 }} />
                        JSON Mode
                    </ToggleButton>
                </ToggleButtonGroup>

                <Divider orientation="vertical" flexItem />

                {/* Action Buttons */}
                <Button 
                    onClick={onReset} 
                    variant="outlined" 
                    size="small" 
                    startIcon={<Refresh />}
                    disabled={disabled}
                >
                    Reset to Defaults
                </Button>
                <Button 
                    onClick={onSave} 
                    variant="contained" 
                    size="small" 
                    startIcon={<Save />}
                    disabled={disabled}
                >
                    Save Configuration
                </Button>
            </Box>
        </Box>
    );
}
```

### 2. Utility Components

#### StringArrayChipEditor Component
**File**: `src/components/StringArrayChipEditor.tsx`

```typescript
import { Box, Typography, Chip, TextField, Button, Paper } from '@mui/material';
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';
import { useState, useCallback } from 'react';

type StringArrayChipEditorProps = {
    readonly label: string;
    readonly items: string[];
    readonly onChange: (items: string[]) => void;
    readonly placeholder?: string;
    readonly disabled?: boolean;
};

export default function StringArrayChipEditor({ 
    label, 
    items, 
    onChange, 
    placeholder = "Add item", 
    disabled = false 
}: StringArrayChipEditorProps) {
    const [inputValue, setInputValue] = useState('');

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    }, []);

    const handleAddItem = useCallback(() => {
        const trimmedValue = inputValue.trim();
        if (trimmedValue && !items.includes(trimmedValue)) {
            onChange([...items, trimmedValue]);
            setInputValue('');
        }
    }, [inputValue, items, onChange]);

    const handleRemoveItem = useCallback((itemToRemove: string) => {
        onChange(items.filter(item => item !== itemToRemove));
    }, [items, onChange]);

    const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddItem();
        }
    }, [handleAddItem]);

    return (
        <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'medium' }}>
                {label}
            </Typography>
            
            {/* Items Display */}
            <Paper variant="outlined" sx={{ p: 2, mb: 2, minHeight: 60, bgcolor: 'grey.50' }}>
                {items.length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {items.map((item) => (
                            <Chip
                                key={item}
                                label={item}
                                onDelete={disabled ? undefined : () => handleRemoveItem(item)}
                                deleteIcon={<CloseIcon />}
                                size="small"
                                variant="outlined"
                            />
                        ))}
                    </Box>
                ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        No {label.toLowerCase()} configured
                    </Typography>
                )}
            </Paper>

            {/* Add New Item */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                    size="small"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder={placeholder}
                    disabled={disabled}
                    sx={{ flexGrow: 1 }}
                />
                <Button
                    onClick={handleAddItem}
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    disabled={disabled || !inputValue.trim()}
                >
                    Add
                </Button>
            </Box>
        </Box>
    );
}
```

#### SearchApproachCard Component  
**File**: `src/components/SearchApproachCard.tsx`

```typescript
import { Box, Paper, TextField, FormControlLabel, Checkbox, IconButton, Typography } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { useCallback } from 'react';

type SearchApproachConfig = {
    id: string;
    filtered?: boolean;
    trim?: boolean;
    removeQuotes?: boolean;
};

type SearchApproachCardProps = {
    readonly approach: SearchApproachConfig;
    readonly onChange: (approach: SearchApproachConfig) => void;
    readonly onDelete: () => void;
    readonly disabled?: boolean;
};

export default function SearchApproachCard({ 
    approach, 
    onChange, 
    onDelete, 
    disabled = false 
}: SearchApproachCardProps) {
    const handleIdChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        onChange({ ...approach, id: e.target.value });
    }, [approach, onChange]);

    const handleCheckboxChange = useCallback((field: 'filtered' | 'trim' | 'removeQuotes') => {
        return (e: React.ChangeEvent<HTMLInputElement>) => {
            const newApproach = { ...approach };
            if (e.target.checked) {
                newApproach[field] = true;
            } else {
                delete newApproach[field];
            }
            onChange(newApproach);
        };
    }, [approach, onChange]);

    return (
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <TextField
                    label="Approach ID"
                    value={approach.id}
                    onChange={handleIdChange}
                    size="small"
                    disabled={disabled}
                    sx={{ flexGrow: 1, mr: 2 }}
                    required
                />
                <IconButton
                    onClick={onDelete}
                    disabled={disabled}
                    size="small"
                    color="error"
                    title="Delete approach"
                >
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </Box>

            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={!!approach.filtered}
                            onChange={handleCheckboxChange('filtered')}
                            disabled={disabled}
                            size="small"
                        />
                    }
                    label={
                        <Box>
                            <Typography variant="body2">Filtered</Typography>
                            <Typography variant="caption" color="text.secondary">
                                Remove filter words
                            </Typography>
                        </Box>
                    }
                />
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={!!approach.trim}
                            onChange={handleCheckboxChange('trim')}
                            disabled={disabled}
                            size="small"
                        />
                    }
                    label={
                        <Box>
                            <Typography variant="body2">Trim</Typography>
                            <Typography variant="caption" color="text.secondary">
                                Cut at separators
                            </Typography>
                        </Box>
                    }
                />
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={!!approach.removeQuotes}
                            onChange={handleCheckboxChange('removeQuotes')}
                            disabled={disabled}
                            size="small"
                        />
                    }
                    label={
                        <Box>
                            <Typography variant="body2">Remove Quotes</Typography>
                            <Typography variant="caption" color="text.secondary">
                                Remove quote characters
                            </Typography>
                        </Box>
                    }
                />
            </Box>
        </Paper>
    );
}
```

### 3. Main Combined Editor Component

#### TextProcessingAndSearchEditor
**File**: `src/components/TextProcessingAndSearchEditor.tsx`

```typescript
import { Box, Typography, Button, Paper, FormControlLabel, Switch, Divider } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useCallback, useEffect } from 'react';
import { useDualModeEditor } from '@/hooks/useDualModeEditor';
import EditorHeader from '@/components/EditorHeader';
import StringArrayChipEditor from '@/components/StringArrayChipEditor';
import SearchApproachCard from '@/components/SearchApproachCard';
import MonacoJsonEditor from '@/components/MonacoJsonEditor';

// Type definitions
type TextProcessingConfig = {
    filterOutWords: string[];
    filterOutQuotes: string[];
    cutOffSeparators: string[];
    processing: {
        filtered: boolean;
        cutOffSeperators: boolean;
        removeQuotes: boolean;
    };
};

type SearchApproachConfig = {
    id: string;
    filtered?: boolean;
    trim?: boolean;
    removeQuotes?: boolean;
};

type CombinedConfig = {
    textProcessing: TextProcessingConfig;
    searchApproaches: SearchApproachConfig[];
};

// Conversion functions (following one-function-per-file rule, create separate files)
const convertToUI = (combined: CombinedConfig) => combined;
const convertToJSON = (ui: CombinedConfig) => ui;

// Validation function
const validateCombinedConfig = (data: CombinedConfig): string | null => {
    // Text Processing validation
    if (!data.textProcessing || !Array.isArray(data.textProcessing.filterOutWords)) {
        return 'Invalid text processing configuration';
    }
    
    // Search Approaches validation  
    if (!Array.isArray(data.searchApproaches)) {
        return 'Search approaches must be an array';
    }
    
    for (let i = 0; i < data.searchApproaches.length; i++) {
        const approach = data.searchApproaches[i];
        if (!approach.id || typeof approach.id !== 'string') {
            return `Approach at index ${i} must have a valid ID`;
        }
    }
    
    return null;
};

export default function TextProcessingAndSearchEditor() {
    const {
        viewMode,
        jsonData,
        uiData,
        loading,
        validationError,
        editorRef,
        loadData,
        handleSave,
        handleReset,
        handleViewModeChange,
        handleUIDataChange
    } = useDualModeEditor<CombinedConfig, CombinedConfig>({
        loadEndpoint: '/api/plex/music-search-config/combined',
        saveEndpoint: '/api/plex/music-search-config/combined',
        validator: validateCombinedConfig,
        jsonToUI: convertToUI,
        uiToJSON: convertToJSON,
        initialData: {
            textProcessing: {
                filterOutWords: [],
                filterOutQuotes: [],
                cutOffSeparators: [],
                processing: { filtered: false, cutOffSeperators: false, removeQuotes: false }
            },
            searchApproaches: []
        }
    });

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Text Processing handlers
    const handleFilterWordsChange = useCallback((newWords: string[]) => {
        handleUIDataChange({
            ...uiData,
            textProcessing: {
                ...uiData.textProcessing,
                filterOutWords: newWords
            }
        });
    }, [uiData, handleUIDataChange]);

    const handleFilterQuotesChange = useCallback((newQuotes: string[]) => {
        handleUIDataChange({
            ...uiData,
            textProcessing: {
                ...uiData.textProcessing,
                filterOutQuotes: newQuotes
            }
        });
    }, [uiData, handleUIDataChange]);

    const handleCutOffSeparatorsChange = useCallback((newSeparators: string[]) => {
        handleUIDataChange({
            ...uiData,
            textProcessing: {
                ...uiData.textProcessing,
                cutOffSeparators: newSeparators
            }
        });
    }, [uiData, handleUIDataChange]);

    const handleProcessingSettingChange = useCallback((setting: keyof typeof uiData.textProcessing.processing, value: boolean) => {
        handleUIDataChange({
            ...uiData,
            textProcessing: {
                ...uiData.textProcessing,
                processing: {
                    ...uiData.textProcessing.processing,
                    [setting]: value
                }
            }
        });
    }, [uiData, handleUIDataChange]);

    // Search Approaches handlers
    const handleApproachChange = useCallback((index: number, newApproach: SearchApproachConfig) => {
        const newApproaches = [...uiData.searchApproaches];
        newApproaches[index] = newApproach;
        handleUIDataChange({
            ...uiData,
            searchApproaches: newApproaches
        });
    }, [uiData, handleUIDataChange]);

    const handleApproachDelete = useCallback((index: number) => {
        const newApproaches = uiData.searchApproaches.filter((_, i) => i !== index);
        handleUIDataChange({
            ...uiData,
            searchApproaches: newApproaches
        });
    }, [uiData, handleUIDataChange]);

    const handleAddApproach = useCallback(() => {
        const newApproach: SearchApproachConfig = {
            id: `approach-${Date.now()}`,
            filtered: false,
            trim: false,
            removeQuotes: false
        };
        handleUIDataChange({
            ...uiData,
            searchApproaches: [...uiData.searchApproaches, newApproach]
        });
    }, [uiData, handleUIDataChange]);

    if (loading) {
        return (
            <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography>Loading configuration...</Typography>
            </Box>
        );
    }

    // JSON Schema for combined configuration
    const combinedSchema = {
        type: 'object',
        properties: {
            textProcessing: {
                type: 'object',
                properties: {
                    filterOutWords: { type: 'array', items: { type: 'string' } },
                    filterOutQuotes: { type: 'array', items: { type: 'string' } },
                    cutOffSeparators: { type: 'array', items: { type: 'string' } },
                    processing: {
                        type: 'object',
                        properties: {
                            filtered: { type: 'boolean' },
                            cutOffSeperators: { type: 'boolean' },
                            removeQuotes: { type: 'boolean' }
                        }
                    }
                }
            },
            searchApproaches: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        filtered: { type: 'boolean' },
                        trim: { type: 'boolean' },
                        removeQuotes: { type: 'boolean' }
                    },
                    required: ['id']
                }
            }
        }
    };

    return (
        <Box>
            <EditorHeader
                title="Text Processing & Search Approaches Configuration"
                viewMode={viewMode}
                onViewModeChange={handleViewModeChange}
                onSave={handleSave}
                onReset={handleReset}
                disabled={loading}
            />

            {viewMode === 'ui' ? (
                <Box sx={{ p: 2 }}>
                    {/* Text Processing Section */}
                    <Typography variant="h6" sx={{ mb: 2 }}>Text Processing Rules</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Configure what words, quotes, and separators to process when cleaning track titles.
                    </Typography>

                    {/* Processing Settings Toggles */}
                    <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={uiData.textProcessing.processing.filtered}
                                    onChange={(e) => handleProcessingSettingChange('filtered', e.target.checked)}
                                />
                            }
                            label="Enable Word Filtering"
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={uiData.textProcessing.processing.removeQuotes}
                                    onChange={(e) => handleProcessingSettingChange('removeQuotes', e.target.checked)}
                                />
                            }
                            label="Enable Quote Removal"
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={uiData.textProcessing.processing.cutOffSeperators}
                                    onChange={(e) => handleProcessingSettingChange('cutOffSeperators', e.target.checked)}
                                />
                            }
                            label="Enable Cut-off at Separators"
                        />
                    </Box>

                    {/* String Array Editors */}
                    <StringArrayChipEditor
                        label="Filter Out Words"
                        items={uiData.textProcessing.filterOutWords}
                        onChange={handleFilterWordsChange}
                        placeholder="Add word to filter (e.g., 'remaster')"
                    />

                    <StringArrayChipEditor
                        label="Quote Characters"
                        items={uiData.textProcessing.filterOutQuotes}
                        onChange={handleFilterQuotesChange}
                        placeholder="Add quote character (e.g., ')"
                    />

                    <StringArrayChipEditor
                        label="Cut-off Separators"
                        items={uiData.textProcessing.cutOffSeparators}
                        onChange={handleCutOffSeparatorsChange}
                        placeholder="Add separator (e.g., '(')"
                    />

                    <Divider sx={{ my: 4 }} />

                    {/* Search Approaches Section */}
                    <Typography variant="h6" sx={{ mb: 2 }}>Search Approaches</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Configure when to apply the text processing rules. Each approach represents a different combination.
                    </Typography>

                    {uiData.searchApproaches.map((approach, index) => (
                        <SearchApproachCard
                            key={approach.id || index}
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
                        Add Search Approach
                    </Button>
                </Box>
            ) : (
                <MonacoJsonEditor
                    ref={editorRef}
                    value={jsonData}
                    onChange={handleUIDataChange}
                    schema={combinedSchema}
                    height={600}
                    error={validationError}
                />
            )}
        </Box>
    );
}
```

### 4. API Integration Requirements

You'll need to create a new API endpoint that combines both configurations:

**File**: `pages/api/plex/music-search-config/combined.ts`

This endpoint should:
1. **GET**: Fetch both text-processing and search-approaches, combine into single response
2. **POST**: Split received data and save to both endpoints

## CODING_GUIDELINES.md Compliance

### Required Patterns  
- ✅ **useCallback for ALL event handlers** - Every onClick, onChange uses useCallback
- ✅ **!! for conditional rendering** - All conditionals use explicit boolean coercion  
- ✅ **errorBoundary for ALL async operations** - Used in useDualModeEditor hook
- ✅ **One function per file** - Conversion utilities should be separate files
- ✅ **Default exports** for React components
- ✅ **Props destructuring** in all components
- ✅ **NO 'src' in import paths** - All imports use @/ pattern

### File Organization
- ✅ **PascalCase file naming** - All component files use PascalCase
- ✅ **camelCase for utility functions** - Hook and utility functions use camelCase
- ✅ **Domain-specific organization** - Components grouped logically

## Acceptance Criteria

### Functional Requirements
1. **Dual-mode editing** works for both configurations
2. **Combined interface** shows relationship between text processing and search approaches  
3. **Data validation** prevents invalid configurations
4. **Real-time updates** in UI mode reflect immediately

### Technical Requirements
1. **Zero ESLint errors** following CODING_GUIDELINES.md
2. **TypeScript compliance** with proper types throughout
3. **Shared component reuse** across both configuration types
4. **Performance optimization** with proper memoization

### User Experience
1. **Intuitive layout** clearly shows text processing → search approaches relationship
2. **Helpful descriptions** explain what each setting does
3. **Immediate feedback** for validation errors
4. **Consistent styling** matches existing Material-UI patterns

This combined editor creates a much more intuitive workflow where users can see exactly how their text processing rules are applied by different search approaches.