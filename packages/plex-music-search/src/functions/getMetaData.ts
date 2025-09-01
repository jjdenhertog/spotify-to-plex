import { getMetadata } from "../actions/getMetadata";
import { Metadata } from "@spotify-to-plex/shared-types/plex/Metadata";
import { PlexMusicSearchConfig } from "../types/PlexMusicSearchConfig";

export function getMetaData(config: PlexMusicSearchConfig, key: string): Promise<Metadata[]> {
    return getMetadata(config.uri, config.token, key);
}