import React from 'react';
import { Box, Typography, Divider } from '@mui/material';

interface EditorHeaderProps {
    readonly title: string;
}

/**
 * EditorHeader - Shared header component placeholder
 * This component provides a consistent header interface for all editor components
 */
const EditorHeader: React.FC<EditorHeaderProps> = ({ title }) => {
    return (
        <Box sx={{ mb: 3 }}>
            <Typography 
                variant="h4" 
                component="h1" 
                sx={{ 
                    fontWeight: 600,
                    color: 'primary.main',
                    mb: 1
                }}
            >
                {title}
            </Typography>
            <Typography 
                variant="subtitle1" 
                color="text.secondary" 
                sx={{ mb: 2 }}
            >
                Configure and customize your music experience
            </Typography>
            <Divider />
        </Box>
    );
};

export default EditorHeader;