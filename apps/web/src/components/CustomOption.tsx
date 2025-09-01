import React from 'react';
import {
    Box,
    Chip,
    Typography
} from '@mui/material';
import { AutocompleteSuggestion } from '../types/MatchFilterTypes';

type CustomOptionProps = {
    readonly option: AutocompleteSuggestion;
};

const CustomOption: React.FC<CustomOptionProps> = ({ option }) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', py: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip label={option.category} size="small" variant="outlined" color={option.category==='field' ? 'primary' : option.category==='operation' ? 'secondary' : 'default'} />
            <Typography variant="body2" fontWeight="medium">
                {option.label}
            </Typography>
        </Box>
        {option.description ? <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
            {option.description}
        </Typography> : null}
    </Box>
);

export default CustomOption;