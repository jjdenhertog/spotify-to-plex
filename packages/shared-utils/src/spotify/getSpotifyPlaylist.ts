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

        // Spotify Web API change (rolled out late 2024): user-authenticated
        // /playlists/{id} responses now return the tracks page under `items`
        // instead of `tracks`, and each entry exposes the track object as
        // `item` instead of `track`. Read both shapes so the function keeps
        // working for any account or region still on the legacy response.
        const tracksPage = ((result as any).items ?? (result as any).tracks) as Page<PlaylistedTrack<Track>> | undefined;
        if (!tracksPage?.items) {
            console.error(`❌ Playlist ${id} response missing tracks page. Most likely fetched with client_credentials — Spotify no longer returns playlist tracks to that auth mode. A user access token is required.`);

            return null;
        }

        const validTracks = tracksPage.items
            .map(item => {
                const track: Track | undefined = (item as any).item ?? (item as any).track;
                if (!track || typeof track !== 'object')
                    return null;

                // Local files and unavailable tracks have null IDs - log for visibility
                if (!track.id) {
                    console.log(`⚠️  Track without Spotify ID (local file or unavailable): "${track.name}" by ${track.artists?.[0]?.name || 'Unknown'}`);
                }

                const artists = track.artists?.flatMap(artist => artist.name.split(',').map(name => name.trim()));

                return {
                    id: track.id,
                    title: track.name,
                    artist: track.artists?.[0]?.name || 'Unknown',
                    album: track.album?.name || 'Unknown',
                    artists: artists || [],
                    album_id: track.album?.id || 'unknown',
                    duration_ms: track.duration_ms
                }
            })
            .filter((track) => !!track);

        playlist.tracks = playlist.tracks.concat(validTracks);
        if (simplified)
            return playlist;

        let nextUrl: string | null = tracksPage.next
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
                    const track: Track | undefined = (item as any).item ?? (item as any).track;
                    if (!track || typeof track !== 'object') return null;

                    // Local files and unavailable tracks have null IDs - log for visibility
                    if (!track.id) {
                        console.log(`⚠️  Track without Spotify ID (local file or unavailable): "${track.name}" by ${track.artists?.[0]?.name || 'Unknown'}`);
                    }

                    return {
                        id: track.id,
                        title: track.name,
                        artist: track.artists?.[0]?.name || 'Unknown',
                        album: track.album?.name || 'Unknown',
                        artists: track.artists?.map(artist => artist.name) || [],
                        album_id: track.album?.id || 'unknown',
                        duration_ms: track.duration_ms
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
