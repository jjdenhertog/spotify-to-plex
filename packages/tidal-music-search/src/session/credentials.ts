import axios, { AxiosError } from "axios";
import qs from "qs";
import { AuthenticateResponse } from "../types/TidalAPI";
import { TidalCredentials } from "@spotify-to-plex/shared-types/tidal/api";

type TidalAPICredentials = {
    accessToken?: string;
    expiresAt?: number;
    user?: TidalCredentials;
    clientId?: string;
    clientSecret?: string;
}

const state: TidalAPICredentials = {
    accessToken: undefined,
    expiresAt: undefined,
    user: undefined,
    clientId: undefined,
    clientSecret: undefined
};

export function getCredentials(): TidalAPICredentials {
    return state;
}

export function setCredentials(clientId: string, clientSecret: string): void {
    Object.assign(state, { clientId, clientSecret });
}
export function setToken(accessToken: string, expiresAt: number): void {
    Object.assign(state, { accessToken, expiresAt });
}
export function setUser(user: TidalCredentials|undefined): void {
    Object.assign(state, { user });
}

export function resetState(): void {
    state.accessToken = undefined;
    state.expiresAt = undefined;
    state.user = undefined;
    state.clientId = undefined;
    state.clientSecret = undefined;
}

export async function authenticate(): Promise<void> {
    const state = getCredentials();

    // Don't authenticate if we have a user
    const now = Date.now();
    if (state.user && state.user.expires_at > now) {
        // Set user credentials
        setToken(state.user.access_token.access_token, state.user.expires_at);

        return;
    }

    // Initiate the client
    if (typeof state.clientId !== 'string') {
        throw new Error(`Client ID is missing`);
    }

    if (typeof state.clientSecret !== 'string') {
        throw new Error(`Client Secret is missing`);
    }

    const tokenUrl = 'https://auth.tidal.com/v1/oauth2/token';
    const authHeader = Buffer.from(`${process.env.TIDAL_API_CLIENT_ID}:${process.env.TIDAL_API_CLIENT_SECRET}`).toString('base64');

    try {
        const result = await axios.post<AuthenticateResponse>(
            tokenUrl,
            qs.stringify({ grant_type: 'client_credentials' }),
            {
                headers: {
                    Authorization: `Basic ${authHeader}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        setToken(result.data.access_token, Date.now() + result.data.expires_in);
    } catch (error) {
        if (error instanceof AxiosError) {
            throw new Error(`Failed authenticating with the Tidal API: ${JSON.stringify(error.response?.data)}`);
        } else {
            throw new Error(`Failed authenticating with the Tidal API`);
        }
    }
}