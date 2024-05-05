import { SnackbarProvider, SnackbarProviderProps } from "notistack";


export const BSnackbarProvider = (props: SnackbarProviderProps) => {
    return <SnackbarProvider
        autoHideDuration={3000}
        transitionDuration={300}
        dense
        variant="success"
        style={{ fontWeight: 400, fontFamily:"Noto Sans" }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        {...props}
    />
}