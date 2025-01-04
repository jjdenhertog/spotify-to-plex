import { decrypt } from '@/helpers/encryption';
import { generateError } from '@/helpers/errors/generateError';
import refreshAccessTokens from '@/helpers/spotify/refreshAccessTokens';
import { configDir } from "@/library/configDir";
import { GetSpotifyAlbum, GetSpotifyPlaylist, SavedItem, SpotifyCredentials } from '@/types/SpotifyAPI';
import { SavedAlbum, SimplifiedPlaylist, SpotifyApi } from '@spotify/web-api-ts-sdk';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const router = createRouter<NextApiRequest, NextApiResponse>()
    .get(
        async (_req, res) => {
            const credentialsPath = join(configDir, 'spotify.json')
            if (!existsSync(credentialsPath))
                throw new Error("No users are currently connected.")

            if (!process.env.SPOTIFY_API_CLIENT_ID || !process.env.SPOTIFY_API_CLIENT_SECRET)
                throw new Error("Spotify Credentials missing. Please add the environment variables to use this feature.")

            const { id, type } = _req.query
            if (typeof id != 'string')
                throw new Error(`User ID expected.`)

            if (type != 'albums' && type != 'playlists')
                throw new Error(`Type should be albums or playlists.`)

            // Refresh any access tokens
            await refreshAccessTokens()

            // Find the specific user
            const credentials: SpotifyCredentials[] = JSON.parse(readFileSync(credentialsPath, 'utf8'))
            const userCredentials = credentials.find(item => item.user.id == id)
            if (!userCredentials)
                throw new Error(`User not found.`)

            const accessToken = {
                access_token: decrypt(userCredentials.access_token.access_token),
                refresh_token: decrypt(userCredentials.access_token.refresh_token),
                expires_in: userCredentials.access_token.expires_in,
                token_type: userCredentials.access_token.token_type
            }
            const api = SpotifyApi.withAccessToken(process.env.SPOTIFY_API_CLIENT_ID, accessToken)

            ///////////////////////////////////
            // Get Saved items
            ///////////////////////////////////
            const savedItemsPath = join(configDir, 'spotify_saved_items.json')
            let savedItems: SavedItem[] = []
            if (existsSync(savedItemsPath))
                savedItems = JSON.parse(readFileSync(savedItemsPath, 'utf8'))

            ///////////////////////////////////
            // Albums
            ///////////////////////////////////
            if (type == 'albums') {
                let allAlbums: SavedAlbum[] = []

                const savedAlbumResult = await api.currentUser.albums.savedAlbums(50)
                allAlbums = allAlbums.concat(savedAlbumResult.items)

                let hasMoreResults = savedAlbumResult.offset + savedAlbumResult.limit < savedAlbumResult.total;
                let offset = savedAlbumResult.offset + savedAlbumResult.limit;
                const nextUrl = savedAlbumResult.next

                if (nextUrl) {
                    while (hasMoreResults) {
                        const loadMore = await api.currentUser.albums.savedAlbums(50, offset)
                        allAlbums = allAlbums.concat(savedAlbumResult.items)
                        hasMoreResults = loadMore.offset + loadMore.limit < loadMore.total;
                        offset = loadMore.offset + loadMore.limit;
                    }
                }

                // Return data
                const albums: GetSpotifyAlbum[] = allAlbums
                    .filter(item => !!item)
                    .map(item => {
                        return {
                            type: "spotify-album",
                            id: item.album.id,
                            added: savedItems.some(savedItem => savedItem.id == item.album.id),
                            title: item.album.name,
                            private: false,
                            image: item.album.images?.[0]?.url || '',
                            tracks: []
                        }
                    })

                return res.json(albums)
            }

            ///////////////////////////////////
            // Playlists
            ///////////////////////////////////
            let allPlaylists: SimplifiedPlaylist[] = []

            const savedPlaylistResult = await api.currentUser.playlists.playlists(50)
            allPlaylists = allPlaylists.concat(savedPlaylistResult.items)

            let hasMoreResults = savedPlaylistResult.offset + savedPlaylistResult.limit < savedPlaylistResult.total;
            let offset = savedPlaylistResult.offset + savedPlaylistResult.limit;
            const nextUrl = savedPlaylistResult.next

            if (nextUrl) {
                while (hasMoreResults) {
                    const loadMore = await api.currentUser.playlists.playlists(50, offset)
                    allPlaylists = allPlaylists.concat(savedPlaylistResult.items)
                    hasMoreResults = loadMore.offset + loadMore.limit < loadMore.total;
                    offset = loadMore.offset + loadMore.limit;
                }
            }

            // Return data
            const playlists: GetSpotifyPlaylist[] = allPlaylists
                .filter(item => !!item)
                .map(item => {
                    return {
                        type: "spotify-playlist",
                        id: item.id,
                        added: savedItems.some(savedItem => savedItem.id == item.id),
                        title: item.name,
                        user_id: item.public ? undefined : id,
                        private: !item.public,
                        owner: item.owner.display_name,
                        image: item.images?.[0]?.url || '',
                        tracks: []
                    }
                })

            return res.json(playlists)
        }

    )

export default router.handler({
    onError: (err: any, req, res) => {
        generateError(req, res, "Spotify import", err);
    },
});


