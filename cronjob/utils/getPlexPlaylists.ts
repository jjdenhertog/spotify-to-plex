import { PlexPlaylists, plex } from "@/library/plex";

export function getPlexPlaylists() {
    let playlists: PlexPlaylists["data"] = plex.playlists.data || [];
    if (!playlists)
        playlists = [];

    return { playlists };
}
