export type TrackLink = {
    spotify_id: string
    plex_id?: string[]
    tidal_id?: string[]
    slskd_files?: {
        username: string;
        filename: string;
        size: number;
    }[]
}