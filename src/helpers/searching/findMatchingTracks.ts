import { GetDiscoverySearchResponse } from '../plex/doDiscoverSearch';
import { GetHubSearchResponse } from '../plex/doHubSearch';
import { compareTitles } from './compareTitles';

export type GetMatchingTrackResponse = {
    guid: string;
    key: string;
    source?: string;
    artist: {
        title: string;
        guid?: string;
        key?: string;
        image?: string;
    };
    album?: {
        title: string;
        key?: string;
        guid?: string;
        image?: string;
    };
    title: string;
    image: string;
    matching: {
        album: { match: boolean, contains: boolean, similarity: number },
        title: { match: boolean, contains: boolean, similarity: number },
        artist: { match: boolean, contains: boolean, similarity: number },
        artistInTitle: { match: boolean, contains: boolean, similarity: number },
        artistWithTitle: { match: boolean, contains: boolean, similarity: number },
        alternativeArtist: { match: boolean, contains: boolean, similarity: number },
    }
}

export function findMatchingTracks(items: (GetHubSearchResponse | GetDiscoverySearchResponse)[], artist: string, track: string, album: string): GetMatchingTrackResponse[] {
    const foundTracks = items
        .filter(item => item.type == "track")
        .map(item => {
            if (item.type != "track")
                return null;

            const result = {
                guid: item.guid,
                key: item.key,
                artist: item.artist,
                album: item.type == 'track' ? item.album : undefined,
                title: item.title,
                image: item.image,
                source: item.source,
                matching: {
                    album: compareTitles(item.album.title, album, true),
                    title: compareTitles(item.title, track, true),
                    artistInTitle: compareTitles(item.title, `${artist}`),
                    artistWithTitle: compareTitles(item.title, `${artist} ${track}`, true),
                    artist: compareTitles(item.artist.title, artist, true),
                    alternativeArtist: compareTitles(item.artist.alternative_title, artist, true),
                }
            };
            return result;
        })

    // @ts-expect-error
    return foundTracks
}