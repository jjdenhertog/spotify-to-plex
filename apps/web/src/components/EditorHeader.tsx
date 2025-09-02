import { Box, Typography, Button, ToggleButtonGroup, ToggleButton, Divider } from '@mui/material';
import { TableChart, Code, Refresh, Save } from '@mui/icons-material';

type ViewMode = 'ui' | 'json';

type EditorHeaderProps = {
    readonly title: string;
    readonly viewMode: ViewMode;
    readonly onViewModeChange: (event: React.MouseEvent<HTMLElement>, newMode: ViewMode | null) => void;
    readonly onSave: () => void;
    readonly onReset: () => void;
    readonly disabled?: boolean;
};

export default function EditorHeader({ 
    title, 
    viewMode, 
    onViewModeChange, 
    onSave, 
    onReset, 
    disabled = false 
}: EditorHeaderProps) {
    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 3,
                p: 2,
                bgcolor: 'background.paper',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider'
            }}
        >
            <Typography variant="h6" sx={{ color: 'text.primary' }}>
                {title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                {/* View Mode Toggle */}
                <ToggleButtonGroup value={viewMode} exclusive onChange={onViewModeChange} size="small" disabled={disabled}>
                    <ToggleButton value="ui">
                        <TableChart fontSize="small" sx={{ mr: 1 }} />
                        UI Mode
                    </ToggleButton>
                    <ToggleButton value="json">
                        <Code fontSize="small" sx={{ mr: 1 }} />
                        JSON Mode
                    </ToggleButton>
                </ToggleButtonGroup>

                <Divider orientation="vertical" flexItem />

                {/* Action Buttons */}
                <Button onClick={onReset} variant="outlined" size="small" startIcon={<Refresh />} disabled={disabled}>
                    Reset to Defaults
                </Button>
                <Button onClick={onSave} variant="contained" size="small" startIcon={<Save />} disabled={disabled}>
                    Save Configuration
                </Button>
            </Box>
        </Box>
    );
}