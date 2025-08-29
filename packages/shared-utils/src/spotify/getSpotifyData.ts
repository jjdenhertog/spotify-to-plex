import { GetSpotifyAlbum, GetSpotifyPlaylist } from "@spotify-to-plex/shared-types/spotify/api";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import axios from "axios";
import crypto from "node:crypto";

import getSpotifyPlaylist from "./getSpotifyPlaylist";

function generateTrackId(artists: string[], trackName: string): string {
    const artistsStr = artists.join(',');
    const combined = `${artistsStr}+${trackName}`;
    return crypto.createHash('md5').update(combined).digest('hex').slice(0, 16);
}

export default async function getSpotifyData(api: SpotifyApi, id: string, simplified: boolean = false): Promise<GetSpotifyAlbum | GetSpotifyPlaylist | undefined> {
    if (id.indexOf('spotify:album:') > -1) {
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

    } else if (id.indexOf('spotify:playlist:') > -1) {
        const playlistId = id.slice(Math.max(0, id.indexOf('spotify:playlist:') + 'spotify:playlist:'.length)).trim();
        const playlist = await getSpotifyPlaylist(api, playlistId, simplified)
        if (playlist)
            return playlist;

        const spotifyUrl = `https://open.spotify.com/playlist/${playlistId}`;
        const response = await axios.post(`${process.env.SPOTIFY_SCRAPER_URL}/playlist`, {
            url: spotifyUrl
        });
        if (response.data) {
            const scraperData = response.data;

            const result:GetSpotifyPlaylist= {
                type: "spotify-playlist",
                id: scraperData.id || playlistId,
                title: scraperData.title || '',
                image: scraperData.image || '',
                owner: scraperData.owner || '',
                tracks: scraperData.tracks?.map((track: any) => ({
                    id: generateTrackId(track.artists || [], track.name || ''),
                    title: track.name || '',
                    album: track.album || '',
                    artists: track.artists || []
                })) || []
            }

            return result
        }

    }

    return undefined
}