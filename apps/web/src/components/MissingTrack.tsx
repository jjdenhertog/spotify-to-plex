import { GetTidalTracksResponse } from "@/pages/api/tidal";
import { Alert, Box, Button, Divider, Typography } from "@mui/material";
import { Track } from "@spotify-to-plex/shared-types/spotify/Track";
import axios from "axios";
import { forwardRef, useCallback, useImperativeHandle, useMemo, useState } from "react";

type SlskdSearchResult = {
    success: boolean;
    message: string;
    bestMatch?: {
        filename: string;
        username: string;
        size: number;
        bitRate?: number;
        bitDepth?: number;
        sampleRate?: number;
        extension: string;
        length?: number;
        isLocked: boolean;
    };
    metadata?: {
        extractedArtist: string;
        extractedTitle: string;
        extractedAlbum: string;
        pattern: string;
        confidence: number;
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
}

export type MissingTrackHandle = {
    sendToSlskd: () => Promise<{ success: boolean; message: string }>;
}

const MissingTrack = forwardRef<MissingTrackHandle, MissingTrackProps>((props, ref) => {
    const { track, tidalTrack, slskdEnabled } = props;

    // Local state for SLSKD operations
    const [isSending, setIsSending] = useState(false);
    const [result, setResult] = useState<SlskdSearchResult>();

    // Determine if track title should be colored warning (missing Tidal track)
    const hasMissingTidalTrack = !!tidalTrack && !!tidalTrack.tidal_ids && tidalTrack.tidal_ids.length === 0;

    // Handle sending to SLSKD - now returns a promise
    const sendToSlskd = useCallback(async () => {
        setIsSending(true);

        try {
            const response = await axios.post<SlskdSearchResult>(
                '/api/slskd/send-track',
                {
                    id: track.id,
                    title: track.title,
                    artist: track.artists[0] || 'Unknown Artist',
                    album: track.album
                }
            );

            setResult(response.data);
            setIsSending(false);

            return { success: response.data.success, message: response.data.message };
        } catch (error) {
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

    // Expose sendToSlskd via ref
    useImperativeHandle(ref, () => ({
        sendToSlskd
    }), [sendToSlskd]);

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
                            <Button
                                onClick={onSendToSlskdClick}
                                disabled={isSending}
                                className="btn"
                                color="primary"
                                variant="outlined"
                                size="small"
                                sx={{ fontSize: '.8em' }}
                            >
                                {isSending ? 'Sending...' : 'Send to SLSKD'}
                            </Button>
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

                                {/* Quality metrics */}
                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 0.5 }}>
                                    {result.bestMatch.bitRate ? (
                                        <Typography variant="body2">
                                            <strong>Bitrate:</strong> {result.bestMatch.bitRate} kbps
                                        </Typography>
                                    ) : null}
                                    {result.bestMatch.sampleRate ? (
                                        <Typography variant="body2">
                                            <strong>Sample Rate:</strong> {(result.bestMatch.sampleRate / 1000).toFixed(1)} kHz
                                        </Typography>
                                    ) : null}
                                    {result.bestMatch.bitDepth ? (
                                        <Typography variant="body2">
                                            <strong>Bit Depth:</strong> {result.bestMatch.bitDepth} bit
                                        </Typography>
                                    ) : null}
                                    <Typography variant="body2">
                                        <strong>Format:</strong> {result.bestMatch.extension.toUpperCase()}
                                    </Typography>
                                </Box>

                                {/* Metadata extraction info */}
                                {result.metadata ? (
                                    <Box sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
                                        <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 'bold' }}>
                                            Extracted Metadata (Confidence: {Math.round(result.metadata.confidence * 100)}%)
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
                                        <Typography variant="caption" color="text.secondary">
                                            Pattern: {result.metadata.pattern}
                                        </Typography>
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
