import { GetSpotifyPlaylist } from "@spotify-to-plex/shared-types/spotify/GetSpotifyPlaylist";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";


export async function getLikedSongs(api: SpotifyApi, userId: string, userName: string, simplified: boolean) {


    try {
        const result = await api.currentUser.tracks.savedTracks(50, 0)
        const playlist: GetSpotifyPlaylist = {
            type: "spotify-playlist",
            id: `liked-${userId}`,
            title: "Liked Songs",
            owner: userName,
            image: '',
            tracks: []
        }
        const validTracks = result.items
            .map(item => {
                if (!item.track)
                    return null;

                const artists = item.track.artists?.flatMap(artist => artist.name.split(',').map(name => name.trim()));

                return {
                    id: item.track.id,
                    title: item.track.name,
                    artist: item.track.artists?.[0]?.name || 'Unknown',
                    album: item.track.album?.name || 'Unknown',
                    artists: artists || [],
                }
            })
            .filter((track)=>!!track);

        playlist.tracks = playlist.tracks.concat(validTracks);
        if (simplified)
            return playlist;

        let offset = 50;
        let hasMoreResults = result.offset + result.limit < result.total;

        if (result.next) {
            while (hasMoreResults) {
                const loadMore = await api.currentUser.tracks.savedTracks(50, offset)
                const validLoadMoreTracks = loadMore.items
                    .map(item => {
                        if (!item.track) return null;

                        return {
                            id: item.track.id,
                            title: item.track.name,
                            artist: item.track.artists?.[0]?.name || 'Unknown',
                            album: item.track.album?.name || 'Unknown',
                            artists: item.track.artists?.map(artist => artist.name) || [],
                        }
                    })
                    .filter((track)=>!!track);

                playlist.tracks = playlist.tracks.concat(validLoadMoreTracks);

                hasMoreResults = loadMore.offset + loadMore.limit < loadMore.total;
                offset = loadMore.offset + loadMore.limit;

                // Add throttling between pagination requests (~171 req/min)
                if (hasMoreResults)
                    await new Promise(resolve => { setTimeout(resolve, 350) });
            }
        }

        return playlist;

    } catch (_e) {
        return null;
    }
}
