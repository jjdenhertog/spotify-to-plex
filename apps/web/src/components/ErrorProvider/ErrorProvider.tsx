"use client";

import React, { memo, useCallback, useMemo, useState } from "react";
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary, Box, Dialog, DialogContent, DialogTitle, IconButton, Paper, Typography } from "@mui/material";
import { ErrorContext } from "./ErrorContext";
import { ProviderContext } from "./types";

type ErrorProviderProps = {
    readonly children?: React.ReactNode | React.ReactNode[];
}

export let showError: ProviderContext['showError'];

const ErrorProviderComponent = ({ children }: ErrorProviderProps) => {
    const [error, setError] = useState("");
    const [stack, setStack] = useState<string | undefined>();

    const showErrorHandler = useCallback((msg: string, stackTrace?: string) => {
        setError(msg);
        setStack(stackTrace);
    }, []);

    showError = showErrorHandler;

    const contextValue = useMemo<ProviderContext>(() => ({
        showError: showErrorHandler
    }), [showErrorHandler]);

    const handleClose = useCallback(() => {
        setError("");
    }, []);

    return (
        <>
            <ErrorContext.Provider value={contextValue}>
                {children}
            </ErrorContext.Provider>
            {!!error &&
                <Dialog open maxWidth="sm" fullWidth onClose={handleClose} aria-describedby="error-dialog-description">
                    <DialogTitle sx={{ paddingTop: 3, paddingBottom: .5 }}>
                        <IconButton size="small" onClick={handleClose} sx={{ position: 'absolute', right: 8, top: 8 }} aria-label="Close">
                            <CloseOutlined fontSize="small" />
                        </IconButton>
                        Error
                    </DialogTitle>
                    <DialogContent>
                        <Typography id="error-dialog-description">
                            {error}
                        </Typography>
                        {!!stack && stack !== error ? <Box mt={2}>
                            <Accordion>
                                <AccordionSummary expandIcon={<ExpandMore />}>
                                    <Typography>Stack Trace</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Paper elevation={0} sx={{ bgcolor: 'action.hover' }}>
                                        <Box p={1}>
                                            <Typography component="div" variant="body2" mt={1} fontFamily="monospace" fontSize="12px" position="relative">
                                                <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>{stack}</pre>
                                            </Typography>
                                        </Box>
                                    </Paper>
                                </AccordionDetails>
                            </Accordion>
                        </Box> : null
                        }
                    </DialogContent>
                </Dialog>
            }
        </>
    );
};

ErrorProviderComponent.displayName = 'ErrorProvider';

const ErrorProvider = memo(ErrorProviderComponent);

export default ErrorProvider;