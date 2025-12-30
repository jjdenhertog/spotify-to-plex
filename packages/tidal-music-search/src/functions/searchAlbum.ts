import { search as musicSearch } from "@spotify-to-plex/music-search/functions/search";
import { Track } from "@spotify-to-plex/music-search/types/Track";
import { TidalMusicSearchConfig } from "../types/TidalMusicSearchConfig";
import { TidalMusicSearchTrack } from "../types/TidalMusicSearchTrack";
import { searchForAlbum } from "../utils/searchForAlbum";
import { getAlbumTracks } from "../utils/getAlbumTracks";
import searchResultToTracks from "../utils/searchResultToTracks";
import { authenticate } from "../session/credentials";
import { setCredentials } from "../session/credentials";
import { setMusicSearchConfig, resetCache} from "../session/state";

export async function searchAlbum(config: TidalMusicSearchConfig, tracks: TidalMusicSearchTrack[]) {

    // Set configuration
    setMusicSearchConfig(config);

    // Set the Tidal credentials
    const { clientId, clientSecret } = config;
    setCredentials(clientId, clientSecret);

    // Initialize tidal search
    await authenticate();

    // Reset cache
    resetCache();

    const firstValidAlbum = tracks.find(item => !!item.album);
    if (!firstValidAlbum) {
        return tracks.map(item => ({
            id: item.id,
            title: item.title,
            artist: item.artists[0] || "",
            album: item.album || "",
            result: []
        }));
    }

    const { album, artists } = firstValidAlbum;
    if (!album) {
        return tracks.map(item => ({
            id: item.id,
            title: item.title,
            artist: item.artists[0] || "",
            album: item.album || "",
            result: []
        }));
    }

    const getMusicSearchResult = (find: TidalMusicSearchTrack, tracks: Track[]): Track[] => {
        const { id, title, album } = find;

        for (let i = 0; i < find.artists.length; i++) {
            const artist = find.artists[i];
            if (artist && album) {
                const result = musicSearch({ id, title, album, artist }, tracks);
                if (result.length > 0) {
                    return result;
                }
            }
        }

        return [];
    };

    for (let j = 0; j < artists.length; j++) {
        const artist = artists[j];
        if (!artist)
            continue;

        try {
            const foundAlbums = await searchForAlbum(artist, album);
            if (foundAlbums.length > 0) {
                // We go for the first hit
                const [foundAlbum] = foundAlbums;
                if (foundAlbum) {
                    const albumTracks = await getAlbumTracks(foundAlbum.id);

                    return tracks.map(item => {
                        const result = getMusicSearchResult(item, searchResultToTracks(albumTracks));
                        const tidalTracks = result
                            .map(item => albumTracks
                                .find(track => track.id == item.id))
                            .filter(item => !!item);

                        return {
                            ...item,
                            artist: artists[0] || "",
                            album: foundAlbum.title || "",
                            albumId: foundAlbum.id,
                            result: tidalTracks
                        };
                    });
                }
            }
        } catch (_e) {
            // Continue to next artist
        }
    }

    return tracks.map(item => ({
        id: item.id,
        title: item.title,
        artist: item.artists[0] || "",
        album: item.album || "",
        result: []
    }));
}