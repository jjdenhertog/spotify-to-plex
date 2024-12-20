import { GetSpotifyPlaylist } from "@/types/SpotifyAPI";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";


export default async function getSpotifyPlaylist(api: SpotifyApi, id: string, simplified: boolean) {

    // const result: GetSpotifyPlaylist = {}
    // let allTracks: GetSpotifyPlaylist["tracks"] = []

    try {
        const result = await api.playlists.getPlaylist(id)
        const playlist: GetSpotifyPlaylist = {
            type: "spotify-playlist",
            id: result.id,
            title: result.name,
            owner: result.owner.display_name,
            image: result.images[0].url,
            tracks: []
        }
        playlist.tracks = playlist.tracks.concat(result.tracks.items.map(item => {
            return {
                id: item.track.id,
                title: item.track.name,
                artist: item.track.artists[0].name,
                album: item.track.album.name,
                artists: item.track.artists.map(item => item.name),
            }
        }));

        if (simplified)
            return playlist;

        let offset = 50;
        let hasMoreResults = result.tracks.offset + result.tracks.limit < result.tracks.total;
        const nextUrl = result.tracks.next

        if (nextUrl) {
            while (hasMoreResults) {
                const loadMore = await api.playlists.getPlaylistItems(id, undefined, undefined, 50, offset)
                playlist.tracks = playlist.tracks.concat(loadMore.items.map(item => {
                    return {
                        id: item.track.id,
                        title: item.track.name,
                        artist: item.track.artists[0].name,
                        album: item.track.album.name,
                        artists: item.track.artists.map(item => item.name),
                    }
                }));

                hasMoreResults = loadMore.offset + loadMore.limit < loadMore.total;
                offset = loadMore.offset + loadMore.limit;
            }
        }

        return playlist;

    } catch (_e) {
    }
    return undefined;
}