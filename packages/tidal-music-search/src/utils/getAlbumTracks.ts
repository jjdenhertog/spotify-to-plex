import { TidalTrack } from "../types";
import { TidalAPI } from "./TidalAPI";


export async function getAlbumTracks(id: string, countryCode = "NL"): Promise<TidalTrack[]> {

    const tidalAPI = TidalAPI.getInstance();
    const searchResults = await tidalAPI.getAlbumTracksIds(id)

    let results: TidalTrack[] = []
    /////////////////////////////////////
    // Paginated loading of tracks
    /////////////////////////////////////
    const pageSize = 19;
    let curPage = 0;
    const pages = Math.ceil(searchResults.length / pageSize);

    while (curPage < pages) {
        const startIndex = curPage * pageSize;
        const endIndex = startIndex + pageSize;
        const tracksToLoad = searchResults.slice(startIndex, endIndex);
        try {
            const result = await tidalAPI.getTrackByIds(tracksToLoad, countryCode)
            results = results.concat(result)
        } catch (_e) { }
        curPage++;
    }

    return results

}
