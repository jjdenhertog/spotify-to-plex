import { OpenSpotifyApi } from "../OpenSpotifyApi";

export default class EndpointsBase {
    constructor(protected api: OpenSpotifyApi) {
    }

    protected async getRequest<TReturnType>(url: string): Promise<TReturnType> {
        return await this.api.makeRequest<TReturnType>("GET", url);
    }

    protected async postRequest<TReturnType, TBody = unknown>(url: string, body?: TBody): Promise<TReturnType> {
        return await this.api.makeRequest<TReturnType>("POST", url, body);
    }
}

