import { GetSpotifyPlaylist } from "@spotify-to-plex/shared-types/spotify/GetSpotifyPlaylist";
import { MaxInt, Page, PlaylistedTrack, SpotifyApi, Track } from "@spotify/web-api-ts-sdk";

const PAGE_SIZE = 50;
// ponytail: hard cap on how many tracks a playlist contributes; raise if bigger playlists matter
const MAX_TRACKS = 500;
// ~350ms delay = ~171 requests/minute (under the ~180 req/min limit with safety margin)
const PAGE_DELAY = 350;

function mapTracks(items: PlaylistedTrack<Track>[]) {
    return items
        .map(item => {
            // The 2024 API change exposes the track as `item`; older responses use `track`.
            const track: Track | undefined = (item as any).item ?? (item as any).track;
            if (!track || typeof track !== 'object')
                return null;

            // Local files have no id but do have a spotify:local: uri
            if (!track.id && !track.uri)
                return null;

            const artists = track.artists?.flatMap(artist => artist.name.split(',').map(name => name.trim()));

            return {
                id: track.id || track.uri,
                title: track.name,
                artist: track.artists?.[0]?.name || 'Unknown',
                album: track.album?.name || 'Unknown',
                artists: artists || [],
                album_id: track.album?.id || 'unknown',
                duration_ms: track.duration_ms
            }
        })
        .filter((track) => !!track);
}

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

        // Spotify Web API change (rolled out late 2024): user-authenticated
        // /playlists/{id} responses now return the tracks page under `items`
        // instead of `tracks`. Read both shapes so the function keeps
        // working for any account or region still on the legacy response.
        // Pick whichever field actually holds a page of tracks: `??` alone would
        // take an `items` field that is present but not a tracks page, and skip
        // a perfectly good legacy `tracks` alongside it.
        const tracksPage = [(result as any).items, (result as any).tracks]
            .find((page) => Array.isArray(page?.items)) as Page<PlaylistedTrack<Track>> | undefined;

        if (!tracksPage?.items) {
            console.error(`❌ Playlist ${id} response missing tracks page. Most likely fetched with client_credentials — Spotify no longer returns playlist tracks to that auth mode. A user access token is required.`);

            return null;
        }

        playlist.tracks = mapTracks(tracksPage.items);
        if (simplified)
            return playlist;

        // The embedded page only carries the first 100 tracks, so keep asking the
        // items endpoint for the rest, up to MAX_TRACKS. Paging by offset instead
        // of following `next` by hand keeps the SDK's auth: a manual fetch needs a
        // token this function does not always have.
        let offset = tracksPage.items.length;
        const total = Math.min(typeof tracksPage.total === 'number' ? tracksPage.total : Infinity, MAX_TRACKS);

        while (offset < total) {
            await new Promise(resolve => { setTimeout(resolve, PAGE_DELAY) });

            const limit = Math.min(PAGE_SIZE, total - offset) as MaxInt<50>;
            const page = await api.playlists.getPlaylistItems(id, undefined, undefined, limit, offset);
            const items = page?.items;
            if (!items?.length)
                break;

            playlist.tracks = playlist.tracks.concat(mapTracks(items));
            offset += items.length;
        }

        return playlist;

    } catch (e) {
        console.error("❌ Error in getSpotifyPlaylist:", e);

        return null;
    }
}
