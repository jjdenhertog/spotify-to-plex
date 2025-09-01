import { NextApiRequest, NextApiResponse } from 'next';
import { getTextProcessing } from '@spotify-to-plex/music-search/functions/getTextProcessing';
import { updateTextProcessing } from '@spotify-to-plex/music-search/functions/updateTextProcessing';
import { getStorageDir } from '@spotify-to-plex/shared-utils/utils/getStorageDir';
import { validateTextProcessing } from '@spotify-to-plex/shared-utils/validation/validateTextProcessing';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const storageDir = getStorageDir();

        if (req.method === 'GET') {
            // Get current text processing config
            const config = await getTextProcessing(storageDir);

            return res.status(200).json(config);
            
        } else if (req.method === 'POST') {
            // Update text processing config
            const newConfig = req.body;
            
            if (!validateTextProcessing(newConfig)) {
                return res.status(400).json({ 
                    error: 'Invalid text processing configuration format',
                    details: 'Expected object with filterOutWords, filterOutQuotes, cutOffSeparators arrays and processing object'
                });
            }
            
            const updatedConfig = await updateTextProcessing(storageDir, newConfig);

            return res.status(200).json({ 
                success: true, 
                message: 'Text processing configuration updated successfully',
                config: updatedConfig
            });
            
        }

        res.setHeader('Allow', ['GET', 'POST']);

        return res.status(405).json({ error: 'Method not allowed' });
        
    } catch (error) {
        console.error('Error in text processing API:', error);

        return res.status(500).json({ 
            error: 'Internal server error', 
            message: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
}