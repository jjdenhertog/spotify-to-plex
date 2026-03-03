import { generateError } from '@/helpers/errors/generateError';
import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';

type LidarrProfile = {
    id: number;
    name: string;
};

type ProfilesResponse = {
    qualityProfiles: LidarrProfile[];
    metadataProfiles: LidarrProfile[];
};

type ErrorResponse = {
    error: string;
};

const router = createRouter<NextApiRequest, NextApiResponse>()
    .post(async (req, res) => {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        const apiKey = process.env.LIDARR_API_KEY;

        if (!apiKey) {
            return res.status(400).json({ error: 'LIDARR_API_KEY environment variable is not set' });
        }

        try {
            const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
            const headers = { 'X-Api-Key': apiKey };

            const [qualityRes, metadataRes] = await Promise.all([
                axios.get<LidarrProfile[]>(`${baseUrl}/api/v1/qualityprofile`, { headers, timeout: 5000 }),
                axios.get<LidarrProfile[]>(`${baseUrl}/api/v1/metadataprofile`, { headers, timeout: 5000 }),
            ]);

            const qualityProfiles: LidarrProfile[] = qualityRes.data.map(p => ({ id: p.id, name: p.name }));
            const metadataProfiles: LidarrProfile[] = metadataRes.data.map(p => ({ id: p.id, name: p.name }));

            return res.status(200).json({ qualityProfiles, metadataProfiles } satisfies ProfilesResponse);
        } catch (error: any) {
            console.error('Failed to fetch Lidarr profiles:', error);

            return res.status(200).json({
                error: error.response?.data?.message || error.message || 'Failed to fetch profiles',
            } satisfies ErrorResponse);
        }
    });

export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "Lidarr Profiles", err);
    }
});
