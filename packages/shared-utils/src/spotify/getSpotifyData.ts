/* eslint-disable max-depth */
import { GetSpotifyPlaylist } from "@spotify-to-plex/shared-types/spotify/GetSpotifyPlaylist";
import { GetSpotifyScraperData } from "@spotify-to-plex/shared-types/spotify/GetSpotifyScraperData";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import axios, { AxiosResponse } from "axios";

import { getSpotifyPlaylist } from "./getSpotifyPlaylist";
import { Track } from "@spotify-to-plex/shared-types/spotify/Track";


export async function getSpotifyData(api: SpotifyApi, id: string, simplified: boolean = false) {

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

    if (!response.data){
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
            artists: splitArtists
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

    const BATCH_SIZE = 10;
    const BATCH_DELAY = 1000;
    const RETRY_DELAY = 5000;

    for (let i = 0; i < tracks.length; i += BATCH_SIZE) {
        const batch = tracks.slice(i, i + BATCH_SIZE);
        try {
            // Process batch in parallel
            const promises: Promise<Track>[] = batch.map(async (track) => {

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

            // If rate limited (429), wait longer
            if (batchError.status === 429) {
                await new Promise(resolve => { setTimeout(resolve, RETRY_DELAY) });
            }
        }
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