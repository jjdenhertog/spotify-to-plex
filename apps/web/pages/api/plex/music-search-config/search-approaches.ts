import { NextApiRequest, NextApiResponse } from 'next';
import { MusicSearchConfigManager, SearchApproachConfig } from '@spotify-to-plex/music-search';

// Get storage directory from environment or default
const getStorageDir = (): string => {
    return process.env.SETTINGS_DIR || process.cwd();
};

// Validate search approach structure
const validateSearchApproach = (approach: any): approach is SearchApproachConfig => {
    return approach && 
           typeof approach === 'object' && 
           typeof approach.id === 'string' &&
           (approach.filtered === undefined || typeof approach.filtered === 'boolean') &&
           (approach.trim === undefined || typeof approach.trim === 'boolean') &&
           (approach.ignoreQuotes === undefined || typeof approach.ignoreQuotes === 'boolean') &&
           (approach.removeQuotes === undefined || typeof approach.removeQuotes === 'boolean') &&
           (approach.force === undefined || typeof approach.force === 'boolean');
};

// Validate array of search approaches
const validateSearchApproaches = (approaches: any): approaches is SearchApproachConfig[] => {
    return Array.isArray(approaches) && approaches.every(validateSearchApproach);
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const configManager = MusicSearchConfigManager.create({ 
            storageDir: getStorageDir(),
            preloadCache: true 
        });

        if (req.method === 'GET') {
            // Get current search approaches
            const approaches = await configManager.getSearchApproaches();

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
            
            const updatedApproaches = await configManager.updateSearchApproaches(newApproaches);

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