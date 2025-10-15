import { errorBoundary } from "@/helpers/errors/errorBoundary";
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

type AlbumData = {
    artist_name: string;
    album_name: string;
    spotify_album_id?: string;
};

type Props = {
    readonly onClose: () => void;
    readonly albums: AlbumData[];
};

export default function LidarrAlbumDialog(props: Props) {
    const { onClose, albums } = props;
    const [sendingAlbums, setSendingAlbums] = useState<Set<string>>(new Set());
    const [sentAlbums, setSentAlbums] = useState<Map<string, { success: boolean; message: string }>>(new Map());

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
            const result = await axios.post<{ success: boolean; message: string }>(
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

            if (axios.isAxiosError(error) && error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }

            setSentAlbums(prev => new Map(prev).set(key, {
                success: false,
                message: errorMessage
            }));
            setSendingAlbums(prev => {
                const newSet = new Set(prev);
                newSet.delete(key);

                return newSet;
            });
        }, true);
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
                                const result = sentAlbums.get(key);

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
                                            <Button variant="outlined" size="small" data-album-key={key} onClick={handleSendAlbumClick} disabled={isSending || !!result}>
                                                {isSending ? 'Sending...' : result ? 'Sent' : 'Send'}
                                            </Button>
                                        </Box>

                                        {result ? <Alert severity={result.success ? 'success' : 'error'} sx={{ mt: 1 }}>
                                            {result.message}
                                        </Alert> : null}

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
