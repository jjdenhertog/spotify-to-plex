import axios from 'axios';
import { getMusicBrainzCache } from '../cache/getMusicBrainzCache';
import { rateLimitDelay } from './utils/rateLimitDelay';
import { withRetry } from './utils/withRetry';
import { getMusicBrainzIdsByTextSearch } from './getMusicBrainzIdsByTextSearch';

/**
 * Response from MusicBrainz URL API
 */
type MusicBrainzUrlResponse = {
    id: string;
    resource: string;
    relations: {
        type: string;
        'type-id': string;
        direction: string;
        'target-type': string;
        release?: {
            id: string;
            title: string;
            disambiguation: string;
            status: string | null;
            'status-id': string | null;
            date: string;
            country: string;
            barcode: string | null;
            packaging: string | null;
            'packaging-id': string | null;
        };
    }[];
};

/**
 * Response from MusicBrainz Release API
 */
type MusicBrainzReleaseResponse = {
    id: string;
    title: string;
    'release-group': {
        id: string;
        title: string;
        'primary-type': string;
        'primary-type-id': string;
        'secondary-types': string[];
        'secondary-type-ids': string[];
        disambiguation: string;
        'first-release-date': string;
    };
    'artist-credit': {
        artist: {
            id: string;
            name: string;
            'sort-name': string;
        };
    }[];
};

/**
 * Get MusicBrainz release group and artist IDs from Spotify album ID
 * Uses caching to minimize API calls
 * Falls back to text search if direct lookup fails and names are provided
 */
export async function getMusicBrainzIds(spotifyAlbumId: string, artistName?: string, albumName?: string) {
    const cache = getMusicBrainzCache();

    // Step 1: Check cache first
    const cached = cache.get(spotifyAlbumId);
    if (cached) {
        return {
            releaseGroupId: cached.musicbrainz_release_group_id,
            artistId: cached.musicbrainz_artist_id
        };
    }

    try {
        // Step 2: MusicBrainz URL API Call with retry
        const urlApiUrl = `https://musicbrainz.org/ws/2/url?resource=https://open.spotify.com/album/${spotifyAlbumId}&fmt=json&inc=release-rels`;
        const urlResponse = await withRetry(() => axios.get<MusicBrainzUrlResponse>(urlApiUrl));

        // Step 3: Extract Release ID
        if (!urlResponse.data.relations || urlResponse.data.relations.length === 0)
            return null;

        const releaseRelation = urlResponse.data.relations.find(
            rel => rel.direction === 'backward' && rel['target-type'] === 'release' && rel.release
        );

        if (!releaseRelation?.release)
            return null;

        const releaseId = releaseRelation.release.id;
        await rateLimitDelay();

        // Step 4: MusicBrainz Release API Call with retry
        const releaseApiUrl = `https://musicbrainz.org/ws/2/release/${releaseId}?inc=release-groups+artist-credits&fmt=json`;
        const releaseResponse = await withRetry(() => axios.get<MusicBrainzReleaseResponse>(releaseApiUrl));

        // Step 5: Extract release-group ID and artist ID
        if (!releaseResponse.data['release-group'])
            return null;

        if (!releaseResponse.data['artist-credit'] || releaseResponse.data['artist-credit'].length === 0)
            return null;

        const releaseGroupId = releaseResponse.data['release-group'].id;
        const artistId = releaseResponse.data['artist-credit']?.[0]?.artist?.id;
        if (!artistId)
            return null;

        // Step 6: Cache the result
        cache.add({
            spotify_album_id: spotifyAlbumId,
            musicbrainz_release_group_id: releaseGroupId,
            musicbrainz_artist_id: artistId
        });

        return {
            releaseGroupId,
            artistId
        };

    } catch (_e: unknown) {
        // FALLBACK: Try text search if artist and album names are provided
        if (artistName && albumName)
            return getMusicBrainzIdsByTextSearch(artistName, albumName);

        return null;
    }
}
