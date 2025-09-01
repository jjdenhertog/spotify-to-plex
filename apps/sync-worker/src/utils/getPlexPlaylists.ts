import { plex } from "../library/plex";
import { PlexPlaylists } from "@spotify-to-plex/plex-config/types/PlexPlaylists";

export async function getPlexPlaylists() {
    const plexPlaylists = await plex.getPlaylists();
    let playlists: PlexPlaylists["data"] = plexPlaylists.data || [];
    if (!playlists)
        playlists = [];

    return { playlists };
}
