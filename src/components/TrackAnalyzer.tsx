import { errorBoundary } from "@/helpers/errors/errorBoundary";
import type { SearchResponse, PlexTrack } from "@jjdenhertog/plex-music-search";
import CloseIcon from '@mui/icons-material/Close';
import { Box, CircularProgress, Divider, IconButton, Modal, Typography } from "@mui/material";
import axios from "axios";
import { Fragment, useEffect, useState } from "react";

type Props = {
    readonly track: {
        id: string
        artists: string[];
        title: string;
        reason?: string;
    }
    readonly fast: boolean
    readonly onClose: () => void;
}

export default function TrackAnalyzer(props: Props) {

    const { track, fast = false, onClose } = props;
    const [loading, setLoading] = useState(true)
    const [searchResponse, setSearchResponse] = useState<SearchResponse>()
    useEffect(() => {

        errorBoundary(async () => {

            const result = await axios.post(`/api/plex/analyze`, {
                item: track,
                fast
            })

            setSearchResponse(result.data)
            setLoading(false)
        })

    }, [fast, track])

    const getRoundedSimilarity = (value: number) => {
        return `${Math.round(value * 100)}%`
    }

    return (<Modal open onClose={onClose}>
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', maxWidth: 600, bgcolor: 'background.paper', p: 3, borderRadius: 1 }}>
            <IconButton
                size="small"
                onClick={onClose}
                sx={{ position: 'absolute', right: 8, top: 8 }}
            >
                <CloseIcon fontSize="small" />
            </IconButton>
            {!!loading && <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
            </Box>}

            {!loading && !!searchResponse &&
                <>
                    <Typography variant="h6" sx={{ mb: 1 }}>Results</Typography>
                    {searchResponse.result.map(({ id, title, artist, matching, reason }: PlexTrack) => {
                        if (!matching)
                            return null;

                        return <Fragment key={`analyze-${id}`}>
                            <Box>
                                <Typography variant="h6" sx={{ mb: 1 }}>Reason for match: {reason}</Typography>
                                <Typography variant="body1">{title}</Typography>
                                <Typography variant="body2">{artist.title}</Typography>
                            </Box>
                            <Box key={id} sx={{ display: 'flex', gap: 2 }}>
                                <Box>
                                    <Typography variant="body1">Artist</Typography>
                                    <Typography variant="body2">Match: {matching.artist.match ? "Yes" : "No"}</Typography>
                                    <Typography variant="body2">Contains: {matching.artist.contains ? "Yes" : "No"}</Typography>
                                    <Typography variant="body2">Similarity: {getRoundedSimilarity(matching.artist.similarity)}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body1">Artist in Title</Typography>
                                    <Typography variant="body2">Match: {matching.artistInTitle.match ? "Yes" : "No"}</Typography>
                                    <Typography variant="body2">Contains: {matching.artistInTitle.contains ? "Yes" : "No"}</Typography>
                                    <Typography variant="body2">Similarity: {getRoundedSimilarity(matching.artistInTitle.similarity)}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body1">Artist with Title</Typography>
                                    <Typography variant="body2">Match: {matching.artistWithTitle.match ? "Yes" : "No"}</Typography>
                                    <Typography variant="body2">Contains: {matching.artistWithTitle.contains ? "Yes" : "No"}</Typography>
                                    <Typography variant="body2">Similarity: {getRoundedSimilarity(matching.artistWithTitle.similarity)}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body1">Title</Typography>
                                    <Typography variant="body2">Match: {matching.title.match ? "Yes" : "No"}</Typography>
                                    <Typography variant="body2">Contains: {matching.title.contains ? "Yes" : "No"}</Typography>
                                    <Typography variant="body2">Similarity: {getRoundedSimilarity(matching.title.similarity)}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body1">Album</Typography>
                                    <Typography variant="body2">Match: {matching.album.match ? "Yes" : "No"}</Typography>
                                    <Typography variant="body2">Contains: {matching.album.contains ? "Yes" : "No"}</Typography>
                                    <Typography variant="body2">Similarity: {getRoundedSimilarity(matching.album.similarity)}</Typography>
                                </Box>
                            </Box>

                            <Divider sx={{ mt: 1, mb: 1 }} />
                        </Fragment>
                    })}
                </>
            }
        </Box>
    </Modal>)
}