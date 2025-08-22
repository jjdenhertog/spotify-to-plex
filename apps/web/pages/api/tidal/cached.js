import { generateError } from '@/helpers/errors/generateError';
import getCachedTrackLinks from '@/helpers/getCachedTrackLink';
import { createRouter } from 'next-connect';
const router = createRouter()
    .post(async (req, res) => {
    const searchItems = req.body.items;
    if (!Array.isArray(searchItems))
        throw new Error(`Array of items expected, none found`);
    //////////////////////////////////////
    // Handeling cached links
    //////////////////////////////////////
    const { found: cachedTrackLinks } = getCachedTrackLinks(searchItems, 'tidal');
    const result = [];
    for (let i = 0; i < searchItems.length; i++) {
        const searchItem = searchItems[i];
        // Process if no cached link has been found
        const trackLink = cachedTrackLinks.find(item => item.spotify_id == searchItem.id);
        const tidalIds = trackLink?.tidal_id;
        if (!tidalIds || tidalIds.length == 0)
            continue;
        result.push({
            id: searchItem.id,
            title: searchItem.title,
            artist: searchItem.artists[0],
            album: searchItem.album || "",
            tidal_ids: tidalIds,
        });
    }
    return res.status(200).json(result);
});
export default router.handler({
    onError: (err, req, res) => {
        generateError(req, res, "Tidal Tracks", err);
    },
});
//# sourceMappingURL=cached.js.map