import { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';
import { generateError } from '@/helpers/errors/generateError';
import { resetToDefaults } from '@spotify-to-plex/music-search/functions/resetToDefaults';
import { getStorageDir } from '@spotify-to-plex/shared-utils/utils/getStorageDir';

const router = createRouter<NextApiRequest, NextApiResponse>()
    .post(
        async (_req, res) => {
            try {
                const storageDir = getStorageDir();
                const config = await resetToDefaults(storageDir);

                return res.status(200).json({
                    success: true,
                    message: 'Configuration reset to defaults successfully',
                    config
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
        generateError(req, res, "Reset Config", err);
    }
});