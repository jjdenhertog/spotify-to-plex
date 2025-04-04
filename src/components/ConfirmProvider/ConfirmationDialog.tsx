import Button from "@mui/material/Button";
import Dialog, { DialogProps } from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { useCallback } from "react";
import { ConfirmOptions } from "./types";

type Props = {
    readonly open: boolean
    readonly options: ConfirmOptions,
    readonly onCancel: () => void
    readonly onConfirm: () => void
    readonly onClose: DialogProps["onClose"]
}

const ConfirmationDialog = ({ open, options, onCancel, onConfirm, onClose }: Props) => {
    const {
        title,
        content,
        confirmationText,
        cancellationText,
        dialogProps,
        dialogActionsProps,
        confirmationButtonProps,
        cancellationButtonProps,
        titleProps,
        contentProps,
        allowClose,
        hideCancelButton,
        buttonOrder,
    } = options;

    const onConfirmClick = useCallback(() => {
        if (onConfirm)
            onConfirm();
    }, [onConfirm])

    const onCancelClick = useCallback(() => {
        if (onCancel)
            onCancel();
    }, [onCancel])

    const dialogActions = (buttonOrder || []).map((buttonType: string) => {
        if (buttonType === "cancel" && !hideCancelButton) {
            return (
                <Button key="cancel" {...cancellationButtonProps} onClick={onCancelClick}>
                    {cancellationText}
                </Button>
            );
        }

        if (buttonType === "confirm") {
            return (
                <Button key="confirm" color="primary" {...confirmationButtonProps} onClick={onConfirmClick}>
                    {confirmationText}
                </Button>
            );
        }

        throw new Error(
            `Supported button types are only "confirm" and "cancel", got: ${buttonType}`
        );
    });

    return (

        <>

            {open ? <Dialog fullWidth {...dialogProps} open={open} onClose={allowClose ? onClose : undefined}>
                {title ? <DialogTitle {...titleProps}>{title}</DialogTitle> : null}
                {!!content &&
                    <DialogContent {...contentProps}>
                        {content}
                    </DialogContent>
                }
                <DialogActions {...dialogActionsProps}>{dialogActions}</DialogActions>
            </Dialog> : null
            }
        </>
    );
};



export default ConfirmationDialog;