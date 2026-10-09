import { TidalMatch } from "./TidalMatch";

export type TidalFallbackFields = {
    status: 'plex' | 'tidal' | 'none';
    tidal_ids?: string[];
    tidal_album_id?: string;
    tidal_match?: TidalMatch;
    tidal_error?: 'unconfigured' | 'failed';
};
