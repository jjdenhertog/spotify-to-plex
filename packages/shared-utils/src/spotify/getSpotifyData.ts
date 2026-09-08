/* eslint-disable max-depth */
import { GetSpotifyPlaylist } from "@spotify-to-plex/shared-types/spotify/GetSpotifyPlaylist";
import { GetSpotifyScraperData } from "@spotify-to-plex/shared-types/spotify/GetSpotifyScraperData";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import axios, { AxiosResponse } from "axios";

import { getSpotifyPlaylist } from "./getSpotifyPlaylist";


export async function getSpotifyData(api: SpotifyApi, id: string, simplified: boolean = false, skipRateLimitChecks: boolean = false) {

    ////////////////////////////////////////
    // Albums
    ////////////////////////////////////////
    if (id.startsWith('spotify:album:')) {
        const albumId = id.slice(Math.max(0, id.indexOf('spotify:album:') + 'spotify:album:'.length)).trim();
        try {
            const result = await api.albums.get(albumId)

            return {
                type: "spotify-album",
                id: result.id,
                title: result.name,
                image: result.images[0]?.url || '',
                tracks: result.tracks.items.map(item => ({
                    artist: item.artists[0]?.name,
                    id: item.id,
                    artists: item.artists.map(artist => artist.name),
                    album: result.name,
                    title: item.name,
                    album_id: result.id,
                    duration_ms: item.duration_ms
                }))
            }
        } catch (_e) { }

        return null;
    }

    ////////////////////////////////////////
    // Playlists
    ////////////////////////////////////////

    // Anything else Spotify-flavoured (artist, track, show, ...) would be sliced
    // into a mangled id below and then reported as a failed curated playlist.
    const spotifyType = id.startsWith('spotify:') ? id.split(':')[1] : undefined;
    if (spotifyType && spotifyType != 'playlist')
        throw new Error(`This is a Spotify ${spotifyType} link. Only playlists and albums can be imported.`);

    const playlistId = id.slice(Math.max(0, id.indexOf('spotify:playlist:') + 'spotify:playlist:'.length)).trim();
    const playlist = await getSpotifyPlaylist(api, playlistId, simplified)
    
    if (playlist)
        return playlist;

    const scraperUrl = process.env.SPOTIFY_SCRAPER_URL?.trim();
    if (!scraperUrl)
        throw new Error(`This was a Spotify curated playlist, and SpotifyScraper is not configured. Set SPOTIFY_SCRAPER_URL environment variable.`);

    let response: AxiosResponse<GetSpotifyScraperData>;
    try {
        const spotifyUrl = `https://open.spotify.com/playlist/${playlistId}`;
        response = await axios.post<GetSpotifyScraperData>(`${scraperUrl}/playlist`, {
            url: spotifyUrl,
            include_album_data: false
        });

    } catch (error) {
        // Reporting every failure as "not available, restart me" hid the real
        // cause (see issue #124) - say what actually went wrong instead.
        let detail: string;
        if (axios.isAxiosError(error) && error.response)
            detail = `SpotifyScraper returned ${error.response.status}: ${JSON.stringify(error.response.data)}`;
        else if (axios.isAxiosError(error))
            detail = `SpotifyScraper at ${scraperUrl} is unreachable (${error.code || error.message}). It might still be starting up.`;
        else
            detail = error instanceof Error ? error.message : String(error);

        throw new Error(`This was a Spotify curated playlist and scraping it failed. ${detail}`)
    }

    if (!response.data) {
        throw new Error(`This was a Spotify curated playlist. Unfortuantely even SpotifyScraper couldn't find it.`)
    }

    const scraperData = response.data

    const images = scraperData.images || [];
    const [image] = images
        .filter((image) => {
            // Keep images without dimensions: SpotifyScraper stopped reporting
            // them, and dropping those would leave every playlist coverless.
            if (typeof image.width != 'number')
                return true;

            return image.width >= 100;
        })
        .sort((a, b) => {
            return (a.width ?? 0) - (b.width ?? 0);
        });

    const tracks = scraperData.tracks?.map((track) => {

        const { artists, album, name, id, uri, duration_ms } = track;
        const splitArtists = artists.flatMap(artist =>
            artist.name.split(',').map(name => name.trim())
        );

        return {
            id: id || uri,
            title: name || '',
            album: album?.name || '',
            artists: splitArtists,
            album_id: 'unknown',
            duration_ms
        }
    }) || []

    if (tracks.length == 0)
        return null;


    if (simplified) {
        return {
            type: "spotify-playlist",
            id: scraperData.id || playlistId,
            title: scraperData.name || '',
            image: image?.url || '',
            owner: scraperData.owner?.name || '',
            tracks
        }
    }

    // Use Spotify's batch API: up to 50 tracks per request
    const BATCH_SIZE = 50;
    // ~350ms delay = ~171 requests/minute (under the ~180 req/min limit with safety margin)
    const BATCH_DELAY = 350;
    const MAX_RETRIES = 3;

    for (let i = 0; i < tracks.length; i += BATCH_SIZE) {
        const batch = tracks.slice(i, i + BATCH_SIZE);

        // Separate tracks with valid IDs from those without (local files/unavailable)
        const tracksWithIds = batch.filter(track => track.id);
        const trackIds = tracksWithIds.map(track => track.id.replace('spotify:track:', ''));

        // Skip API call if no valid track IDs in batch
        if (trackIds.length === 0) {
            continue;
        }

        let retryCount = 0;
        let success = false;

        while (!success && retryCount < MAX_RETRIES) {
            try {
                // SINGLE API CALL for up to 50 tracks (50x more efficient!)
                const enrichedTracks = await api.tracks.get(trackIds);

                // Map enriched data back to original tracks - only for tracks with IDs
                let enrichedIdx = 0;
                const enrichedBatch = batch.map((track) => {
                    // Skip tracks without IDs (local files/unavailable)
                    if (!track.id) return track;

                    const enrichedTrack = enrichedTracks[enrichedIdx++];
                    if (!enrichedTrack) return track; // Fallback if track not found

                    return {
                        ...track,
                        album: enrichedTrack.album.name,
                        album_id: enrichedTrack.album.id,
                        duration_ms: track.duration_ms ?? enrichedTrack.duration_ms
                    };
                });

                tracks.splice(i, BATCH_SIZE, ...enrichedBatch);
                success = true;

                // Wait between batches (except for the last batch)
                if (i + BATCH_SIZE < tracks.length)
                    await new Promise(resolve => { setTimeout(resolve, BATCH_DELAY) });

            } catch (batchError: any) {
                retryCount++;

                // Check for rate limit errors (429) - SDK might wrap the status differently
                const isRateLimit = batchError.status === 429 ||
                    batchError.statusCode === 429 ||
                    batchError.message?.includes('rate limit') ||
                    batchError.message?.includes('429');

                if (isRateLimit) {
                    // Extract retry-after from various possible locations
                    const retryAfter = parseInt(
                        batchError.headers?.['retry-after'] ||
                        batchError.response?.headers?.['retry-after'] ||
                        '5',
                        10
                    );
                    const backoffDelay = Math.min(retryAfter * 1000, 1000 * (2 ** retryCount));

                    if (!skipRateLimitChecks)
                        throw new Error(`Rate Limit Exceeded, try with a different token.`)

                    console.log(`Rate limited. Waiting ${backoffDelay}ms before retry ${retryCount}/${MAX_RETRIES}...`);
                    await new Promise(resolve => { setTimeout(resolve, backoffDelay) });
                } else {
                    // Batch /v1/tracks?ids= is 403-forbidden for restricted-mode tokens
                    // while single-track lookups still work - enrich one by one instead
                    console.error(`Error enriching batch - ${retryCount}/${MAX_RETRIES}: ${batchError.message}. Falling back to single-track lookups.`);
                    const enrichedBatch = await enrichTracksIndividually(api, batch, BATCH_DELAY);
                    tracks.splice(i, BATCH_SIZE, ...enrichedBatch);
                    success = true;
                }
            }
        }

        if (!success)
            console.error(`Failed to enrich batch after ${MAX_RETRIES} retries. Using original track data.`);
    }

    try {
        const result: GetSpotifyPlaylist = {
            type: "spotify-playlist",
            id: scraperData.id || playlistId,
            title: scraperData.name || '',
            image: image?.url || '',
            owner: scraperData.owner?.name || '',
            tracks
        }

        return result;

    } catch (e) {
        console.log(e)
    }


    return null

}

type EnrichableTrack = {
    id: string;
    album: string;
    album_id: string;
    duration_ms?: number;
};

async function enrichTracksIndividually<T extends EnrichableTrack>(api: SpotifyApi, batch: T[], delayMs: number): Promise<T[]> {
    const result = [...batch];

    for (let i = 0; i < result.length; i++) {
        const track = result[i];
        if (!track?.id || track.id.startsWith('spotify:local:'))
            continue;

        try {
            const enrichedTrack = await api.tracks.get(track.id.replace('spotify:track:', ''));
            result[i] = {
                ...track,
                album: enrichedTrack.album.name,
                album_id: enrichedTrack.album.id,
                duration_ms: track.duration_ms ?? enrichedTrack.duration_ms
            };
        } catch (_e) {
            // Keep the scraper data for tracks that fail individually
        }

        await new Promise(resolve => { setTimeout(resolve, delayMs) });
    }

    return result;
}