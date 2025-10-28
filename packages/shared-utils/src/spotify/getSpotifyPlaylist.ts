import { GetSpotifyPlaylist } from "@spotify-to-plex/shared-types/spotify/GetSpotifyPlaylist";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";


export async function getSpotifyPlaylist(api: SpotifyApi, id: string, simplified: boolean) {


    try {
        const result = await api.playlists.getPlaylist(id)
        const playlist: GetSpotifyPlaylist = {
            type: "spotify-playlist",
            id: result.id,
            title: result.name,
            owner: result.owner?.display_name || 'Unknown',
            image: result.images?.[0]?.url || '',
            tracks: []
        }
        const validTracks = result.tracks.items
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
                    album_id: item.track.album?.id || 'unknown'
                }
            })
            .filter((track)=>!!track);
        
        playlist.tracks = playlist.tracks.concat(validTracks);
        if (simplified)
            return playlist;

        let offset = result.tracks.limit;
        let nextUrl = result.tracks.next

        while (nextUrl) {
            const loadMore = await api.playlists.getPlaylistItems(id, undefined, undefined, 50, offset)
            const validLoadMoreTracks = loadMore.items
                .map(item => {
                    if (!item.track) return null;

                    return {
                        id: item.track.id,
                        title: item.track.name,
                        artist: item.track.artists?.[0]?.name || 'Unknown',
                        album: item.track.album?.name || 'Unknown',
                        artists: item.track.artists?.map(artist => artist.name) || [],
                        album_id: item.track.album?.id || 'unknown'
                    }
                })
                .filter((track)=>!!track);

            playlist.tracks = playlist.tracks.concat(validLoadMoreTracks);

            nextUrl = loadMore.next
            offset = loadMore.offset + loadMore.limit;

            // Add throttling between pagination requests (~171 req/min)
            if (nextUrl) 
                await new Promise(resolve => { setTimeout(resolve, 350) });
        }

        return playlist;

    } catch (_e) {
        return null;
    }
}
