import { generateError } from '@/helpers/errors/generateError';
import { getLidarrSettings } from '@spotify-to-plex/plex-config/functions/getLidarrSettings';
import { LidarrAddAlbumRequest } from '@spotify-to-plex/shared-types/lidarr/LidarrAddAlbumRequest';
import { getMusicBrainzIds } from '@spotify-to-plex/shared-utils/lidarr/getMusicBrainzIds';
import { lookupLidarrAlbum } from '@spotify-to-plex/shared-utils/lidarr/lookupLidarrAlbum';
import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';

const router = createRouter<NextApiRequest, NextApiResponse>()
    .post(async (req, res) => {
        try {
            const { spotify_album_id, artist_name, album_name } = req.body;

            if (!spotify_album_id) {
                console.error('spotify_album_id is required');

                return res.status(400).json({
                    success: false,
                    message: 'spotify_album_id is required',
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

            // Step 1: Get MusicBrainz IDs (with fallback using artist/album names)
            const musicBrainzIds = await getMusicBrainzIds(spotify_album_id, artist_name, album_name);
            if (!musicBrainzIds) {
                return res.status(404).json({
                    success: false,
                    message: `No MusicBrainz mapping found for Spotify album: ${spotify_album_id}`,
                });
            }

            const { releaseGroupId } = musicBrainzIds;

            // Step 2: Lookup album in Lidarr
            const lidarrAlbum = await lookupLidarrAlbum(releaseGroupId, settings.url, apiKey);

            if (!lidarrAlbum?.artist) {
                return res.status(404).json({
                    success: false,
                    message: 'Album not found in Lidarr database',
                });
            }

            // Step 3: Add to Lidarr
            const baseUrl = settings.url.endsWith('/') ? settings.url.slice(0, -1) : settings.url;
            const addRequest: LidarrAddAlbumRequest = {
                foreignAlbumId: lidarrAlbum.foreignAlbumId,
                title: lidarrAlbum.title,
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
                    foreignArtistId: lidarrAlbum.artist.foreignArtistId,
                    artistName: lidarrAlbum.artist.artistName,
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
                message: `Successfully added "${lidarrAlbum.title}" to Lidarr`,
            });

        } catch (error: any) {
            console.error('Error sending album to Lidarr:', error.message);

            // Log detailed error response from Lidarr
            if (error.response?.data) {
                console.error('Lidarr API Response:', JSON.stringify(error.response.data, null, 2));
            }

            // Handle "already exists" error
            if (error.response?.status === 409) {
                return res.status(200).json({
                    success: true,
                    message: 'Album already exists in Lidarr',
                });
            }

            // Extract error message from Lidarr's response
            let errorMessage = 'Failed to send album';
            if (error.response?.data) {
                const {data} = error.response;
                // Handle array response (validation errors)
                if (Array.isArray(data) && data.length > 0) {
                    const [firstError] = data;
                    errorMessage = firstError.errorMessage || firstError.message || JSON.stringify(firstError);
                } else if (data.message) {
                    errorMessage = data.message;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }

            res.status(500).json({
                success: false,
                message: errorMessage,
            });
        }
    });

export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "Lidarr Send Album", err);
    }
});
