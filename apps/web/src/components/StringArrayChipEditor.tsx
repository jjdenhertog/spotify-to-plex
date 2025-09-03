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

    const createDeleteHandler = useCallback((item: string) => {
        return () => handleRemoveItem(item);
    }, [handleRemoveItem]);

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
            <Paper variant="outlined" sx={{ p: 0, mb: 2, minHeight: 60 }}>
                <Box sx={{ p: 2 }}>
                    {!!items.length && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {items.map((item) => (
                                <Chip 
                                    key={item} 
                                    label={item} 
                                    onDelete={disabled ? undefined : createDeleteHandler(item)} 
                                    deleteIcon={<CloseIcon />} 
                                    size="small"
                                    variant="filled"
                                    color="primary"
                                    sx={{ 
                                        mr: 1,
                                        mb: 0.5,
                                        fontFamily: 'monospace',
                                        fontSize: '0.75rem'
                                    }}
                                />
                            ))}
                        </Box>
                    )}
                    {!items.length && (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            No {label.toLowerCase()} configured
                        </Typography>
                    )}
                </Box>
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
                <Button onClick={handleAddItem} variant="outlined" size="small" startIcon={<AddIcon />} disabled={disabled || !inputValue.trim()}>
                    Add
                </Button>
            </Box>
        </Box>
    );
}