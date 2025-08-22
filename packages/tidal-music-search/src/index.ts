import MusicSearch, { filterOutWords, Track } from "@spotify-to-plex/music-search";
import { TidalMusicSearchApproach } from "./types/TidalMusicSearchApproach";
import { TidalMusicSearchConfig } from "./types/TidalMusicSearchConfig";
import { TidalMusicSearchTrack } from "./types/TidalMusicSearchTrack";
import { TidalTrack } from "./types/TidalTrack";
import { UserCredentials } from "./types/UserCredentials";
import { TidalAPI } from "./utils/TidalAPI";
import { getAlbumTracks } from "./utils/getAlbumTracks";
import { searchForAlbum } from "./utils/searchForAlbum";
import { searchForTrack } from "./utils/searchForTrack";
import searchResultToTracks from "./utils/searchResultToTracks";

export type SearchResponse = {
    id: string;
    artist: string;
    title: string;
    album: string;
    result: TidalTrack[];
};

export class TidalMusicSearch {

    private readonly _config: TidalMusicSearchConfig
    private _cache: { id: string, result: TidalTrack[] }[] = []

    public constructor(config: TidalMusicSearchConfig) {
        this._config = config;

        // Set the Tidal credentials
        const tidalAPI = TidalAPI.getInstance()
        tidalAPI.clientId = config.clientId
        tidalAPI.clientSecret = config.clientSecret
    }

    public set user(user: UserCredentials | undefined) {
        const tidalAPI = TidalAPI.getInstance()
        tidalAPI.user = user;
    }
    public get user() {
        const tidalAPI = TidalAPI.getInstance()

        return tidalAPI.user;
    }

    public async search(tracks: TidalMusicSearchTrack[]) {

        // Setup approaches
        const {
            searchApproaches: approaches = [
                { id: 'normal', filtered: false, trim: false },
                { id: 'filtered', filtered: true, trim: false },
                { id: 'trimmed', filtered: false, trim: true },
                { id: 'filtered_trimmed', filtered: true, trim: true }
            ]
        } = this._config

        // Initialize music search with config
        const musicSearch = MusicSearch.getInstance()
        musicSearch.config = this._config;

        // Initialzie tidal search
        const tidalAPI = TidalAPI.getInstance()
        await tidalAPI.authenticate()

        // Reset cache
        this._cache = []

        // Search for all tracks
        const result: SearchResponse[] = []

        for (let i = 0; i < tracks.length; i++) {
            const trackResult = await this._newTrackSearch(approaches, tracks[i])
            result.push(trackResult)
        }

        return result
    }

    public async searchAlbum(tracks: TidalMusicSearchTrack[]): Promise<SearchResponse[]> {

        const firstValidAlbum = tracks.find(item => !!item.album);
        if (!firstValidAlbum)
            return tracks.map(item => ({ id: item.id, title: item.title, artist: item.artists[0], album: item.album || "", result: [] }))

        const { album, artists } = firstValidAlbum;
        if (!album)
            return tracks.map(item => ({ id: item.id, title: item.title, artist: item.artists[0], album: item.album || "", result: [] }))

        // Initialize music search with config
        const musicSearch = MusicSearch.getInstance();

        const getMusicSearchResult = (find: TidalMusicSearchTrack, tracks: Track[]): Track[] => {
            const { id, title, album } = find;

            for (let i = 0; i < find.artists.length; i++) {
                const artist = find.artists[i]
                const result = musicSearch.search({ id, title, album, artist }, tracks)
                if (result.length > 0)
                    return result;

            }

            return []
        }

        for (let j = 0; j < artists.length; j++) {
            const artist = artists[j];
            try {
                const foundAlbums = await searchForAlbum(artist, album);
                if (foundAlbums.length > 0) {
                    // We go for the first hit
                    // eslint-disable-next-line @typescript-eslint/prefer-destructuring
                    const album = foundAlbums[0];
                    const albumTracks = await getAlbumTracks(album.id)

                    return tracks.map(item => {

                        const result = getMusicSearchResult(item, searchResultToTracks(albumTracks))
                        const tidalTracks = result
                            .map(item => albumTracks
                                .find(track => track.id == item.id))
                            .filter(item => !!item)

                        return {
                            ...item,
                            artist: artists[0],
                            album: album.title,
                            result: tidalTracks
                        }
                    })
                }
                // return foundAlbums;
            } catch (_e) {

            }
        }

        return tracks.map(item => ({ id: item.id, title: item.title, artist: item.artists[0], album: item.album || "", result: [] }))
    }

    public async getByIds(ids: string[], countryCode: string = "NL") {
        // Initialzie tidal search
        const tidalAPI = TidalAPI.getInstance()
        await tidalAPI.authenticate()

        return tidalAPI.getTrackByIds(ids, countryCode)
    }

    private async _newTrackSearch(approaches: TidalMusicSearchApproach[], searchTrack: TidalMusicSearchTrack): Promise<SearchResponse> {

        const { id, artists, title, album } = searchTrack;

        for (let i = 0; i < artists.length; i++) {
            const artist = artists[i];
            try {
                const result = await this._findTrack(approaches, { id, artist, title, album });
                if (result && result.result.length > 0)
                    return result;
            } catch (_e) {

            }
        }

        // When nothing is found
        return { id, artist: artists[0], title, album: album || "", result: [] }
    }

    private async _findTrack(approaches: TidalMusicSearchApproach[], find: Track) {
        let searchResult: TidalTrack[] = []

        const { id, artist, title, album = '' } = find;

        const musicSearch = MusicSearch.getInstance();

        ///////////////////////////////////////////
        // Perform a search on the plex library
        ///////////////////////////////////////////
        const performSearch = async (artist: string, title: string, album: string) => {
            const cacheId = `${artist}-${title}-${album}`
            const foundCache = this._cache.find(item => item.id == cacheId)
            if (foundCache)
                return foundCache.result;

            const searchResult = await searchForTrack(artist, title, album)
            if (searchResult.length > 0) {
                const musicSearchResult = musicSearch.search(find, searchResultToTracks(searchResult))
                const tidalTracks = musicSearchResult
                    .map(item => searchResult
                        .find(track => track.id == item.id))
                    .filter(item => !!item)

                this._cache.push({ id: cacheId, result: tidalTracks })

                return tidalTracks;
            }

            return []
        }

        ///////////////////////////////////////////
        // Perform searches
        ///////////////////////////////////////////
        try {

            let searchApproachIndex = 0;
            while (approaches[searchApproachIndex]) {
                const approach = approaches[searchApproachIndex]
                if (searchResult.length > 0) {
                    searchApproachIndex++;
                    continue;
                }

                const { trim, filtered, ignoreQuotes: removeQuotes } = approach

                const searchArtist = filterOutWords(artist.toLowerCase(), filtered, trim, removeQuotes);
                const searchAlbum = filterOutWords(album.toLowerCase(), filtered, trim, removeQuotes)
                const searchTrack = filterOutWords(title.toLowerCase(), filtered, trim, removeQuotes)

                // Find and cache result
                searchResult = await performSearch(searchArtist, searchTrack, searchAlbum)

                ////////////////////////////////////////
                // Rewrite "&"" to "and"
                ////////////////////////////////////////
                if (searchResult.length == 0 && (searchArtist.indexOf("&") || searchTrack.indexOf("&") > -1)) {
                    const altSearchArtist = searchArtist.split('&').join('and');
                    const altSearchTrack = searchTrack.split('&').join('and');
                    searchResult = await performSearch(altSearchArtist, altSearchTrack, searchAlbum)
                }

                searchApproachIndex++;
            }

            return {
                id,
                artist,
                album,
                title,
                result: searchResult
            }

        } catch (_e) {
            throw new Error("Something went wrong while searching");
        }

    }
}

export * from './types';
