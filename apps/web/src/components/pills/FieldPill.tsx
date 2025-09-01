import React, { useCallback } from 'react';
import { Chip } from '@mui/material';
import type { FieldType } from '../../types/MatchFilterTypes';

type FieldPillProps = {
    readonly field: FieldType;
    readonly isConfigured?: boolean;
    readonly onClick?: (field: FieldType) => void;
    readonly disabled?: boolean;
};

const FieldPill: React.FC<FieldPillProps> = ({
    field,
    isConfigured = false,
    onClick,
    disabled = false
}) => {
    const handleClick = useCallback(() => {
        if (!!onClick && !disabled) {
            onClick(field);
        }
    }, [onClick, field, disabled]);

    return (
        <Chip
            label={field}
            clickable={!!onClick && !disabled}
            disabled={disabled}
            onClick={handleClick}
            variant={isConfigured ? 'filled' : 'outlined'}
            color={isConfigured ? 'primary' : 'default'}
            size="small"
            sx={{
                marginRight: 1,
                marginBottom: 0.5,
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                    transform: !!onClick && !disabled ? 'scale(1.05)' : 'none',
                },
                '&.MuiChip-filled': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                },
                '&.MuiChip-outlined': {
                    borderColor: 'grey.400',
                    color: 'text.secondary',
                },
            }}
        />
    );
};

export default FieldPill;