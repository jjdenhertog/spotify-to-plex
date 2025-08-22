import { Box, Typography } from "@mui/material";
import Link from "next/link";
export default function Logo() {
    return (<Box textAlign="center">
            <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                <Box display="flex" gap={.2} pb={1} alignItems="center" justifyContent="center" maxWidth={400} margin="0 auto">
                    <img src="/img/logo.png" alt="Logo" width={80} height={80}/>
                </Box>
                <Typography sx={{ mb: 2 }} variant="body2">Spotify to Plex</Typography>
            </Link>
        </Box>);
}
//# sourceMappingURL=Logo.jsx.map