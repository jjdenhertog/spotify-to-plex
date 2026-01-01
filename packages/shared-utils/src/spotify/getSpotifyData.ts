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
                    album_id: result.id
                }))
            }
        } catch (_e) { }

        return null;
    }

    ////////////////////////////////////////
    // Playlists
    ////////////////////////////////////////

    const playlistId = id.slice(Math.max(0, id.indexOf('spotify:playlist:') + 'spotify:playlist:'.length)).trim();
    const playlist = await getSpotifyPlaylist(api, playlistId, simplified)
    
    if (playlist)
        return playlist;

    let response: AxiosResponse<GetSpotifyScraperData>;
    try {
        const spotifyUrl = `https://open.spotify.com/playlist/${playlistId}`;
        response = await axios.post<GetSpotifyScraperData>(`${process.env.SPOTIFY_SCRAPER_URL}/playlist`, {
            url: spotifyUrl,
            include_album_data: false
        });

    } catch (_e) {
        throw new Error(`This was a Spotify curated playlist, and SpotifyScraper is not available. You might need to restart Spotify-to-Plex to fix this.`)
    }

    if (!response.data) {
        throw new Error(`This was a Spotify curated playlist. Unfortuantely even SpotifyScraper couldn't find it.`)
    }

    const scraperData = response.data

    const images = scraperData.images || [];
    const [image] = images
        .filter((image) => {
            if (image.width < 100)
                return false;

            return true;
        })
        .sort((a, b) => {
            return a.width - b.width;
        });

    const tracks = scraperData.tracks?.map((track) => {

        const { artists, album, name, id, uri } = track;
        const splitArtists = artists.flatMap(artist =>
            artist.name.split(',').map(name => name.trim())
        );

        return {
            id: id || uri,
            title: name || '',
            album: album?.name || '',
            artists: splitArtists,
            album_id: 'unknown'
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

        // Extract track IDs for batch API call
        const trackIds = batch.map(track => track.id.replace('spotify:track:', ''));

        let retryCount = 0;
        let success = false;

        while (!success && retryCount < MAX_RETRIES) {
            try {
                // SINGLE API CALL for up to 50 tracks (50x more efficient!)
                const enrichedTracks = await api.tracks.get(trackIds);

                // Map enriched data back to original tracks
                const enrichedBatch = batch.map((track, idx) => {
                    const enrichedTrack = enrichedTracks[idx];
                    if (!enrichedTrack) return track; // Fallback if track not found

                    return {
                        ...track,
                        album: enrichedTrack.album.name,
                        album_id: enrichedTrack.album.id
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
                    // For other errors, just log and continue with original track data
                    console.error(`Error enriching batch - ${retryCount}/${MAX_RETRIES}: ${batchError.message}`);
                    success = true; // Don't retry non-rate-limit errors
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