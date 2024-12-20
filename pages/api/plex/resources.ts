import { generateError } from '@/helpers/errors/generateError';
import { plex } from '@/library/plex';
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

                if (!plex.settings?.token)
                    return res.status(400).json({ message: "No Plex connection found" });


                const result = await axios.get(`https://plex.tv/api/v2/resources`, {
                    params: {
                        "X-Plex-Product=": "AI Guest DJ",
                        "X-Plex-Client-Identifier": process.env.PLEX_APP_ID,
                        "X-Plex-Token": plex.settings?.token,
                    }
                })

                const servers: GetPlexResourcesResponse[] = [];
                result.data.forEach((item: any) => {
                    if (item.product == "Plex Media Server") {
                        servers.push({
                            name: item.name,
                            id: item.clientIdentifier,
                            connections: item.connections.map((connection: any) => ({
                                uri: connection.uri,
                                local: connection.local
                            }))
                        })
                    }
                })

                return res.status(200).json(servers)
            } catch (_e) {
                return res.status(400).json({ message: "No resources found" })
            }
        })


export default router.handler({
    onError: (err: any, req, res) => {
        generateError(req, res, "Songs", err);
    }
});


