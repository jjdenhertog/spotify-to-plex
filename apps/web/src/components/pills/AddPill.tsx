import React, { useCallback } from 'react';
import { Chip } from '@mui/material';
import { Add } from '@mui/icons-material';

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
            icon={<Add sx={{ fontSize: '1rem' }} />}
            label={label}
            clickable={!!onClick && !disabled}
            disabled={disabled}
            onClick={handleClick}
            variant="outlined"
            size="small"
            sx={{
                marginRight: 1,
                marginBottom: 0.5,
                borderStyle: 'dashed',
                borderColor: 'grey.400',
                color: 'text.secondary',
                fontSize: '0.75rem',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                    transform: !!onClick && !disabled ? 'scale(1.05)' : 'none',
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    '& .MuiChip-icon': {
                        color: 'primary.main',
                    },
                },
                '&.Mui-disabled': {
                    borderColor: 'grey.300',
                    color: 'grey.400',
                },
                '& .MuiChip-icon': {
                    color: 'inherit',
                    marginLeft: '-2px',
                },
            }}
        />
    );
};

export default AddPill;