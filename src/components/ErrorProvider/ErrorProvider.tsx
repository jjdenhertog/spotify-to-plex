"use client";

import CloseOutlined from '@mui/icons-material/CloseOutlined';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary, Box, Dialog, DialogContent, DialogTitle, IconButton, Paper, Typography } from "@mui/material";
import { Component } from "react";
import { ErrorContext } from "./ErrorContext";
import { ProviderContext } from "./types";

type State = {
    error: string;
    stack?: string;
    contextValue: ProviderContext
}
type ErrorProviderProps = {
    readonly children?: React.ReactNode | React.ReactNode[];
}

export let showError: ProviderContext['showError'];

 
export default class ErrorProvider extends Component<ErrorProviderProps, State> {

    public constructor(props: ErrorProviderProps) {
        super(props)

        showError = this.showError;

        this.state = {
            error: "",
            contextValue: {
                showError: this.showError.bind(this),
            }
        };
    }

    public showError = (msg: string, stack?: string) => {
        this.setState({ error: msg, stack })
    }

    public render() {
        const { error, stack, contextValue } = this.state;

        const handleClose = () => {
            this.setState({ error: "" });
        };

        return (
            <>
                <ErrorContext.Provider value={contextValue} />
                {!!error &&
                    <Dialog open maxWidth="sm" fullWidth>
                        <DialogTitle sx={{ paddingTop: 3, paddingBottom: .5 }}>
                            <IconButton
                                size="small"
                                onClick={handleClose}
                                sx={{ position: 'absolute', right: 8, top: 8 }}
                            >
                                <CloseOutlined fontSize="small" />
                            </IconButton>
                            Error
                        </DialogTitle>
                        <DialogContent>
                            <Typography>
                                {error}
                            </Typography>
                            {stack && stack != error ? <Box mt={2}>
                                <Accordion>
                                    <AccordionSummary expandIcon={<ExpandMore />}>
                                        <Typography>Stack Trace</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Paper elevation={0} sx={{ bgcolor: 'action.hover' }}>
                                            <Box p={1}>
                                                <Typography
                                                    component="div"
                                                    variant="body2"
                                                    mt={1}
                                                    fontFamily="monospace"
                                                    fontSize="12px"
                                                    position="relative"
                                                >
                                                    <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
                                                        {stack}
                                                    </pre>
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

        )
    }
}
