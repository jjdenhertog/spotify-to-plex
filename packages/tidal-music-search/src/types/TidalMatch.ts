// Describes the best Tidal track, so a caller can show what will be downloaded
export type TidalMatch = {
    artist: string;
    title: string;
    album: string;
    duration_ms?: number;
};
