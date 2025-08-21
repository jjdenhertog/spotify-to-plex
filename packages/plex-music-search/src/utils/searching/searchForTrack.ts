import hubSearch from "../../actions/hubSearch";

export async function searchForTrack(uri: string, token: string, artist: string, track: string, _album: string = '') {
    const search = `${artist} ${track}`;

    // Search for artist + track
    const searchResult = await hubSearch(uri, token, search, 20);

    // Search for track name
    {
        const alternativeSearchResult = await hubSearch(uri, token, track, 50);
        alternativeSearchResult.forEach(item => {
            if (searchResult.filter(existingItem => existingItem.guid == item.guid).length == 0)
                searchResult.push(item);
        });
    }

    // Search for artist name
    {
        const alternativeSearchResult = await hubSearch(uri, token, artist, 50);
        alternativeSearchResult.forEach(item => {
            if (searchResult.filter(existingItem => existingItem.guid == item.guid).length == 0)
                searchResult.push(item);
        });
    }

    // Extra search for everything after ":"
    // For classical tracks that often start with [Componser]: [TrackName]
    if (track.indexOf(':') > -1) {
        const alternative = track.slice(Math.max(0, track.indexOf(':') + 1));
        const alternativeSearchResult = await hubSearch(uri, token, alternative, 50);
        alternativeSearchResult.forEach(item => {
            if (searchResult.filter(existingItem => existingItem.guid == item.guid).length == 0)
                searchResult.push(item);
        });
    }

    return searchResult;
}
