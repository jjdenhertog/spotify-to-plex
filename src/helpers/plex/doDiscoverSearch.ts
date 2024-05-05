import { plex } from "@/library/plex";
import { DiscoveryMetadata, DiscoverySearchResponse, DiscoverySearchResult } from "@/types/PlexAPI";
import axios from "axios";
import { AxiosRequest } from "../AxiosRequest";


export type GetDiscoverySearchResponse = (GetDiscoverySearchAlbumResponse | GetDiscoverySearchTrackResponse)
export type GetDiscoverySearchTrackResponse = {
    type: "track",
    key: DiscoveryMetadata["key"],
    guid: DiscoveryMetadata["guid"],
    source: DiscoveryMetadata["source"],
    score: DiscoverySearchResult["score"],
    image: DiscoveryMetadata["thumb"],
    title: DiscoveryMetadata["title"],
    album: {
        key: DiscoveryMetadata["parentKey"],
        title: DiscoveryMetadata["parentTitle"],
    },
    artist: {
        title: DiscoveryMetadata["grandparentTitle"],
        alternative_title: DiscoveryMetadata["grandparentTitle"],
    },
    metadata: any
}

export type GetDiscoverySearchAlbumResponse = {
    type: "album",
    key: DiscoveryMetadata["key"],
    source: DiscoveryMetadata["source"],
    guid: DiscoveryMetadata["guid"],
    score: DiscoverySearchResult["score"],
    image: DiscoveryMetadata["thumb"],
    year: DiscoveryMetadata["year"],
    title: DiscoveryMetadata["title"],
    artist: {
        key: DiscoveryMetadata["parentKey"],
        title: DiscoveryMetadata["parentTitle"],
        alternative_title: DiscoveryMetadata["grandparentTitle"],
    },
    metadata: any
}


export default function doDiscoverSearch(query: string, limit: number = 5) {
    return new Promise<GetDiscoverySearchResponse[]>((resolve, reject) => {
        if (!plex.settings.uri || !plex.settings.token) {
            reject("No Plex connection found");
            return;
        }

        const url = `https://discover.provider.plex.tv/library/search?query=${encodeURIComponent(query)}&limit=${limit}&searchTypes=music&searchProviders=discover%2CplexAVOD%2Ctidal`;
        AxiosRequest.get<DiscoverySearchResponse>(url, plex.settings.token)
            .then(async (result) => {
                const tidal = result.data.MediaContainer.SearchResults.filter((item: any) => item.id == "tidal")[0];
                const response: GetDiscoverySearchResponse[] = [];
                if (tidal.SearchResult && tidal.SearchResult.length > 0) {
                    for (let i = 0; i < tidal.SearchResult.length; i++) {
                        const searchResult = tidal.SearchResult[i];
                        if (searchResult.Metadata.type == "album" && searchResult.Metadata) {
                            const metadata = searchResult.Metadata;
                            response.push({
                                type: "album",
                                key: metadata.key,
                                guid: metadata.guid,
                                score: searchResult.score,
                                image: metadata.thumb,
                                year: metadata.year,
                                title: metadata.title,
                                source: metadata.source,
                                artist: {
                                    key: metadata.parentKey,
                                    title: metadata.parentTitle,
                                    alternative_title: '',
                                },
                                metadata: metadata
                            })
                        }
                        if (searchResult.Metadata.type == "track" && searchResult.Metadata) {
                            const metadata = searchResult.Metadata;
                            let artist = metadata.grandparentTitle;
                            let thumb = metadata.thumb;

                            if (artist == 'Various Artists' || thumb.indexOf('rovicorp') > -1) {
                                try {
                                    const url = `https://music.provider.plex.tv${metadata.key}?X-Plex-Token=${plex.settings.token}`;
                                    const getTrack = await axios.get(url);
                                    const trackData = getTrack.data.MediaContainer.Metadata[0];
                                    if (artist == 'Various Artists' && trackData)
                                        artist = trackData.originalTitle;

                                    if (thumb.indexOf('rovicorp') > -1 && trackData?.parentThumb?.indexOf('rovicorp') == -1)
                                        thumb = trackData.parentThumb
                                    if (thumb.indexOf('rovicorp') > -1 && trackData?.grandparentThumb?.indexOf('rovicorp') == -1)
                                        thumb = trackData.parentThumb
                                } catch (e) {
                                }
                            }

                            response.push({
                                type: "track",
                                key: metadata.key,
                                guid: metadata.guid,
                                score: searchResult.score,
                                image: thumb,
                                title: metadata.title,
                                source: metadata.source,
                                album: {
                                    key: metadata.parentKey,
                                    title: metadata.parentTitle,
                                },
                                artist: {
                                    title: artist,
                                    alternative_title: '',
                                },
                                metadata: metadata
                            })
                        }
                    }
                }
                resolve(response)
            }).catch((error) => {
                reject("Could not connect to server");
            })
    })
}