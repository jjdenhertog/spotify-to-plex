import { GetSpotifyPlaylist } from "@spotify-to-plex/shared-types/spotify/GetSpotifyPlaylist";
import { GetSpotifyScraperData } from "@spotify-to-plex/shared-types/spotify/GetSpotifyScraperData";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import axios from "axios";

import { getSpotifyPlaylist } from "./getSpotifyPlaylist";


export async function getSpotifyData(api: SpotifyApi, id: string, simplified: boolean = false, scrpaeIncludeAlbumData: boolean = false) {
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
        const response = await axios.post<GetSpotifyScraperData>(`${process.env.SPOTIFY_SCRAPER_URL}/playlist`, {
            url: spotifyUrl,
            include_album_data: scrpaeIncludeAlbumData
        });
        if (response.data) {
            const scraperData = response.data

            const images = scraperData.images || [];
            const [image]= images
                .filter((image) => {
                    if (image.width < 100)
                        return false;

                    return true;
                })
                .sort((a, b) => {
                    return a.width - b.width;
                });

            const result: GetSpotifyPlaylist = {
                type: "spotify-playlist",
                id: scraperData.id || playlistId,
                title: scraperData.name || '',
                image: image?.url || '',
                owner: scraperData.owner?.name || '',
                tracks: scraperData.tracks?.map((track) => ({
                    id: track.id,
                    title: track.name || '',
                    album: track.album?.name || '',
                    artists: track.artists.map(artist => artist.name)
                })) || []
            }

            return result
        }

    }

    return null;
    
}