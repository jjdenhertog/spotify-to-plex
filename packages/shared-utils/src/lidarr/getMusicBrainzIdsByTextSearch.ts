import axios from 'axios';
import { MusicBrainzTextSearchResponse } from '@spotify-to-plex/shared-types/musicbrainz/MusicBrainzTextSearchResponse';
import { rateLimitDelay } from './utils/rateLimitDelay';
import { withRetry } from './utils/withRetry';
import { validateMusicBrainzMatch } from './validateMusicBrainzMatch';

/**
 * Get MusicBrainz IDs using text search (fallback method)
 * Uses artist and album names to search MusicBrainz
 */
export async function getMusicBrainzIdsByTextSearch(artistName: string, albumName: string) {
    try {
        // Rate limiting before API call
        await rateLimitDelay();

        // Build search query
        const query = `${artistName} ${albumName}`;
        const encodedQuery = encodeURIComponent(query);
        const searchUrl = `https://musicbrainz.org/ws/2/release-group/?query=${encodedQuery}&fmt=json&limit=1`;

        const searchResponse = await withRetry(() =>
            axios.get<MusicBrainzTextSearchResponse>(searchUrl)
        );

        // Check if we got results
        if (!searchResponse.data['release-groups'] || searchResponse.data['release-groups'].length === 0)
            return null;

        const [firstResult] = searchResponse.data['release-groups'];
        const mbArtistName = firstResult?.['artist-credit']?.[0]?.artist?.name || '';
        const mbAlbumName = firstResult?.title || '';

        const isValidMatch = validateMusicBrainzMatch(artistName, albumName, mbArtistName, mbAlbumName);
        if (!isValidMatch)
            return null;

        // Extract IDs
        const releaseGroupId = firstResult?.id;
        const artistId = firstResult?.['artist-credit']?.[0]?.artist?.id;

        if (!artistId || !releaseGroupId)
            return null;

        return { releaseGroupId, artistId };

    } catch (_e: unknown) {
        return null;
    }
}
