import { NextApiRequest, NextApiResponse } from 'next';
import { getMatchFilters, updateMatchFilters } from '@spotify-to-plex/music-search/config/config-utils';
import { getStorageDir } from '@spotify-to-plex/shared-utils/utils/getStorageDir';
import { validateMatchFilters } from '@spotify-to-plex/shared-utils/validation/validateMatchFilters';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const storageDir = getStorageDir();

        if (req.method === 'GET') {
            // Get current match filters
            const filters = await getMatchFilters(storageDir);

            return res.status(200).json(filters);
            
        } else if (req.method === 'POST') {
            // Update match filters
            const newFilters = req.body;
            
            if (!validateMatchFilters(newFilters)) {
                return res.status(400).json({ 
                    error: 'Invalid match filters format',
                    details: 'Expected array of objects with reason and filter properties'
                });
            }
            
            const updatedFilters = await updateMatchFilters(storageDir, newFilters);

            return res.status(200).json({ 
                success: true, 
                message: 'Match filters updated successfully',
                filters: updatedFilters
            });
            
        }

        res.setHeader('Allow', ['GET', 'POST']);

        return res.status(405).json({ error: 'Method not allowed' });
        
    } catch (error) {
        console.error('Error in match filters API:', error);

        return res.status(500).json({ 
            error: 'Internal server error', 
            message: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
}