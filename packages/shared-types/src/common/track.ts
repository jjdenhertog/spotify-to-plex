export type TrackLink = {
    spotify_id: string
    /** Chosen by a person, so heuristics must not silently discard it */
    manual?: boolean
    plex_id?: string[]
    tidal_id?: string[]
    slskd_files?: {
        username: string;
        filename: string;
        size: number;
    }[]
}