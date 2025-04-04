import { BSnackbarProvider } from "@/components/BSnackbarProvider";
import { ConfirmProvider } from "@/components/ConfirmProvider/ConfirmProvider";
import { Box, CircularProgress, Container } from "@mui/material";
import ErrorProvider from "../components/ErrorProvider/ErrorProvider";

type MainLayoutProps = {
    readonly children: React.ReactNode,
    readonly loading?: boolean
    readonly maxWidth?: string
}

export default function MainLayout(props: MainLayoutProps) {
    const { children, loading, maxWidth = "100%" } = props;

    return (
        <Container sx={{ padding: 0 }}>
            <ErrorProvider />
            <BSnackbarProvider />
            <ConfirmProvider />
            <Container sx={{ maxWidth, padding: 0 }}>
                {loading ? <Box display="flex" justifyContent="center" pt={12}>
                    <CircularProgress size={40} />
                </Box> : null}
                {!loading &&
                    <Box pt={6}>
                        {children}f
                    </Box>
                }
            </Container>
        </Container>
    )
}