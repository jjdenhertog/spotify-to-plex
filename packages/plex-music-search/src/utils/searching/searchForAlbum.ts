import { compareTitles } from "@spotify-to-plex/music-search";
import hubSearch from "../../actions/hubSearch";


// eslint-disable-next-line unicorn/no-object-as-default-parameter
export async function searchForAlbum(uri: string, token: string, artist: string, album: string, artistMatch: { contain: boolean; similarity: number; } = { similarity: 0.6, contain: true }) {
    const hubSearchResult = await hubSearch(uri, token, album, 10);
    const foundAlbums = hubSearchResult.map(item => {
        return {
            ...item,
            matching: {
                album: compareTitles(item.title, album),
                artist: compareTitles(item.artist.title, artist)
            }
        };
    });

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
        const aMatches = a.matching.artist.similarity + a.matching.album.similarity;
        const bMatches = b.matching.artist.similarity + b.matching.album.similarity;

        return bMatches - aMatches;
    });

}
