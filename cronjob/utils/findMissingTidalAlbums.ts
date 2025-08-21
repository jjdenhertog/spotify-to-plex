import getTidalCredentials from "@/helpers/tidal/getTidalCredentials";
import { Track } from "@/types/SpotifyAPI";
import { TidalMusicSearch, SearchResponse } from "@spotify-to-plex/tidal-music-search";

export async function findMissingTidalAlbums(missingTracks: Track[]) {

    if (typeof process.env.TIDAL_API_CLIENT_ID != 'string' || typeof process.env.TIDAL_API_CLIENT_SECRET != 'string')
        return [];

    console.log(`Search for ${missingTracks.length} tracks on Tidal`);

    // Credentials
    const tidalUser = await getTidalCredentials();
    const tidalMusicSearch = new TidalMusicSearch({
        clientId: process.env.TIDAL_API_CLIENT_ID,
        clientSecret: process.env.TIDAL_API_CLIENT_SECRET
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
