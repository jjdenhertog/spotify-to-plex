/* eslint-disable react/prop-types */
import { MenuItem, Popover, Radio, RadioGroup, FormControlLabel, Divider, Typography } from "@mui/material";
import { useCallback, useState, useEffect } from "react";
import { Delete } from "@mui/icons-material";

import type { OperationType } from "@/types/MatchFilterTypes";

type OperationSelectorPopupProps = {
    readonly open: boolean;
    readonly anchorEl: HTMLElement | null;
    readonly onClose: () => void;
    readonly onOperationSelect: (operation: OperationType, threshold?: number) => void;
    readonly onDelete?: () => void;
    readonly currentOperation?: OperationType;
    readonly currentThreshold?: number;
}

const OperationSelectorPopup: React.FC<OperationSelectorPopupProps> = ({
    open,
    anchorEl,
    onClose,
    onOperationSelect,
    onDelete,
    currentOperation,
    currentThreshold
}) => {
    const [selectedThreshold, setSelectedThreshold] = useState<number>(currentThreshold || 85);

    // Update selectedThreshold when currentThreshold changes
    useEffect(() => {
        if (currentThreshold !== undefined) {
            setSelectedThreshold(currentThreshold);
        }
    }, [currentThreshold]);

    const operations = [
        { value: 'match' as OperationType, label: 'Match', description: 'Exact text matching' },
        { value: 'contains' as OperationType, label: 'Contains', description: 'Partial text matching' },
        { value: 'similarity' as OperationType, label: 'Similarity', description: 'Fuzzy matching with threshold' }
    ];

    const thresholdOptions = [
        { value: 70, label: '70%' },
        { value: 75, label: '75%' },
        { value: 80, label: '80%' },
        { value: 85, label: '85%' },
        { value: 90, label: '90%' },
        { value: 95, label: '95%' }
    ];

    const createOperationClickHandler = useCallback((operation: OperationType) => () => {
        if (operation === 'similarity') {
            onOperationSelect(operation, selectedThreshold);
        } else {
            onOperationSelect(operation);
        }

        onClose();
    }, [onOperationSelect, onClose, selectedThreshold]);

    const onThresholdChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const newThreshold = Number(event.target.value);
        setSelectedThreshold(newThreshold);
        // Automatically apply similarity with the selected threshold
        onOperationSelect('similarity', newThreshold);
        onClose();
    }, [onOperationSelect, onClose]);

    const handleDelete = useCallback(() => {
        if (onDelete) {
            onDelete();
            onClose();
        }
    }, [onDelete, onClose]);

    const handleRadioGroupClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
    }, []);

    return (
        <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={onClose}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left'
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'left'
            }}
            sx={{
                mt: 1
            }}
        >
            {operations.map((operation, index) => (
                <div key={operation.value}>
                    <MenuItem
                        onClick={operation.value === 'similarity' ? undefined : createOperationClickHandler(operation.value)}
                        selected={currentOperation === operation.value}
                        sx={{
                            minWidth: 250,
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            py: 1.5,
                            cursor: operation.value === 'similarity' ? 'default' : 'pointer',
                            '&.Mui-selected': {
                                backgroundColor: 'action.selected'
                            }
                        }}
                    >
                        <div style={{ fontWeight: 500 }}>
                            {operation.label}
                        </div>
                        <div style={{ fontSize: '0.85em', color: 'text.secondary', marginTop: 2 }}>
                            {operation.description}
                        </div>
                        
                        {operation.value === 'similarity' && (
                            <div style={{ marginTop: 12, width: '100%' }}>
                                <Typography variant="body2" sx={{ mb: 1, color: 'text.primary' }}>
                                    Threshold:
                                </Typography>
                                <RadioGroup
                                    row
                                    value={selectedThreshold}
                                    onChange={onThresholdChange}
                                    onClick={handleRadioGroupClick}
                                    sx={{
                                        '& .MuiFormControlLabel-root': {
                                            mr: 1.5,
                                            '& .MuiFormControlLabel-label': {
                                                fontSize: '0.875rem'
                                            }
                                        }
                                    }}
                                >
                                    {thresholdOptions.map((option) => (
                                        <FormControlLabel key={option.value} value={option.value} control={<Radio size="small" />} label={option.label} />
                                    ))}
                                </RadioGroup>
                            </div>
                        )}
                    </MenuItem>
                    
                    {index < operations.length - 1 && <Divider />}
                </div>
            ))}
            
            {!!onDelete && (
                <>
                    <Divider />
                    <MenuItem onClick={handleDelete} sx={{ color: 'error.main', py: 1.5 }}>
                        <Delete sx={{ mr: 1, fontSize: '1rem' }} />
                        Delete Field
                    </MenuItem>
                </>
            )}
        </Popover>
    );
};

export default OperationSelectorPopup;