import { plex } from "@/library/plex"
import { HubSearchResponse, Metadata } from "@/types/PlexAPI"
import { AxiosRequest } from "../AxiosRequest"
import getAPIUrl from "../getAPIUrl"

export type GetHubSearchResponse = (GetHubSearchAlbumResponse | GetHubSearchTrackResponse)
export type GetHubSearchTrackResponse = {
    type: "track",
    key: Metadata["key"],
    ratingKey: Metadata["ratingKey"],
    guid: Metadata["guid"],
    score: Metadata["score"],
    image: Metadata["thumb"],
    title: Metadata["title"],
    source?: string,
    album: {
        guid: Metadata["parentGuid"],
        key: Metadata["parentKey"],
        title: Metadata["parentTitle"],
        year: Metadata["parentYear"],
        image: Metadata["parentThumb"],
    },
    artist: {
        guid: Metadata["grandparentGuid"],
        key: Metadata["grandparentKey"],
        title: Metadata["grandparentTitle"],
        alternative_title: Metadata["grandparentTitle"],
        image: Metadata["grandparentThumb"],
    }
}
export type GetHubSearchAlbumResponse = {
    type: "album",
    key: Metadata["key"],
    ratingKey: Metadata["ratingKey"],
    guid: Metadata["guid"],
    score: Metadata["score"],
    image: Metadata["thumb"],
    year: Metadata["year"],
    title: Metadata["title"],
    source?: string,
    artist: {
        guid: Metadata["parentGuid"],
        key: Metadata["parentKey"],
        title: Metadata["parentTitle"],
        alternative_title: Metadata["parentTitle"],
        image: Metadata["parentThumb"],
    },
}


export function removeFeaturing(artist: string) {
    let result = artist
    if (result.indexOf('feat') > -1)
        result = result.substring(0, result.indexOf('feat'))
    if (result.indexOf('(') > -1)
        result = result.substring(0, result.indexOf('('))
    // if (result.indexOf(',') > -1)
    //     result = result.substring(0, result.indexOf(','))
    if (result.indexOf('&') > -1)
        result = result.substring(0, result.indexOf('&'))
    return result;
}

export default function doHubSearch(query: string, limit: number = 5) {
    return new Promise<GetHubSearchResponse[]>((resolve, reject) => {
        if (!plex.settings.uri || !plex.settings.token) {
            reject("No Plex connection found");
            return;
        }

        const url = getAPIUrl(plex.settings.uri, `/hubs/search?query=${encodeURIComponent(query)}&limit=${limit}`);
        AxiosRequest.get<HubSearchResponse>(url, plex.settings.token)
            .then((result) => {
                const response: GetHubSearchResponse[] = [];
                if (result.data.MediaContainer.Hub.length > 0) {
                    for (let i = 0; i < result.data.MediaContainer.Hub.length; i++) {
                        const hub = result.data.MediaContainer.Hub[i];
                        if (hub.type == "album" && hub.Metadata) {
                            for (let j = 0; j < hub.Metadata.length; j++) {
                                const metadata = hub.Metadata[j];
                                response.push({
                                    type: "album",
                                    key: metadata.key,
                                    ratingKey: metadata.ratingKey,
                                    guid: metadata.guid,
                                    score: metadata.score,
                                    image: metadata.thumb,
                                    year: metadata.year,
                                    title: metadata.title,
                                    artist: {
                                        guid: metadata.parentGuid,
                                        key: metadata.parentKey,
                                        title: removeFeaturing(metadata.parentTitle),
                                        alternative_title: "",
                                        image: metadata.parentThumb,
                                    },
                                })
                            }
                        }
                        if (hub.type == "track" && hub.Metadata) {
                            for (let j = 0; j < hub.Metadata.length; j++) {
                                const metadata = hub.Metadata[j];
                                response.push({
                                    type: "track",
                                    key: metadata.key,
                                    ratingKey: metadata.ratingKey,
                                    guid: metadata.guid,
                                    score: metadata.score,
                                    image: metadata.thumb,
                                    title: metadata.title,
                                    album: {
                                        guid: metadata.parentGuid,
                                        key: metadata.parentKey,
                                        title: metadata.parentTitle,
                                        year: metadata.parentYear,
                                        image: metadata.parentThumb,
                                    },
                                    artist: {
                                        guid: metadata.grandparentGuid,
                                        key: metadata.grandparentKey,
                                        title: removeFeaturing(metadata.originalTitle || metadata.grandparentTitle),
                                        alternative_title: removeFeaturing(metadata.grandparentTitle),
                                        image: metadata.grandparentThumb,
                                    }
                                })
                            }
                        }
                    }
                }
                resolve(response)
            }).catch((error) => {
                reject("Could not connect to server");
            })

    })
}