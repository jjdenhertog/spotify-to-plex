import { compareTitles } from "@spotify-to-plex/music-search/utils/compareTitles";
import { searchAlbum } from "./tidal/searchAlbum";

type FoundAlbumWithMatching = {
    id: string,
    title: string,
    artist: string,
    matching: {
        album: {
            match: boolean;
            contains: boolean;
            similarity: number;
        },
        artist: {
            match: boolean;
            contains: boolean;
            similarity: number;
        }
    }
}

// eslint-disable-next-line unicorn/no-object-as-default-parameter
export async function searchForAlbum(artist: string, album: string, artistMatch: { contain: boolean; similarity: number; } = { similarity: 0.6, contain: true }) {

    const search = `${artist} ${album}`;

    const searchResults = await searchAlbum(search);

    const foundAlbums: FoundAlbumWithMatching[] = []
    searchResults.forEach(searchResult => {

        const { id, title, artists } = searchResult;
        artists.forEach(artist => {

            foundAlbums.push({
                id,
                title,
                artist,
                matching: {
                    album: compareTitles(title, album),
                    artist: compareTitles(artist, artist)
                }
            })
        })
    })

    return foundAlbums
        .filter(item => {
            if (item.matching.album.match &&
                (
                    item.matching.artist.match ||
                    item.matching.artist.similarity >= artistMatch.similarity ||
                    (item.matching.artist.contains && artistMatch.contain)
                )
            ) {
                return true;
            }

            return false;
        })
        .sort((a, b) => {
            const aMatches = a.matching.artist.similarity + a.matching.album.similarity;
            const bMatches = b.matching.artist.similarity + b.matching.album.similarity;

            return bMatches - aMatches;
        });

}
