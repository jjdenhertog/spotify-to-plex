import { generateError } from '@/helpers/errors/generateError';
import { createRouter } from 'next-connect';
const router = createRouter()
    .get(async (_req, res) => {
    if (typeof process.env.TIDAL_API_CLIENT_ID != 'string' || typeof process.env.TIDAL_API_CLIENT_SECRET != 'string')
        return res.json({ ok: false });
    return res.json({ ok: true });
});
export default router.handler({
    onError: (err, req, res) => {
        generateError(req, res, "Tidal login", err);
    },
});
//# sourceMappingURL=valid.js.map