import { Hub } from "@spotify-to-plex/shared-types/plex/Hub";


export type HubSearchResponse = {
    MediaContainer: {
        size: number;
        Hub: Hub[];
    };
};
