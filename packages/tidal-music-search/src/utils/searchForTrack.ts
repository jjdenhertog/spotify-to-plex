import { searchTracks } from './tidal/searchTracks';


export async function searchForTrack(artist: string, track: string, _album: string = '') {
    const search = `${artist} ${track}`;

    const searchResult = await searchTracks(search);

    if (track.indexOf(':') > -1) {
        const alternative = track.slice(Math.max(0, track.indexOf(':') + 1));
        const alternativeSearchResult = await searchTracks(alternative);
        alternativeSearchResult.forEach(item => {
            if (searchResult.filter(existingItem => existingItem.id == item.id).length == 0)
                searchResult.push(item);
        });
    }

    return searchResult;
}
