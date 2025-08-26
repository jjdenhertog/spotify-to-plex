import { NextApiRequest, NextApiResponse } from 'next';
import { unlinkSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// Configuration file path
const getConfigPath = (): string => {
    const settingsDir = process.env.SETTINGS_DIR || process.cwd();

    return join(settingsDir, 'music-search-config.json');
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method !== 'POST') {
            res.setHeader('Allow', ['POST']);

            return res.status(405).json({ error: 'Method not allowed' });
        }

        // Delete the configuration file to force fallback to defaults
        const configPath = getConfigPath();
        
        if (existsSync(configPath)) {
            unlinkSync(configPath);
        }

        return res.status(200).json({ 
            success: true, 
            message: 'Configuration reset to defaults successfully' 
        });
        
    } catch (error) {
        console.error('Error resetting music search config:', error);

        return res.status(500).json({ 
            error: 'Internal server error', 
            message: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
}