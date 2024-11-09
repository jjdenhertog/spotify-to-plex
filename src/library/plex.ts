import { configDir } from "@/pages/index"
import { readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

/******
 * 
 * @TODO: Needs refactoring
 * 
 */
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
    const _plex: {
        saveConfig: (settings: PlexSettings) => void
        savePlaylist: (type: string, id: string, plex: string) => void
        settings: PlexSettings
        playlists: PlexPlaylists
    }
}

// @ts-expect-error I dodn't setup the global typing
// eslint-disable-next-line @typescript-eslint/prefer-destructuring 
let _plex = global._plex;

if (!_plex) {

    let settings: PlexSettings = {}
    try {
        const result = readFileSync(join(configDir, 'plex.json'))
        settings = JSON.parse(String(result));
    } catch (_e) { }

    let playlists: PlexPlaylists = {}
    try {
        const result = readFileSync(join(configDir, 'playlists.json'))
        playlists = JSON.parse(String(result));
    } catch (_e) { }

    _plex = {
        saveConfig: (settings: PlexSettings) => {
            // Save & Store
            _plex.settings = { ...plex.settings, ...settings };
            writeFileSync(join(configDir, 'plex.json'), JSON.stringify(_plex.settings, null, 2), 'utf8');
        },
        savePlaylist: (type: string, id: string, plexId: string) => {
            //@ts-expect-error Needs refactoring
            const playlists = (_plex.playlists.data || []).filter(item => item.id != id)

            playlists.push({ type, id, plex: plexId })
            _plex.playlists = { ..._plex.playlists, data: playlists };
            writeFileSync(join(configDir, 'playlists.json'), JSON.stringify(_plex.playlists, null, 2), 'utf8');
        },
        settings,
        playlists
    }
}

export const plex = _plex;