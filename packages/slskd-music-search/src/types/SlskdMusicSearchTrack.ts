/**
 * Track input for search (mirrors TidalMusicSearchTrack)
 */
export type SlskdMusicSearchTrack = {
    id: string;
    artists: string[];
    title: string;
    album?: string;
};
