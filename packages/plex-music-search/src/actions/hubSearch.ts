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
                const { Hub } = result.data.MediaContainer;
                
                if (!Hub || Hub.length === 0) {
                    resolve(response);

                    return;
                }

                for (const hub of Hub) {
                    if (!hub?.Metadata) continue;
                    
                    if (hub.type === "album") {
                        processAlbumMetadata(hub.Metadata, response);
                    }

                    if (hub.type === "track") {
                        processTrackMetadata(hub.Metadata, response);
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

function processAlbumMetadata(metadata: any[], response: HubSearchResult[]) {
    for (const item of metadata) {
        if (!item) continue;
        
        response.push({
            type: "album",
            id: item.key || '',
            ratingKey: item.ratingKey || '',
            guid: item.guid || '',
            score: item.score || 0,
            image: item.thumb || '',
            year: item.year || 0,
            title: item.title || '',
            artist: {
                guid: item.parentGuid || '',
                id: item.parentKey || '',
                title: removeFeaturing(item.parentTitle || ''),
                alternative_title: "",
                image: item.parentThumb || '',
            },
        });
    }
}

function processTrackMetadata(metadata: any[], response: HubSearchResult[]) {
    for (const item of metadata) {
        if (!item) continue;
        
        response.push({
            type: "track",
            id: item.key || '',
            ratingKey: item.ratingKey || '',
            guid: item.guid || '',
            score: item.score || 0,
            image: item.thumb || '',
            title: item.title || '',
            album: {
                id: item.parentKey || '',
                guid: item.parentGuid || '',
                title: item.parentTitle || '',
                year: item.parentYear || 0,
                image: item.parentThumb || '',
            },
            artist: {
                id: item.grandparentKey || '',
                guid: item.grandparentGuid || '',
                title: removeFeaturing(item.originalTitle || item.grandparentTitle || ''),
                image: item.grandparentThumb || '',
            }
        });
    }
}

function fixedEncodeURIComponent(str: string) {
    return encodeURIComponent(str).replace(/[!'()*]/g, (c) => {
        return '%' + c.charCodeAt(0).toString(16);
    });
}