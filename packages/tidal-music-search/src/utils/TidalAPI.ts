/* eslint-disable unicorn/prefer-type-error */
import axios, { AxiosError } from "axios";
import qs from "qs";
import { TidalTrack } from "../types";
import { TidalAlbum } from "../types/TidalAlbum";
import { AuthenticateResponse, operations, TidalComponents } from "../types/TidalAPI";
import { UserCredentials } from "../types/UserCredentials";
import tidalApiRequest from "./tidalApiRequest";

export type TidalAPIProps = {
    clientId: string,
    clientSecret: string
}

export class TidalAPI {

    private _access_token?: string;
    private _expires_at?: number;
    private _user?: UserCredentials

    private _clientId?: string | undefined;
    private _clientSecret?: string | undefined;

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    private constructor() { }

    private static _instance: TidalAPI;
    public static getInstance() {
        if (this._instance)
            return this._instance

        this._instance = new TidalAPI();

        return this._instance;
    }

    //////////////////////////////////////////
    // Getters & Setters
    //////////////////////////////////////////
    public set user(user: UserCredentials | undefined) {
        this._user = user;
    }
    public get user() {
        return this._user
    }
    public get clientSecret(): string | undefined {
        return this._clientSecret;
    }
    public set clientSecret(value: string | undefined) {
        this._clientSecret = value;
    }
    public get clientId(): string | undefined {
        return this._clientId;
    }
    public set clientId(value: string | undefined) {
        this._clientId = value;
    }

    public async authenticate() {

        // Don't authenticate if we have a user
        const now = Date.now()
        if (this._user && this._user.expires_at > now) {

            // Set user credentials
            this._access_token = this._user.access_token.access_token;
            this._expires_at = this._user.expires_at;

            return;
        }

        ///////////////////////////////////////////
        // Initiate the client
        ///////////////////////////////////////////
        if (typeof this._clientId != 'string')
            throw new Error(`Client ID is missing`)

        if (typeof this._clientSecret != 'string')
            throw new Error(`Client Secret is missing`)

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

            this._access_token = result.data.access_token;
            this._expires_at = Date.now() + result.data.expires_in;
        } catch (error) {

            // eslint-disable-next-line unicorn/prefer-ternary
            if (error instanceof AxiosError) {
                throw new Error(`Failed authenticating with the Tidal API: ${JSON.stringify(error.response?.data)}`);
            } else {
                throw new Error(`Failed authenticating with the Tidal API`);
            }
        }
    }

    public async search(query: string, countryCode: string = 'NL'): Promise<TidalTrack[]> {

        // Authenticate again if the token is expired
        if (!this._expires_at || Date.now() > this._expires_at)
            await this.authenticate()

        let tidalTracks: TidalTrack[] = []

        if (this._access_token) {

            // Search for tracks
            const result = await tidalApiRequest<operations['getSearchResultsByQuery']>(this._access_token, `https://openapi.tidal.com/v2/searchresults/${encodeURIComponent(query)}`, {
                countryCode,
                include: 'tracks'
            })

            // Get all track data
            const tracks = result.data?.data?.relationships?.tracks?.data;

            if (tracks && tracks.length > 0) {

                const ids = tracks.map(item => item.id)
                const trackData = await this.getTrackByIds(ids, countryCode)
                tidalTracks = tidalTracks.concat(trackData)
            }

        }

        return tidalTracks
    }

    public async searchAlbum(query: string, countryCode: string = 'NL'): Promise<TidalAlbum[]> {

        // Authenticate again if the token is expired
        if (!this._expires_at || Date.now() > this._expires_at)
            await this.authenticate()

        const tidalAlbums: TidalAlbum[] = []

        if (this._access_token) {

            // Search for tracks
            const result = await tidalApiRequest<operations['getSearchResultsAlbumsRelationship']>(this._access_token, `https://openapi.tidal.com/v2/searchresults/${encodeURIComponent(query)}/relationships/albums`, {
                countryCode,
                include: 'albums'
            })

            // Get album title + artist
            const albums = result.data?.data

            if (albums && albums.length > 0) {

                for (let i = 0; i < albums.length; i++) {
                    const album = albums[i];
                    if (!album) continue;

                    const { id } = album;
                    const albumData = result.data.included?.find(item => item.id == id)
                    if (albumData && albumData.type == 'albums' && albumData.attributes) {

                        const { title } = albumData.attributes;

                        // eslint-disable-next-line max-depth
                        if (!albumData.relationships?.artists.links?.self)
                            continue;

                        const artistResult = await tidalApiRequest<operations['getArtistAlbumsRelationship']>(this._access_token, `https://openapi.tidal.com/v2${albumData.relationships.artists.links.self}`, { include: ['artists'] })

                        // eslint-disable-next-line max-depth
                        if (artistResult?.data.included) {

                            const artists = artistResult.data.included
                                .map(item => item.type == 'artists' ? item.attributes?.name || "" : "")
                                .filter(item => !!item)

                            tidalAlbums.push({
                                id,
                                title,
                                artists
                            })
                        }
                    }
                }
            }

        }

        return tidalAlbums
    }

    public async getAlbumTracksIds(id: string, countryCode: string = 'NL'): Promise<string[]> {

        // Authenticate again if the token is expired
        if (!this._expires_at || Date.now() > this._expires_at)
            await this.authenticate()

        const albumTrackIds: string[] = []

        if (this._access_token) {

            // Search for tracks
            const result = await tidalApiRequest<operations['getAlbumItemsRelationship']>(this._access_token, `https://openapi.tidal.com/v2/albums/${id}/relationships/items`, {
                countryCode,
                include: 'items'
            })

            if (result.data.data && result.data.data.length > 0) {
                return result.data.data
                    .map(item => item.id)
            }


        }

        return albumTrackIds
    }

    public async getTrackByIds(ids: string[], countryCode: string): Promise<TidalTrack[]> {

        if (!this._access_token)
            return []

        const result: TidalTrack[] = []
        const searchResult = await tidalApiRequest<operations['getTracksByFilters']>(this._access_token, `https://openapi.tidal.com/v2/tracks`, {
            countryCode,
            include: ['artists', 'tracks', 'albums'],
            'filter[id]': ids
        })

        const { data, included } = searchResult.data;


        if (data && included && data.length > 0 && included.length > 0) {
            for (let i = 0; i < data.length; i++) {
                const track = data[i];
                if (!track) continue;

                const { id, attributes, relationships } = track;
                const title = attributes?.title;
                const link = getLink(attributes?.externalLinks)
                const artists = included
                    .filter(item => item.type == 'artists' && relationships?.artists?.data?.some((artist: any) => artist.id == item.id))
                    .filter(item => item.type == 'artists')
                    .map(item => (
                        {
                            name: item.attributes?.name || '',
                            link: getLink(item.attributes?.externalLinks)
                        })
                    )
                const albums = included
                    .filter(item => item.type == 'albums' && relationships?.albums?.data?.some((album: any) => album.id == item.id))
                    .filter(item => item.type == 'albums')
                    .map(item => (
                        {
                            id: item.id,
                            title: item.attributes?.title || '',
                            link: getLink(item.attributes?.externalLinks)
                        })
                    )


                if (id && title && link && artists && albums && artists.length > 0 && albums.length > 0) {
                    const [album] = albums;
                    if (album) {
                        result.push({ id, title, link, artists, album });
                    }
                }
            }
        }

        return result
    }
}


function getLink(data?: TidalComponents["schemas"]["Catalogue_Item_External_Link"][]) {
    if (!data)
        return '';

    const link = data.find(item => item.meta.type == 'TIDAL_SHARING')
    if (link?.href)
        return link.href;

    return '';

}