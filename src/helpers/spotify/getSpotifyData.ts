import { GetSpotifyAlbum, GetSpotifyPlaylist } from "@/types/SpotifyAPI";
import { OpenSpotifyApi } from "@jjdenhertog/open-spotify-sdk";
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
                image: result.images[0].url,
                tracks: result.tracks.items.map(item => ({
                    artist: item.artists[0].name,
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

        // Attempt using the partner api
        try {
            const openSpotifyAPI = new OpenSpotifyApi()

            let playlist = await openSpotifyAPI.playlists.get(id, 0, 1)
            if (!simplified)
                playlist = await openSpotifyAPI.playlists.getFull(id)

            return {
                type: "spotify-playlist",
                id: playlist.id,
                title: playlist.name,
                owner: playlist.owner.name,
                image: playlist.images[0].url,
                tracks: playlist.tracks.items.map(track => {
                    return {
                        artist: track.artists[0].name,
                        id: track.id,
                        artists: track.artists.map(artist => artist.name),
                        album: track.album.name,
                        title: track.name
                    }
                })
            }

        } catch (_e) {
            console.log(_e)
        }
    }
}