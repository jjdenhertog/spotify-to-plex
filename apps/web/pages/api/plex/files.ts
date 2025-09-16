import { generateError } from "@/helpers/errors/generateError"
import { getMetaData } from "@spotify-to-plex/plex-music-search/functions/getMetaData";
import { Metadata } from "@spotify-to-plex/plex-music-search/types/plex/Metadata";
import { getMusicSearchConfigFromStorage } from "@spotify-to-plex/music-search/functions/getMusicSearchConfigFromStorage";
import { getStorageDir } from '@spotify-to-plex/shared-utils/utils/getStorageDir';
import { NextApiRequest, NextApiResponse } from "next"
import { createRouter } from "next-connect"
import { getSettings } from "@spotify-to-plex/plex-config/functions/getSettings";

const router = createRouter<NextApiRequest, NextApiResponse>()
    .get(
        async (req, res) => {
            try {
                const { media_content_id: mediaContentId } = req.query
                if (typeof mediaContentId !== "string")
                    return res.status(200).json([])

                const settings = await getSettings();

                if (!settings.token || !settings.uri)
                    return res.status(400).json({ error: 'Missing plex configuration' })

                const musicSearchConfig = await getMusicSearchConfigFromStorage(getStorageDir());

                const plexConfig = {
                    uri: settings.uri,
                    token: settings.token,
                    musicSearchConfig,
                };

                const libraryItem = await getMetaData(plexConfig, mediaContentId)
                if (!libraryItem?.[0]?.key) {
                    return res.status(200).json([])
                }

                const trackMetaData = await getMetaData(plexConfig, libraryItem[0].key)
                const tracks = trackMetaData.map((metadata: Metadata) => {
                    try {
                        return metadata.Media?.[0]?.Part?.[0]?.file || null;
                    } catch (_e) {
                        return null;
                    }
                })

                const files = tracks.filter((item: string | null): item is string => item !== null);
                res.json(files)
            } catch (error) {
                console.error('Error getting Plex files:', error);
                res.status(500).json({ error: 'Failed to get files' });
            }
        })


export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "Songs", err);
    }
});


