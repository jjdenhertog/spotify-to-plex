import React, { useState, useCallback } from 'react';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Switch,
    Tooltip,
    Typography,
    Chip
} from '@mui/material';
import {
    DragHandle as DragHandleIcon,
    Delete as DeleteIcon,
    Add as AddIcon
} from '@mui/icons-material';
import { MatchFilterRule } from '../types/MatchFilterTypes';
import ExpressionInput from './ExpressionInput';

type TableEditorProps = {
    filters: MatchFilterRule[];
    onChange: (filters: MatchFilterRule[]) => void;
    disabled?: boolean;
};

const TableEditor: React.FC<TableEditorProps> = ({
    filters,
    onChange,
    disabled = false
}) => {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    // Add new filter
    const handleAddFilter = useCallback(() => {
        const newFilter: MatchFilterRule = {
            reason: 'New filter rule',
            expression: 'artist:match',
            enabled: true
        };
        onChange([...filters, newFilter]);
        setEditingIndex(filters.length); // Start editing the new filter
    }, [filters, onChange]);

    // Delete filter
    const handleDeleteFilter = useCallback((index: number) => {
        const newFilters = filters.filter((_, i) => i !== index);
        onChange(newFilters);
    }, [filters, onChange]);

    // Update filter property
    const handleUpdateFilter = useCallback((index: number, updates: Partial<MatchFilterRule>) => {
        const newFilters = filters.map((filter, i) => 
            i === index ? { ...filter, ...updates } : filter
        );
        onChange(newFilters);
    }, [filters, onChange]);

    // Toggle enabled state
    const handleToggleEnabled = useCallback((index: number) => {
        handleUpdateFilter(index, { enabled: !filters[index]?.enabled });
    }, [filters, handleUpdateFilter]);

    // Handle drag and drop
    const handleDragStart = useCallback((index: number) => {
        setDraggedIndex(index);
    }, []);

    const handleDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
    }, []);

    const handleDrop = useCallback((event: React.DragEvent, targetIndex: number) => {
        event.preventDefault();
        if (draggedIndex === null || draggedIndex === targetIndex) {
            setDraggedIndex(null);
            return;
        }

        const newFilters = [...filters];
        const movedFilter = newFilters[draggedIndex];
        if (!movedFilter) return;
        newFilters.splice(draggedIndex, 1);
        newFilters.splice(targetIndex, 0, movedFilter);
        
        onChange(newFilters);
        setDraggedIndex(null);
    }, [draggedIndex, filters, onChange]);

    const handleDragEnd = useCallback(() => {
        setDraggedIndex(null);
    }, []);

    // Handle reason editing
    const handleReasonChange = useCallback((index: number, newReason: string) => {
        handleUpdateFilter(index, { reason: newReason });
    }, [handleUpdateFilter]);

    const handleReasonKeyDown = useCallback((event: React.KeyboardEvent, _index: number) => {
        if (event.key === 'Enter' || event.key === 'Escape') {
            setEditingIndex(null);
        }
    }, []);

    // Handle expression change
    const handleExpressionChange = useCallback((index: number, expression: string) => {
        handleUpdateFilter(index, { expression });
    }, [handleUpdateFilter]);

    // Get priority indicator color
    const getPriorityColor = (index: number) => {
        if (index === 0) return 'error'; // Highest priority
        if (index <= 2) return 'warning'; // High priority
        if (index <= 5) return 'primary'; // Medium priority
        return 'default'; // Lower priority
    };

    return (
        <Box>
            {/* Header with add button */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    Filters are evaluated in order. First match wins. Drag rows to reorder.
                </Typography>
                <IconButton 
                    onClick={handleAddFilter} 
                    color="primary" 
                    disabled={disabled}
                    size="small"
                >
                    <AddIcon />
                </IconButton>
            </Box>

            {/* Filter table */}
            <TableContainer component={Paper} variant="outlined">
                <Table size="small" sx={{ minWidth: 650 }}>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.50' }}>
                            <TableCell width={40}></TableCell> {/* Drag handle */}
                            <TableCell width={60}>On/Off</TableCell>
                            <TableCell width={80}>Priority</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Expression</TableCell>
                            <TableCell width={60}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filters.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">
                                        No filters configured. Click the + button to add your first filter.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filters.map((filter, index) => (
                                <TableRow
                                    key={index}
                                    draggable={!disabled}
                                    onDragStart={() => handleDragStart(index)}
                                    onDragOver={handleDragOver}
                                    onDrop={(event) => handleDrop(event, index)}
                                    onDragEnd={handleDragEnd}
                                    sx={{
                                        height: 56, // ~40px content + padding
                                        opacity: filter.enabled ? 1 : 0.6,
                                        bgcolor: draggedIndex === index ? 'action.hover' : 'inherit',
                                        '&:hover': {
                                            bgcolor: 'action.hover'
                                        },
                                        cursor: !disabled ? 'grab' : 'default',
                                        '&:active': {
                                            cursor: !disabled ? 'grabbing' : 'default'
                                        }
                                    }}
                                >
                                    {/* Drag Handle */}
                                    <TableCell>
                                        <Tooltip title="Drag to reorder">
                                            <IconButton 
                                                size="small" 
                                                disabled={disabled}
                                                sx={{ cursor: 'grab' }}
                                            >
                                                <DragHandleIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>

                                    {/* Enable/Disable Toggle */}
                                    <TableCell>
                                        <Switch
                                            checked={filter.enabled !== false} // Default to true if undefined
                                            onChange={() => handleToggleEnabled(index)}
                                            disabled={disabled}
                                            size="small"
                                        />
                                    </TableCell>

                                    {/* Priority Indicator */}
                                    <TableCell>
                                        <Chip
                                            label={index + 1}
                                            size="small"
                                            color={getPriorityColor(index)}
                                            variant="outlined"
                                        />
                                    </TableCell>

                                    {/* Reason/Description */}
                                    <TableCell>
                                        {editingIndex === index ? (
                                            <input
                                                type="text"
                                                value={filter.reason}
                                                onChange={(e) => handleReasonChange(index, e.target.value)}
                                                onBlur={() => setEditingIndex(null)}
                                                onKeyDown={(e) => handleReasonKeyDown(e, index)}
                                                disabled={disabled}
                                                style={{
                                                    border: 'none',
                                                    background: 'transparent',
                                                    width: '100%',
                                                    fontSize: '0.875rem',
                                                    fontFamily: 'inherit'
                                                }}
                                                autoFocus
                                            />
                                        ) : (
                                            <Typography 
                                                variant="body2" 
                                                onClick={() => !disabled && setEditingIndex(index)}
                                                sx={{ 
                                                    cursor: disabled ? 'default' : 'pointer',
                                                    '&:hover': {
                                                        bgcolor: disabled ? 'transparent' : 'action.hover',
                                                        borderRadius: 1,
                                                        px: 1,
                                                        py: 0.5,
                                                        mx: -1,
                                                        my: -0.5
                                                    }
                                                }}
                                            >
                                                {filter.reason}
                                            </Typography>
                                        )}
                                    </TableCell>

                                    {/* Expression Input */}
                                    <TableCell>
                                        <ExpressionInput
                                            value={filter.expression}
                                            onChange={(expression) => handleExpressionChange(index, expression)}
                                            disabled={disabled}
                                            size="small"
                                            placeholder="e.g., artist:match AND title:contains"
                                        />
                                    </TableCell>

                                    {/* Delete Button */}
                                    <TableCell>
                                        <Tooltip title="Delete filter">
                                            <IconButton 
                                                onClick={() => handleDeleteFilter(index)}
                                                disabled={disabled}
                                                size="small"
                                                color="error"
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Footer info */}
            {filters.length > 0 && (
                <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                        {filters.filter(f => f.enabled !== false).length} of {filters.length} filters enabled
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip size="small" color="error" variant="outlined" label="1 = Highest priority" />
                        <Chip size="small" color="warning" variant="outlined" label="2-3 = High" />
                        <Chip size="small" color="primary" variant="outlined" label="4-6 = Medium" />
                        <Chip size="small" color="default" variant="outlined" label="7+ = Lower" />
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default TableEditor;
