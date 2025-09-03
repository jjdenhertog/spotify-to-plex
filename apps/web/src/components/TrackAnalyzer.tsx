import { errorBoundary } from "@/helpers/errors/errorBoundary";
import type { SearchResponse } from "@spotify-to-plex/plex-music-search/types/SearchResponse";
import type { PlexTrack } from "@spotify-to-plex/plex-music-search/types/PlexTrack";
import CloseIcon from '@mui/icons-material/Close';
import { Box, CircularProgress, Divider, IconButton, Modal, Paper, Typography } from "@mui/material";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";

type Props = {
    readonly track?: {
        id: string
        artists: string[];
        title: string;
        reason?: string;
    }
    readonly fast?: boolean
    readonly onClose?: () => void;
    readonly asModal?: boolean;
    readonly searchResponse?: SearchResponse;
    readonly loading?: boolean;
    readonly onAnalyze?: (track: { id: string; artists: string[]; title: string; reason?: string }, fast: boolean) => Promise<SearchResponse>;
}

export default function TrackAnalyzer(props: Props) {

    const { 
        track, 
        fast = false, 
        onClose,
        asModal = true,
        searchResponse: externalSearchResponse,
        loading: externalLoading,
        onAnalyze 
    } = props;
    
    const [internalLoading, setInternalLoading] = useState(false)
    const [internalSearchResponse, setInternalSearchResponse] = useState<SearchResponse>()
    
    const loading = externalLoading === undefined ? internalLoading : externalLoading;
    const searchResponse = externalSearchResponse === undefined ? internalSearchResponse : externalSearchResponse;
    
    useEffect(() => {
        // Only fetch data if we're managing our own state and have a track
        if (externalSearchResponse === undefined && track && !onAnalyze) {
            setInternalLoading(true);
            errorBoundary(async () => {
                const result = await axios.post(`/api/plex/analyze`, {
                    item: track,
                    fast
                })

                setInternalSearchResponse(result.data)
                setInternalLoading(false)
            })
        } else if (onAnalyze && track && externalSearchResponse === undefined) {
            // Use provided analyze function
            setInternalLoading(true);
            errorBoundary(async () => {
                const result = await onAnalyze(track, fast);
                setInternalSearchResponse(result);
                setInternalLoading(false);
            })
        }
    }, [fast, track, externalSearchResponse, onAnalyze])

    const getRoundedSimilarity = useCallback((value: number) => {
        return `${Math.round(value * 100)}%`
    }, [])

    const renderContent = () => (
        <>
            {!!asModal && !!onClose && (
                <IconButton size="small" onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            )}
            
            {!!loading && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 5 }}>
                    <CircularProgress />
                </Box>
            )}

            {!loading && !!searchResponse && (
                <>
                    <Typography variant="h6" sx={{ mb: 2 }}>Results</Typography>
                    
                    {!!searchResponse.result && searchResponse.result.length === 0 && (
                        <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'warning.50' }}>
                            <Typography variant="body1">
                                No matches found for this track.
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Try adjusting your configuration settings or check if the track exists in your Plex library.
                            </Typography>
                        </Paper>
                    )}
                    
                    {searchResponse.result.map(({ id, title, artist, matching, reason }: PlexTrack) => {
                        if (!matching) return null;

                        return (
                            <Paper key={`analyze-${id}`} variant="outlined" sx={{ p: 2, mb: 2 }}>
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 0.5 }}>
                                        Matched Track
                                    </Typography>
                                    <Typography variant="body1">{title}</Typography>
                                    <Typography variant="body2" color="text.secondary">{artist.title}</Typography>
                                    {!!reason && (
                                        <Typography variant="body2" sx={{ mt: 1, color: 'success.main' }}>
                                            Match Reason: {reason}
                                        </Typography>
                                    )}
                                </Box>
                                
                                <Divider sx={{ my: 2 }} />
                                
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>Matching Details:</Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2 }}>
                                    <Box>
                                        <Typography variant="body2" fontWeight="bold">Artist</Typography>
                                        <Typography variant="body2">Match: {matching.artist.match ? "✅" : "❌"}</Typography>
                                        <Typography variant="body2">Contains: {matching.artist.contains ? "✅" : "❌"}</Typography>
                                        <Typography variant="body2">Similarity: {getRoundedSimilarity(matching.artist.similarity)}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" fontWeight="bold">Artist in Title</Typography>
                                        <Typography variant="body2">Match: {matching.artistInTitle.match ? "✅" : "❌"}</Typography>
                                        <Typography variant="body2">Contains: {matching.artistInTitle.contains ? "✅" : "❌"}</Typography>
                                        <Typography variant="body2">Similarity: {getRoundedSimilarity(matching.artistInTitle.similarity)}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" fontWeight="bold">Artist with Title</Typography>
                                        <Typography variant="body2">Match: {matching.artistWithTitle.match ? "✅" : "❌"}</Typography>
                                        <Typography variant="body2">Contains: {matching.artistWithTitle.contains ? "✅" : "❌"}</Typography>
                                        <Typography variant="body2">Similarity: {getRoundedSimilarity(matching.artistWithTitle.similarity)}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" fontWeight="bold">Title</Typography>
                                        <Typography variant="body2">Match: {matching.title.match ? "✅" : "❌"}</Typography>
                                        <Typography variant="body2">Contains: {matching.title.contains ? "✅" : "❌"}</Typography>
                                        <Typography variant="body2">Similarity: {getRoundedSimilarity(matching.title.similarity)}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" fontWeight="bold">Album</Typography>
                                        <Typography variant="body2">Match: {matching.album.match ? "✅" : "❌"}</Typography>
                                        <Typography variant="body2">Contains: {matching.album.contains ? "✅" : "❌"}</Typography>
                                        <Typography variant="body2">Similarity: {getRoundedSimilarity(matching.album.similarity)}</Typography>
                                    </Box>
                                </Box>
                            </Paper>
                        );
                    })}
                </>
            )}
        </>
    );

    if (asModal && onClose) {
        return (
            <Modal open onClose={onClose}>
                <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', maxWidth: 600, bgcolor: 'background.paper', p: 3, borderRadius: 1 }}>
                    {renderContent()}
                </Box>
            </Modal>
        );
    }

    return <Box>{renderContent()}</Box>;
}