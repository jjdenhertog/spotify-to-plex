import { NextApiRequest, NextApiResponse } from 'next';
import { resetToDefaults } from '@spotify-to-plex/music-search/config/config-utils';
import { getStorageDir } from '@spotify-to-plex/shared-utils/utils/getStorageDir';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method !== 'POST') {
            res.setHeader('Allow', ['POST']);

            return res.status(405).json({ error: 'Method not allowed' });
        }

        // Reset configuration to defaults using the config utils
        const storageDir = getStorageDir();
        const config = await resetToDefaults(storageDir);

        return res.status(200).json({ 
            success: true, 
            message: 'Configuration reset to defaults successfully',
            config
        });
        
    } catch (error) {
        console.error('Error resetting music search config:', error);

        return res.status(500).json({ 
            error: 'Internal server error', 
            message: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
}