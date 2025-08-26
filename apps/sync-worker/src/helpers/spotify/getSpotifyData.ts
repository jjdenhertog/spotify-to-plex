import { GetSpotifyAlbum, GetSpotifyPlaylist } from "@spotify-to-plex/shared-types";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import getSpotifyPlaylist from "./getSpotifyPlaylist";

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

    }
    
    return undefined
}