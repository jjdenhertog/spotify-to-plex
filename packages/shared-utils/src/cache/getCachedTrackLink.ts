import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { filterUnique } from "../array/filterUnique"

// Import from shared types when packages are linked
export type TrackLink = {
    spotify_id: string
    plex_id?: string[]
    tidal_id?: string[]
}

export type PlexMusicSearchTrack = {
    id: string;
    title: string;
    artists: string[];
}

export type TidalMusicSearchTrack = {
    id: string;
    title: string;
    artists: string[];
}

export default function getCachedTrackLinks(
    searchItems: (PlexMusicSearchTrack | TidalMusicSearchTrack)[], 
    type: 'plex' | 'tidal',
    settingsDir: string
) {
    //////////////////////////////////////
    // Handeling cached links
    //////////////////////////////////////
    const path = join(settingsDir, 'track_links.json')
    let all: TrackLink[] = []

    if (existsSync(path))
        all = JSON.parse(readFileSync(path, 'utf8'))

    const found: TrackLink[] = [];

    for (let i = 0; i < searchItems.length; i++) {
        const searchItem = searchItems[i];

        const trackLink = all.find(item => item.spotify_id == searchItem?.id)
        if (!trackLink)
            continue;

        switch (type) {
            case "plex":
                if (trackLink.plex_id && trackLink.plex_id.length > 0)
                    found.push(trackLink)

                break;

            case "tidal":
                if (trackLink.tidal_id && trackLink.tidal_id.length > 0)
                    found.push(trackLink)

                break;
        }
    }

    const add = (searchResult: { title: string, artist: string, result: ({ id: string, album?: { id: string } })[] }[], type: "tidal" | "plex", album?: { id: string }) => {

        ////////////////////////////////
        // Cache tracks
        ////////////////////////////////
        searchResult.forEach(item => {
            if (item.result && item.result.length > 0) {
                const searchItem = searchItems.find(toSearchItem => toSearchItem.title == item.title && toSearchItem.artists.indexOf(item.artist) > -1)
                if (!searchItem)
                    return;

                // Create new track links if nont existant
                let trackLink = all.find(item => item.spotify_id == searchItem.id)
                if (!trackLink) {
                    trackLink = { spotify_id: searchItem.id }
                    all.push(trackLink)
                }

                switch (type) {
                    case "plex":
                        trackLink.plex_id = item.result
                            .map(item => item.id)
                        break;

                    case "tidal":
                        trackLink.tidal_id = item.result
                            .map(item => item.id)
                        break;
                }
            }
        })

        ////////////////////////////////
        // Cache albums
        ////////////////////////////////
        if (album) {
            let albumIds: string[] = []
            searchResult.forEach(item => {
                albumIds = albumIds.concat(item.result.filter(item => !!item.album).map(item => item.album?.id || ""))
            })
            albumIds = albumIds.filter(filterUnique)

            let albumLink = all.find(item => item.spotify_id == album.id)
            if (!albumLink) {
                albumLink = { spotify_id: album.id }
                all.push(albumLink)
            }

            switch (type) {
                case "plex":
                    albumLink.plex_id = albumIds
                    break;

                case "tidal":
                    albumLink.tidal_id = albumIds
                    break;
            }
        }


        writeFileSync(path, JSON.stringify(all, undefined, 4))
    }

    return { path, all, found, add }

}