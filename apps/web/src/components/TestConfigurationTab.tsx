import { Box, Typography, Paper } from '@mui/material';

export default function TestConfigurationTab() {
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
                Test Your Configuration
            </Typography>
            <Paper variant="outlined" sx={{ p: 3, bgcolor: 'grey.50' }}>
                <Typography variant="body1">
                    🧪 This integrated testing interface will allow you to test your configuration 
                    changes immediately with real Spotify tracks and see the matching process in detail.
                </Typography>
                <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
                    🚧 Implementation coming in Task 4
                </Typography>
            </Paper>
        </Box>
    );
}