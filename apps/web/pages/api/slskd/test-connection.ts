import { generateError } from '@/helpers/errors/generateError';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';

const router = createRouter<NextApiRequest, NextApiResponse>()
    .post(async (req, res) => {
        try {
            const { url } = req.body;

            if (!url) {
                return res.status(200).json({
                    success: false,
                    message: 'URL is required'
                });
            }

            const apiKey = process.env.SLSKD_API_KEY;
            if (!apiKey) {
                return res.status(200).json({
                    success: false,
                    message: 'SLSKD_API_KEY environment variable is not set'
                });
            }

            // Test connection to SLSKD server
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout

            try {
                const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
                const testUrl = `${baseUrl}/api/v0/application`;

                const response = await fetch(testUrl, {
                    method: 'GET',
                    headers: {
                        'X-API-Key': apiKey,
                    },
                    signal: controller.signal,
                });

                clearTimeout(timeout);

                if (!response.ok) {
                    return res.status(200).json({
                        success: false,
                        message: `SLSKD server returned status ${response.status}`
                    });
                }

                const data = await response.json();
                res.status(200).json({
                    success: true,
                    message: 'Connected successfully to SLSKD',
                    server: data
                });

            } catch (fetchError) {
                clearTimeout(timeout);

                if ((fetchError as Error).name === 'AbortError') {
                    return res.status(200).json({
                        success: false,
                        message: 'Connection timeout (5 seconds)'
                    });
                }

                throw fetchError;
            }

        } catch (error) {
            console.error('SLSKD connection test failed:', error);
            res.status(200).json({
                success: false,
                message: error instanceof Error ? error.message : 'Connection failed'
            });
        }
    });

export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "SLSKD Test Connection", err);
    }
});
