import { BSnackbarProvider } from "@/components/BSnackbarProvider";
import { Box, CircularProgress, Container } from "@mui/joy";
import ErrorProvider from "../components/ErrorProvider/ErrorProvider";
interface MainLayoutProps {
    children: React.ReactNode,
    loading?: boolean
}
export default function MainLayout(props: MainLayoutProps) {
    const { children, loading } = props;
    return (
        <Container style={{ maxWidth: "100%", padding: 0 }}>
            <ErrorProvider />
            <BSnackbarProvider />
            <Container style={{ maxWidth: "100%", padding: 0 }}>
                {loading &&
                    <Box display={'flex'} justifyContent={'center'} pt={12}>
                        <CircularProgress size="md" />
                    </Box>}
                {!loading &&
                    <Box pt={6}>
                        {children}
                    </Box>
                }
            </Container>
        </Container >
    )
}