import { ButtonProps, DialogActionsProps, DialogContentProps, DialogProps, DialogTitleProps } from "@mui/material";



export type ConfirmOptions = {
    title?: React.ReactNode;
    titleProps?: DialogTitleProps;
    content?: React.ReactNode | null;
    contentProps?: DialogContentProps;
    confirmationText?: React.ReactNode;
    cancellationText?: React.ReactNode;
    dialogProps?: Omit<DialogProps, "open">;
    dialogActionsProps?: DialogActionsProps;
    confirmationButtonProps?: ButtonProps;
    cancellationButtonProps?: ButtonProps;
    allowClose?: boolean;
    hideCancelButton?: boolean;
    buttonOrder?: string[];
    rejectOnCancel?: boolean;
}

export type ProviderContext = {
    confirm: (options: ConfirmOptions) => Promise<void>;
    // closeSnackbar: (key?: SnackbarKey) => void;
}
