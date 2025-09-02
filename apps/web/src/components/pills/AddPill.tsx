import React, { useCallback } from 'react';
import { Chip } from '@mui/material';

type AddPillProps = {
    readonly onClick?: () => void;
    readonly disabled?: boolean;
    readonly label?: string;
};

const AddPill: React.FC<AddPillProps> = ({
    onClick,
    disabled = false,
    label = '+ Add Field'
}) => {
    const handleClick = useCallback(() => {
        if (!!onClick && !disabled) {
            onClick();
        }
    }, [onClick, disabled]);

    return (
        <Chip
            label={label}
            clickable={!!onClick && !disabled}
            disabled={disabled}
            onClick={handleClick}
            variant="outlined"
            size="small"
            sx={{
                mr: 1,
                mb: 0.5,
                borderStyle: 'dashed',
                borderColor: 'grey.400',
                color: 'text.secondary',
                fontSize: '0.75rem',
                '&:hover:not(.Mui-disabled)': {
                    borderColor: 'primary.main',
                    color: 'primary.main'
                },
                '&.Mui-disabled': {
                    borderColor: 'grey.300',
                    color: 'grey.400'
                }
            }}
        />
    );
};

export default AddPill;