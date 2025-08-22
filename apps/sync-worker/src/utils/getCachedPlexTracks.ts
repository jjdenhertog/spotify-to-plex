import getCachedTrackLinks from "../helpers/getCachedTrackLink";
import { GetSpotifyAlbum, GetSpotifyPlaylist } from "../types/SpotifyAPI";
import { PlexMusicSearch, PlexTrack, SearchResponse } from "@spotify-to-plex/plex-music-search";

export async function getCachedPlexTracks(plexMusicSearch: PlexMusicSearch, data: GetSpotifyPlaylist | GetSpotifyAlbum) {
    const { add, found: cachedTrackLinks } = getCachedTrackLinks(data.tracks, 'plex');
    const result: SearchResponse[] = [];

    for (let i = 0; i < data.tracks.length; i++) {
        const searchItem = data.tracks[i];

        // Process if no cached link has been found
        const trackLink = cachedTrackLinks.find(item => item.spotify_id == searchItem.id);
        if (!trackLink?.plex_id || trackLink.plex_id?.length == 0)
            continue;

        // Load the plex tracks data
        const foundTracks: PlexTrack[] = [];

        for (let j = 0; j < trackLink.plex_id.length; j++) {
            const plexId = trackLink.plex_id[j];
            try {
                const metaData = await plexMusicSearch.getById(plexId);

                if (metaData)
                    foundTracks.push(metaData);
            } catch (_e) {
            }
        }

        // Try searching again if no tracks are found
        if (foundTracks.length == 0)
            continue;

        // Add the result
        result.push({
            id: searchItem.id,
            title: searchItem.title,
            artist: searchItem.artists[0],
            album: searchItem.album || "",
            result: foundTracks
        });
    }

    return { add, result };
}
