import { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';
import { generateError } from '@/helpers/errors/generateError';
import { getSearchApproaches } from '@spotify-to-plex/music-search/functions/getSearchApproaches';
import { updateSearchApproaches } from '@spotify-to-plex/music-search/functions/updateSearchApproaches';
import { getStorageDir } from '@spotify-to-plex/shared-utils/utils/getStorageDir';
import { validateSearchApproaches } from '@spotify-to-plex/shared-utils/validation/validateSearchApproaches';

const router = createRouter<NextApiRequest, NextApiResponse>()
    .get(
        async (_req, res) => {
            try {
                const storageDir = getStorageDir();
                const approaches = await getSearchApproaches(storageDir);

                return res.status(200).json(approaches);
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
                const newApproaches = req.body;

                if (!validateSearchApproaches(newApproaches)) {
                    return res.status(400).json({
                        error: 'Invalid search approaches format',
                        details: 'Expected array of objects with id string and optional boolean flags'
                    });
                }

                const updatedApproaches = await updateSearchApproaches(storageDir, newApproaches);

                return res.status(200).json({
                    success: true,
                    message: 'Search approaches updated successfully',
                    approaches: updatedApproaches
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
        generateError(req, res, "Search Approaches", err);
    }
});