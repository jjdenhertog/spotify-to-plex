import { removeFeaturing } from "@spotify-to-plex/music-search/utils/removeFeaturing";
import { getMetadata } from "../actions/getMetadata";
import { PlexMusicSearchConfig } from "../types/PlexMusicSearchConfig";
import { PlexTrack } from "../types/PlexTrack";

export async function getById(config: PlexMusicSearchConfig, key: string): Promise<PlexTrack> {
    const metaData = await getMetadata(config.uri, config.token, key);
    const [item] = metaData;
    
    if (!item) {
        throw new Error(`No metadata found for key: ${key}`);
    }

    let src = '';
    try {
        src = item.Media?.[0]?.Part?.[0]?.file || '';
    } catch (_e) {
        // Ignore error
    }

    return {
        id: item.key || '',
        guid: item.guid || '',
        image: item.thumb || '',
        title: item.title || '',
        src,
        album: {
            guid: item.parentGuid || '',
            id: item.parentKey || '',
            title: item.parentTitle || '',
            image: item.parentThumb || '',
        },
        artist: {
            guid: item.grandparentGuid || '',
            id: item.grandparentKey || '',
            title: removeFeaturing(item.originalTitle || item.grandparentTitle || ''),
            image: item.grandparentThumb || '',
        }
    };
}