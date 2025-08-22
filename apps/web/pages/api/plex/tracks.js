import { generateError } from '@/helpers/errors/generateError';
import getCachedTrackLinks from '@/helpers/getCachedTrackLink';
import { plex } from '@/library/plex';
import { PlexMusicSearch } from '@spotify-to-plex/plex-music-search';
import { createRouter } from 'next-connect';
const router = createRouter()
    .post(async (req, res) => {
    const searchItems = req.body.items;
    const { type = 'spotify-playlist', fast = false, album } = req.body;
    if (!searchItems || searchItems.length == 0)
        return res.status(400).json({ msg: "No items given" });
    if (!plex.settings.token || !plex.settings.uri)
        return res.status(400).json({ msg: "Plex not configured" });
    //////////////////////////////////////
    // Initiate the plexMusicSearch
    //////////////////////////////////////
    const plexMusicSearch = new PlexMusicSearch({
        uri: plex.settings.uri,
        token: plex.settings.token,
        searchApproaches: fast ? [
            { id: 'fast', filtered: true }
        ] : undefined
    });
    let searchResult = [];
    switch (type) {
        case "spotify-album":
            searchResult = await plexMusicSearch.searchAlbum(searchItems);
            break;
        default:
            searchResult = await plexMusicSearch.search(searchItems);
            break;
    }
    ///////////////////////////
    // Update track links
    ///////////////////////////
    const { add } = getCachedTrackLinks(searchItems, 'plex');
    add(searchResult, 'plex', album ? { id: album } : undefined);
    res.status(200).json(searchResult);
});
export default router.handler({
    onError: (err, req, res) => {
        generateError(req, res, "Songs", err);
    }
});
//# sourceMappingURL=tracks.js.map