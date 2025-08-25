import { plex, PlexPlaylists } from "../library/plex";

export async function getPlexPlaylists() {
    const plexPlaylists = await plex.getPlaylists();
    let playlists: PlexPlaylists["data"] = plexPlaylists.data || [];
    if (!playlists)
        playlists = [];

    return { playlists };
}
