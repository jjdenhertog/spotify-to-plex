/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
import { generateError } from '@/helpers/errors/generateError';
import { plex } from '@/library/plex';
import { getSpotifyData, settingsDir } from '@spotify-to-plex/shared-utils/server';

import type { SavedItem } from '@spotify-to-plex/shared-types/spotify/api';
import { getById } from '@spotify-to-plex/plex-music-search/functions/getById';
import { getMusicSearchConfig } from '@spotify-to-plex/music-search/config/config-utils';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'node:url';

const router = createRouter<NextApiRequest, NextApiResponse>()
    .get(
        async (req, res) => {

            const savedItemsPath = join(settingsDir, 'spotify_saved_items.json')
            if (!existsSync(savedItemsPath))
                return res.status(200).json([])

            const savedItems: SavedItem[] = JSON.parse(readFileSync(savedItemsPath, 'utf8'))

            const { id } = req.query;
            if (typeof id == 'string') {
                const savedItem = savedItems.find(item => item.id == id)
                if (!savedItem)
                    throw new Error(`Saved item not found ${id}`)

                return res.status(200).json([savedItem])
            }

            return res.status(200).json(savedItems.reverse())
        }
    )
    .post(
        async (req, res) => {
            try {
                const { search, id: searchId, user_id, label } = req.body;
                if (typeof search != 'string' && typeof searchId != 'string')
                    return res.status(400).json({ error: "Search query missing" })

                if (!process.env.SPOTIFY_API_CLIENT_ID || !process.env.SPOTIFY_API_CLIENT_SECRET)
                    return res.status(400).json({ error: "Spotify Credentials missing. Please add the environment variables to use this feature." })

                let savedItem: SavedItem | null = null;
                if (typeof search == 'string' && search.trim().startsWith('/library')) {
                    const plexMediaId = search.trim();

                    const settings = await plex.getSettings();

                    if (!settings.token || !settings.uri)
                        return res.status(400).json({ msg: "Plex not configured" });

                    const musicSearchConfig = await getMusicSearchConfig(settingsDir);

                    const plexConfig = {
                        uri: settings.uri,
                        token: settings.token,
                        musicSearchConfig
                    };

                    const metaData = await getById(plexConfig, plexMediaId)
                    if (metaData)
                        savedItem = { type: 'plex-media', uri: metaData.id, id: metaData.guid, title: metaData.title, image: `/api/plex/image?path=${encodeURIComponent(metaData.image)}` }
                } else {
                    let id = searchId || '';

                    if (search.indexOf('http') > -1) {
                        
                        const { path } = parse(search, true);
                        
                        if (!path) 
                            return res.status(400).json({ error: "Invalid URL" });

                        id = path.split("/").join(":");
                        id = `spotify${id}`;
                    } else if (search.split(":").length == 3) {
                        id = search;
                    } else {
                        return res.status(400).json({ error: "Invalid Spotify URI, expecting spotify:playlist:id" });
                    }

                    const api = SpotifyApi.withClientCredentials(process.env.SPOTIFY_API_CLIENT_ID, process.env.SPOTIFY_API_CLIENT_SECRET);
                    const data = await getSpotifyData(api, id)
                    console.log(data)
                    if (!data)
                        return res.status(400).json({ error: "No datas found, it might be a private playlist" })

                    const { type, id: resultId, title: name, image } = data;
                    savedItem = { type, uri: id, id: resultId, title: name, image }
                    if (typeof user_id == 'string')
                        savedItem.user = user_id;

                    if (typeof label == 'string')
                        savedItem.label = label;

                }

                if (!savedItem)
                    return res.status(400).json({ error: "Could not find data to save" })

                const savedItemsPath = join(settingsDir, 'spotify_saved_items.json')
                if (existsSync(savedItemsPath)) {

                    const savedItems: SavedItem[] = JSON.parse(readFileSync(savedItemsPath, 'utf8'))
                    if (savedItems.some(item => item.id == savedItem.id))
                        return res.status(400).json({ error: `${savedItem.title} (spotify id: ${savedItem.id}) is already added.` })

                    savedItems.push(savedItem)
                    writeFileSync(savedItemsPath, JSON.stringify(savedItems, undefined, 4))
                } else {
                    writeFileSync(savedItemsPath, JSON.stringify([savedItem], undefined, 4))
                }

                const savedItems: SavedItem[] = JSON.parse(readFileSync(savedItemsPath, 'utf8'))

                return res.status(200).json(savedItems.reverse())
            } catch {
                res.status(500).json({ error: 'Failed to save items' });
            }
        })
    .delete(
        async (req, res) => {

            const savedItemsPath = join(settingsDir, 'spotify_saved_items.json')
            if (!existsSync(savedItemsPath))
                return res.status(400).json({ error: `No items found` })

            const { id } = req.query
            if (typeof id != 'string')
                return res.status(400).json({ error: `ID expected but none found` })

            let savedItems: SavedItem[] = JSON.parse(readFileSync(savedItemsPath, 'utf8'))
            if (!savedItems.some(item => item.id == id))
                return res.status(400).json({ error: `Item not found` })


            // Change the imtes
            savedItems = savedItems.filter(item => item.id != id)
            writeFileSync(savedItemsPath, JSON.stringify(savedItems, undefined, 4))

            return res.status(200).json(savedItems.reverse())
        }
    )
    .put(
        async (req, res) => {

            const savedItemsPath = join(settingsDir, 'spotify_saved_items.json')
            if (!existsSync(savedItemsPath))
                return res.status(400).json({ error: `No items found` })

            const { ids, label, sync, sync_interval, title } = req.body
            if (!Array.isArray(ids))
                return res.status(400).json({ error: `Mutliple ids expected as an array` })

            const savedItems: SavedItem[] = JSON.parse(readFileSync(savedItemsPath, 'utf8'))

            for (let i = 0; i < ids.length; i++) {
                const saveItem = savedItems.find(item => item.id == ids[i])
                if (!saveItem)
                    return res.status(400).json({ error: `Item not found` })

                if (typeof sync == 'boolean' && typeof sync_interval == 'string') {
                    saveItem.sync = sync
                    saveItem.sync_interval = sync_interval
                }

                if (typeof label == 'string')
                    saveItem.label = label;

                if (typeof title == 'string')
                    saveItem.title = title;
            }

            // Change the imtes
            writeFileSync(savedItemsPath, JSON.stringify(savedItems, undefined, 4))

            return res.status(200).json(savedItems.reverse())
        }
    )

export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        generateError(req, res, "Spotify import", err);
    },
});


