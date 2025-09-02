import React, { useCallback } from 'react';
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
    Tooltip,
    Button
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Add as AddIcon
} from '@mui/icons-material';
import { MatchFilterRule } from '../types/MatchFilterTypes';
import PillEditor from './PillEditor';

type TableEditorProps = {
    readonly filters: MatchFilterRule[];
    readonly onChange: (filters: MatchFilterRule[]) => void;
    readonly disabled?: boolean;
};

const TableEditor: React.FC<TableEditorProps> = ({
    filters,
    onChange,
    disabled = false
}) => {
    // Add new filter
    const handleAddFilter = useCallback(() => {
        const newFilter: MatchFilterRule = 'artist:match';
        onChange([...filters, newFilter]);
    }, [filters, onChange]);

    // Delete filter
    const handleDeleteFilter = useCallback((index: number) => {
        const newFilters = filters.filter((_, i) => i !== index);
        onChange(newFilters);
    }, [filters, onChange]);


    // Handle expression change
    const handleExpressionChange = useCallback((index: number, newExpression: string) => {
        const newFilters = [...filters];
        newFilters[index] = newExpression;
        onChange(newFilters);
    }, [filters, onChange]);

    // Create memoized handlers for each row to avoid arrow functions in JSX
    const createExpressionChangeHandler = useCallback((index: number) => {
        return (newValue: string) => handleExpressionChange(index, newValue);
    }, [handleExpressionChange]);

    const createDeleteHandler = useCallback((index: number) => {
        return () => handleDeleteFilter(index);
    }, [handleDeleteFilter]);

    return (
        <Box>
            {/* Add button */}
            <Box sx={{ mb: 2 }}>
                <Button onClick={handleAddFilter} startIcon={<AddIcon />} variant="outlined" size="small" disabled={disabled}>
                    Add Filter Rule
                </Button>
            </Box>

            {/* Table */}
            <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Filter Expression</TableCell>
                            <TableCell width="60px" align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filters.map((filter, index) => (
                            <TableRow key={index} hover>
                                {/* Expression input - takes most space */}
                                <TableCell sx={{ width: '100%' }}>
                                    <PillEditor value={filter} onChange={createExpressionChangeHandler(index)} disabled={disabled} placeholder="Click + Add Field to start" size="small" />
                                </TableCell>

                                {/* Delete button */}
                                <TableCell align="center">
                                    <Tooltip title="Delete filter">
                                        <IconButton onClick={createDeleteHandler(index)} disabled={disabled} size="small" color="error">
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filters.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={2} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                    No filter rules configured. Click &quot;Add Filter Rule&quot; to get started.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default TableEditor;