export type TrackLink = {
    spotify_id: string
    // Chosen by a person, so the duration guard must leave it alone
    manual?: boolean
    plex_id?: string[]
    tidal_id?: string[]
    slskd_files?: {
        username: string;
        filename: string;
        size: number;
    }[]
}