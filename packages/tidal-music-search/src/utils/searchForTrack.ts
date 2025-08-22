import { TidalAPI } from './TidalAPI';


export async function searchForTrack(artist: string, track: string, _album: string = '') {
    const search = `${artist} ${track}`;

    const tidalAPI = TidalAPI.getInstance();
    const searchResult = await tidalAPI.search(search)

    if (track.indexOf(':') > -1) {
        const alternative = track.slice(Math.max(0, track.indexOf(':') + 1));
        const alternativeSearchResult = await tidalAPI.search(alternative)
        alternativeSearchResult.forEach(item => {
            if (searchResult.filter(existingItem => existingItem.id == item.id).length == 0)
                searchResult.push(item);
        });
    }

    return searchResult;
}
