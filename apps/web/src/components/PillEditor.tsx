import React, { useCallback, useState, useMemo } from 'react';
import { Box } from '@mui/material';
import { expressionToPills, Pill } from '../utils/expressionToPills';
import { pillsToExpression } from '../utils/pillsToExpression';
import FieldPill from './pills/FieldPill';
import AddPill from './pills/AddPill';
import FieldSelectorPopup from './popups/FieldSelectorPopup';
import OperationSelectorPopup from './popups/OperationSelectorPopup';
import type { FieldType, OperationType, OperationText } from '../types/MatchFilterTypes';

type PillEditorProps = {
    readonly value: string;
    readonly onChange: (value: string) => void;
    readonly disabled?: boolean;
    readonly placeholder?: string;
    readonly size?: 'small' | 'medium';
};


const PillEditor: React.FC<PillEditorProps> = ({
    value,
    onChange,
    disabled = false,
    placeholder = 'Click + Add Field to start',
    size = 'small'
}) => {
    // State for popups
    const [fieldSelectorOpen, setFieldSelectorOpen] = useState(false);
    const [operationSelectorOpen, setOperationSelectorOpen] = useState(false);
    const [selectedPillId, setSelectedPillId] = useState<string | null>(null);
    const [popupAnchorEl, setPopupAnchorEl] = useState<HTMLElement | null>(null);

    // Parse expression to pills
    const pills = useMemo(() => {
        return expressionToPills(value);
    }, [value]);

    // Get selected pill for popup
    const selectedPill = useMemo(() => {
        return selectedPillId ? pills.find(p => p.id === selectedPillId) : undefined;
    }, [selectedPillId, pills]);

    // Convert pills back to expression and notify parent
    const updateExpression = useCallback((newPills: Pill[]) => {
        const newExpression = pillsToExpression(newPills);
        onChange(newExpression);
    }, [onChange]);

    // Handle adding a new field
    const handleAddField = useCallback(() => {
        if (disabled) return;

        // For the AddPill component, we'll use a ref or different approach for anchoring
        setFieldSelectorOpen(true);
    }, [disabled]);

    // Handle add field with anchor element
    const handleAddFieldWithAnchor = useCallback((event: React.MouseEvent<HTMLElement>) => {
        if (disabled) return;

        setPopupAnchorEl(event.currentTarget);
        setFieldSelectorOpen(true);
    }, [disabled]);

    // Handle field selection from popup
    const handleFieldSelect = useCallback((field: FieldType) => {
        const newPills = [...pills];
        
        // If there are already condition pills, add an AND combinator first
        const conditionPills = pills.filter(p => p.type === 'condition');
        if (conditionPills.length > 0) {
            newPills.push({
                id: `pill-${Date.now()}-and`,
                type: 'combinator',
                combinator: 'AND',
                text: 'AND'
            });
        }
        
        // Add the new field pill
        newPills.push({
            id: `pill-${Date.now()}`,
            type: 'condition',
            field,
            text: field
        });

        updateExpression(newPills);
        setFieldSelectorOpen(false);
        setPopupAnchorEl(null);
    }, [pills, updateExpression]);

    // Handle clicking on a field pill to edit operation
    const handleFieldPillClick = useCallback((pillId: string, event: React.MouseEvent<HTMLElement>) => {
        if (disabled) return;

        event.preventDefault();
        setSelectedPillId(pillId);
        setPopupAnchorEl(event.currentTarget);
        setOperationSelectorOpen(true);
    }, [disabled]);

    // Handle operation selection from popup
    const handleOperationSelect = useCallback((operation: OperationType, threshold?: number) => {
        if (!selectedPillId) return;

        const newPills = pills.map(pill => {
            if (pill.id === selectedPillId) {
                let operationText: OperationText = operation;
                if (operation === 'similarity' && threshold !== undefined) {
                    operationText = `similarity>=${threshold / 100}`;
                }

                return {
                    ...pill,
                    operation,
                    threshold: operation === 'similarity' && threshold !== undefined ? threshold / 100 : undefined,
                    text: `${pill.field}:${operationText}`
                };
            }

            return pill;
        });

        updateExpression(newPills);
        setOperationSelectorOpen(false);
        setSelectedPillId(null);
        setPopupAnchorEl(null);
    }, [selectedPillId, pills, updateExpression]);

    // Handle pill deletion
    const handlePillDelete = useCallback(() => {
        if (!selectedPillId) return;

        // Find the pill and its index
        const pillIndex = pills.findIndex(pill => pill.id === selectedPillId);
        if (pillIndex === -1) return;

        const newPills = [...pills];
        
        // Remove the pill
        newPills.splice(pillIndex, 1);
        
        // If we removed a condition pill and there's a combinator before or after, remove it too
        const removedPill = pills[pillIndex];
        if (removedPill?.type === 'condition') {
            // Check if there's a combinator after this position
            if (pillIndex < newPills.length && newPills[pillIndex]?.type === 'combinator') {
                newPills.splice(pillIndex, 1);
            }
            // Otherwise check if there's a combinator before this position
            else if (pillIndex > 0 && newPills[pillIndex - 1]?.type === 'combinator') {
                newPills.splice(pillIndex - 1, 1);
            }
        }

        updateExpression(newPills);
        setOperationSelectorOpen(false);
        setSelectedPillId(null);
        setPopupAnchorEl(null);
    }, [selectedPillId, pills, updateExpression]);

    // Close popups
    const handleClosePopups = useCallback(() => {
        setFieldSelectorOpen(false);
        setOperationSelectorOpen(false);
        setSelectedPillId(null);
        setPopupAnchorEl(null);
    }, []);

    // Check if a pill is configured (has operation)
    const isPillConfigured = useCallback((pill: Pill) => {
        return pill.type === 'condition' && !!pill.operation;
    }, []);

    // Create field pill click handler for a specific pill
    const createFieldPillClickHandler = useCallback((pill: Pill) => {
        return () => {
            const element = document.getElementById(`pill-${pill.id}`);
            if (element) {
                const event = {
                    currentTarget: element,
                    preventDefault: () => { /* empty handler */ }
                } as React.MouseEvent<HTMLElement>;
                handleFieldPillClick(pill.id, event);
            }
        };
    }, [handleFieldPillClick]);

    return (
        <Box>
            {/* Pills container */}
            <Box
                sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 0.5,
                    minHeight: size === 'small' ? 32 : 40,
                    alignItems: 'center',
                    p: 1,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    backgroundColor: disabled ? 'action.disabled' : 'background.paper',
                    '&:hover:not([data-disabled])': {
                        borderColor: 'primary.main'
                    }
                }}
                data-disabled={disabled || undefined}
            >
                {/* Render all pills */}
                {pills.map((pill) => (
                    <React.Fragment key={pill.id}>
                        {pill.type === 'condition' && pill.field ? (
                            <Box id={`pill-${pill.id}`}>
                                <FieldPill field={pill.field} isConfigured={isPillConfigured(pill)} onClick={createFieldPillClickHandler(pill)} disabled={disabled} displayText={isPillConfigured(pill) ? pill.text : pill.field} />
                            </Box>
                        ) : pill.type === 'combinator' ? (
                            <Box component="span" sx={{ mx: 1, fontSize: '0.75rem', color: 'text.secondary', fontWeight: 'medium' }}>
                                {pill.combinator}
                            </Box>
                        ) : null}
                    </React.Fragment>
                ))}

                {/* Add field pill */}
                <Box onClick={handleAddFieldWithAnchor}>
                    <AddPill onClick={handleAddField} disabled={disabled} label="+ Add Field" />
                </Box>

                {/* Empty state */}
                {pills.length === 0 && (
                    <Box sx={{ color: 'text.secondary', fontSize: '0.875rem', fontStyle: 'italic', py: 0.5 }}>
                        {placeholder}
                    </Box>
                )}
            </Box>

            {/* Field selector popup */}
            <FieldSelectorPopup open={fieldSelectorOpen} anchorEl={popupAnchorEl} onClose={handleClosePopups} onFieldSelect={handleFieldSelect} />

            {/* Operation selector popup */}
            <OperationSelectorPopup 
                open={operationSelectorOpen} 
                anchorEl={popupAnchorEl} 
                onClose={handleClosePopups} 
                onOperationSelect={handleOperationSelect}
                onDelete={handlePillDelete}
                currentOperation={selectedPill?.operation}
                currentThreshold={selectedPill?.threshold ? Math.round(selectedPill.threshold * 100) : undefined}
            />
        </Box>
    );
};

export default PillEditor;