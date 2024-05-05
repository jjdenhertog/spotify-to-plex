import { readFileSync, writeFileSync } from "fs"

export type PlexSettings = {
    id?: string,
    uri?: string,
    token?: string,
    pin_code?: string,
    pin_id?: string
}
export type PlexPlaylists = {
    data?: { type: string, id: string, plex: string }[]
}
declare global {
    var _plex: {
        saveConfig: (settings: PlexSettings) => void
        savePlaylist: (type: string, id: string, plex: string) => void
        settings: PlexSettings
        playlists: PlexPlaylists
    }
}

let _plex = global._plex;
if (!_plex) {

    let settings: PlexSettings = {}
    try {
        const result = readFileSync("config/plex.json")
        settings = JSON.parse(String(result));
    } catch (e) {

    }

    let playlists: PlexPlaylists = {}
    try {
        const result = readFileSync("config/playlists.json")
        playlists = JSON.parse(String(result));
    } catch (e) {

    }

    _plex = {
        saveConfig: (settings) => {
            // Save & Store
            _plex.settings = { ...plex.settings, ...settings };
            writeFileSync('config/plex.json', JSON.stringify(_plex.settings, null, 2), 'utf8');
        },
        savePlaylist: (type: string, id: string, plexId: string) => {
            const playlists = _plex.playlists.data || []
            playlists.push({ type: type, id: id, plex: plexId })
            _plex.playlists = { ..._plex.playlists, data: playlists };
            writeFileSync('config/playlists.json', JSON.stringify(_plex.playlists, null, 2), 'utf8');
        },
        settings: settings,
        playlists: playlists
    }
}

export const plex = _plex;