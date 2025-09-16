/* eslint-disable max-depth */
import { GetSpotifyPlaylist } from "@spotify-to-plex/shared-types/spotify/GetSpotifyPlaylist";
import { GetSpotifyScraperData } from "@spotify-to-plex/shared-types/spotify/GetSpotifyScraperData";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import axios from "axios";

import { getSpotifyPlaylist } from "./getSpotifyPlaylist";
import { Track } from "@spotify-to-plex/shared-types/spotify/Track";


export async function getSpotifyData(api: SpotifyApi, id: string, simplified: boolean = false, scrapeIncludeAlbumData: boolean = false) {

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
                    title: item.name
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

    const spotifyUrl = `https://open.spotify.com/playlist/${playlistId}`;
    const response = await axios.post<GetSpotifyScraperData>(`${process.env.SPOTIFY_SCRAPER_URL}/playlist`, {
        url: spotifyUrl,
        include_album_data: scrapeIncludeAlbumData
    });

    if (!response.data)
        return null;

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

    const tracks = scraperData.tracks?.map((track) => ({
        id: track.id || track.uri,
        title: track.name || '',
        album: track.album?.name || '',
        artists: track.artists.map(artist => artist.name)
    })) || []

    if (tracks.length == 0)
        return null;

    console.log(`Enriching ${tracks.length} tracks with Spotify API for album data`);

    const BATCH_SIZE = 10;
    const BATCH_DELAY = 1000;
    const RETRY_DELAY = 5000;

    for (let i = 0; i < tracks.length; i += BATCH_SIZE) {
        const batch = tracks.slice(i, i + BATCH_SIZE);

        try {
            // Process batch in parallel
            const promises: Promise<Track>[] = batch.map(async (track) => {

                if (!track.id?.startsWith('spotify:track:'))
                    return track;

                return new Promise((resolve) => {

                    const trackId = track.id.replace('spotify:track:', '');
                    api.tracks.get(trackId)
                        .then(enrichedTrack => {
                            resolve({
                                ...track,
                                album: enrichedTrack.album.name
                            });
                        })
                        .finally(() => {
                            resolve(track);
                        });
                });
            })

            const enrichedBatch = await Promise.all(promises);

            tracks.splice(i, BATCH_SIZE, ...enrichedBatch);

            // Wait between batches (except for the last batch)
            if (i + BATCH_SIZE < tracks.length)
                await new Promise(resolve => { setTimeout(resolve, BATCH_DELAY) });

        } catch (batchError: any) {
            console.error(`Batch enrichment failed for batch starting at ${i}:`, batchError);

            // If rate limited (429), wait longer
            if (batchError.status === 429) {
                console.log(`Rate limited, waiting ${RETRY_DELAY}ms before continuing`);
                await new Promise(resolve => { setTimeout(resolve, RETRY_DELAY) });
            }
        }
    }

    console.log(`Completed track enrichment for ${tracks.length} tracks`);

    const result: GetSpotifyPlaylist = {
        type: "spotify-playlist",
        id: scraperData.id || playlistId,
        title: scraperData.name || '',
        image: image?.url || '',
        owner: scraperData.owner?.name || '',
        tracks
    }

    return result

}