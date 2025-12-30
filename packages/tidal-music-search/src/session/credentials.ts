import axios, { AxiosError } from "axios";
import qs from "qs";
import { AuthenticateResponse } from "../types/TidalAPI";

type TidalAPICredentials = {
    accessToken?: string;
    expiresAt?: number;
    clientId?: string;
    clientSecret?: string;
}

const state: TidalAPICredentials = {
    accessToken: undefined,
    expiresAt: undefined,
    clientId: undefined,
    clientSecret: undefined
};

export function getCredentials(): TidalAPICredentials {
    return state;
}

export function setCredentials(clientId: string, clientSecret: string) {
    Object.assign(state, { clientId, clientSecret });
}

export function setToken(accessToken: string, expiresAt: number) {
    Object.assign(state, { accessToken, expiresAt });
}

export function resetState() {
    state.accessToken = undefined;
    state.expiresAt = undefined;
    state.clientId = undefined;
    state.clientSecret = undefined;
}

export async function authenticate() {
    const state = getCredentials();

    // Validate client credentials are set
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