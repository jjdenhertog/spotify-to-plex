import { generateError } from '@/helpers/errors/generateError';
import { plex } from '@/library/plex';
import axios from 'axios';
import { createRouter } from 'next-connect';
import { stringify } from 'qs';
const router = createRouter()
    .post(async (req, res, _next) => {
    const result = await axios.post("https://plex.tv/api/v2/pins", stringify({
        strong: true,
        "X-Plex-Product": "Spotify to Plex",
        "X-Plex-Client-Identifier": process.env.PLEX_APP_ID,
    }));
    const authUrl = `https://app.plex.tv/auth#?${stringify({
        clientID: process.env.PLEX_APP_ID,
        code: result.data.code,
        forwardUrl: `${req.body.callback}?plex=1`,
        context: {
            device: {
                product: 'Spotify to Plex',
            },
        },
    })}`;
    plex.saveConfig({ pin_id: `${result.data.id}`, pin_code: result.data.code });
    res.json({
        authUrl
    });
});
export default router.handler({
    onError: (err, req, res) => {
        generateError(req, res, "Plex Authentication", err);
    },
});
//# sourceMappingURL=url.js.map