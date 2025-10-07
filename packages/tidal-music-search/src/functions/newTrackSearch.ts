/* eslint-disable max-depth */
import { search as musicSearch } from "@spotify-to-plex/music-search/functions/search";
import { filterOutWords } from "@spotify-to-plex/music-search/utils/filterOutWords";
import { Track } from "@spotify-to-plex/music-search/types/Track";
import { TidalMusicSearchApproach } from "../types/TidalMusicSearchApproach";
import { TidalMusicSearchTrack } from "../types/TidalMusicSearchTrack";
import { SearchResponse, SearchQuery } from "../types/SearchResponse";
import { TidalTrack } from "../types/TidalTrack";
import { searchForTrack } from "../utils/searchForTrack";
import searchResultToTracks from "../utils/searchResultToTracks";
import { addToCache, getFromCache, getConfig } from "../session/state";

export async function newTrackSearch(approaches: TidalMusicSearchApproach[], searchTrack: TidalMusicSearchTrack, analyze: boolean = false): Promise<SearchResponse> {
    const { id, artists, title, album = '' } = searchTrack;

    // Build artist variations (including combined artists)
    const artistVariations = [...artists];
    if (artists.length > 1) {
        artistVariations.push(artists.join(", "));
    }

    const allQueries: SearchQuery[] = [];
    let finalResult: TidalTrack[] = [];

    try {
        // NEW: Loop through approaches first, then artists
        for (const approach of approaches) {
            if (finalResult.length > 0 && !analyze)
                break; // Early exit if we found results and not analyzing

            // For each approach, try all artist variations
            for (const artist of artistVariations) {

                if (!artist)
                    continue;

                const searchResult = await tryApproachWithArtist(approach, { id, artist, title, album }, analyze);
                if (searchResult) {
                    allQueries.push(...searchResult.queries);

                    if (searchResult.result.length == 0)
                        continue;

                    finalResult = searchResult.result;

                    if (!analyze) {
                        return {
                            id,
                            artist: artists[0] || '',
                            title,
                            album: album || "",
                            queries: allQueries,
                            result: finalResult
                        };
                    }

                }
            }
        }

        return {
            id,
            artist: artists[0] || '',
            title,
            album: album || "",
            queries: allQueries,
            result: finalResult
        };

    } catch (_e) {
        throw new Error("Something went wrong while searching");
    }
}


// Helper function to safely try an approach with an artist
type SearchParams = { id: string; artist: string; title: string; album: string };

async function tryApproachWithArtist(approach: TidalMusicSearchApproach, searchParams: SearchParams, analyze: boolean = false): Promise<{ queries: SearchQuery[]; result: TidalTrack[] } | null> {
    try {
        return await performApproachSearch(approach, searchParams, analyze);
    } catch (_e) {
        return null;
    }
}

async function performApproachSearch(approach: TidalMusicSearchApproach, searchParams: SearchParams, analyze: boolean = false): Promise<{ queries: SearchQuery[]; result: TidalTrack[] }> {
    const { id, artist, title, album } = searchParams;
    const config = getConfig();

    if (!config)
        throw new Error("Configuration not set. Call setConfig first.");

    const queries: SearchQuery[] = [];
    let searchResult: TidalTrack[] = [];

    const { id: approachId, trim, filtered, ignoreQuotes: removeQuotes } = approach;

    // Apply text processing
    const searchArtist = filterOutWords(artist.toLowerCase(), config.musicSearchConfig!.textProcessing, filtered, trim, removeQuotes);
    const searchAlbum = filterOutWords(album.toLowerCase(), config.musicSearchConfig!.textProcessing, filtered, trim, removeQuotes);
    const searchTrack = filterOutWords(title.toLowerCase(), config.musicSearchConfig!.textProcessing, filtered, trim, removeQuotes);

    // Perform search function
    const performSearch = async (approach: string, artist: string, title: string, album: string) => {
        const cacheId = `${artist}-${title}-${album}`;
        const foundCache = getFromCache(cacheId);
        if (foundCache)
            return foundCache;

        const searchResults = await searchForTrack(artist, title, album);
        const musicSearchResult = musicSearch({ id, artist, title, album }, searchResultToTracks(searchResults), analyze);

        const tidalTracks = musicSearchResult
            .map((item: Track) => {
                const searchResult = searchResults.find(track => track.id == item.id);
                if (!searchResult)
                    return null;

                return {
                    ...searchResult,
                    matching: item.matching
                };
            })
            .filter((item) => !!item)
            .map((item) => ({ ...item, matching: item.matching }));

        addToCache(cacheId, tidalTracks);

        const query: SearchQuery = { approach, artist, title, album };
        if (analyze)
            query.result = tidalTracks;

        queries.push(query);

        return tidalTracks;
    };

    // Find and cache result
    searchResult = await performSearch(approachId, searchArtist, searchTrack, searchAlbum);

    // Rewrite "&" to "and"
    if (searchResult.length == 0 && (searchArtist.indexOf("&") > -1 || searchTrack.indexOf("&") > -1)) {
        const altSearchArtist = searchArtist.split('&').join('and');
        const altSearchTrack = searchTrack.split('&').join('and');
        searchResult = await performSearch(approachId, altSearchArtist, altSearchTrack, searchAlbum);
    }

    return { queries, result: searchResult };
}
