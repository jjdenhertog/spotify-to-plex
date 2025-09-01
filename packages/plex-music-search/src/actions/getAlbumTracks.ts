import { removeFeaturing } from "@spotify-to-plex/music-search/utils/removeFeaturing";
import { HubSearchResult } from "../types/actions/HubSearchResult";
import { Metadata } from "@spotify-to-plex/shared-types/plex/Metadata";
import { getMetadata } from "./getMetadata";

export default async function getAlbumTracks(uri: string, token: string, key: string) {
    const albumTracks = await getMetadata(uri, token, key);

    const trackResult: HubSearchResult[] = albumTracks.map((metadata: Metadata) => {
        return {
            type: "track",
            id: metadata.key,
            ratingKey: metadata.ratingKey,
            guid: metadata.guid,
            score: parseFloat(metadata.score) || 0,
            image: metadata.thumb,
            title: metadata.title,
            album: {
                id: metadata.parentKey,
                guid: metadata.parentGuid,
                title: metadata.parentTitle,
                year: metadata.parentYear,
                image: metadata.parentThumb,
            },
            artist: {
                id: metadata.grandparentKey,
                guid: metadata.grandparentGuid,
                title: removeFeaturing(metadata.originalTitle || metadata.grandparentTitle),
                image: metadata.grandparentThumb,
            }
        };
    });

    return trackResult;
}