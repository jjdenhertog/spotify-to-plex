import { generateError } from '@/helpers/errors/generateError';
import { plex } from '@/library/plex';
import { createRouter } from 'next-connect';
const router = createRouter()
    .post(async (req, res) => {
    if (req.body.uri)
        plex.saveConfig({ uri: req.body.uri, id: req.body.id });
    res.json({ loggedin: !!plex.settings.token, uri: plex.settings.uri, id: plex.settings.id });
})
    .get(async (_req, res) => {
    res.json({ loggedin: !!plex.settings.token, uri: plex.settings.uri, id: plex.settings.id });
});
export default router.handler({
    onError: (err, req, res) => {
        generateError(req, res, "Songs", err);
    }
});
//# sourceMappingURL=settings.js.map