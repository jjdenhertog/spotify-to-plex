import { settingsDir } from "@/library/settingsDir"
import { ensureDirSync } from "fs-extra"
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
 
let {_plex} = global;

if (!_plex) {

    let settings: PlexSettings = {}
    try {
        ensureDirSync(settingsDir)
        
        const result = readFileSync(join(settingsDir, 'plex.json'))
        settings = JSON.parse(String(result));
    } catch (_e) { }

    let playlists: PlexPlaylists = {}
    try {
        const result = readFileSync(join(settingsDir, 'playlists.json'))
        playlists = JSON.parse(String(result));
    } catch (_e) { }

    _plex = {
        saveConfig: (settings: PlexSettings) => {
            // Save & Store
            _plex.settings = { ...plex.settings, ...settings };
            writeFileSync(join(settingsDir, 'plex.json'), JSON.stringify(_plex.settings, null, 2), 'utf8');
        },
        savePlaylist: (type: string, id: string, plexId: string) => {
            //@ts-expect-error Needs refactoring
            const playlists = (_plex.playlists.data || []).filter(item => item.id != id)

            playlists.push({ type, id, plex: plexId })
            _plex.playlists = { ..._plex.playlists, data: playlists };
            writeFileSync(join(settingsDir, 'playlists.json'), JSON.stringify(_plex.playlists, null, 2), 'utf8');
        },
        settings,
        playlists
    }
}

export const plex = _plex;