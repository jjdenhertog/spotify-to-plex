import { generateError } from '@/helpers/errors/generateError';
import { createRouter } from 'next-connect';
import crypto from 'node:crypto';
const router = createRouter()
    .get(async (_req, res) => {
    const redirectUri = process.env.TIDAL_API_REDIRECT_URI;
    const clientId = process.env.TIDAL_API_CLIENT_ID;
    const codeVerifier = process.env.ENCRYPTION_KEY || "XClkSCrJoAxXZGVv8KZF1csyyscyLYEI-y5TEIWXIZw";
    // eslint-disable-next-line newline-per-chained-call
    const challenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
    const authUrl = `https://login.tidal.com/authorize?response_type=code&client_id=${clientId}&scope=&redirect_uri=${encodeURIComponent(redirectUri)}&code_challenge_method=S256&code_challenge=${challenge}`;
    return res.redirect(302, authUrl);
});
export default router.handler({
    onError: (err, req, res) => {
        generateError(req, res, "Tidal login", err);
    },
});
//# sourceMappingURL=login.js.map