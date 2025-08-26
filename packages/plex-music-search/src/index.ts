import MusicSearch, { filterOutWords, removeFeaturing, Track } from "@spotify-to-plex/music-search";
import getAlbumTracks from "./actions/getAlbumTracks";
import { getMetadata } from "./actions/getMetadata";
import { Metadata } from "./types";
import { PlexMusicSearchApproach } from "./types/PlexMusicSearchApproach";
import { PlexMusicSearchConfig } from "./types/PlexMusicSearchConfig";
import { PlexMusicSearchTrack } from "./types/PlexMusicSearchTrack";
import { PlexTrack } from "./types/PlexTrack";
import { SearchQuery, SearchResponse } from "./types/SearchResponse";
import { HubSearchResult } from "./types/actions/HubSearchResult";
import hubSearchToPlexTrack from "./utils/searching/hubSearchToPlexTrack";
import { searchForAlbum } from "./utils/searching/searchForAlbum";
import { searchForAlbumTracks } from "./utils/searching/searchForAlbumTracks";
import { searchForTrack } from "./utils/searching/searchForTrack";
import searchResultToTracks from "./utils/searching/searchResultToTracks";

export class PlexMusicSearch {

    private readonly _config: PlexMusicSearchConfig
    private _cache: { id: string, result: PlexTrack[] }[] = []

    public constructor(config: PlexMusicSearchConfig) {
        this._config = config;
    }

    public async search(tracks: PlexMusicSearchTrack[]) {

        const {
            searchApproaches: approaches = [
                { id: 'normal', filtered: false, trim: false },
                { id: 'filtered', filtered: true, trim: false, removeQuotes: true },
                { id: 'trimmed', filtered: false, trim: true },
                { id: 'filtered_trimmed', filtered: true, trim: true, removeQuotes: true }
            ]
        } = this._config

        // Initialize music search with config
        const musicSearch = MusicSearch.getInstance()
        musicSearch.config = this._config;
        
        // Set music search configuration if available
        const { musicSearchConfig } = this._config;
        if (musicSearchConfig) {
            musicSearch.setMusicSearchConfig(musicSearchConfig);
        }

        // Reset cache
        this._cache = []

        const result: SearchResponse[] = []

        for (let i = 0; i < tracks.length; i++) {
            const track = tracks[i];
            if (track) {
                const trackResult = await this._newTrackSearch(approaches, track, false)
                result.push(trackResult)
            }
        }

        return result
    }


    public async analyze(track: PlexMusicSearchTrack) {

        const {
            searchApproaches: approaches = [
                { id: 'normal', filtered: false, trim: false },
                { id: 'filtered', filtered: true, trim: false, removeQuotes: true },
                { id: 'trimmed', filtered: false, trim: true },
                { id: 'filtered_trimmed', filtered: true, trim: true, removeQuotes: true }
            ]
        } = this._config

        // Reset cache
        this._cache = []

        // Initialize music search with config
        const musicSearch = MusicSearch.getInstance()
        musicSearch.config = this._config;
        
        // Set music search configuration if available
        const { musicSearchConfig } = this._config;
        if (musicSearchConfig) {
            musicSearch.setMusicSearchConfig(musicSearchConfig);
        }

        return this._newTrackSearch(approaches, track, true)
    }

    public async searchAlbum(tracks: PlexMusicSearchTrack[]): Promise<SearchResponse[]> {

        const firstValidAlbum = tracks.find(item => !!item?.album);
        if (!firstValidAlbum)
            return tracks.map(item => ({ id: item.id, title: item.title, artist: item.artists[0] || '', album: item.album || "", result: [] }))

        const { album, artists } = firstValidAlbum;
        if (!album)
            return tracks.map(item => ({ id: item.id, title: item.title, artist: item.artists[0] || '', album: item.album || "", result: [] }))

        // Initialize music search with config
        const musicSearch = MusicSearch.getInstance();

        const getMusicSearchResult = (find: PlexMusicSearchTrack, tracks: Track[]): Track[] => {
            const { id, title, album } = find;

            for (let i = 0; i < find.artists.length; i++) {
                const artist = find.artists[i]
                const result = musicSearch.search({ id, title, album: album || '', artist: artist || '' }, tracks)
                if (result.length > 0)
                    return result;

            }

            return []
        }

        for (let j = 0; j < artists.length; j++) {
            const artist = artists[j];
            try {
                const foundAlbums = await searchForAlbum(this._config.uri, this._config.token, artist || '', album || '');
                if (foundAlbums.length > 0) {

                    // We go for the first hit
                    // eslint-disable-next-line @typescript-eslint/prefer-destructuring
                    const album = foundAlbums[0];
                    const albumTracks = await getAlbumTracks(this._config.uri, this._config.token, album?.id || '')

                    return tracks.map(item => {

                        const result = getMusicSearchResult(item, searchResultToTracks(albumTracks))
                        const plexTracks = result
                            .map(item => albumTracks
                                .find(track => track.id == item.id))
                            .filter(item => !!item)
                            .map(item => hubSearchToPlexTrack(item))

                        return {
                            ...item,
                            artist: artists[0] || '',
                            album: album?.title || '',
                            result: plexTracks
                        }
                    })
                }
                // return foundAlbums;
            } catch (_e) {
            }
        }

        return tracks.map(item => ({ id: item.id, title: item.title, artist: item.artists[0] || '', album: item.album || "", result: [] }))

    }

    public getMetaData(key: string): Promise<Metadata[]> {
        return getMetadata(this._config.uri, this._config.token, key);
    }

    public async getById(key: string): Promise<PlexTrack> {
        const metaData = await getMetadata(this._config.uri, this._config.token, key);
        // eslint-disable-next-line @typescript-eslint/prefer-destructuring
        const item = metaData[0];
        
        if (!item) {
            throw new Error(`No metadata found for key: ${  key}`);
        }

        let src = '';
        try {
            src = item.Media?.[0]?.Part?.[0]?.file || '';
        } catch (_e) {
        }

        return {
            id: item.key || '',
            guid: item.guid || '',
            image: item.thumb || '',
            title: item.title || '',
            src,
            album: {
                guid: item.parentGuid || '',
                id: item.parentKey || '',
                title: item.parentTitle || '',
                image: item.parentThumb || '',
            },
            artist: {
                guid: item.grandparentGuid || '',
                id: item.grandparentKey || '',
                title: removeFeaturing(item.originalTitle || item.grandparentTitle || ''),
                image: item.grandparentThumb || '',
            }
        };

    }

    private async _newTrackSearch(approaches: PlexMusicSearchApproach[], searchTrack: PlexMusicSearchTrack, includeMatching: boolean): Promise<SearchResponse> {

        const { id, artists, title, album } = searchTrack;

        let queries: SearchQuery[] = []

        for (let j = 0; j < artists.length; j++) {
            const artist = artists[j];
            try {
                const result = await this._findTrack(approaches, { id, artist: artist || '', title, album: album || '' }, includeMatching);
                queries = queries.concat(result.queries)

                if (result && result.result.length > 0)
                    return result;
            } catch (_e) {
            }
        }

        return { id, artist: artists[0] || '', title, album: album || "", queries, result: [] }
    }

    private async _findTrack(approaches: PlexMusicSearchApproach[], find: Track, includeMatching: boolean) {
        let searchResult: PlexTrack[] = []

        const { id, artist, title, album = '' } = find;

        const queries: SearchQuery[] = []
        const musicSearch = MusicSearch.getInstance();

        ///////////////////////////////////////////
        // Perform a search on the plex library
        ///////////////////////////////////////////
        const performSearch = async (approach: string, artist: string, title: string, album: string, searchAlbumTracks: boolean = false) => {
            const cacheId = `${searchAlbumTracks ? 'album-' : ''}${artist}-${title}-${album}`
            const foundCache = this._cache.find(item => item.id == cacheId)
            if (foundCache)
                return foundCache.result;

            const searchHandler = searchAlbumTracks ? searchForAlbumTracks : searchForTrack;
            const searchResults = await searchHandler(this._config.uri, this._config.token, artist, title, album)
            const musicSearchResult = musicSearch.search(find, searchResultToTracks(searchResults), includeMatching)

            const plexTracks = musicSearchResult
                .map((item: Track & { reason?: string; matching?: Track["matching"] }) => {
                    const searchResult = searchResults.find(track => track.id == item.id)
                    if (!searchResult)
                        return null;

                    return {
                        ...searchResult,
                        reason: item.reason,
                        matching: item.matching
                    }
                })
                .filter((item): item is HubSearchResult & { reason: string; matching: Track["matching"] } => !!item)
                .map((item) => ({ ...hubSearchToPlexTrack(item), matching: item.matching, reason: item.reason }))

            this._cache.push({ id: cacheId, result: plexTracks })

            const approachId = searchAlbumTracks ? `${approach}-album` : approach
            queries.push({ approach: approachId, artist, title, album })

            return plexTracks;
        }

        ///////////////////////////////////////////
        // Perform searches
        ///////////////////////////////////////////

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

            const { id: approachId, trim, filtered, ignoreQuotes: removeQuotes } = approach
            const searchArtist = filterOutWords(artist.toLowerCase(), filtered, trim, removeQuotes)
            const searchAlbum = filterOutWords(album.toLowerCase(), filtered, trim, removeQuotes)
            const searchTrack = filterOutWords(title.toLowerCase(), filtered, trim, removeQuotes)

            try {

                // Find and cache result
                searchResult = await performSearch(approachId, searchArtist, searchTrack, searchAlbum)

                ////////////////////////////////////////
                // Rewrite "&"" to "and"
                ////////////////////////////////////////
                if (searchResult.length == 0 && (searchArtist.indexOf("&") || searchTrack.indexOf("&") > -1)) {
                    const altSearchArtist = searchArtist.split('&').join('and');
                    const altSearchTrack = searchTrack.split('&').join('and');
                    searchResult = await performSearch(approachId, altSearchArtist, altSearchTrack, searchAlbum)
                }

                ////////////////////////////////////////
                // Search for albums
                // Plex has difficulties finding tracks where the album name is the same as the track
                ////////////////////////////////////////
                if (searchResult.length == 0)
                    searchResult = await performSearch(approachId, searchArtist, searchTrack, searchAlbum, true)

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
        }


    }
}


export * from './types';
