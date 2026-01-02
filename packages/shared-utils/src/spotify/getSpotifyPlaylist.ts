import { GetSpotifyPlaylist } from "@spotify-to-plex/shared-types/spotify/GetSpotifyPlaylist";
import { Page, PlaylistedTrack, SpotifyApi, Track } from "@spotify/web-api-ts-sdk";


export async function getSpotifyPlaylist(api: SpotifyApi, id: string, simplified: boolean) {


    try {
        const tokenInfo = await api.getAccessToken();
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

                // Local files and unavailable tracks have null IDs - log for visibility
                if (!item.track.id) {
                    console.log(`⚠️  Track without Spotify ID (local file or unavailable): "${item.track.name}" by ${item.track.artists?.[0]?.name || 'Unknown'}`);
                }

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
            .filter((track) => !!track);

        playlist.tracks = playlist.tracks.concat(validTracks);
        if (simplified)
            return playlist;

        let nextUrl: string | null = result.tracks.next
        while (nextUrl) {

            const response = await fetch(nextUrl, {
                headers: {
                    'Authorization': `Bearer ${tokenInfo?.access_token}`
                }
            });

            if (!response.ok) {
                console.error(`❌ Fetch failed: ${response.status} ${response.statusText}`);
                break;
            }

            const data = await response.json();
            const loadMore = data as Page<PlaylistedTrack<Track>>;
            if (!loadMore.items) {
                nextUrl = null;
                break;
            }

            const validLoadMoreTracks = loadMore.items
                .map(item => {
                    if (!item.track) return null;

                    // Local files and unavailable tracks have null IDs - log for visibility
                    if (!item.track.id) {
                        console.log(`⚠️  Track without Spotify ID (local file or unavailable): "${item.track.name}" by ${item.track.artists?.[0]?.name || 'Unknown'}`);
                    }

                    return {
                        id: item.track.id,
                        title: item.track.name,
                        artist: item.track.artists?.[0]?.name || 'Unknown',
                        album: item.track.album?.name || 'Unknown',
                        artists: item.track.artists?.map(artist => artist.name) || [],
                        album_id: item.track.album?.id || 'unknown'
                    }
                })
                .filter((track) => !!track);

            playlist.tracks = playlist.tracks.concat(validLoadMoreTracks);

            nextUrl = loadMore.next

            if (nextUrl)
                await new Promise(resolve => { setTimeout(resolve, 350) });
        }

        return playlist;

    } catch (e) {
        console.error("❌ Error in getSpotifyPlaylist:", e);

        return null;
    }
}
