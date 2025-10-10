import { generateError } from '@/helpers/errors/generateError';
import { getLidarrSettings } from '@spotify-to-plex/plex-config/functions/getLidarrSettings';
import { LidarrAddAlbumRequest, LidarrSearchResult } from '@spotify-to-plex/shared-types/common/lidarr';
import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';

const router = createRouter<NextApiRequest, NextApiResponse>()
    .post(async (req, res) => {
        try {
            const { artist_name, album_name } = req.body;

            if (!artist_name || !album_name) {
                return res.status(400).json({
                    success: false,
                    message: 'Artist name and album name are required',
                });
            }

            // Get Lidarr settings
            const settings = await getLidarrSettings();
            if (!settings.enabled) {
                return res.status(400).json({
                    success: false,
                    message: 'Lidarr is not enabled',
                });
            }

            if (!settings.url) {
                return res.status(400).json({
                    success: false,
                    message: 'Lidarr URL is not configured',
                });
            }

            const apiKey = process.env.LIDARR_API_KEY;
            if (!apiKey) {
                return res.status(400).json({
                    success: false,
                    message: 'LIDARR_API_KEY environment variable is not set',
                });
            }

            // Step 1: Search Lidarr
            const baseUrl = settings.url.endsWith('/') ? settings.url.slice(0, -1) : settings.url;
            const searchTerm = `${artist_name} ${album_name}`;
            const searchUrl = `${baseUrl}/api/v1/search?term=${encodeURIComponent(searchTerm)}`;

            const searchResponse = await axios.get<LidarrSearchResult[]>(searchUrl, {
                headers: {
                    'X-Api-Key': apiKey,
                },
            });

            if (!searchResponse.data || searchResponse.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: `No results found for "${searchTerm}"`,
                });
            }

            // Find album result
            const albumResult = searchResponse.data.find(result => result.album);
            if (!albumResult?.album?.artist) {
                return res.status(404).json({
                    success: false,
                    message: 'No album found in search results',
                });
            }

            const { foreignAlbumId, title, artist } = albumResult.album;
            const { foreignArtistId, artistName } = artist;

            // Step 2: Add to Lidarr
            const addRequest: LidarrAddAlbumRequest = {
                foreignAlbumId,
                title,
                artistId: 0,
                profileId: settings.quality_profile_id,
                qualityProfileId: settings.quality_profile_id,
                metadataProfileId: settings.metadata_profile_id,
                monitored: true,
                anyReleaseOk: true,
                rootFolderPath: settings.root_folder_path,
                addOptions: {
                    searchForNewAlbum: true,
                },
                artist: {
                    foreignArtistId,
                    artistName,
                    qualityProfileId: settings.quality_profile_id,
                    metadataProfileId: settings.metadata_profile_id,
                    rootFolderPath: settings.root_folder_path,
                },
            };

            const addUrl = `${baseUrl}/api/v1/album`;
            await axios.post(addUrl, addRequest, {
                headers: {
                    'X-Api-Key': apiKey,
                    'Content-Type': 'application/json',
                },
            });

            res.status(200).json({
                success: true,
                message: `Successfully added "${title}" to Lidarr`,
            });

        } catch (error: any) {
            console.error('Error sending album to Lidarr:', error);

            // Handle "already exists" error
            if (error.response?.status === 409) {
                return res.status(200).json({
                    success: true,
                    message: 'Album already exists in Lidarr',
                });
            }

            res.status(500).json({
                success: false,
                message: error.response?.data?.message || error.message || 'Failed to send album',
            });
        }
    });

export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "Lidarr Send Album", err);
    }
});
