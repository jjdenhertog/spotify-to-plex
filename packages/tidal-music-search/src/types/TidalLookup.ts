import { TidalTrack } from "./TidalTrack";

export type TidalLookup = {
    id: string;
    // Best match first
    tidal_ids: string[];
    // Only known when the track came from a live search, a cached link holds just the ids
    track?: TidalTrack;
};
