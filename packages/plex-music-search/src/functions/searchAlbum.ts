import { search } from "@spotify-to-plex/music-search/functions/search";
import { Track } from "@spotify-to-plex/music-search/types/Track";
import getAlbumTracks from "../actions/getAlbumTracks";
import { PlexMusicSearchConfig } from "../types/PlexMusicSearchConfig";
import { PlexMusicSearchTrack } from "../types/PlexMusicSearchTrack";
import hubSearchToPlexTrack from "../utils/searching/hubSearchToPlexTrack";
import { searchForAlbum } from "../utils/searching/searchForAlbum";
import searchResultToTracks from "../utils/searching/searchResultToTracks";
import { resetCache, setMusicSearchConfig } from "../session/state";

export async function searchAlbum(config: PlexMusicSearchConfig, tracks: PlexMusicSearchTrack[]) {
    if (!config.searchApproaches || config.searchApproaches.length === 0) 
        throw new Error('No search approaches provided. Configuration must include explicit searchApproaches.');

    setMusicSearchConfig(config);
    resetCache();
    
    const firstValidAlbum = tracks.find(item => !!item?.album);
    if (!firstValidAlbum) {
        return tracks.map(item => ({ 
            id: item.id, 
            title: item.title, 
            artist: item.artists[0] || '', 
            album: item.album || "", 
            result: [] 
        }));
    }

    const { album, artists } = firstValidAlbum;
    if (!album) {
        return tracks.map(item => ({ 
            id: item.id, 
            title: item.title, 
            artist: item.artists[0] || '', 
            album: item.album || "", 
            result: [] 
        }));
    }

    const getMusicSearchResult = (find: PlexMusicSearchTrack, tracks: Track[]): Track[] => {
        const { id, title, album } = find;

        for (let i = 0; i < find.artists.length; i++) {
            const artist = find.artists[i];
            const result = search({ id, title, album: album || '', artist: artist || '' }, tracks);
            if (result.length > 0) {
                return result;
            }
        }

        return [];
    };

    for (let j = 0; j < artists.length; j++) {
        const artist = artists[j];
        try {
            const foundAlbums = await searchForAlbum(config.uri, config.token, artist || '', album || '');
            if (foundAlbums.length > 0) {
                // We go for the first hit
                const [albumResult] = foundAlbums;
                const albumTracks = await getAlbumTracks(config.uri, config.token, albumResult?.id || '');
                const reformedAlbumTracks = searchResultToTracks(albumTracks)

                return tracks.map(item => {
                    const result = getMusicSearchResult(item, reformedAlbumTracks);

                    const plexTracks = result
                        .map(item => albumTracks
                            .find(track => track.id == item.id))
                        .filter(item => !!item)
                        .map(item => hubSearchToPlexTrack(item));

                    return {
                        ...item,
                        artist: artists[0] || '',
                        album: albumResult?.title || '',
                        result: plexTracks
                    };
                });
            }
        } catch (_e) {
            // Continue to next artist
        }
    }

    return tracks.map(item => ({ 
        id: item.id, 
        title: item.title, 
        artist: item.artists[0] || '', 
        album: item.album || "", 
        result: [] 
    }));
}