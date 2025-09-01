import { NextApiRequest, NextApiResponse } from 'next';
import { getSearchApproaches } from '@spotify-to-plex/music-search/functions/getSearchApproaches';
import { updateSearchApproaches } from '@spotify-to-plex/music-search/functions/updateSearchApproaches';
import { getStorageDir } from '@spotify-to-plex/shared-utils/utils/getStorageDir';
import { validateSearchApproaches } from '@spotify-to-plex/shared-utils/validation/validateSearchApproaches';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const storageDir = getStorageDir();

        if (req.method === 'GET') {
            // Get current search approaches
            const approaches = await getSearchApproaches(storageDir);

            return res.status(200).json(approaches);
            
        } else if (req.method === 'POST') {
            // Update search approaches
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
            
        }

        res.setHeader('Allow', ['GET', 'POST']);

        return res.status(405).json({ error: 'Method not allowed' });
        
    } catch (error) {
        console.error('Error in search approaches API:', error);

        return res.status(500).json({ 
            error: 'Internal server error', 
            message: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
}