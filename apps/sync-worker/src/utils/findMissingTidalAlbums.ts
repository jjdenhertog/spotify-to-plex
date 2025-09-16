import { getTidalCredentials } from "@spotify-to-plex/shared-utils/tidal/getTidalCredentials";
import { getStorageDir } from "@spotify-to-plex/shared-utils/utils/getStorageDir";
import { Track } from "@spotify-to-plex/shared-types/spotify/Track";
import { searchAlbum } from "@spotify-to-plex/tidal-music-search/functions/searchAlbum";
import { setUser } from "@spotify-to-plex/tidal-music-search/functions/setUser";
import { getMusicSearchConfigFromStorage } from "@spotify-to-plex/music-search/functions/getMusicSearchConfigFromStorage";

export async function findMissingTidalAlbums(missingTracks: Track[]) {

    if (typeof process.env.TIDAL_API_CLIENT_ID != 'string' || typeof process.env.TIDAL_API_CLIENT_SECRET != 'string')
        return [];

    console.log(`Search for ${missingTracks.length} tracks on Tidal`);

    // Credentials
    const tidalUser = await getTidalCredentials();
    
    // Load music search configuration
    let musicSearchConfig;
    try {
        musicSearchConfig = await getMusicSearchConfigFromStorage(getStorageDir());
    } catch (error) {
        // Fallback to default config if error loading
        console.warn('Failed to load music search config, using defaults:', error);
    }

    const tidalConfig = {
        clientId: process.env.TIDAL_API_CLIENT_ID,
        clientSecret: process.env.TIDAL_API_CLIENT_SECRET,
        musicSearchConfig,
    };
    setUser(tidalUser);

    const firstWithAlbum = missingTracks.find(item => !!item.album)

    if (!firstWithAlbum)
        return []

    const results = await searchAlbum(tidalConfig, [firstWithAlbum]);

    const albumIds: string[] = []
    results.forEach((result) => {
        result.result.forEach(item => {
            if (!albumIds.includes(item.album.id))
                albumIds.push(item.album.id)
        })
    })

    return albumIds;

}
