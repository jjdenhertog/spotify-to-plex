import { Box, Typography, Button, FormControlLabel, Switch, Divider } from '@mui/material';
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

// Conversion functions
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

    const handleFilteredChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        handleProcessingSettingChange('filtered', e.target.checked);
    }, [handleProcessingSettingChange]);

    const handleRemoveQuotesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        handleProcessingSettingChange('removeQuotes', e.target.checked);
    }, [handleProcessingSettingChange]);

    const handleCutOffSeparatorsToggleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        handleProcessingSettingChange('cutOffSeperators', e.target.checked);
    }, [handleProcessingSettingChange]);

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

    const createApproachChangeHandler = useCallback((index: number) => {
        return (newApproach: SearchApproachConfig) => handleApproachChange(index, newApproach);
    }, [handleApproachChange]);

    const createApproachDeleteHandler = useCallback((index: number) => {
        return () => handleApproachDelete(index);
    }, [handleApproachDelete]);

    if (loading) {
        return (
            <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography>
                    Loading configuration...
                </Typography>
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
            <EditorHeader title="Text Processing & Search Approaches Configuration" viewMode={viewMode} onViewModeChange={handleViewModeChange} onSave={handleSave} onReset={handleReset} disabled={loading} />

            {viewMode === 'ui' ? (
                <Box sx={{ p: 2 }}>
                    {/* Text Processing Section */}
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Text Processing Rules
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Configure what words, quotes, and separators to process when cleaning track titles.
                    </Typography>

                    {/* Processing Settings Toggles */}
                    <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
                        <FormControlLabel control={ <Switch checked={uiData.textProcessing.processing.filtered} onChange={handleFilteredChange} /> } label="Enable Word Filtering" />
                        <FormControlLabel control={ <Switch checked={uiData.textProcessing.processing.removeQuotes} onChange={handleRemoveQuotesChange} /> } label="Enable Quote Removal" />
                        <FormControlLabel control={ <Switch checked={uiData.textProcessing.processing.cutOffSeperators} onChange={handleCutOffSeparatorsToggleChange} /> } label="Enable Cut-off at Separators" />
                    </Box>

                    {/* String Array Editors */}
                    <StringArrayChipEditor label="Filter Out Words" items={uiData.textProcessing.filterOutWords} onChange={handleFilterWordsChange} placeholder="Add word to filter (e.g., 'remaster')" />

                    <StringArrayChipEditor label="Quote Characters" items={uiData.textProcessing.filterOutQuotes} onChange={handleFilterQuotesChange} placeholder="Add quote character (e.g., ')" />

                    <StringArrayChipEditor label="Cut-off Separators" items={uiData.textProcessing.cutOffSeparators} onChange={handleCutOffSeparatorsChange} placeholder="Add separator (e.g., '(')" />

                    <Divider sx={{ my: 4 }} />

                    {/* Search Approaches Section */}
                    <Typography variant="h6" sx={{ mb: 2 }}>Search Approaches</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Configure when to apply the text processing rules. Each approach represents a different combination.
                    </Typography>

                    {uiData.searchApproaches.map((approach, index) => (
                        <SearchApproachCard key={approach.id || index} approach={approach} onChange={createApproachChangeHandler(index)} onDelete={createApproachDeleteHandler(index)} disabled={loading} />
                    ))}

                    <Button onClick={handleAddApproach} startIcon={<AddIcon />} variant="outlined" size="small">
                        Add Search Approach
                    </Button>
                </Box>
            ) : (
                <MonacoJsonEditor ref={editorRef} value={jsonData} onChange={handleUIDataChange} schema={combinedSchema} height={600} error={validationError} />
            )}
        </Box>
    );
}