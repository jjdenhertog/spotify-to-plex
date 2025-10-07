import { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';
import { generateError } from '@/helpers/errors/generateError';
import { getTextProcessing } from '@spotify-to-plex/music-search/functions/getTextProcessing';
import { updateTextProcessing } from '@spotify-to-plex/music-search/functions/updateTextProcessing';
import { getStorageDir } from '@spotify-to-plex/shared-utils/utils/getStorageDir';
import { validateTextProcessing } from '@spotify-to-plex/music-search/validation/validateTextProcessing';

const router = createRouter<NextApiRequest, NextApiResponse>()
    .get(
        async (_req, res) => {
            try {
                const storageDir = getStorageDir();
                const config = await getTextProcessing(storageDir);

                return res.status(200).json(config);
            } catch (error) {
                return res.status(500).json({
                    error: 'Internal server error',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        })
    .post(
        async (req, res) => {
            try {
                const storageDir = getStorageDir();
                const newConfig = req.body;

                if (!validateTextProcessing(newConfig)) {
                    return res.status(400).json({
                        error: 'Invalid text processing configuration format',
                        details: 'Expected object with filterOutWords, filterOutQuotes, cutOffSeparators arrays'
                    });
                }

                const updatedConfig = await updateTextProcessing(storageDir, newConfig);

                return res.status(200).json({
                    success: true,
                    message: 'Text processing configuration updated successfully',
                    config: updatedConfig
                });
            } catch (error) {
                return res.status(500).json({
                    error: 'Internal server error',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        })

export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "Text Processing", err);
    }
});