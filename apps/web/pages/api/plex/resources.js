import { generateError } from '@/helpers/errors/generateError';
import { plex } from '@/library/plex';
import axios from 'axios';
import { createRouter } from 'next-connect';
const router = createRouter()
    .get(async (_req, res) => {
    try {
        if (!plex.settings?.token)
            return res.status(400).json({ message: "No Plex connection found" });
        const result = await axios.get(`https://plex.tv/api/v2/resources`, {
            params: {
                "X-Plex-Product": "Spotify to Plex",
                "X-Plex-Client-Identifier": process.env.PLEX_APP_ID,
                "X-Plex-Token": plex.settings?.token,
            }
        });
        const servers = [];
        result.data.forEach((item) => {
            if (item.product == "Plex Media Server") {
                const connections = item.connections.map((connection) => {
                    const { local } = connection;
                    let { uri } = connection;
                    if (item.httpsRequired)
                        uri = uri.split('http://').join('https://');
                    return { uri, local };
                });
                servers.push({
                    name: item.name,
                    id: item.clientIdentifier,
                    connections
                });
            }
        });
        return res.status(200).json(servers);
    }
    catch (_e) {
        return res.status(400).json({ message: "No resources found" });
    }
});
export default router.handler({
    onError: (err, req, res) => {
        generateError(req, res, "Songs", err);
    }
});
//# sourceMappingURL=resources.js.map