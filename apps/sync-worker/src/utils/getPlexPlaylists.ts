import { plex, PlexPlaylists } from "../library/plex";

export function getPlexPlaylists() {
    let playlists: PlexPlaylists["data"] = plex.playlists.data || [];
    if (!playlists)
        playlists = [];

    return { playlists };
}
