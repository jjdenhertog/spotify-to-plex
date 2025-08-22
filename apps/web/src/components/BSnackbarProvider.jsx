import { useTheme } from "@mui/material/styles";
import { SnackbarProvider } from "notistack";
export const BSnackbarProvider = (props) => {
    const theme = useTheme();
    return <SnackbarProvider autoHideDuration={3000} transitionDuration={300} dense variant="success" style={{ fontWeight: 400, fontFamily: theme.typography.fontFamily }} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} {...props}/>;
};
//# sourceMappingURL=BSnackbarProvider.jsx.map