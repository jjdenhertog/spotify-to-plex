import { generateError } from '@/helpers/errors/generateError';
import { getCachedTrackLinks } from '@spotify-to-plex/shared-utils/cache/getCachedTrackLink';
import { getTidalCredentials } from '@spotify-to-plex/shared-utils/tidal/getTidalCredentials';
import { Album } from '@spotify-to-plex/shared-types/spotify/Album';
import { Track } from '@spotify-to-plex/shared-types/spotify/Track';
import { search as tidalMusicSearch } from '@spotify-to-plex/tidal-music-search/functions/search';
import { searchAlbum } from '@spotify-to-plex/tidal-music-search/functions/searchAlbum';
import { setUser } from '@spotify-to-plex/tidal-music-search/session/credentials';
import { SearchResponse } from '@spotify-to-plex/tidal-music-search/types/SearchResponse';
import { getMusicSearchConfig } from "@spotify-to-plex/music-search/functions/getMusicSearchConfig";
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';

export type GetTidalTracksResponse = {
    id: string,
    title: string
    artist: string
    album: string
    tidal_ids?: string[]
}

const router = createRouter<NextApiRequest, NextApiResponse>()
    .post(
        async (req, res) => {

            const searchItems: Track[] = req.body.items
            const album: Album = req.body.album
            const { type = 'spotify-playlist' } = req.body;

            if (!Array.isArray(searchItems))
                throw new Error(`Array of items expected, none found`)

            if (typeof process.env.TIDAL_API_CLIENT_ID !== 'string')
                throw new Error(`Environment variable TIDAL_API_CLIENT_ID is missing`)

            if (typeof process.env.TIDAL_API_CLIENT_SECRET !== 'string')
                throw new Error(`Environment variable TIDAL_API_CLIENT_SECRET is missing`)

            ///////////////////////////////////////
            // Tidal authentication and configuration
            ///////////////////////////////////////
            const tidalUser = await getTidalCredentials();
            if(!tidalUser)
                throw new Error(`Tidal credentials not found`)
            
            setUser(tidalUser);
            
            // Load music search configuration
            const musicSearchConfig= await getMusicSearchConfig();
            if(!musicSearchConfig)
                throw new Error(`Music search config not found`)

            const {searchApproaches} = musicSearchConfig;
            if(!searchApproaches || searchApproaches.length === 0)
                throw new Error(`Search approaches not found`)

            const tidalConfig = {
                clientId: process.env.TIDAL_API_CLIENT_ID,
                clientSecret: process.env.TIDAL_API_CLIENT_SECRET,
                musicSearchConfig,
                searchApproaches
            };

            //////////////////////////////////////
            // Search Tidal tracks
            //////////////////////////////////////
            let searchResult: SearchResponse[] = []
            switch (type) {
                case "spotify-album":
                    searchResult = await searchAlbum(tidalConfig, searchItems)
                    break;

                default:
                    searchResult = await tidalMusicSearch(tidalConfig, searchItems)
                    break;
            }

            
            ///////////////////////////
            // Store caching
            ///////////////////////////
            const { add } = getCachedTrackLinks(searchItems, 'tidal')
            add(searchResult, 'tidal', album)

            return res.status(200).json(searchResult.map(item => ({ ...item, tidal_ids: item.result.map(item => item.id) })))
        })

export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "Tidal Tracks", err);
    },
});


