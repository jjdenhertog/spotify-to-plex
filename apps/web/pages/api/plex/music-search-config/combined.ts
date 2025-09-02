import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method === 'GET') {
            // Fetch both configurations in parallel
            const [textProcessingResponse, searchApproachesResponse] = await Promise.all([
                axios.get(`http://localhost:3000/api/plex/music-search-config/text-processing`),
                axios.get(`http://localhost:3000/api/plex/music-search-config/search-approaches`)
            ]);

            const combined = {
                textProcessing: textProcessingResponse.data,
                searchApproaches: searchApproachesResponse.data
            };

            return res.status(200).json(combined);
            
        } else if (req.method === 'POST') {
            const { textProcessing, searchApproaches } = req.body;
            
            if (!textProcessing || !searchApproaches) {
                return res.status(400).json({ 
                    error: 'Invalid request body - must contain textProcessing and searchApproaches' 
                });
            }

            // Save both configurations in parallel
            const [textProcessingResponse, searchApproachesResponse] = await Promise.all([
                axios.post(`http://localhost:3000/api/plex/music-search-config/text-processing`, textProcessing),
                axios.post(`http://localhost:3000/api/plex/music-search-config/search-approaches`, searchApproaches)
            ]);

            return res.status(200).json({ 
                success: true, 
                message: 'Combined configuration updated successfully',
                textProcessing: textProcessingResponse.data,
                searchApproaches: searchApproachesResponse.data
            });
        }

        res.setHeader('Allow', ['GET', 'POST']);

        return res.status(405).json({ error: 'Method not allowed' });
        
    } catch (error) {
        console.error('Error in combined config API:', error);

        return res.status(500).json({ 
            error: 'Internal server error', 
            message: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
}