import { BSnackbarProvider } from "@/components/BSnackbarProvider";
import { ConfirmProvider } from "@/components/ConfirmProvider/ConfirmProvider";
import { Box, CircularProgress, Container } from "@mui/material";
import ErrorProvider from "../components/ErrorProvider/ErrorProvider";
export default function MainLayout(props) {
    const { children, loading, maxWidth = "100%" } = props;
    return (<Container sx={{ padding: 0 }}>
            <ErrorProvider />
            <BSnackbarProvider />
            <ConfirmProvider />
            <Container sx={{ maxWidth, padding: 0 }}>
                {loading ? <Box display="flex" justifyContent="center" pt={12}>
                    <CircularProgress size={40}/>
                </Box> : null}
                {!loading &&
            <Box pt={6}>
                        {children}
                    </Box>}
            </Container>
        </Container>);
}
//# sourceMappingURL=MainLayout.jsx.map