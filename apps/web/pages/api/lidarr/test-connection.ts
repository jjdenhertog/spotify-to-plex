import { generateError } from '@/helpers/errors/generateError';
import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';

const router = createRouter<NextApiRequest, NextApiResponse>()
    .post(async (req, res) => {
        try {
            const { url } = req.body;

            if (!url) {
                return res.status(400).json({
                    success: false,
                    message: 'URL is required'
                });
            }

            const apiKey = process.env.LIDARR_API_KEY;
            if (!apiKey) {
                return res.status(400).json({
                    success: false,
                    message: 'LIDARR_API_KEY environment variable is not set'
                });
            }

            // Test connection by fetching system status
            const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
            const testUrl = `${baseUrl}/api/v1/system/status`;
            const response = await axios.get(testUrl, {
                headers: {
                    'X-Api-Key': apiKey,
                },
                timeout: 5000,
            });

            if (response.status === 200) {
                res.status(200).json({
                    success: true,
                    message: `Connected successfully to Lidarr v${response.data.version || 'unknown'}`,
                });
            } else {
                res.status(200).json({
                    success: false,
                    message: 'Unexpected response from Lidarr',
                });
            }
        } catch (error: any) {
            console.error('Lidarr connection test failed:', error);
            res.status(200).json({
                success: false,
                message: error.response?.data?.message || error.message || 'Connection failed',
            });
        }
    });

export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "Lidarr Test Connection", err);
    }
});
