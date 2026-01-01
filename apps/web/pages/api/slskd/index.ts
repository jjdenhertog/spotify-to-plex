import { generateError } from '@/helpers/errors/generateError';
import { getCachedTrackLinks } from '@spotify-to-plex/shared-utils/cache/getCachedTrackLink';
import { Album } from '@spotify-to-plex/shared-types/spotify/Album';
import { Track } from '@spotify-to-plex/shared-types/spotify/Track';
import { search as slskdMusicSearch } from '@spotify-to-plex/slskd-music-search/functions/search';
import { SearchResponse } from '@spotify-to-plex/slskd-music-search/types/SearchResponse';
import { getMusicSearchConfig } from "@spotify-to-plex/music-search/functions/getMusicSearchConfig";
import { getSlskdSettings } from '@spotify-to-plex/plex-config/functions/getSlskdSettings';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';

export type GetSlskdTracksResponse = {
    id: string,
    title: string
    artist: string
    album: string
    slskd_files?: {
        username: string;
        filename: string;
        size: number;
    }[]
}

const router = createRouter<NextApiRequest, NextApiResponse>()
    .post(
        async (req, res) => {

            const searchItems: Track[] = req.body.items
            const album: Album = req.body.album

            if (!Array.isArray(searchItems))
                throw new Error(`Array of items expected, none found`)

            if (typeof process.env.SLSKD_API_KEY !== 'string')
                throw new Error(`Environment variable SLSKD_API_KEY is missing`)

            const slskdSettings = await getSlskdSettings();
            if (!slskdSettings.url)
                throw new Error(`SLSKD URL is not configured in settings. Please save your settings first.`)

            // Sanitize URL (remove trailing slash to prevent double-slash issues)
            const baseUrl = slskdSettings.url.endsWith('/')
                ? slskdSettings.url.slice(0, -1)
                : slskdSettings.url;

            ///////////////////////////////////////
            // SLSKD authentication and configuration
            ///////////////////////////////////////

            // Load music search configuration
            const musicSearchConfig = await getMusicSearchConfig();
            if (!musicSearchConfig)
                throw new Error(`Music search config not found`)

            const { searchApproaches, textProcessing } = musicSearchConfig;
            if (!searchApproaches || searchApproaches.length === 0)
                throw new Error(`Search approaches not found`)

            const slskdConfig = {
                baseUrl,
                apiKey: process.env.SLSKD_API_KEY,
                musicSearchConfig,
                searchApproaches,
                textProcessing,
                allowedExtensions: slskdSettings.allowed_extensions
            };

            //////////////////////////////////////
            // Search SLSKD tracks
            //////////////////////////////////////
            let searchResult: SearchResponse[] = []

            // Convert Spotify tracks to SLSKD search format
            const slskdSearchItems = searchItems.map(track => ({
                id: track.id,
                artists: track.artists || [],
                title: track.title,
                album: track.album
            }));

            searchResult = await slskdMusicSearch(slskdConfig, slskdSearchItems);


            ///////////////////////////
            // Store caching
            ///////////////////////////
            const { add } = getCachedTrackLinks(searchItems, 'slskd')
            add(searchResult, 'slskd', album)

            return res.status(200).json(searchResult.map(item => ({
                ...item,
                slskd_files: item.result.map(file => ({
                    username: file.username,
                    filename: file.filename,
                    size: file.size
                }))
            })))
        })

export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "SLSKD Tracks", err);
    },
});
