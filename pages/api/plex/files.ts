import { generateError } from "@/helpers/errors/generateError"
import { plex } from "@/library/plex"
import { PlexMusicSearch } from "@jjdenhertog/plex-music-search"
import { NextApiRequest, NextApiResponse } from "next"
import { createRouter } from "next-connect"

const router = createRouter<NextApiRequest, NextApiResponse>()
    .get(
        async (req, res) => {
            const { media_content_id: mediaContentId } = req.query
            if (typeof mediaContentId != "string")
                return res.status(200).json([])

            if (!plex.settings.token || !plex.settings.uri)
                throw new Error('Missing plex')

            const plexMusicSearch = new PlexMusicSearch({
                uri: plex.settings.uri,
                token: plex.settings.token,
            })

            const libraryItem = await plexMusicSearch.getMetaData(mediaContentId)
            const trackMetaData = await plexMusicSearch.getMetaData(libraryItem[0].key)
            const tracks = trackMetaData.map(metadata => {
                try {
                    return metadata.Media[0].Part[0].file;
                } catch (_e) {
                    return null;
                }
            })

            const files = tracks.filter(item => item != null);
            res.json(files)
        })


export default router.handler({
    onError: (err: any, req, res) => {
        generateError(req, res, "Songs", err);
    }
});


