import { getTidalCredentials, settingsDir } from "@spotify-to-plex/shared-utils/server";
import { Track } from "@spotify-to-plex/shared-types";
import { TidalMusicSearch, SearchResponse } from "@spotify-to-plex/tidal-music-search";
import { MusicSearchConfigManager } from "@spotify-to-plex/music-search";

export async function findMissingTidalAlbums(missingTracks: Track[]) {

    if (typeof process.env.TIDAL_API_CLIENT_ID != 'string' || typeof process.env.TIDAL_API_CLIENT_SECRET != 'string')
        return [];

    console.log(`Search for ${missingTracks.length} tracks on Tidal`);

    // Credentials
    const tidalUser = await getTidalCredentials();
    
    // Load music search configuration
    const musicSearchConfigManager = MusicSearchConfigManager.create({
        storageDir: settingsDir,
        preloadCache: true
    });
    let musicSearchConfig;
    try {
        musicSearchConfig = await musicSearchConfigManager.getConfig();
    } catch (error) {
        // Fallback to default config if error loading
        console.warn('Failed to load music search config, using defaults:', error);
    }

    const tidalMusicSearch = new TidalMusicSearch({
        clientId: process.env.TIDAL_API_CLIENT_ID,
        clientSecret: process.env.TIDAL_API_CLIENT_SECRET,
        musicSearchConfig,
    });
    tidalMusicSearch.user = tidalUser;

    const firstWithAlbum = missingTracks.find(item => !!item.album)

    if (!firstWithAlbum)
        return []

    const results = await tidalMusicSearch.searchAlbum([firstWithAlbum]);

    const albumIds: string[] = []
    results.forEach((result: SearchResponse) => {
        result.result.forEach(item => {
            if (!albumIds.includes(item.album.id))
                albumIds.push(item.album.id)
        })
    })

    return albumIds;

}
