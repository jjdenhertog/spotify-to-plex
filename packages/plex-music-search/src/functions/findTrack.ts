import { search as musicSearch } from "@spotify-to-plex/music-search/functions/search";
import { filterOutWords } from "@spotify-to-plex/music-search/utils/filterOutWords";
import { Track } from "@spotify-to-plex/music-search/types/Track";
import { PlexMusicSearchApproach } from "../types/PlexMusicSearchApproach";
import { SearchQuery } from "../types/SearchResponse";
import { PlexTrack } from "../types/PlexTrack";
import { HubSearchResult } from "../types/actions/HubSearchResult";
import hubSearchToPlexTrack from "../utils/searching/hubSearchToPlexTrack";
import { searchForAlbumTracks } from "../utils/searching/searchForAlbumTracks";
import { searchForTrack } from "../utils/searching/searchForTrack";
import searchResultToTracks from "../utils/searching/searchResultToTracks";
import { getConfig, addToCache, getFromCache } from "./state";

export async function findTrack(approaches: PlexMusicSearchApproach[], find: Track, includeMatching: boolean) {
    let searchResult: PlexTrack[] = [];

    const { id, artist, title, album = '' } = find;
    const config = getConfig();
    
    if (!config) {
        throw new Error("Configuration not set. Call setConfig first.");
    }

    const queries: SearchQuery[] = [];

    // Perform a search on the plex library
    const performSearch = async (approach: string, artist: string, title: string, album: string, searchAlbumTracks: boolean = false) => {
        const cacheId = `${searchAlbumTracks ? 'album-' : ''}${artist}-${title}-${album}`;
        const foundCache = getFromCache(cacheId);
        if (foundCache) {
            return foundCache;
        }

        const searchHandler = searchAlbumTracks ? searchForAlbumTracks : searchForTrack;
        const searchResults = await searchHandler(config.uri, config.token, artist, title, album);
        const musicSearchResult = musicSearch(find, searchResultToTracks(searchResults), includeMatching);

        const plexTracks = musicSearchResult
            .map((item: Track & { reason?: string; matching?: Track["matching"] }) => {
                const searchResult = searchResults.find(track => track.id == item.id);
                if (!searchResult) {
                    return null;
                }

                return {
                    ...searchResult,
                    reason: item.reason,
                    matching: item.matching
                };
            })
            .filter((item): item is HubSearchResult & { reason: string; matching: Track["matching"] } => !!item)
            .map((item) => ({ ...hubSearchToPlexTrack(item), matching: item.matching, reason: item.reason }));

        addToCache(cacheId, plexTracks);

        const approachId = searchAlbumTracks ? `${approach}-album` : approach;
        queries.push({ approach: approachId, artist, title, album });

        return plexTracks;
    };

    // Perform searches
    let searchApproachIndex = 0;
    while (approaches[searchApproachIndex]) {
        const approach = approaches[searchApproachIndex];
        if (!approach) {
            searchApproachIndex++;
            continue;
        }
        
        if (searchResult.length > 0) {
            searchApproachIndex++;
            continue;
        }

        const { id: approachId, trim, filtered, ignoreQuotes: removeQuotes } = approach;
        const searchArtist = filterOutWords(artist.toLowerCase(), filtered, trim, removeQuotes);
        const searchAlbum = filterOutWords(album.toLowerCase(), filtered, trim, removeQuotes);
        const searchTrack = filterOutWords(title.toLowerCase(), filtered, trim, removeQuotes);

        try {
            // Find and cache result
            searchResult = await performSearch(approachId, searchArtist, searchTrack, searchAlbum);

            // Rewrite "&" to "and"
            if (searchResult.length == 0 && (searchArtist.indexOf("&") || searchTrack.indexOf("&") > -1)) {
                const altSearchArtist = searchArtist.split('&').join('and');
                const altSearchTrack = searchTrack.split('&').join('and');
                searchResult = await performSearch(approachId, altSearchArtist, altSearchTrack, searchAlbum);
            }

            // Search for albums
            // Plex has difficulties finding tracks where the album name is the same as the track
            if (searchResult.length == 0) {
                searchResult = await performSearch(approachId, searchArtist, searchTrack, searchAlbum, true);
            }

        } catch (_e) {
            // This can happen, with hickups.
            // the invalid urls are also shown in the console
        }

        searchApproachIndex++;
    }

    return {
        id,
        artist,
        album,
        title,
        queries,
        result: searchResult
    };
}