import { OpenSpotifyApi } from "../OpenSpotifyApi";

export default class EndpointsBase {
    public constructor(protected api: OpenSpotifyApi) {
    }

    protected async getRequest<TReturnType>(url: string): Promise<TReturnType> {
        return this.api.makeRequest<TReturnType>("GET", url);
    }

    protected async postRequest<TReturnType>(url: string, body?: unknown): Promise<TReturnType> {
        return this.api.makeRequest<TReturnType>("POST", url, body);
    }
}

