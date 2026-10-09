import { authenticate, setCredentials } from "../session/credentials";
import { TidalMusicSearchApproach } from "../types/TidalMusicSearchApproach";
import { TidalMusicSearchTrack } from "../types/TidalMusicSearchTrack";
import { TidalCredentials } from "../types/TidalCredentials";
import { TidalFallbackFields } from "../types/TidalFallbackFields";
import { TidalLookup } from "../types/TidalLookup";
import { TidalMatch } from "../types/TidalMatch";
import { TidalTrack } from "../types/TidalTrack";
import { getTrackByIds } from "../utils/tidal/getTrackByIds";
import { findTidalTracks } from "./findTidalTracks";
import { getTidalCredentials } from "./getTidalCredentials";

type LibraryRow = {
    id: string;
    result: unknown[];
};

// Tracks fetched per request when describing cached links
const TRACKS_PER_REQUEST = 20;

/**
 * Looks up on Tidal every row the library (Plex) search found nothing for.
 * A Tidal problem never fails the rows, it ends up in tidal_error.
 *
 * @param rows library search results, a row with an empty result is missing
 * @param items the search input, so Tidal gets the same artists, title and album
 * @param searchApproaches the approaches the library search used
 */
export async function addTidalFallback<T extends LibraryRow>(rows: T[], items: TidalMusicSearchTrack[], searchApproaches?: TidalMusicSearchApproach[]): Promise<(T & TidalFallbackFields)[]> {

    const missingIds = new Set(rows.filter(row => row.result.length == 0).map(row => row.id));
    const missingItems = items.filter((item, index) => missingIds.has(item.id) && items.findIndex(other => other.id == item.id) == index);

    const credentials = getTidalCredentials();
    let lookups: TidalLookup[] = [];
    let error: TidalFallbackFields['tidal_error'];

    if (missingItems.length > 0) {
        if (credentials) {
            try {
                const found = await findTidalTracks(credentials, missingItems, searchApproaches);
                lookups = await describeCachedLookups(credentials, found);
            } catch (e) {
                console.error('Error searching missing tracks on Tidal:', e);
                error = 'failed';
            }
        } else {
            error = 'unconfigured';
        }
    }

    return rows.map((row): T & TidalFallbackFields => {
        if (row.result.length > 0)
            return { ...row, status: 'plex' };

        if (error)
            return { ...row, status: 'none', tidal_ids: [], tidal_error: error };

        const lookup = lookups.find(item => item.id == row.id);
        if (!lookup || lookup.tidal_ids.length == 0)
            return { ...row, status: 'none', tidal_ids: [] };

        const { tidal_ids, track } = lookup;

        return {
            ...row,
            status: 'tidal',
            tidal_ids,
            ...(track ? { tidal_album_id: track.album.id, tidal_match: toTidalMatch(track) } : {})
        };
    });
}

function toTidalMatch(track: TidalTrack): TidalMatch {
    return {
        artist: track.artists.map(artist => artist.name).join(', '),
        title: track.title,
        album: track.album.title,
        duration_ms: track.duration_ms
    };
}

/**
 * A cached track link only holds Tidal ids, fetch the best track of each so it can be described.
 * Best effort: when this fails the lookups keep their ids without a description.
 */
async function describeCachedLookups(credentials: TidalCredentials, lookups: TidalLookup[]) {
    const ids = lookups
        .filter(item => !item.track)
        .map(item => item.tidal_ids[0])
        .filter((id): id is string => !!id);

    if (ids.length == 0)
        return lookups;

    try {
        setCredentials(credentials.clientId, credentials.clientSecret);
        await authenticate();

        const tracks: TidalTrack[] = [];

        for (let i = 0; i < ids.length; i += TRACKS_PER_REQUEST)
            tracks.push(...await getTrackByIds(ids.slice(i, i + TRACKS_PER_REQUEST), 'NL'));

        return lookups.map(item => item.track ? item : { ...item, track: tracks.find(track => track.id == item.tidal_ids[0]) });
    } catch (e) {
        console.error('Error describing cached Tidal tracks:', e);

        return lookups;
    }
}
