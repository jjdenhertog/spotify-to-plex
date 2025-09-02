/* eslint-disable react/prop-types */
import { MenuItem, Popover } from "@mui/material";
import { useCallback } from "react";

import type { FieldType } from "@/types/MatchFilterTypes";

type FieldSelectorPopupProps = {
    readonly open: boolean;
    readonly anchorEl: HTMLElement | null;
    readonly onClose: () => void;
    readonly onFieldSelect: (field: FieldType) => void;
}

const FieldSelectorPopup: React.FC<FieldSelectorPopupProps> = ({
    open,
    anchorEl,
    onClose,
    onFieldSelect
}) => {
    const fields: { value: FieldType; label: string; description: string }[] = [
        { value: 'artist', label: 'Artist', description: 'Match by artist name' },
        { value: 'title', label: 'Title', description: 'Match by track title' },
        { value: 'album', label: 'Album', description: 'Match by album name' },
        { value: 'artistWithTitle', label: 'Artist with Title', description: 'Match by artist and title combined' },
        { value: 'artistInTitle', label: 'Artist in Title', description: 'Match artist name within track title' }
    ];

    const createFieldClickHandler = useCallback((field: FieldType) => () => {
        onFieldSelect(field);
        onClose();
    }, [onFieldSelect, onClose]);

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
            {fields.map((field) => (
                <MenuItem
                    key={field.value}
                    onClick={createFieldClickHandler(field.value)}
                    sx={{
                        minWidth: 200,
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        py: 1.5
                    }}
                >
                    <div style={{ fontWeight: 500 }}>
                        {field.label}
                    </div>
                    <div style={{ fontSize: '0.85em', color: 'text.secondary', marginTop: 2 }}>
                        {field.description}
                    </div>
                </MenuItem>
            ))}
        </Popover>
    );
};

export default FieldSelectorPopup;