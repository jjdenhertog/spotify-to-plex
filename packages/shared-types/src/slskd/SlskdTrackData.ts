// Type for missing_tracks_slskd.json
// Contains minimal track data available from Track type (no duration_ms)
export type SlskdTrackData = {
    spotify_id: string;
    artist_name: string;
    track_name: string;
    album_name?: string;
};
