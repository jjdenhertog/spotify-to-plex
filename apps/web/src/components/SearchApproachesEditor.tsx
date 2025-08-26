import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Chip,
    Divider,
    FormControlLabel,
    Switch,
    Typography,
    Alert,
    IconButton,
    Collapse,
    Tooltip
} from '@mui/material';
import { ExpandMore, ExpandLess, Info, Speed, Tune } from '@mui/icons-material';

interface SearchApproachConfig {
    name: string;
    filtered: boolean;
    cutOffSeperators: boolean; // Note: preserving typo from original
    removeQuotes: boolean;
}

interface SearchApproachesEditorProps {
    plexApproaches: SearchApproachConfig[];
    tidalApproaches: SearchApproachConfig[];
    onUpdatePlex: (index: number, field: string, value: any) => void;
    onUpdateTidal: (index: number, field: string, value: any) => void;
}

const SearchApproachesEditor: React.FC<SearchApproachesEditorProps> = ({
    plexApproaches,
    tidalApproaches,
    onUpdatePlex,
    onUpdateTidal
}) => {
    const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
        plex: true,
        tidal: false
    });

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const getApproachComplexityScore = (approach: SearchApproachConfig): number => {
        return [approach.filtered, approach.cutOffSeperators, approach.removeQuotes].filter(Boolean).length;
    };

    const getApproachComplexity = (approach: SearchApproachConfig): { level: string; color: string; description: string } => {
        const activeFeatures = getApproachComplexityScore(approach);
        
        if (activeFeatures === 0) {
            return { level: 'Basic', color: 'default', description: 'Raw search without processing' };
        } else if (activeFeatures === 1) {
            return { level: 'Simple', color: 'primary', description: 'Single processing step' };
        } else if (activeFeatures === 2) {
            return { level: 'Advanced', color: 'warning', description: 'Multiple processing steps' };
        } else {
            return { level: 'Complex', color: 'error', description: 'Full processing pipeline' };
        }
    };

    const renderApproachCard = (
        approach: SearchApproachConfig,
        index: number,
        onUpdate: (index: number, field: string, value: any) => void,
        platform: string
    ) => {
        const complexity = getApproachComplexity(approach);
        
        return (
            <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {approach.name}
                            </Typography>
                            <Chip 
                                label={complexity.level}
                                size="small"
                                color={complexity.color as any}
                                variant="outlined"
                            />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip 
                                label={`Step ${index + 1}`}
                                size="small"
                                variant="filled"
                            />
                            <Tooltip title={complexity.description}>
                                <IconButton size="small">
                                    <Info fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>

                    <Box sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                        gap: 2,
                        mb: 2
                    }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={approach.filtered}
                                    onChange={(e) => onUpdate(index, 'filtered', e.target.checked)}
                                />
                            }
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Tune fontSize="small" />
                                    <span>Apply Word Filtering</span>
                                </Box>
                            }
                        />
                        
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={approach.cutOffSeperators}
                                    onChange={(e) => onUpdate(index, 'cutOffSeperators', e.target.checked)}
                                />
                            }
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Speed fontSize="small" />
                                    <span>Cut Off Separators</span>
                                </Box>
                            }
                        />
                        
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={approach.removeQuotes}
                                    onChange={(e) => onUpdate(index, 'removeQuotes', e.target.checked)}
                                />
                            }
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <span>Remove Quotes</span>
                                </Box>
                            }
                        />
                    </Box>

                    {/* Configuration Summary */}
                    <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                            <strong>Processing Pipeline:</strong>{' '}
                            {[
                                approach.filtered && 'Word Filtering',
                                approach.cutOffSeperators && 'Separator Cut-off',
                                approach.removeQuotes && 'Quote Removal'
                            ].filter(Boolean).join(' → ') || 'No Processing (Raw Search)'}
                        </Typography>
                    </Box>

                    {/* Performance Impact Indicator */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                            Performance Impact:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {[1, 2, 3].map((level) => (
                                <Box
                                    key={level}
                                    sx={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        bgcolor: level <= getApproachComplexityScore(approach) ? 
                                            (level === 1 ? 'success.main' : level === 2 ? 'warning.main' : 'error.main') : 
                                            'action.disabled'
                                    }}
                                />
                            ))}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                            ({getApproachComplexityScore(approach) === 0 ? 'Minimal' : getApproachComplexityScore(approach) === 1 ? 'Low' : getApproachComplexityScore(approach) === 2 ? 'Medium' : 'High'})
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        );
    };

    const renderPlatformSection = (
        platform: string,
        approaches: SearchApproachConfig[],
        onUpdate: (index: number, field: string, value: any) => void,
        description: string,
        icon: React.ReactNode
    ) => {
        const expanded = expandedSections[platform.toLowerCase()];
        
        return (
            <Box sx={{ mb: 4 }}>
                <Box 
                    sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 2,
                        '&:hover': { bgcolor: 'action.hover' }
                    }}
                    onClick={() => toggleSection(platform.toLowerCase())}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {icon}
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {platform} Search Approaches
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {description}
                            </Typography>
                        </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Chip 
                            label={`${approaches.length} approaches`}
                            size="small"
                            variant="outlined"
                        />
                        <IconButton>
                            {expanded ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                    </Box>
                </Box>

                <Collapse in={expanded}>
                    <Box sx={{ pl: 2 }}>
                        <Alert severity="info" sx={{ mb: 3 }}>
                            <Typography variant="body2">
                                <strong>Search Strategy:</strong> Each approach is tried in sequence until matches are found.
                                Start with more specific approaches and fall back to broader ones.
                            </Typography>
                        </Alert>
                        
                        {approaches.map((approach, index) => 
                            renderApproachCard(approach, index, onUpdate, platform.toLowerCase())
                        )}
                    </Box>
                </Collapse>
            </Box>
        );
    };

    const activeFeatures = (approaches: SearchApproachConfig[]) => {
        return approaches.reduce((total, approach) => {
            return total + [approach.filtered, approach.cutOffSeperators, approach.removeQuotes].filter(Boolean).length;
        }, 0);
    };

    return (
        <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>Search Approaches Configuration</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                Configure platform-specific search strategies. Each platform uses different approaches 
                in sequence until matches are found.
            </Typography>

            {/* Platform Overview */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 4 }}>
                <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="primary">{plexApproaches.length}</Typography>
                        <Typography variant="body2" color="text.secondary">Plex Approaches</Typography>
                        <Typography variant="caption" color="text.secondary">
                            {activeFeatures(plexApproaches)} total processing features
                        </Typography>
                    </CardContent>
                </Card>
                
                <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="secondary">{tidalApproaches.length}</Typography>
                        <Typography variant="body2" color="text.secondary">Tidal Approaches</Typography>
                        <Typography variant="caption" color="text.secondary">
                            {activeFeatures(tidalApproaches)} total processing features
                        </Typography>
                    </CardContent>
                </Card>
            </Box>

            {/* Plex Section */}
            {renderPlatformSection(
                'Plex',
                plexApproaches,
                onUpdatePlex,
                'Local media server with comprehensive metadata and search capabilities',
                <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 1, borderRadius: 1, fontSize: '0.875rem', fontWeight: 600 }}>
                    PLEX
                </Box>
            )}

            <Divider sx={{ my: 4 }} />

            {/* Tidal Section */}
            {renderPlatformSection(
                'Tidal',
                tidalApproaches,
                onUpdateTidal,
                'Streaming service with high-quality audio and music discovery',
                <Box sx={{ bgcolor: 'secondary.main', color: 'white', p: 1, borderRadius: 1, fontSize: '0.875rem', fontWeight: 600 }}>
                    TIDAL
                </Box>
            )}

            {/* Key Differences Alert */}
            <Alert severity="warning" sx={{ mt: 4 }}>
                <Typography variant="body2">
                    <strong>⚠️ Platform Differences:</strong><br />
                    • Plex includes quote removal by default for better local file matching<br />
                    • Tidal approaches are optimized for streaming service metadata<br />
                    • These differences are intentional and should be preserved unless you have specific requirements
                </Typography>
            </Alert>

            {/* Performance Tips */}
            <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                    <strong>🚀 Performance Tips:</strong><br />
                    • Put the most effective approaches first to reduce search time<br />
                    • Complex processing takes more time but may find better matches<br />
                    • Consider your library size when choosing the number of approaches<br />
                    • Monitor search performance after making changes
                </Typography>
            </Alert>
        </Box>
    );
};

export default SearchApproachesEditor;