import { TidalCredentials } from "../types/TidalCredentials";

/**
 * Tidal client credentials from the environment, undefined when they are missing or blank.
 */
export function getTidalCredentials(): TidalCredentials | undefined {
    const { TIDAL_API_CLIENT_ID: clientId, TIDAL_API_CLIENT_SECRET: clientSecret } = process.env;

    if (typeof clientId != 'string' || typeof clientSecret != 'string')
        return;

    if (!clientId.trim() || !clientSecret.trim())
        return;

    return { clientId, clientSecret };
}
