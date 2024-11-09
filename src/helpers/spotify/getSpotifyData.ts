import { GetSpotifyAlbum, GetSpotifyPlaylist } from "@/types/SpotifyAPI";
import { PlaylistedTrack, SpotifyApi, Track } from "@spotify/web-api-ts-sdk";

export default async function getSpotifyData(api: SpotifyApi, id: string): Promise<GetSpotifyAlbum | GetSpotifyPlaylist | undefined> {
    if (id.indexOf('spotify:album:') > -1) {
        const albumId = id.slice(Math.max(0, id.indexOf('spotify:album:') + 'spotify:album:'.length)).trim();
        try {
            const result = await api.albums.get(albumId)

            return {
                type: "spotify-album",
                id: result.id,
                title: result.name,
                image: result.images[0].url,
                tracks: result.tracks.items.map(item => ({
                    artist: item.artists[0].name,
                    id: item.id,
                    artists: item.artists.map(artist => artist.name),
                    album: result.name,
                    title: item.name
                }))
            }
        } catch (_e) { }

    } else if (id.indexOf('spotify:playlist:') > -1) {
        const playlistId = id.slice(Math.max(0, id.indexOf('spotify:playlist:') + 'spotify:playlist:'.length)).trim();

        try {
            let allTracks: PlaylistedTrack<Track>[] = []
            const result = await api.playlists.getPlaylist(playlistId)
            allTracks = allTracks.concat(result.tracks.items);
            let offset = 50;
            let hasMoreResults = result.tracks.offset + result.tracks.limit < result.tracks.total;
            const nextUrl = result.tracks.next

            if (nextUrl) {
                while (hasMoreResults) {
                    const loadMore = await api.playlists.getPlaylistItems(playlistId, undefined, undefined, 50, offset)
                    allTracks = allTracks.concat(loadMore.items);
                    hasMoreResults = loadMore.offset + loadMore.limit < loadMore.total;
                    offset = loadMore.offset + loadMore.limit;
                }
            }

            return {
                type: "spotify-playlist",
                id: result.id,
                title: result.name,
                owner: result.owner.display_name,
                image: result.images[0].url,
                tracks: allTracks.map(item => {
                    return {
                        id: item.track.id,
                        title: item.track.name,
                        artist: item.track.artists[0].name,
                        album: item.track.album.name,
                        artists: item.track.artists.map(item => item.name),
                    }
                })
            }
        } catch (_e) {
            return undefined;
        }
    }
}