import getAccessToken from "./authentication/getAccessToken";
import getClientToken from "./authentication/getClientToken";
import AlbumsEndpoints from "./endpoints/AlbumsEndpoints";
import ArtistsEndpoints from "./endpoints/ArtistsEndpoints";
import PlaylistsEndpoints from "./endpoints/PlaylistsEndpoints";
import TracksEndpoints from "./endpoints/TracksEndpoints";
import deserialize from "./serialization/deserialize";
import { AccessToken, ClientToken } from "./types";

export class OpenSpotifyApi {
    public albums: AlbumsEndpoints;
    public artists: ArtistsEndpoints;
    public playlists: PlaylistsEndpoints;
    public tracks: TracksEndpoints;

    public accessToken: AccessToken
    public clientToken: ClientToken

    public constructor() {
        this.albums = new AlbumsEndpoints(this);
        this.artists = new ArtistsEndpoints(this);
        this.playlists = new PlaylistsEndpoints(this);
        this.tracks = new TracksEndpoints(this);
    }

    private async setAccessToken() {
        if (this.accessToken && Date.now() > this.accessToken.accessTokenExpirationTimestampMs)
            return;

        this.accessToken = await getAccessToken()
    }

    private async setClientToken() {
        if (this.clientToken)
            return;

        this.clientToken = await getClientToken(this.accessToken.clientId)
    }

    public async makeRequest<TReturnType>(method: "GET" | "POST" | "PUT" | "DELETE", url: string, body: any = undefined): Promise<TReturnType> {
        await this.setAccessToken()
        await this.setClientToken()

        const { accessToken } = this.accessToken;
        const { token: clientToken } = this.clientToken.granted_token
        const result = await fetch(url, {
            method,
            body,
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'client-token': clientToken
            }
        })

        return deserialize<TReturnType>(result)
    }
}
