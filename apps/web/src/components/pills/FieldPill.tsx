import React, { useCallback } from 'react';
import { Chip } from '@mui/material';
import type { FieldType } from '../../types/MatchFilterTypes';

type FieldPillProps = {
    readonly field: FieldType;
    readonly isConfigured?: boolean;
    readonly onClick?: (field: FieldType) => void;
    readonly disabled?: boolean;
    readonly displayText?: string;
};

const FieldPill: React.FC<FieldPillProps> = ({
    field,
    isConfigured = false,
    onClick,
    disabled = false,
    displayText
}) => {
    const handleClick = useCallback(() => {
        if (!!onClick && !disabled) {
            onClick(field);
        }
    }, [onClick, field, disabled]);

    return (
        <Chip
            label={displayText || field}
            clickable={!!onClick && !disabled}
            disabled={disabled}
            onClick={handleClick}
            variant={isConfigured ? 'filled' : 'outlined'}
            color={isConfigured ? 'primary' : 'default'}
            size="small"
            sx={{
                mr: 1,
                mb: 0.5,
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                cursor: !!onClick && !disabled ? 'pointer' : 'default'
            }}
        />
    );
};

export default FieldPill;