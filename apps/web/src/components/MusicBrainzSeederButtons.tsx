import { getMusicBrainzSeederUrls } from "@/helpers/musicbrainz/getMusicBrainzSeederUrls";
import { Box, Button } from "@mui/material";
import { useMemo } from "react";

type Props = {
    readonly spotifyAlbumId: string;
    readonly className?: string;
};

export default function MusicBrainzSeederButtons(props: Props) {
    const { spotifyAlbumId, className } = props;
    const urls = useMemo(() => getMusicBrainzSeederUrls(spotifyAlbumId), [spotifyAlbumId]);

    return (
        <>
            <Box>
                <Button
                    component="a"
                    href={urls.harmony}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={className}
                    color="inherit"
                    variant="outlined"
                    size="small"
                    sx={{ fontSize: '.8em' }}
                    title="Import this album into MusicBrainz with Harmony"
                >
                    Harmony
                </Button>
            </Box>
            <Box>
                <Button
                    component="a"
                    href={urls.sambl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={className}
                    color="inherit"
                    variant="outlined"
                    size="small"
                    sx={{ fontSize: '.8em' }}
                    title="Import this album into MusicBrainz with SAMBL"
                >
                    SAMBL
                </Button>
            </Box>
        </>
    );
}
