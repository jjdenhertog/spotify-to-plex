import { NextApiRequest, NextApiResponse } from 'next';
import { MusicSearchConfigManager, TextProcessingConfig } from '@spotify-to-plex/music-search';

// Get storage directory from environment or default
const getStorageDir = (): string => {
    return process.env.SETTINGS_DIR || process.cwd();
};

// Validate text processing structure
const validateTextProcessing = (config: any): config is TextProcessingConfig => {
    return config && 
           typeof config === 'object' && 
           Array.isArray(config.filterOutWords) &&
           Array.isArray(config.filterOutQuotes) &&
           Array.isArray(config.cutOffSeparators) &&
           config.processing &&
           typeof config.processing === 'object' &&
           typeof config.processing.filtered === 'boolean' &&
           typeof config.processing.cutOffSeperators === 'boolean' &&
           typeof config.processing.removeQuotes === 'boolean';
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const configManager = MusicSearchConfigManager.create({ 
            storageDir: getStorageDir(),
            preloadCache: true 
        });

        if (req.method === 'GET') {
            // Get current text processing config
            const config = await configManager.getTextProcessing();

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
            
            const updatedConfig = await configManager.updateTextProcessing(newConfig);

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