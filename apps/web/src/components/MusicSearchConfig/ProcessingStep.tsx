import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

type ProcessingStepProps = {
    readonly title: string;
    readonly description: string;
    readonly isLast?: boolean;
}

const ProcessingStep: React.FC<ProcessingStepProps> = ({ title, description, isLast = false }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Paper
            elevation={2}
            sx={{
                p: 2,
                minWidth: 140,
                textAlign: 'center',
                bgcolor: 'primary.light',
                color: 'primary.contrastText',
            }}
        >
            <Typography variant="subtitle2" fontWeight="bold">
                {title}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                {description}
            </Typography>
        </Paper>
        {!isLast && (
            <ArrowForwardIcon
                sx={{
                    mx: 2,
                    color: 'primary.main',
                    fontSize: 32,
                }}
            />
        )}
    </Box>
);

export default ProcessingStep;