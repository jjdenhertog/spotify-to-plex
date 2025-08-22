import { Track } from "@spotify-to-plex/music-search";
import { TidalTrack } from "../types";

export default function searchResultToTracks(items: TidalTrack[]): Track[] {

    const tracks: Track[] = []

    for (let i = 0; i < items.length; i++) {
        const item = items[i];

        for (let j = 0; j < item.artists.length; j++) {
            const artist = item.artists[j];
            tracks.push({
                id: item.id,
                artist: artist.name,
                title: item.title,
                album: item.album?.title || ""
            })
        }
    }

    return tracks;
}