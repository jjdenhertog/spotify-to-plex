import { search as musicSearch } from "@spotify-to-plex/music-search/functions/search";
import { filterOutWords } from "@spotify-to-plex/music-search/utils/filterOutWords";
import { Track } from "@spotify-to-plex/music-search/types/Track";
import { TidalMusicSearchApproach } from "../types/TidalMusicSearchApproach";
import { TidalTrack } from "../types/TidalTrack";
import { searchForTrack } from "../utils/searchForTrack";
import searchResultToTracks from "../utils/searchResultToTracks";
import { addToCache, getFromCache } from "./state";

export type SearchResponse = {
    id: string;
    artist: string;
    title: string;
    album: string;
    result: TidalTrack[];
};

export async function findTrack(approaches: TidalMusicSearchApproach[], find: Track): Promise<SearchResponse> {
    let searchResult: TidalTrack[] = [];

    const { id, artist, title, album = '' } = find;

    // Perform a search on the tidal library
    const performSearch = async (artist: string, title: string, album: string) => {
        const cacheId = `${artist}-${title}-${album}`;
        const foundCache = getFromCache(cacheId);
        if (foundCache) {
            return foundCache;
        }

        const searchResult = await searchForTrack(artist, title, album);
        if (searchResult.length > 0) {
            const musicSearchResult = musicSearch(find, searchResultToTracks(searchResult));
            const tidalTracks = musicSearchResult
                .map(item => searchResult
                    .find(track => track.id == item.id))
                .filter(item => !!item);

            addToCache(cacheId, tidalTracks);

            return tidalTracks;
        }

        return [];
    };

    // Perform searches
    try {
        let searchApproachIndex = 0;
        while (approaches[searchApproachIndex]) {
            const approach = approaches[searchApproachIndex];
            if (searchResult.length > 0) {
                searchApproachIndex++;
                continue;
            }

            if (!approach) {
                searchApproachIndex++;
                continue;
            }

            const { trim, filtered, ignoreQuotes: removeQuotes } = approach;

            const searchArtist = filterOutWords(artist.toLowerCase(), filtered, trim, removeQuotes);
            const searchAlbum = filterOutWords(album.toLowerCase(), filtered, trim, removeQuotes);
            const searchTrack = filterOutWords(title.toLowerCase(), filtered, trim, removeQuotes);

            // Find and cache result
            searchResult = await performSearch(searchArtist, searchTrack, searchAlbum);

            // Rewrite "&" to "and"
            if (searchResult.length == 0 && (searchArtist.indexOf("&") || searchTrack.indexOf("&") > -1)) {
                const altSearchArtist = searchArtist.split('&').join('and');
                const altSearchTrack = searchTrack.split('&').join('and');
                searchResult = await performSearch(altSearchArtist, altSearchTrack, searchAlbum);
            }

            searchApproachIndex++;
        }

        return {
            id,
            artist,
            album,
            title,
            result: searchResult
        };

    } catch (_e) {
        throw new Error("Something went wrong while searching");
    }
}