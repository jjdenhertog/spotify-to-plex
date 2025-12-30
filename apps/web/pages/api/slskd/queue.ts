import { generateError } from '@/helpers/errors/generateError';
import { getSlskdSettings } from '@spotify-to-plex/plex-config/functions/getSlskdSettings';
import { queueDownload, type SlskdDownloadFile } from '@spotify-to-plex/slskd-music-search/actions/queueDownload';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';

type QueueRequest = {
    files: {
        username: string;
        filename: string;
        size?: number;
        bitRate?: number;
        bitDepth?: number;
        extension?: string;
    }[];
    track: {
        title: string;
        artist: string;
        album?: string;
    };
};

const router = createRouter<NextApiRequest, NextApiResponse>()
    .post(async (req, res) => {
        try {
            // Validate input
            const { files, track } = req.body as QueueRequest;

            if (!files || !Array.isArray(files) || files.length === 0) {
                return res.status(400).json({
                    error: 'Missing required field: files array'
                });
            }

            if (!track?.title || !track.artist) {
                return res.status(400).json({
                    error: 'Missing required track fields: title, artist'
                });
            }

            // Get settings
            const settings = await getSlskdSettings();

            if (!settings.enabled) {
                return res.status(400).json({ error: 'SLSKD is not enabled' });
            }

            if (!settings.url) {
                return res.status(400).json({ error: 'SLSKD URL is not configured' });
            }

            if (!process.env.SLSKD_API_KEY) {
                return res.status(400).json({ error: 'SLSKD API key is not configured' });
            }

            const apiKey = process.env.SLSKD_API_KEY;

            console.log(`[SLSKD Queue] Queuing ${files.length} file(s) for: ${track.artist} - ${track.title}`);

            // Queue the files
            let queuedFile: SlskdDownloadFile;
            try {
                queuedFile = await queueDownload(files, {
                    baseUrl: settings.url,
                    apiKey
                });
                console.log(`[SLSKD Queue] Successfully queued: ${queuedFile.filename}`);
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                console.error(`[SLSKD Queue] Failed to queue files:`, error);

                return res.status(500).json({
                    error: `Failed to queue download. ${errorMsg}`
                });
            }

            // Success response
            return res.status(200).json({
                success: true,
                message: 'File queued for download',
                track: {
                    title: track.title,
                    artist: track.artist,
                    album: track.album
                },
                file: {
                    filename: queuedFile.filename,
                    username: queuedFile.username,
                    size: queuedFile.size,
                    bitRate: queuedFile.bitRate,
                    bitDepth: queuedFile.bitDepth,
                    extension: queuedFile.extension
                }
            });

        } catch (error) {
            console.error('[SLSKD Queue] Unexpected error:', error);
            res.status(500).json({
                error: `Failed to queue download: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        }
    });

export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "SLSKD Queue", err);
    }
});
