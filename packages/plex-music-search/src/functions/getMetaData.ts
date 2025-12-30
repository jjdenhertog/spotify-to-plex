import { getMetadata } from "../actions/getMetadata";
import { PlexMusicSearchConfig } from "../types/PlexMusicSearchConfig";

export function getMetaData(config: PlexMusicSearchConfig, key: string) {
    return getMetadata(config.uri, config.token, key);
}