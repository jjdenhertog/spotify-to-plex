import React from 'react';
import {
    Box,
    FormControlLabel,
    Paper,
    Switch,
    TextField,
    Typography,
    Chip,
    Tooltip
} from '@mui/material';
import { DragIndicator } from '@mui/icons-material';

interface MatchFilter {
    id: string;
    name: string;
    enabled: boolean;
    artistSimilarity?: number;
    titleSimilarity?: number;
    artistWithTitleSimilarity?: number;
    useContains?: boolean;
    useArtistMatch?: boolean;
    reason: string;
}

interface MatchFilterEditorProps {
    filters: MatchFilter[];
    onUpdateFilter: (index: number, field: string, value: any) => void;
    onReorderFilters?: (newOrder: MatchFilter[]) => void;
}

const MatchFilterEditor: React.FC<MatchFilterEditorProps> = ({
    filters,
    onUpdateFilter
}) => {
    const getPriorityColor = (index: number, total: number) => {
        if (index < total * 0.3) return 'error'; // High priority
        if (index < total * 0.6) return 'warning'; // Medium priority
        return 'default'; // Low priority
    };

    const getSimilarityLabel = (value: number) => {
        if (value >= 0.9) return 'Very High';
        if (value >= 0.8) return 'High';
        if (value >= 0.7) return 'Medium';
        if (value >= 0.6) return 'Low';
        return 'Very Low';
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    Match filters are evaluated in order. The first filter that returns results wins.
                    Drag and drop to reorder filters or adjust individual settings below.
                </Typography>
            </Box>

            {filters.map((filter, index) => (
                <Paper 
                    key={filter.id} 
                    elevation={filter.enabled ? 2 : 1} 
                    sx={{ 
                        p: 2, 
                        opacity: filter.enabled ? 1 : 0.6,
                        border: filter.enabled ? '1px solid' : '1px dashed',
                        borderColor: filter.enabled ? 'divider' : 'action.disabled'
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <DragIndicator sx={{ mr: 1, color: 'action.disabled', cursor: 'grab' }} />
                        
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={filter.enabled}
                                    onChange={(e) => onUpdateFilter(index, 'enabled', e.target.checked)}
                                    size="small"
                                />
                            }
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                        {filter.name}
                                    </Typography>
                                    <Chip 
                                        label={`Priority ${index + 1}`}
                                        size="small"
                                        color={getPriorityColor(index, filters.length)}
                                        variant="outlined"
                                    />
                                </Box>
                            }
                            sx={{ flexGrow: 1, m: 0 }}
                        />
                    </Box>

                    {/* Similarity Thresholds */}
                    <Box sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
                        gap: 2, 
                        mb: 2 
                    }}>
                        {filter.artistSimilarity !== undefined && (
                            <Box>
                                <TextField
                                    label="Artist Similarity"
                                    type="number"
                                    size="small"
                                    fullWidth
                                    inputProps={{ min: 0, max: 1, step: 0.05 }}
                                    value={filter.artistSimilarity}
                                    onChange={(e) => onUpdateFilter(index, 'artistSimilarity', parseFloat(e.target.value))}
                                    disabled={!filter.enabled}
                                    helperText={`${getSimilarityLabel(filter.artistSimilarity)} (${(filter.artistSimilarity * 100).toFixed(0)}%)`}
                                />
                            </Box>
                        )}
                        
                        {filter.titleSimilarity !== undefined && (
                            <Box>
                                <TextField
                                    label="Title Similarity"
                                    type="number"
                                    size="small"
                                    fullWidth
                                    inputProps={{ min: 0, max: 1, step: 0.05 }}
                                    value={filter.titleSimilarity}
                                    onChange={(e) => onUpdateFilter(index, 'titleSimilarity', parseFloat(e.target.value))}
                                    disabled={!filter.enabled}
                                    helperText={`${getSimilarityLabel(filter.titleSimilarity)} (${(filter.titleSimilarity * 100).toFixed(0)}%)`}
                                />
                            </Box>
                        )}
                        
                        {filter.artistWithTitleSimilarity !== undefined && (
                            <Box>
                                <TextField
                                    label="Artist+Title Similarity"
                                    type="number"
                                    size="small"
                                    fullWidth
                                    inputProps={{ min: 0, max: 1, step: 0.05 }}
                                    value={filter.artistWithTitleSimilarity}
                                    onChange={(e) => onUpdateFilter(index, 'artistWithTitleSimilarity', parseFloat(e.target.value))}
                                    disabled={!filter.enabled}
                                    helperText={`${getSimilarityLabel(filter.artistWithTitleSimilarity)} (${(filter.artistWithTitleSimilarity * 100).toFixed(0)}%)`}
                                />
                            </Box>
                        )}
                    </Box>

                    {/* Additional Options */}
                    {(filter.useContains !== undefined || filter.useArtistMatch !== undefined) && (
                        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                            {filter.useContains !== undefined && (
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={filter.useContains}
                                            onChange={(e) => onUpdateFilter(index, 'useContains', e.target.checked)}
                                            size="small"
                                            disabled={!filter.enabled}
                                        />
                                    }
                                    label={
                                        <Tooltip title="Use 'contains' logic instead of exact similarity matching">
                                            <span>Use Contains Logic</span>
                                        </Tooltip>
                                    }
                                />
                            )}
                            
                            {filter.useArtistMatch !== undefined && (
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={filter.useArtistMatch}
                                            onChange={(e) => onUpdateFilter(index, 'useArtistMatch', e.target.checked)}
                                            size="small"
                                            disabled={!filter.enabled}
                                        />
                                    }
                                    label={
                                        <Tooltip title="Use artist-specific matching logic">
                                            <span>Use Artist Match</span>
                                        </Tooltip>
                                    }
                                />
                            )}
                        </Box>
                    )}

                    {/* Match Reason */}
                    <TextField
                        label="Match Reason"
                        fullWidth
                        size="small"
                        value={filter.reason}
                        onChange={(e) => onUpdateFilter(index, 'reason', e.target.value)}
                        disabled={!filter.enabled}
                        helperText="This message will be shown when this filter successfully matches a track"
                        sx={{ 
                            '& .MuiInputBase-input': { 
                                fontSize: '0.875rem',
                                fontFamily: 'monospace' 
                            }
                        }}
                    />

                    {/* Filter Status Summary */}
                    <Box sx={{ mt: 2, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                            <strong>Filter Summary:</strong>{' '}
                            {filter.enabled ? 'Active' : 'Inactive'} • Priority: {index + 1} • {
                                [
                                    filter.artistSimilarity && `Artist: ${(filter.artistSimilarity * 100).toFixed(0)}%`,
                                    filter.titleSimilarity && `Title: ${(filter.titleSimilarity * 100).toFixed(0)}%`,
                                    filter.artistWithTitleSimilarity && `Combined: ${(filter.artistWithTitleSimilarity * 100).toFixed(0)}%`
                                ].filter(Boolean).join(' • ')
                            }
                        </Typography>
                    </Box>
                </Paper>
            ))}

            <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1, mt: 2 }}>
                <Typography variant="body2" color="info.dark">
                    <strong>💡 Pro Tip:</strong> Keep high-confidence filters at the top for better performance. 
                    The system stops at the first filter that finds matches, so order matters!
                </Typography>
            </Box>
        </Box>
    );
};

export default MatchFilterEditor;