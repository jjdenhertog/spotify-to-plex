import { compareTitles } from "../searching/compareTitles";
import { GetMatchingTrackResponse, findMatchingTracks } from "../searching/findMatchingTracks";
import doDiscoverSearch from "./doDiscoverSearch";
import doHubSearch, { removeFeaturing } from "./doHubSearch";
import { getAlbum } from "./getAlbum";

export async function searchForTrackInHubs(artist: string, track: string, album: string) {
    let search = `${artist} ${track}`;
    const searchResult = await doHubSearch(search, 50);
    const result = findMatchingTracks(searchResult, artist, track, album);

    let alternative = `${track}`;
    const alternativeSearchResult = await doHubSearch(alternative, 50);
    const alternativeResult = findMatchingTracks(alternativeSearchResult, artist, track, album);
    alternativeResult.forEach(item => {
        if (result.filter(existingItem => existingItem.guid == item.guid).length == 0)
            result.push(item)
    })

    // Added because of abbreviations in tracks (Dancing => Dancin')
    {
        const alternative = `${artist}`;
        const alternativeSearchResult = await doHubSearch(alternative, 50);
        const alternativeResult = findMatchingTracks(alternativeSearchResult, artist, track, album);
        alternativeResult.forEach(item => {
            if (result.filter(existingItem => existingItem.guid == item.guid).length == 0)
                result.push(item)
        })
    }

    // Added because of classical tracks
    if (track.indexOf(':') > -1) {
        alternative = track.substring(track.indexOf(':') + 1)
        const alternativeSearchResult = await doHubSearch(alternative, 50);
        const alternativeResult = findMatchingTracks(alternativeSearchResult, artist, track, album);
        alternativeResult.forEach(item => {
            if (result.filter(existingItem => existingItem.guid == item.guid).length == 0)
                result.push(item)
        })
    }
    return result;
}

export async function searchForAlbumInHubs(artist: string, album: string, artistMatch: { contain: boolean, similarity: number } = { similarity: .6, contain: true }) {
    const hubSearchResult = await doHubSearch(album, 10);
    const foundAlbums = hubSearchResult.map(item => {
        return {
            ...item,
            matching: {
                album: compareTitles(item.title, album),
                artist: compareTitles(item.artist.title, artist)
            }
        }
    })
    return foundAlbums.filter(item => {
        if (item.type != "album")
            return false;

        if (item.matching.album.match && (
            item.matching.artist.match ||
            item.matching.artist.similarity >= artistMatch.similarity ||
            (item.matching.artist.contains && artistMatch.contain)
        )) {
            return true;
        }
        return false;
    }).sort((a, b) => {
        let aMatches = a.matching.artist.similarity + a.matching.album.similarity
        let bMatches = b.matching.artist.similarity + b.matching.album.similarity
        return bMatches - aMatches;
    });

}
export async function searchForAlbumInDiscovery(artist: string, album: string, artistMatch: { contain: boolean, similarity: number } = { similarity: .6, contain: true }) {
    const discoverySearchResult = await doDiscoverSearch(album, 10);
    if (!discoverySearchResult)
        return []

    const foundAlbums = discoverySearchResult.map(item => {
        return {
            ...item,
            matching: {
                album: compareTitles(item.title, album),
                artist: compareTitles(item.artist.title, artist)
            }
        }
    })
    return foundAlbums.filter(item => {
        if (item.type != "album")
            return false;

        if (item.matching.album.match && (
            item.matching.artist.match ||
            item.matching.artist.similarity >= artistMatch.similarity ||
            (item.matching.artist.contains && artistMatch.contain)
        )) {
            return true;
        }
        return false;
    }).sort((a, b) => {
        let aMatches = a.matching.artist.similarity + a.matching.album.similarity
        let bMatches = b.matching.artist.similarity + b.matching.album.similarity
        return bMatches - aMatches;
    });

}

export async function searchForAlbumTracksInHubs(artist: string, track: string, album: string) {
    const results: GetMatchingTrackResponse[] = []
    const foundAlbums = await searchForAlbumInHubs(artist, album)

    for (let i = 0; i < foundAlbums.length; i++) {
        const foundAlbum = foundAlbums[i];
        if (foundAlbum) {
            const albumTracks = await getAlbum(foundAlbum.key);
            const trackResults = albumTracks.map((metadata:any) => {
                return {
                    type: "track",
                    key: metadata.key,
                    guid: metadata.guid,
                    score: metadata.score,
                    image: metadata.thumb,
                    title: metadata.title,
                    album: {
                        guid: metadata.parentGuid,
                        key: metadata.parentKey,
                        title: metadata.parentTitle,
                        year: metadata.parentYear,
                        image: metadata.parentThumb,
                    },
                    artist: {
                        guid: metadata.grandparentGuid,
                        key: metadata.grandparentKey,
                        title: removeFeaturing(metadata.originalTitle || metadata.grandparentTitle),
                        alternative_title: removeFeaturing(metadata.grandparentTitle),
                        image: metadata.grandparentThumb,
                    }
                }
            })
            const matchingTracksResult = findMatchingTracks(trackResults, artist, track, album);
            matchingTracksResult.forEach(item => {
                if (results.filter(existingItem => existingItem.guid == item.guid).length == 0)
                    results.push(item)
            })
        }
    }
    return results;
}

export async function searchForTrackInDiscovery(artist: string, track: string, album: string) {
    let search = `${artist} ${track}`;

    const searchResult = await doDiscoverSearch(search, 50);
    const result = findMatchingTracks(searchResult, artist, track, album);

    let alternative = `${track}`;
    const alternativeSearchResult = await doDiscoverSearch(alternative, 50);
    const alternativeResult = findMatchingTracks(alternativeSearchResult, artist, track, album);
    alternativeResult.forEach(item => {
        if (result.filter(existingItem => existingItem.guid == item.guid).length == 0)
            result.push(item)
    })
    return result;
}
