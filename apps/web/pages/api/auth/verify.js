import { generateError } from '@/helpers/errors/generateError';
import { plex } from '@/library/plex';
import axios from 'axios';
import { createRouter } from 'next-connect';
const router = createRouter()
    .post(async (_req, res, _next) => {
    const result = await axios.get(`https://plex.tv/api/v2/pins/${plex.settings.pin_id}`, {
        params: {
            code: plex.settings.pin_code,
            "X-Plex-Client-Identifier": process.env.PLEX_APP_ID,
        }
    });
    plex.saveConfig({ token: result.data.authToken });
    res.json({
        ok: true
    });
});
export default router.handler({
    onError: (err, req, res) => {
        generateError(req, res, "Plex Authentication", err);
    },
});
//# sourceMappingURL=verify.js.map