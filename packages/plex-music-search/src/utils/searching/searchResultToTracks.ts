import { Track } from "@spotify-to-plex/music-search/types/Track";
import { HubSearchResult } from "../../types/actions/HubSearchResult";

export default function searchResultToTracks(items: HubSearchResult[]): Track[] {

    return items
        .filter(item => item.type != 'album')
        .map(item => ({
            id: item.id,
            artist: item.artist.title,
            title: item.title,
            album: item.album.title
        }))
}