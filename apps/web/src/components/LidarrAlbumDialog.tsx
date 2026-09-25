import { errorBoundary } from "@/helpers/errors/errorBoundary";
import { GetMusicBrainzMappingResponse } from "@/pages/api/lidarr/musicbrainz-mapping";
import CloseIcon from '@mui/icons-material/Close';
import {
    Alert,
    Box,
    Button,
    Dialog,
    Divider,
    IconButton,
    Modal,
    Typography
} from "@mui/material";
import axios from "axios";
import { useCallback, useMemo, useState } from "react";
import MusicBrainzSeederButtons from "./MusicBrainzSeederButtons";

type AlbumData = {
    artist_name: string;
    album_name: string;
    spotify_album_id?: string;
};

type SendResult = {
    success: boolean;
    message: string;
    code?: 'NO_MUSICBRAINZ_MAPPING';
};

type Props = {
    readonly onClose: () => void;
    readonly albums: AlbumData[];
};

export default function LidarrAlbumDialog(props: Props) {
    const { onClose, albums } = props;
    const [sendingAlbums, setSendingAlbums] = useState<Set<string>>(new Set());
    const [sentAlbums, setSentAlbums] = useState<Map<string, SendResult>>(new Map());
    const [checkingAlbums, setCheckingAlbums] = useState<Set<string>>(new Set());
    const [mappedAlbums, setMappedAlbums] = useState<Set<string>>(new Set());

    const getAlbumKey = (album: AlbumData) => `${album.artist_name}|${album.album_name}`;

    const albumMap = useMemo(() => {
        const map = new Map<string, AlbumData>();

        albums.forEach(album => {
            map.set(getAlbumKey(album), album);
        });

        return map;
    }, [albums]);

    const handleSendAlbumClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
        const key = event.currentTarget.dataset.albumKey;

        if (!key)
            return;

        const album = albumMap.get(key);

        if (!album)
            return;

        setSendingAlbums(prev => new Set(prev).add(key));

        errorBoundary(async () => {
            const result = await axios.post<SendResult>(
                '/api/lidarr/send-album',
                album
            );

            setSentAlbums(prev => new Map(prev).set(key, result.data));
            setSendingAlbums(prev => {
                const newSet = new Set(prev);
                newSet.delete(key);

                return newSet;
            });
        }, (error: unknown) => {
            // Extract error message from API response
            let errorMessage = 'Album could not be processed by Lidarr, attempt a manual import instead.';
            let code: SendResult['code'];

            if (axios.isAxiosError(error) && error.response?.data?.message) {
                errorMessage = error.response.data.message;
                ({ code } = error.response.data);
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }

            setSentAlbums(prev => new Map(prev).set(key, {
                success: false,
                message: errorMessage,
                code
            }));
            setSendingAlbums(prev => {
                const newSet = new Set(prev);
                newSet.delete(key);

                return newSet;
            });
        }, true);
    }, [albumMap]);

    const handleRecheckClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
        const key = event.currentTarget.dataset.albumKey;

        if (!key)
            return;

        const album = albumMap.get(key);

        if (!album)
            return;

        const removeChecking = () => setCheckingAlbums(prev => {
            const newSet = new Set(prev);
            newSet.delete(key);

            return newSet;
        });

        setCheckingAlbums(prev => new Set(prev).add(key));

        errorBoundary(async () => {
            const result = await axios.post<GetMusicBrainzMappingResponse>('/api/lidarr/musicbrainz-mapping', album);

            if (result.data.found) {
                // Clearing the failed result re-enables the Send button
                setSentAlbums(prev => {
                    const newMap = new Map(prev);
                    newMap.delete(key);

                    return newMap;
                });
                setMappedAlbums(prev => new Set(prev).add(key));
            } else {
                setSentAlbums(prev => new Map(prev).set(key, {
                    success: false,
                    code: 'NO_MUSICBRAINZ_MAPPING',
                    message: `Still no MusicBrainz mapping found for Spotify album: ${album.spotify_album_id}. New releases can take a minute to show up.`
                }));
            }

            removeChecking();
        }, removeChecking, true);
    }, [albumMap]);

    return (
        <Modal open onClose={onClose}>
            <Dialog open onClose={onClose}>
                <Box sx={{ maxWidth: 600, p: 2, position: 'relative' }}>
                    <IconButton size="small" onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>

                    <Typography variant="h6">
                        Send Albums to Lidarr
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Select albums to send to Lidarr for download.
                    </Typography>

                    <Divider sx={{ mb: 2 }} />

                    {albums.length === 0 ? (
                        <Alert severity="info">
                            No unique albums found to send to Lidarr.
                        </Alert>
                    ) : (
                        <Box>
                            {albums.map((album) => {
                                const key = getAlbumKey(album);
                                const isSending = sendingAlbums.has(key);
                                const isChecking = checkingAlbums.has(key);
                                const result = sentAlbums.get(key);
                                const isUnmapped = result?.code === 'NO_MUSICBRAINZ_MAPPING';

                                return (
                                    <Box key={key} sx={{ mb: 2 }}>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                mb: 1
                                            }}>
                                            <Box>
                                                <Typography variant="body2">
                                                    {album.album_name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {album.artist_name}
                                                </Typography>
                                            </Box>
                                            <Button variant="outlined" size="small" data-album-key={key} onClick={handleSendAlbumClick} disabled={isSending || isChecking || !!result}>
                                                {isSending ? 'Sending...' : result ? 'Sent' : 'Send'}
                                            </Button>
                                        </Box>

                                        {result ? <Alert severity={result.success ? 'success' : 'error'} sx={{ mt: 1 }}>
                                            {result.message}
                                        </Alert> : null}

                                        {mappedAlbums.has(key) && !result ? <Alert severity="info" sx={{ mt: 1 }}>
                                            MusicBrainz mapping found, ready to send.
                                        </Alert> : null}

                                        {isUnmapped && !!album.spotify_album_id ? (
                                            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                                                <Typography variant="caption" color="text.secondary" sx={{ flexBasis: '100%' }}>
                                                    Add this album to MusicBrainz, then re-check:
                                                </Typography>
                                                <MusicBrainzSeederButtons spotifyAlbumId={album.spotify_album_id} />
                                                <Box>
                                                    <Button variant="outlined" size="small" sx={{ fontSize: '.8em' }} data-album-key={key} onClick={handleRecheckClick} disabled={isChecking}>
                                                        {isChecking ? 'Checking...' : 'Re-check'}
                                                    </Button>
                                                </Box>
                                            </Box>
                                        ) : null}

                                        <Divider sx={{ mt: 1 }} />
                                    </Box>
                                );
                            })}
                        </Box>
                    )}
                </Box>
            </Dialog>
        </Modal>
    );
}
