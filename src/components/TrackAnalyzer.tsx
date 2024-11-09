import { errorBoundary } from "@/helpers/errors/errorBoundary";
import { SearchResponse } from "@jjdenhertog/plex-music-search";
import { Box, CircularProgress, Divider, Modal, ModalClose, ModalDialog, Typography } from "@mui/joy";
import axios from "axios";
import { useEffect, useState } from "react";

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

            const result = await axios.post<SearchResponse>(`/api/plex/analyze`, {
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

    return (<Modal open onClose={onClose} disableEscapeKeyDown disablePortal>
        <ModalDialog sx={{ maxWidth: 600 }}>
            <ModalClose />
            {!!loading && <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
            </Box>}

            {!loading && !!searchResponse &&
                <>
                    <Typography level="h1">Track Analyzer</Typography>
                    <Typography level="body-md">Below you find the exact data on which your tracks were matched. It can help you understand why the track was matched. This data can also be used to optimize the matching alghorithm.</Typography>

                    <Divider sx={{ mt: 1, mb: 1 }} />
                    <Box>
                        <Typography level="h2" mb={.5}>Searching for:</Typography>
                        <Typography level="body-md" mb={0}>{track.title}</Typography>
                        <Typography level="body-md" mb={1}>{track.artists.join(', ')}</Typography>
                    </Box>

                    {searchResponse.result.map(item => {
                        const { title, artist, id, matching, reason } = item;

                        if (!matching)
                            return null;

                        return <>
                            <Box>
                                <Typography level="h2" mb={1}>Reason for match: {reason}</Typography>
                                <Typography level="body-md">{title}</Typography>
                                <Typography level="body-sm">{artist.title}</Typography>
                            </Box>
                            <Box key={id} sx={{ display: 'flex', gap: 2 }}>
                                <Box>
                                    <Typography level="body-md">Artist</Typography>
                                    <Typography level="body-sm">Match: {matching.artist.match ? "Yes" : "No"}</Typography>
                                    <Typography level="body-sm">Contains: {matching.artist.contains ? "Yes" : "No"}</Typography>
                                    <Typography level="body-sm">Similarity: {getRoundedSimilarity(matching.artist.similarity)}</Typography>
                                </Box>
                                <Box>
                                    <Typography level="body-md">Artist in Title</Typography>
                                    <Typography level="body-sm">Match: {matching.artistInTitle.match ? "Yes" : "No"}</Typography>
                                    <Typography level="body-sm">Contains: {matching.artistInTitle.contains ? "Yes" : "No"}</Typography>
                                    <Typography level="body-sm">Similarity: {getRoundedSimilarity(matching.artistInTitle.similarity)}</Typography>
                                </Box>
                                <Box>
                                    <Typography level="body-md">Artist with Title</Typography>
                                    <Typography level="body-sm">Match: {matching.artistWithTitle.match ? "Yes" : "No"}</Typography>
                                    <Typography level="body-sm">Contains: {matching.artistWithTitle.contains ? "Yes" : "No"}</Typography>
                                    <Typography level="body-sm">Similarity: {getRoundedSimilarity(matching.artistWithTitle.similarity)}</Typography>
                                </Box>
                                <Box>
                                    <Typography level="body-md">Title</Typography>
                                    <Typography level="body-sm">Match: {matching.title.match ? "Yes" : "No"}</Typography>
                                    <Typography level="body-sm">Contains: {matching.title.contains ? "Yes" : "No"}</Typography>
                                    <Typography level="body-sm">Similarity: {getRoundedSimilarity(matching.title.similarity)}</Typography>
                                </Box>
                                <Box>
                                    <Typography level="body-md">Album</Typography>
                                    <Typography level="body-sm">Match: {matching.album.match ? "Yes" : "No"}</Typography>
                                    <Typography level="body-sm">Contains: {matching.album.contains ? "Yes" : "No"}</Typography>
                                    <Typography level="body-sm">Similarity: {getRoundedSimilarity(matching.album.similarity)}</Typography>
                                </Box>
                            </Box>

                            <Divider sx={{ mt: 1, mb: 1 }} />
                        </>
                    })}
                </>
            }
        </ModalDialog>
    </Modal>)
}