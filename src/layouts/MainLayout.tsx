import { BSnackbarProvider } from "@/components/BSnackbarProvider";
import { Box, CircularProgress, Container } from "@mui/joy";
import ErrorProvider from "../components/ErrorProvider/ErrorProvider";
type MainLayoutProps = {
    readonly children: React.ReactNode,
    readonly loading?: boolean
    readonly maxWidth?: string
}
export default function MainLayout(props: MainLayoutProps) {
    const { children, loading, maxWidth = "100%" } = props;

    return (
        <Container style={{ maxWidth: "100%", padding: 0 }}>
            <ErrorProvider />
            <BSnackbarProvider />
            <Container style={{ maxWidth, padding: 0 }}>
                {loading ? <Box display="flex" justifyContent="center" pt={12}>
                    <CircularProgress size="md" />
                </Box> : null}
                {!loading &&
                    <Box pt={6}>
                        {children}
                    </Box>
                }
            </Container>
        </Container >
    )
}