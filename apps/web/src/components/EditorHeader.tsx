import { Box, Typography } from '@mui/material';

type EditorHeaderProps = {
    readonly title: string;
};

export default function EditorHeader({ title }: EditorHeaderProps) {
    return (
        <Box sx={{ mb: 2 }}>
            <Typography variant="h6">{title}</Typography>
            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                🚧 Shared header implementation coming in Task 3
            </Typography>
        </Box>
    );
}