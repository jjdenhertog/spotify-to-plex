import { generateError } from '@/helpers/errors/generateError';
import { getSettings } from '@spotify-to-plex/plex-config/functions/getSettings';
import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';


export type GetPlexResourcesResponse = {
    name: string
    id: string
    connections: {
        uri: string,
        local: boolean
    }[]
}

const router = createRouter<NextApiRequest, NextApiResponse>()
    .get(
        async (_req, res) => {

            try {

                const settings = await getSettings();

                if (!settings?.token)
                    return res.status(400).json({ message: "No Plex connection found" });

                const result = await axios.get(`https://plex.tv/api/v2/resources`, {
                    params: {
                        "X-Plex-Product": "Spotify to Plex",
                        "X-Plex-Client-Identifier": process.env.PLEX_APP_ID,
                        "X-Plex-Token": settings?.token,
                    }
                })

                console.log(result.data)

                const servers: GetPlexResourcesResponse[] = [];
                result.data.forEach((item: { product: string; name: string; clientIdentifier: string; connections: { local: boolean; uri: string }[]; httpsRequired?: boolean }) => {
                    if (item.product === "Plex Media Server") {

                        const connections = item.connections.map((connection: { local: boolean; uri: string }) => {
                            const { local } = connection;
                            let { uri } = connection
                            if (item.httpsRequired)
                                uri = uri.split('http://').join('https://')

                            return { uri, local }
                        })

                        servers.push({
                            name: item.name,
                            id: item.clientIdentifier,
                            connections
                        })
                    }
                })

                return res.status(200).json(servers)
            } catch (_e) {
                return res.status(400).json({ message: "No resources found" })
            }
        })


export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "Songs", err);
    }
});


