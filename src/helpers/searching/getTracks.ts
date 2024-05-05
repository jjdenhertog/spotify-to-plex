import { GetTrackResponse, PostTrackData } from "@/pages/api/tracks";
import { searchForAlbumTracksInHubs, searchForTrackInDiscovery, searchForTrackInHubs } from "../plex/searchForTrack";
import { GetMatchingTrackResponse } from "./findMatchingTracks";



// Possible "perfect" matches
const primaryMatchFilters = [
    (item: GetMatchingTrackResponse) => item.matching.artist.match && item.matching.title.match,
    (item: GetMatchingTrackResponse) => item.matching.artist.match && item.matching.title.contains,
    (item: GetMatchingTrackResponse) => item.matching.artist.match && item.matching.title.similarity >= .8,
    (item: GetMatchingTrackResponse) => item.matching.artist.contains && item.matching.title.match,
    (item: GetMatchingTrackResponse) => item.matching.alternativeArtist.match && item.matching.title.match,
    (item: GetMatchingTrackResponse) => item.matching.alternativeArtist.match && item.matching.title.contains,
    (item: GetMatchingTrackResponse) => item.matching.alternativeArtist.match && item.matching.title.similarity >= .8,
    (item: GetMatchingTrackResponse) => item.matching.artist.contains && item.matching.title.contains && item.matching.album.contains,
    (item: GetMatchingTrackResponse) => item.matching.alternativeArtist.contains && item.matching.title.match,
    (item: GetMatchingTrackResponse) => item.matching.artist.similarity >= 0.85 && item.matching.title.similarity >= 0.85,
    (item: GetMatchingTrackResponse) => item.matching.artistWithTitle.similarity >= 0.8 && item.matching.title.similarity >= 0.9,
    (item: GetMatchingTrackResponse) => item.matching.artistWithTitle.similarity >= 0.95,
    (item: GetMatchingTrackResponse) => item.matching.artist.contains && item.matching.title.contains,
    (item: GetMatchingTrackResponse) => item.matching.artist.similarity >= 0.7 && item.matching.album.match && item.matching.title.match,
    (item: GetMatchingTrackResponse) => item.matching.artist.similarity >= 0.7 && item.matching.album.match && item.matching.title.similarity >= 0.85,
]

const secondaryMatchFilters = [
    (item: GetMatchingTrackResponse) => item.matching.title.similarity == 1 && item.matching.artist.similarity >= 0.9,
    (item: GetMatchingTrackResponse) => item.matching.title.similarity == 1 && item.matching.artistWithTitle.similarity >= 0.9,
    (item: GetMatchingTrackResponse) => item.matching.title.similarity >= 0.8 && item.matching.artist.similarity >= 0.8,
    (item: GetMatchingTrackResponse) => item.matching.title.similarity >= 0.8 && item.matching.artistInTitle.contains,
    (item: GetMatchingTrackResponse) => item.matching.title.contains && item.matching.artist.contains,
    (item: GetMatchingTrackResponse) => item.matching.title.contains && item.matching.artistInTitle.contains
]


function getPrimairyMatches(results: GetMatchingTrackResponse[]) {
    for (let i = 0; i < primaryMatchFilters.length; i++) {
        const result = results.filter(primaryMatchFilters[i])
        if (result.length > 0)
            return result;
    }
    return []
}
function getSecondaryMatches(results: GetMatchingTrackResponse[]) {

    for (let i = 0; i < secondaryMatchFilters.length; i++) {
        const result = results.filter(secondaryMatchFilters[i])
        if (result.length > 0)
            return result;
    }
    return []
}

export function filterOutWordsFromSearch(input: string, cutOffSeperators: boolean = false, unfiltered: boolean = false) {

    if (!unfiltered)
        return input;

    let result = input.toLowerCase();
    let words = ["original mix", "radio edit", "single edit", "alternate mix", "remastered", "remaster", "single version", 'retail mix', "'", '"', "´", "`", "()"];
    for (let i = 0; i < words.length; i++) {
        result = result.split(words[i]).join("")
    }
    if (cutOffSeperators && result.lastIndexOf('(') > -1)
        result = result.substring(0, result.lastIndexOf('('))
    if (cutOffSeperators && result.lastIndexOf('[') > -1)
        result = result.substring(0, result.lastIndexOf('['))
    if (cutOffSeperators && result.lastIndexOf('{') > -1)
        result = result.substring(0, result.lastIndexOf('{'))
    if (cutOffSeperators && result.lastIndexOf('-') > -1)
        result = result.substring(0, result.lastIndexOf('-'))

    result = result.trim();
    while (result.length > 3 && result.substring(result.length - 1) == '-')
        result = result.substring(0, result.length - 2).trim()

    while (result.length > 3 && result.substring(0, 1) == '-')
        result = result.substring(0, 1).trim()

    return result;
}
export async function getTracks(items: PostTrackData[]) {

    // const tidalAccessToken = await getTidalAccessToken()
    const promises: Promise<GetTrackResponse>[] = [];
    for (let i = 0; i < items.length; i++) {
        const { artist, album = '', name: preSearchName = '', alternative_artist = '', alternative_name = '' } = items[i];

        let searchName = preSearchName;
        if (searchName.indexOf(artist) > -1) {
            searchName = searchName.split(artist).join('').trim()
            while (searchName.indexOf('-') == 0)
                searchName = searchName.substring(1).trim()
        }

        const promise = new Promise<GetTrackResponse>(async (resolve, reject) => {
            try {
                let searchResult: GetMatchingTrackResponse[] = []
                const searchApproaches: { platform: string, ignoreSearchResult?: boolean, unfiltered?: boolean, trimmed: boolean, data: GetMatchingTrackResponse[] | null }[] = [
                    { platform: 'local_unfiltererd', unfiltered: true, trimmed: false, data: null },
                    { platform: 'local', trimmed: false, data: null },
                    { platform: 'local_album', trimmed: false, data: null },
                    { platform: 'local_spotify', trimmed: false, data: null },
                    { platform: 'local', trimmed: true, data: null },
                    { platform: 'local_spotify', trimmed: true, data: null },
                    { platform: 'discovery', trimmed: false, data: null },
                    { platform: 'discovery_spotify', trimmed: false, data: null },
                    { platform: 'discovery', trimmed: true, data: null },
                    { platform: 'discovery_spotify', trimmed: true, data: null },
                    { platform: 'local_discovery', ignoreSearchResult: true, trimmed: false, data: null },
                ]

                let searchApproachIndex = 0;
                while (searchApproaches[searchApproachIndex]) {

                    const approach = searchApproaches[searchApproachIndex]
                    if (searchResult.length > 0 && !approach.ignoreSearchResult) {
                        searchApproachIndex++;
                        continue;
                    }
                    const { platform, trimmed, unfiltered } = approach
                    const name = filterOutWordsFromSearch(searchName, trimmed, !!unfiltered)
                    const alternativeName = filterOutWordsFromSearch(alternative_name || "", trimmed, !!unfiltered)

                    switch (platform) {
                        case "local_unfiltered":
                        case "local":
                        case "local_trimmed":
                            {
                                const result = await searchForTrackInHubs(artist, name, album)
                                approach.data = result;
                                searchResult = getPrimairyMatches(result);

                                if (searchResult.length == 0 && (artist.indexOf("&") || name.indexOf("&") > -1)) {
                                    const result = await searchForTrackInHubs(artist.split("&").join("and"), name.split("&").join("and"), album.split("&").join("and"))
                                    approach.data = result;
                                    searchResult = getPrimairyMatches(result);
                                }
                            }
                            break;
                        case "local_album":
                            {
                                const result = await searchForAlbumTracksInHubs(artist, name, album)
                                approach.data = result;
                                searchResult = getPrimairyMatches(result);
                            }
                            break;
                        case "local_spotify":
                        case "local_spotify_trimmed":
                            if (alternativeName && alternative_artist) {
                                const result = await searchForTrackInHubs(alternative_artist, alternativeName, album)
                                approach.data = result;
                                searchResult = getPrimairyMatches(result);
                            }
                            break;
                        case "discovery":
                        case "discovery_trimmed":
                            {
                                const result = await searchForTrackInDiscovery(artist, name, album)
                                approach.data = result
                                searchResult = getPrimairyMatches(result);
                            }
                            break;
                        case "discovery_spotify":
                        case "discovery_spotify_trimmed":
                            if (alternativeName && alternative_artist) {
                                const result = await searchForTrackInDiscovery(alternative_artist, alternativeName, album)
                                approach.data = result
                                searchResult = getPrimairyMatches(result);
                            }
                            break;
                        case "local_discovery":
                            // Sort on similarity
                            searchResult.sort((a, b) => {
                                let aMatches = a.matching.artist.similarity + a.matching.title.similarity + a.matching.alternativeArtist.similarity;
                                let bMatches = b.matching.artist.similarity + b.matching.title.similarity + b.matching.alternativeArtist.similarity
                                return bMatches - aMatches;
                            });

                            if (searchResult[0] && searchResult[0].source == 'provider://tv.plex.provider.music') {
                                const { artist, album, title } = searchResult[0]
                                const result = await searchForTrackInHubs(artist.title, title, album?.title || "")
                                approach.data = result;
                                const matches = getPrimairyMatches(result)
                                if (result && matches.length > 0)
                                    searchResult = matches;

                                if (matches.length == 0) {
                                    // Attempt album search
                                    const result = await searchForAlbumTracksInHubs(artist.title, name, album?.title || "")
                                    approach.data = result;
                                    const matches = getPrimairyMatches(result)
                                    if (result && matches.length > 0)
                                        searchResult = matches;
                                }
                            }
                            break;
                    }
                    searchApproachIndex++;
                }

                for (let j = 0; j < searchApproaches.length && searchResult.length == 0; j++) {
                    const { data } = searchApproaches[j];
                    if (data)
                        searchResult = getSecondaryMatches(data)
                }

                // For debugging:
                // if (preSearchName.toLowerCase().indexOf('so beautiful') > -1) {
                //     console.log(items[i])
                //     for (let j = 0; j < searchApproaches.length; j++) {
                //         const { data, platform, trimmed } = searchApproaches[j];
                //         if (platform.indexOf("local") == -1)
                //             continue;

                //         if (data) {
                //             console.log(`${platform}${trimmed} ${artist} - ${searchName} - ${album} - ${alternative_artist} - ${alternative_name}`)
                //             console.log(data.map(item => ({
                //                 x: `${item.artist.title} - ${item.title} - ${item.album?.title}`,
                //                 album: item.matching.album,
                //                 artist: item.matching.artist,
                //                 alternative_artist: item.matching.alternativeArtist,
                //                 artistInTitle: item.matching.artistInTitle,
                //                 artistWithTitle: item.matching.artistWithTitle,
                //                 title: item.matching.title,
                //             })))
                //         }
                //     }
                //     console.log(searchResult[0])
                // }

                // Sort on similarity
                searchResult.sort((a, b) => {
                    let aMatches = a.matching.artist.similarity + a.matching.title.similarity + a.matching.alternativeArtist.similarity;
                    let bMatches = b.matching.artist.similarity + b.matching.title.similarity + a.matching.alternativeArtist.similarity
                    return bMatches - aMatches;
                });

                resolve({
                    artist: artist,
                    album: album,
                    name: preSearchName,
                    alternative_artist: alternative_artist,
                    alternative_name: alternative_name,
                    Result: searchResult
                })
            } catch (e) {
                console.log(e);
                reject("Something went wrong while searching");
            }
        });
        promises.push(promise);
    }

    // const settledPromises = await Promise.allSettled(promises);
    // console.log(settledPromises);
    //@ts-ignore
    const result: GetTrackResponse[] = (await Promise.allSettled(promises)).filter(item => item.status == "fulfilled").map(item => item.value);
    return result;
}
