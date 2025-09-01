import React from 'react';
import { Paper } from '@mui/material';

const CustomPaper: React.FC<React.HTMLAttributes<HTMLElement>> = ({ children, ...props }) => (
    <Paper {...props} sx={{ mt: 1 }}>
        {children}
    </Paper>
);

export default CustomPaper;