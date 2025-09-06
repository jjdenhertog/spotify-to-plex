import React from 'react';
import { Paper, PaperProps } from '@mui/material';

const CustomPaper: React.FC<PaperProps> = ({ children, sx, ...props }) => (
    <Paper {...props} sx={{ mt: 1, ...sx }}>
        {children}
    </Paper>
);

export default CustomPaper;