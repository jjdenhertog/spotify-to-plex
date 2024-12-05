import { generateError } from "@/helpers/errors/generateError"
import { configDir } from "@/library/configDir"
import { plex } from "@/library/plex"
import { PlexMusicSearch } from "@jjdenhertog/plex-music-search"
import { ensureDirSync, existsSync, readFileSync, writeFileSync } from 'fs-extra'
import { NextApiRequest, NextApiResponse } from "next"
import { createRouter } from "next-connect"
import { join } from "node:path"

const router = createRouter<NextApiRequest, NextApiResponse>()
    .post(
        async (req, res) => {

            const { id } = req.query
            const { type, media_content_id: mediaContentId } = req.body;

            if (typeof id != 'string' || typeof mediaContentId != "string" || typeof type != "string")
                return res.status(200).json([])

            const cacheDir = join(configDir, 'cache');
            const cachedTracksPath = join(cacheDir, `${id}.json`)
            if (existsSync(cachedTracksPath)) {
                const data = JSON.parse(readFileSync(cachedTracksPath, 'utf8'))
                return res.status(200).json(data)
            }

            if (!plex.settings.token || !plex.settings.uri)
                throw new Error('Missing plex')

            const plexMusicSearch = new PlexMusicSearch({
                uri: plex.settings.uri,
                token: plex.settings.token,
            })

            const cleanId = mediaContentId.slice(Math.max(0, mediaContentId.lastIndexOf("/") + 1))
            const path = type == 'playlist' ? `/playlists/${cleanId}/items` : `${mediaContentId}/children`;
            const metadatas = await plexMusicSearch.getMetaData(path)
            const tracks = metadatas.map(metadata => {
                try {
                    return metadata.Media[0].Part[0].file;
                } catch (_e) {
                    return null;
                }
            })
            // eslint-disable-next-line no-eq-null
            const files = tracks.filter(item => item != null);

            // Store cache
            ensureDirSync(cacheDir)
            writeFileSync(cachedTracksPath, JSON.stringify(files))

            res.json(files)
        })


export default router.handler({
    onError: (err: any, req, res) => {
        generateError(req, res, "Songs", err);
    }
});


