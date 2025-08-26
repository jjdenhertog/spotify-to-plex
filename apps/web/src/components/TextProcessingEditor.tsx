import React, { useState } from 'react';
import {
    Box,
    Chip,
    FormControlLabel,
    IconButton,
    Switch,
    TextField,
    Typography,
    Alert,
    Collapse,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import { Add, Delete, ExpandMore, ExpandLess, Preview } from '@mui/icons-material';

interface TextProcessingConfig {
    filterOutWords: string[];
    filterOutQuotes: string[];
    cutOffSeparators: string[];
    processing: {
        filtered: boolean;
        cutOffSeperators: boolean;
        removeQuotes: boolean;
    };
}

interface TextProcessingEditorProps {
    config: TextProcessingConfig;
    onUpdate: (field: string, value: any) => void;
}

const TextProcessingEditor: React.FC<TextProcessingEditorProps> = ({
    config,
    onUpdate
}) => {
    const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
        filterOutWords: false,
        filterOutQuotes: false,
        cutOffSeparators: false
    });
    
    const [newItemInputs, setNewItemInputs] = useState<{ [key: string]: string }>({
        filterOutWords: '',
        filterOutQuotes: '',
        cutOffSeparators: ''
    });
    
    const [previewDialog, setPreviewDialog] = useState(false);
    const [previewText, setPreviewText] = useState('Artist Name feat. Another Artist - Song Title (Radio Edit) "Remastered Version"');

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const addItem = (field: string) => {
        const newItem = newItemInputs[field]?.trim();
        if (!newItem) return;
        const fieldValue = config[field as keyof TextProcessingConfig];
        if (Array.isArray(fieldValue) && !fieldValue.includes(newItem)) {
            const updatedArray = [...fieldValue, newItem];
            onUpdate(field, updatedArray);
            setNewItemInputs(prev => ({ ...prev, [field]: '' }));
        }
    };

    const removeItem = (field: string, item: string) => {
        const updatedArray = (config[field as keyof TextProcessingConfig] as string[]).filter(i => i !== item);
        onUpdate(field, updatedArray);
    };

    const handleInputKeyPress = (field: string, event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
            addItem(field);
        }
    };

    // Preview processing function (simplified version)
    const processTextPreview = (text: string): string => {
        let processed = text.toLowerCase();
        
        // Filter out words
        if (config.filterOutWords) {
            config.filterOutWords.forEach(word => {
                const regex = new RegExp(`\\b${word}\\b`, 'gi');
                processed = processed.replace(regex, '');
            });
        }
        
        // Remove quotes
        if (config.processing?.removeQuotes && config.filterOutQuotes) {
            config.filterOutQuotes.forEach(quote => {
                processed = processed.split(quote).join('');
            });
        }
        
        // Cut off at separators
        if (config.processing?.cutOffSeperators && config.cutOffSeparators) {
            for (const separator of config.cutOffSeparators) {
                const index = processed.lastIndexOf(separator.toLowerCase());
                if (index !== -1) {
                    processed = processed.substring(0, index);
                    break;
                }
            }
        }
        
        // Clean up extra spaces and trim
        processed = processed.replace(/\s+/g, ' ').trim();
        
        return processed;
    };

    const renderArrayEditor = (
        field: keyof TextProcessingConfig,
        label: string,
        description: string,
        placeholder: string,
        examples: string[]
    ) => {
        const items = config[field] as string[];
        const expanded = expandedSections[field];

        return (
            <Box key={field} sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {label}
                    </Typography>
                    <IconButton size="small" onClick={() => toggleSection(field)}>
                        {expanded ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {description}
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2, minHeight: 32 }}>
                    {items.length === 0 ? (
                        <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic', p: 1 }}>
                            No items configured
                        </Typography>
                    ) : (
                        items.map((item, index) => (
                            <Chip
                                key={index}
                                label={item}
                                size="small"
                                onDelete={() => removeItem(field, item)}
                                deleteIcon={<Delete />}
                                variant="outlined"
                            />
                        ))
                    )}
                </Box>

                <Collapse in={expanded}>
                    <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            <TextField
                                size="small"
                                placeholder={placeholder}
                                value={newItemInputs[field]}
                                onChange={(e) => setNewItemInputs(prev => ({ ...prev, [field]: e.target.value }))}
                                onKeyPress={(e) => handleInputKeyPress(field, e)}
                                fullWidth
                            />
                            <IconButton 
                                onClick={() => addItem(field)}
                                disabled={!newItemInputs[field]?.trim()}
                                color="primary"
                            >
                                <Add />
                            </IconButton>
                        </Box>
                        
                        <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                Common examples:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {examples.map((example, index) => (
                                    <Chip
                                        key={index}
                                        label={example}
                                        size="small"
                                        variant="outlined"
                                        onClick={() => {
                                            if (!items.includes(example)) {
                                                const updatedArray = [...items, example];
                                                onUpdate(field, updatedArray);
                                            }
                                        }}
                                        sx={{ cursor: 'pointer' }}
                                    />
                                ))}
                            </Box>
                        </Box>
                    </Box>
                </Collapse>
            </Box>
        );
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justify: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">Text Processing Configuration</Typography>
                <Button
                    startIcon={<Preview />}
                    onClick={() => setPreviewDialog(true)}
                    variant="outlined"
                    size="small"
                >
                    Preview Processing
                </Button>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Configure how track and artist names are cleaned and processed before matching.
                Processing happens in sequence: filter words → remove quotes → cut at separators → clean up.
            </Typography>

            {/* Boolean Settings */}
            <Box sx={{ mb: 4, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>Processing Options</Typography>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={config.processing?.removeQuotes || false}
                                onChange={(e) => onUpdate('processing', { ...config.processing, removeQuotes: e.target.checked })}
                            />
                        }
                        label="Remove Quote Characters"
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={config.processing?.cutOffSeperators || false}
                                onChange={(e) => onUpdate('processing', { ...config.processing, cutOffSeperators: e.target.checked })}
                            />
                        }
                        label="Cut Off at Separators"
                    />
                </Box>
            </Box>

            {/* Array Editors */}
            {renderArrayEditor(
                'filterOutWords',
                'Filter Out Words',
                'Words that will be completely removed from track titles before matching',
                'Enter word to filter out...',
                ['remaster', 'remix', 'feat', 'featuring', 'radio', 'edit', 'explicit', 'live', 'acoustic']
            )}

            {renderArrayEditor(
                'filterOutQuotes',
                'Quote Characters to Remove',
                'Quote and bracket characters that will be removed from track titles',
                'Enter quote character...',
                ['"', "'", '"', '"', '«', '»', '(', ')', '[', ']']
            )}

            {renderArrayEditor(
                'cutOffSeparators',
                'Cut-off Separators',
                'When found, everything after these separators will be removed from track titles',
                'Enter separator...',
                [' - ', ' – ', ' (', ' [', ' feat', ' ft', ' featuring', ' remix', ' edit']
            )}

            {/* Processing Preview Dialog */}
            <Dialog open={previewDialog} onClose={() => setPreviewDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>Text Processing Preview</DialogTitle>
                <DialogContent>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Test Input:</Typography>
                        <TextField
                            fullWidth
                            value={previewText}
                            onChange={(e) => setPreviewText(e.target.value)}
                            placeholder="Enter text to preview processing..."
                            size="small"
                        />
                    </Box>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box>
                            <Typography variant="subtitle2" color="primary">Original:</Typography>
                            <Typography sx={{ p: 1, bgcolor: 'grey.100', borderRadius: 1, fontFamily: 'monospace' }}>
                                {previewText}
                            </Typography>
                        </Box>
                        
                        <Box>
                            <Typography variant="subtitle2" color="success.main">Processed:</Typography>
                            <Typography sx={{ p: 1, bgcolor: 'success.light', borderRadius: 1, fontFamily: 'monospace' }}>
                                {processTextPreview(previewText)}
                            </Typography>
                        </Box>
                    </Box>
                    
                    <Alert severity="info" sx={{ mt: 2 }}>
                        <Typography variant="caption">
                            This preview shows a simplified version of the actual processing.
                            The real implementation may include additional logic and optimizations.
                        </Typography>
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPreviewDialog(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Usage Tips */}
            <Alert severity="info" sx={{ mt: 3 }}>
                <Typography variant="body2">
                    <strong>💡 Tips:</strong><br />
                    • Order matters for separators - the first match wins<br />
                    • Be careful with short words that might match unintentionally<br />
                    • Test your changes with the preview tool above<br />
                    • Common words like "the", "and" are usually not filtered to avoid over-processing
                </Typography>
            </Alert>
        </Box>
    );
};

export default TextProcessingEditor;