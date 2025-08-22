import { generateError } from '@/helpers/errors/generateError';
import { plex } from '@/library/plex';
import { createRouter } from 'next-connect';
const router = createRouter()
    .post(async (req, res) => {
    if (!req.body.query && !req.query.query)
        return res.status(400).json({ message: "Please add a search query" });
    if (!plex.settings.uri || !plex.settings.token)
        return res.status(400).json({ message: "No Plex connection found" });
    try {
        // const response = await doHubSearch(req.body.query || req.query.query)
        return res.json({ ok: true });
    }
    catch (_e) {
        return res.status(400).json({ message: "Something went wrong while connecting to this server." });
    }
});
export default router.handler({
    onError: (err, req, res) => {
        generateError(req, res, "Search", err);
    }
});
//# sourceMappingURL=search.js.map