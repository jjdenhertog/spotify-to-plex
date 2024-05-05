import { generateError } from '@/helpers/errors/generateError';
import { GetMatchingTrackResponse } from '@/helpers/searching/findMatchingTracks';
import { getTracks } from '@/helpers/searching/getTracks';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';

export type GetTrackResponse = {
    artist: string;
    name: string;
    album: string;
    alternative_name?: string;
    alternative_artist?: string;
    Result: GetMatchingTrackResponse[];
};

export type PostTrackData = {
    artist: string;
    name: string;
    album: string;
    alternative_name?: string;
    alternative_artist?: string;
    idx: number
}

const router = createRouter<NextApiRequest, NextApiResponse>()
    .post(
        async (req, res, next) => {
            const items: PostTrackData[] = req.body.items;
            if (!items || items.length == 0)
                return res.status(400).json({ msg: "No items given" });

            
            let result = await getTracks(items)
            res.status(200).json(result);
        })


export default router.handler({
    onNoMatch: (req, res) => {
        res.status(200).json({})
    },
    onError: (err: any, req, res) => {
        generateError(req, res, "Songs", err);
    }
});


