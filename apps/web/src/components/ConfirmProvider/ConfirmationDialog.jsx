import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { useCallback } from "react";
const ConfirmationDialog = ({ open, options, onCancel, onConfirm, onClose }) => {
    const { title, content, confirmationText, cancellationText, dialogProps, dialogActionsProps, confirmationButtonProps, cancellationButtonProps, titleProps, contentProps, allowClose, hideCancelButton, buttonOrder, } = options;
    const onConfirmClick = useCallback(() => {
        if (onConfirm)
            onConfirm();
    }, [onConfirm]);
    const onCancelClick = useCallback(() => {
        if (onCancel)
            onCancel();
    }, [onCancel]);
    const dialogActions = (buttonOrder || []).map((buttonType) => {
        if (buttonType === "cancel" && !hideCancelButton) {
            return (<Button key="cancel" {...cancellationButtonProps} onClick={onCancelClick}>
                    {cancellationText}
                </Button>);
        }
        if (buttonType === "confirm") {
            return (<Button key="confirm" color="primary" {...confirmationButtonProps} onClick={onConfirmClick}>
                    {confirmationText}
                </Button>);
        }
        throw new Error(`Supported button types are only "confirm" and "cancel", got: ${buttonType}`);
    });
    return (<>

            {open ? <Dialog fullWidth {...dialogProps} open={open} onClose={allowClose ? onClose : undefined}>
                {title ? <DialogTitle {...titleProps}>{title}</DialogTitle> : null}
                {!!content &&
                <DialogContent {...contentProps}>
                        {content}
                    </DialogContent>}
                <DialogActions {...dialogActionsProps}>{dialogActions}</DialogActions>
            </Dialog> : null}
        </>);
};
export default ConfirmationDialog;
//# sourceMappingURL=ConfirmationDialog.jsx.map