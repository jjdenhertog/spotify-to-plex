import { SpotifyUser } from './SpotifyUser';

export type SpotifyCredentials = {

    user: SpotifyUser
    access_token: {
        access_token: string,
        refresh_token: string,
        expires_in: number,
        token_type: string
    },
    expires_at: number
}