/* eslint-disable unicorn/prefer-code-point */
/* eslint-disable prefer-template */
 
import { removeFeaturing } from "@spotify-to-plex/music-search";
import { HubSearchResult } from "../types/actions/HubSearchResult";
import { HubSearchResponse } from "../types/plex/HubSearchResponse";
import { AxiosRequest } from "../utils/AxiosRequest";
import getAPIUrl from "../utils/getAPIUrl";

export default function hubSearch(uri: string, token: string, query: string, limit: number = 5) {
    return new Promise<HubSearchResult[]>((resolve, reject) => {

        // Fix forbidden characters
        const forbiddenCharacters = ['(', ')']

        for (let i = 0; i < forbiddenCharacters.length; i++) {
            const element = forbiddenCharacters[i];
            if (element) {
                query = query.split(element).join('')
            }
        }

        const url = getAPIUrl(uri, `/hubs/search?query=${fixedEncodeURIComponent(query.trim())}&limit=${limit}`);
        AxiosRequest.get<HubSearchResponse>(url, token)
            .then((result) => {
                const response: HubSearchResult[] = [];
                if (result.data.MediaContainer.Hub && result.data.MediaContainer.Hub.length > 0) {
                    for (let i = 0; i < result.data.MediaContainer.Hub.length; i++) {
                        const hub = result.data.MediaContainer.Hub[i];
                        if (hub && hub.type == "album" && hub.Metadata) {
                            for (let j = 0; j < hub.Metadata.length; j++) {
                                const metadata = hub.Metadata[j];
                                if (metadata) {
                                    response.push({
                                        type: "album",
                                        id: metadata.key || '',
                                        ratingKey: metadata.ratingKey || '',
                                        guid: metadata.guid || '',
                                        score: metadata.score || 0,
                                        image: metadata.thumb || '',
                                        year: metadata.year || 0,
                                        title: metadata.title || '',
                                        artist: {
                                            guid: metadata.parentGuid || '',
                                            id: metadata.parentKey || '',
                                            title: removeFeaturing(metadata.parentTitle || ''),
                                            alternative_title: "",
                                            image: metadata.parentThumb || '',
                                        },
                                    })
                                }
                            }
                        }

                        if (hub && hub.type == "track" && hub.Metadata) {
                            for (let j = 0; j < hub.Metadata.length; j++) {
                                const metadata = hub.Metadata[j];
                                if (metadata) {
                                    response.push({
                                        type: "track",
                                        id: metadata.key || '',
                                        ratingKey: metadata.ratingKey || '',
                                        guid: metadata.guid || '',
                                        score: metadata.score || 0,
                                        image: metadata.thumb || '',
                                        title: metadata.title || '',
                                        album: {
                                            id: metadata.parentKey || '',
                                            guid: metadata.parentGuid || '',
                                            title: metadata.parentTitle || '',
                                            year: metadata.parentYear || 0,
                                            image: metadata.parentThumb || '',
                                        },
                                        artist: {
                                            id: metadata.grandparentKey || '',
                                            guid: metadata.grandparentGuid || '',
                                            title: removeFeaturing(metadata.originalTitle || metadata.grandparentTitle || ''),
                                            image: metadata.grandparentThumb || '',
                                        }
                                    })
                                }
                            }
                        }
                    }
                }

                resolve(response)

            })
            .catch((_error: unknown) => {
                console.error(`Plex API Request failed:\n${url}`)
                reject("Could not connect to server");
            })
    })
}

function fixedEncodeURIComponent(str: string) {
    return encodeURIComponent(str).replace(/[!'()*]/g, (c) => {
        return '%' + c.charCodeAt(0).toString(16);
    });
}