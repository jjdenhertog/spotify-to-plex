import { GetTidalTracksResponse } from "@/pages/api/tidal";
import { Alert, Box, Button, Divider, Typography } from "@mui/material";
import { Track } from "@spotify-to-plex/shared-types/spotify/Track";
import axios from "axios";
import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from "react";

type SlskdSearchResult = {
    success: boolean;
    message: string;
    bestMatch?: {
        filename: string;
        username: string;
    };
    metadata?: {
        extractedArtist: string;
        extractedTitle: string;
        extractedAlbum: string;
    };
    matchInfo?: {
        totalMatches: number;
        queriesAttempted: number;
        approaches: string[];
    };
};

type MissingTrackProps = {
    readonly track: Track;
    readonly tidalTrack?: GetTidalTracksResponse;
    readonly slskdEnabled: boolean;
    readonly slskdBusy?: boolean;
}

export type MissingTrackHandle = {
    sendToSlskd: () => Promise<{ success: boolean; message: string }>;
    stopSlskd: () => void;
}

const MissingTrack = forwardRef<MissingTrackHandle, MissingTrackProps>((props, ref) => {
    const { track, tidalTrack, slskdEnabled, slskdBusy = false } = props;

    // Local state for SLSKD operations
    const [isSending, setIsSending] = useState(false);
    const [result, setResult] = useState<SlskdSearchResult>();
    const abortControllerRef = useRef<AbortController | null>(null);

    // Determine if track title should be colored warning (missing Tidal track)
    const hasMissingTidalTrack = !!tidalTrack && !!tidalTrack.tidal_ids && tidalTrack.tidal_ids.length === 0;

    // Handle stopping the SLSKD request
    const stopSending = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
    }, []);

    // Handle sending to SLSKD - two-step: search then queue (allows cancellation between)
    const sendToSlskd = useCallback(async () => {
        setIsSending(true);
        abortControllerRef.current = new AbortController();

        const artist = track.artists[0] || 'Unknown Artist';

        try {
            // Step 1: Search for the track
            const searchResponse = await axios.post<Array<{
                id: string;
                result?: Array<{
                    username: string;
                    filename: string;
                    size: number;
                    bitRate?: number;
                    bitDepth?: number;
                    extension?: string;
                }>;
                queries?: Array<{ approach: string }>;
            }>>(
                '/api/slskd/search',
                {
                    items: [{
                        id: track.id,
                        artists: track.artists,
                        title: track.title,
                        album: track.album
                    }]
                },
                { signal: abortControllerRef.current.signal }
            );

            // Check if stopped after search
            if (!abortControllerRef.current) {
                setIsSending(false);
                return { success: false, message: 'Stopped' };
            }

            const searchResult = searchResponse.data[0];
            if (!searchResult?.result || searchResult.result.length === 0) {
                const errorResult: SlskdSearchResult = {
                    success: false,
                    message: 'No files found for this track',
                    matchInfo: {
                        totalMatches: 0,
                        queriesAttempted: searchResult?.queries?.length || 0,
                        approaches: searchResult?.queries?.map(q => q.approach) || []
                    }
                };
                setResult(errorResult);
                setIsSending(false);
                return { success: false, message: errorResult.message };
            }

            // Get top matches (up to 10) for fallback in case some sources are unavailable
            const MAX_FALLBACK_SOURCES = 10;
            const topMatches = searchResult.result.slice(0, MAX_FALLBACK_SOURCES);

            if (topMatches.length === 0) {
                const errorResult: SlskdSearchResult = {
                    success: false,
                    message: 'No valid match found',
                    matchInfo: {
                        totalMatches: 0,
                        queriesAttempted: searchResult?.queries?.length || 0,
                        approaches: searchResult?.queries?.map(q => q.approach) || []
                    }
                };
                setResult(errorResult);
                setIsSending(false);
                return { success: false, message: errorResult.message };
            }

            // Step 2: Queue the download with multiple sources for fallback
            const queueResponse = await axios.post<{
                success: boolean;
                message: string;
                file?: { filename: string; username: string };
            }>(
                '/api/slskd/queue',
                {
                    files: topMatches.map(match => ({
                        username: match.username,
                        filename: match.filename,
                        size: match.size,
                        bitRate: match.bitRate,
                        bitDepth: match.bitDepth,
                        extension: match.extension
                    })),
                    track: {
                        title: track.title,
                        artist,
                        album: track.album
                    }
                },
                { signal: abortControllerRef.current.signal }
            );

            // Use the actual queued file from the response (may differ from first match if fallback was used)
            const queuedFile = queueResponse.data.file || topMatches[0];

            const successResult: SlskdSearchResult = {
                success: true,
                message: 'Track queued for download',
                bestMatch: {
                    filename: queuedFile.filename,
                    username: queuedFile.username
                },
                matchInfo: {
                    totalMatches: searchResult.result.length,
                    queriesAttempted: searchResult.queries?.length || 0,
                    approaches: searchResult.queries?.map(q => q.approach) || []
                }
            };
            setResult(successResult);
            setIsSending(false);

            return { success: true, message: queueResponse.data.message };
        } catch (error) {
            // Check if request was cancelled
            if (axios.isCancel(error)) {
                setIsSending(false);
                return { success: false, message: 'Stopped' };
            }

            let errorMessage = 'Failed to send to SLSKD';
            let errorDetails;

            if (axios.isAxiosError(error) && error.response?.data) {
                const errorData = error.response.data;
                errorMessage = errorData.error || errorMessage;
                errorDetails = errorData.details;
            }

            const errorResult: SlskdSearchResult = {
                success: false,
                message: errorMessage,
                matchInfo: errorDetails
            };
            setResult(errorResult);
            setIsSending(false);

            return { success: false, message: errorMessage };
        }
    }, [track]);

    // Expose sendToSlskd and stopSlskd via ref for batch operations
    useImperativeHandle(ref, () => ({
        sendToSlskd,
        stopSlskd: stopSending
    }), [sendToSlskd, stopSending]);

    const onSendToSlskdClick = useCallback(() => {
        sendToSlskd();
    }, [sendToSlskd]);


    const spotifyId = useMemo(()=>{
        return track.id.replace('spotify:track:', '');
    }, [track.id]);

    return (
        <>
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    '& .btn': { visibility: isSending ? 'visible' : 'hidden' },
                    '&:hover .btn': { visibility: 'visible' },
                    gap: 1,
                    mb: 1
                }}
            >
                <Box>
                    <Typography variant="body2" color={hasMissingTidalTrack ? 'warning' : undefined}>
                        {track.title}
                    </Typography>
                    <Typography variant="caption">{track.artists.join(', ')}</Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    {/* SLSKD Button */}
                    {!!slskdEnabled && (
                        <Box>
                            {isSending ? (
                                <Button onClick={stopSending} className="btn" color="error" variant="outlined" size="small" sx={{ fontSize: '.8em', visibility: 'visible' }}>
                                    Stop
                                </Button>
                            ) : (
                                <Button onClick={onSendToSlskdClick} className="btn" color="primary" variant="outlined" size="small" sx={{ fontSize: '.8em' }} disabled={slskdBusy}>
                                    Send to SLSKD
                                </Button>
                            )}
                        </Box>
                    )}

                    {/* Tidal Button */}
                    {!!tidalTrack && !!tidalTrack.tidal_ids && tidalTrack.tidal_ids.length > 0 && (
                        <Box>
                            <Button
                                component="a"
                                href={`https://tidal.com/browse/track/${tidalTrack.tidal_ids[0]}`}
                                target="_blank"
                                className="btn"
                                color="inherit"
                                variant="outlined"
                                size="small"
                                sx={{ fontSize: '.8em' }}
                            >
                                Tidal
                            </Button>
                        </Box>
                    )}

                    {/* Spotify Button */}
                    <Box>
                        <Button
                            component="a"
                            href={`https://open.spotify.com/track/${spotifyId}`}
                            target="_blank"
                            className="btn"
                            color="inherit"
                            variant="outlined"
                            size="small"
                            sx={{ fontSize: '.8em' }}
                        >
                            Spotify
                        </Button>
                    </Box>
                </Box>
            </Box>

            {/* Result Alert with Detailed Information */}
            {result ? (
                <Box sx={{ mt: 1 }}>
                    <Alert severity={result.success ? 'success' : 'error'} sx={{ fontSize: '.85em' }}>
                        {result.message}
                    </Alert>

                    {/* Show detailed match information on success */}
                    {result.success && result.bestMatch ? (
                        <Box sx={{ mt: 1, p: 1.5, bgcolor: 'action.hover', borderRadius: 1, fontSize: '.85em' }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                Best Match Found
                            </Typography>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                <Typography variant="body2">
                                    <strong>File:</strong> {result.bestMatch.filename}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Source:</strong> {result.bestMatch.username}
                                </Typography>

                                {/* Metadata extraction info */}
                                {result.metadata ? (
                                    <Box sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
                                        <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 'bold' }}>
                                            Extracted Metadata
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Artist:</strong> {result.metadata.extractedArtist}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Title:</strong> {result.metadata.extractedTitle}
                                        </Typography>
                                        {result.metadata.extractedAlbum ? (
                                            <Typography variant="body2">
                                                <strong>Album:</strong> {result.metadata.extractedAlbum}
                                            </Typography>
                                        ) : null}
                                    </Box>
                                ) : null}

                                {/* Match statistics */}
                                {result.matchInfo ? (
                                    <Box sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Found {result.matchInfo.totalMatches} match{result.matchInfo.totalMatches === 1 ? '' : 'es'}
                                            {' '}using {result.matchInfo.queriesAttempted} quer{result.matchInfo.queriesAttempted === 1 ? 'y' : 'ies'}
                                            {result.matchInfo.approaches.length > 0 ? (
                                                <> ({result.matchInfo.approaches.join(', ')})</>
                                            ) : null}
                                        </Typography>
                                    </Box>
                                ) : null}
                            </Box>
                        </Box>
                    ) : null}

                    {/* Show search info on error if available */}
                    {!result.success && result.matchInfo ? (
                        <Box sx={{ mt: 1, p: 1, bgcolor: 'action.hover', borderRadius: 1, fontSize: '.85em' }}>
                            <Typography variant="caption" color="text.secondary">
                                Tried {result.matchInfo.queriesAttempted} quer{result.matchInfo.queriesAttempted === 1 ? 'y' : 'ies'}
                                {result.matchInfo.approaches.length > 0 ? (
                                    <> using approaches: {result.matchInfo.approaches.join(', ')}</>
                                ) : null}
                            </Typography>
                        </Box>
                    ) : null}
                </Box>
            ) : null}

            <Divider sx={{ mt: 1, mb: 1 }} />
        </>
    );
});

MissingTrack.displayName = 'MissingTrack';

export default MissingTrack;
