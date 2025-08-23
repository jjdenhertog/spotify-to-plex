import { useCallback, useEffect, useState } from "react";
import ConfirmationDialog from "./ConfirmationDialog";
import { ConfirmContext } from "./ConfirmContext";
import { ConfirmOptions, ProviderContext } from './types';


const DEFAULT_OPTIONS: ConfirmOptions = {
    title: "Are you sure?",
    content: "",
    confirmationText: "Yes, delete",
    cancellationText: "Cancel",
    dialogProps: { maxWidth: "xs" },
    dialogActionsProps: {},
    confirmationButtonProps: {
        variant: "contained",
        size: "small",
        color: "error"
    },
    cancellationButtonProps: {
        size: "small",
        color: "secondary"
    },
    titleProps: {
        variant: "h2",
        pt: 3,
        pb: .5,
        sx: { borderTop: (theme) => `solid 3px ${theme.palette.error.main}` }
    },
    allowClose: true,
    hideCancelButton: false,
    buttonOrder: ["cancel", "confirm"],
};

const buildOptions = (options: ConfirmOptions) => {
    const dialogProps = {
        ...(DEFAULT_OPTIONS.dialogProps), ...options.dialogProps,
    };
    const dialogActionsProps = {
        ...(DEFAULT_OPTIONS.dialogActionsProps), ...options.dialogActionsProps,
    };
    const confirmationButtonProps = {
        ...(DEFAULT_OPTIONS.confirmationButtonProps), ...options.confirmationButtonProps,
    };
    const cancellationButtonProps = {
        ...(DEFAULT_OPTIONS.cancellationButtonProps), ...options.cancellationButtonProps,
    };
    const titleProps = {
        ...(DEFAULT_OPTIONS.titleProps), ...options.titleProps,
    };
    const contentProps = {
        ...(DEFAULT_OPTIONS.contentProps), ...options.contentProps,
    };

    return {
        ...DEFAULT_OPTIONS,
        ...options,
        dialogProps,
        dialogActionsProps,
        confirmationButtonProps,
        cancellationButtonProps,
        titleProps,
        contentProps
    };
};


export let confirm: ProviderContext['confirm'];
export const ConfirmProvider = () => {

    // Set confirm
    confirm = (options: ConfirmOptions = {}) => {
        return new Promise<void>((resolve, reject) => {
            setOptions(options);
            setResolveReject([resolve, reject]);
        })
    }
    const [options, setOptions] = useState<ConfirmOptions>({})
    const [resolveReject, setResolveReject] = useState<Function[]>([]);
    const [context] = useState<ProviderContext>({ confirm })

    const handleClose = useCallback(() => {
        setResolveReject([])
    }, [])

    const handleCancel = useCallback(() => {
        if (options.rejectOnCancel) {
            const [_confirm, reject] = resolveReject;
            if (reject)
                reject()
        }

        handleClose()
    }, [handleClose, options.rejectOnCancel, resolveReject])
    const handleConfirm = useCallback(() => {

        const [resolve] = resolveReject;
        if (resolve)
            resolve()

        handleClose()
    }, [handleClose, resolveReject])

    const onPressEnter = useCallback((e: KeyboardEvent) => {
        if (e.key == "Enter" && resolveReject.length == 2)
            handleConfirm();
    }, [handleConfirm, resolveReject.length])

    useEffect(() => {

        document.addEventListener('keydown', onPressEnter)

        return () => {
            document.removeEventListener('keydown', onPressEnter)
        }
    }, [onPressEnter])

    return (
        <>
            <ConfirmContext.Provider value={context} />
            {resolveReject.length == 2 &&
                <ConfirmationDialog
                    open={resolveReject.length === 2}
                    options={buildOptions(options)}
                    onClose={handleClose}
                    onCancel={handleCancel}
                    onConfirm={handleConfirm}
                />
            }
        </>

    )

}
