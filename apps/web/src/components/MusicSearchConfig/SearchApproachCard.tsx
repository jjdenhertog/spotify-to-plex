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
                const { [field]: _, ...rest } = newApproach;
                onChange(rest as SearchApproachConfig);

                return;
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
                <IconButton onClick={onDelete} disabled={disabled} size="small" color="error" title="Delete approach">
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </Box>

            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <FormControlLabel control={<Checkbox checked={!!approach.filtered} onChange={handleCheckboxChange('filtered')} disabled={disabled} size="small" />} label={<Box><Typography variant="body2">Filtered</Typography><Typography variant="caption" color="text.secondary">Remove filter words</Typography></Box>} />
                <FormControlLabel control={<Checkbox checked={!!approach.trim} onChange={handleCheckboxChange('trim')} disabled={disabled} size="small" />} label={<Box><Typography variant="body2">Trim</Typography><Typography variant="caption" color="text.secondary">Cut at separators</Typography></Box>} />
                {/* eslint-disable-next-line react/jsx-curly-brace-presence, custom/jsx-multiline-children */}
                <FormControlLabel control={<Checkbox checked={!!approach.removeQuotes} onChange={handleCheckboxChange('removeQuotes')} disabled={disabled} size="small" />} label={<Box><Typography variant="body2">Remove Quotes</Typography><Typography variant="caption" color="text.secondary">Remove quote characters</Typography></Box>} />
            </Box>
        </Paper>
    );
}