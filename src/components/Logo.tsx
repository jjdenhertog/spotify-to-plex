import { Box, Typography } from "@mui/joy";

export default function Logo() {

    return (<Box textAlign="center">
        <Box display="flex" gap={.2} pb={1} alignItems="center" justifyContent="center" maxWidth={400} margin="0 auto">
            <img src="/img/logo.png" alt="Logo" width={80} height={80} />
        </Box>
        <Typography mb={2} level="body-sm">Spotify to Plex</Typography>
    </Box>
    )
}