import axios, { AxiosError } from "axios";
import qs from "qs";
import { AuthenticateResponse } from "../../types/TidalAPI";
import { getState, setState } from "./state";

export async function authenticate(): Promise<void> {
    const state = getState();
    
    // Don't authenticate if we have a user
    const now = Date.now();
    if (state.user && state.user.expires_at > now) {
        // Set user credentials
        setState({
            accessToken: state.user.access_token.access_token,
            expiresAt: state.user.expires_at
        });

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

        setState({
            accessToken: result.data.access_token,
            expiresAt: Date.now() + result.data.expires_in
        });
    } catch (error) {
        if (error instanceof AxiosError) {
            throw new Error(`Failed authenticating with the Tidal API: ${JSON.stringify(error.response?.data)}`);
        } else {
            throw new Error(`Failed authenticating with the Tidal API`);
        }
    }
}