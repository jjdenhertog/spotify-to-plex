import getAlbumTracks from "../../actions/getAlbumTracks";
import { HubSearchResult } from "../../types/actions/HubSearchResult";
import { searchForAlbum } from "./searchForAlbum";


export async function searchForAlbumTracks(uri: string, token: string, artist: string, _track: string, album: string) {
    const foundAlbums = await searchForAlbum(uri, token, artist, album);

    const results: HubSearchResult[] = []

    for (let i = 0; i < foundAlbums.length; i++) {
        const foundAlbum = foundAlbums[i];
        if (foundAlbum) {
            const trackResult: HubSearchResult[] = await getAlbumTracks(uri, token, foundAlbum.id)
            trackResult.forEach(item => {
                if (results.filter(existingItem => existingItem.guid == item.guid).length == 0)
                    results.push(item);
            });
        }
    }

    return results;
}
