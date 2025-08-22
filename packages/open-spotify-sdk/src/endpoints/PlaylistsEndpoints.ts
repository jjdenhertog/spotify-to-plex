import getRequestHash from '../authentication/getRequestHash';
import getId from '../serialization/getId';
import { Image, MaxInt, Playlist, SimplifiedAlbum } from './../types';
import EndpointsBase from './EndpointsBase';

export default class PlaylistsEndpoints extends EndpointsBase {

    public async getFull(uri: string) {
        let offset = 0;
        const playlist = await this.get(uri, offset, 100)

        // Check if more tracks can be loaded
        let hasMoreResults = playlist.tracks.offset + playlist.tracks.limit < playlist.tracks.total;
        while (hasMoreResults) {

            offset += 100;
            const result = await this.get(uri, offset, 100)

            // Append tracks
            playlist.tracks.items = playlist.tracks.items.concat(result.tracks.items)
            hasMoreResults = result.tracks.offset + result.tracks.limit < result.tracks.total;
        }

        return playlist;
    }

    public async get(uri: string, offset: number = 0, limit: MaxInt<100> = 100): Promise<Playlist> {

        if (uri.split(':').length != 3)
            throw new Error(`A playlist uri should be structured as "spotify:playlist:uid"`)

        const url = new URL(`https://api-partner.spotify.com/pathfinder/v1/query`);
        url.searchParams.append('operationName', 'fetchPlaylist')
        url.searchParams.append('variables', JSON.stringify({
            uri,
            offset,
            limit
        }))
        url.searchParams.append('extensions', JSON.stringify({
            persistedQuery: {
                version: 1,
                sha256Hash: getRequestHash('playlist')
            }
        }))

        const data = await this.getRequest<SpotifyPartnerPlaylistResponse>(url.toString())

        const { playlistV2 } = data.data;

        const images: Image[] = []
        playlistV2.images.items.forEach(item => {
            images.push(...item.sources)
        })

        const { content } = playlistV2
        const { pagingInfo, totalCount, items } = content;

        const { description, name, uri: playlistUri, sharingInfo, ownerV2 } = playlistV2;
        const { offset: pagingOffset, limit: pagingLimit } = pagingInfo;
        const { shareUrl } = sharingInfo;
        const { data: ownerData } = ownerV2;
        
        const result: Playlist = {
            id: getId(playlistUri),
            description,
            href: shareUrl,
            images,
            name,
            owner: ownerData,
            uri: playlistUri,
            tracks: {
                items: items.map(({ itemV2 }) => {

                    const { data } = itemV2;
                    const { albumOfTrack, artists: trackArtists, discNumber, trackNumber, trackDuration, name: trackName, uri: trackUri } = data;
                    const { uri: albumUri, name: albumName, coverArt, artists: albumArtists } = albumOfTrack;
                    const { totalMilliseconds } = trackDuration;
                    
                    const album: SimplifiedAlbum = {
                        id: getId(albumUri),
                        uri: albumUri,
                        name: albumName,
                        images: coverArt.sources,
                        artists: albumArtists.items.map(artist => ({ name: artist.profile.name, uri: artist.uri })),
                    }
                    const artists = trackArtists.items.map(artist => ({ name: artist.profile.name, uri: artist.uri }))

                    return {
                        id: getId(trackUri),
                        album,
                        artists,
                        discNumber,
                        trackNumber,
                        trackDuration: totalMilliseconds,
                        name: trackName,
                        uri: trackUri,
                    }
                }),
                offset: pagingOffset,
                limit: pagingLimit,
                total: totalCount
            }
        }

        return result;

    }
}


/**
 * Inferred typing
 */
type SpotifyPartnerPlaylistResponse = {
    data: {
        playlistV2: {
            __typename: "Playlist";
            content: {
                __typename: "PlaylistItemsPage";
                items: {
                    addedAt: {
                        isoString: string;
                    };
                    addedBy: null | string;
                    attributes: { key: string; value: string }[];
                    itemV2: {
                        __typename: "TrackResponseWrapper";
                        data: {
                            __typename: "Track";
                            albumOfTrack: {
                                artists: {
                                    items: { profile: { name: string }; uri: string }[];
                                };
                                coverArt: {
                                    sources: { height: number; url: string; width: number }[];
                                };
                                name: string;
                                uri: string;
                            };
                            artists: {
                                items: { profile: { name: string }; uri: string }[];
                            };
                            associationsV2: {
                                totalCount: number;
                            };
                            contentRating: {
                                label: string;
                            };
                            discNumber: number;
                            trackDuration: {
                                totalMilliseconds: number;
                            };
                            name: string;
                            playability: {
                                playable: boolean;
                                reason: "PLAYABLE";
                            };
                            playcount: string;
                            trackNumber: number;
                            uri: string;
                        };
                    };
                    uid: string;
                }[];
                pagingInfo: {
                    limit: number;
                    offset: number;
                };
                totalCount: number;
            };
            attributes: { key: string; value: string }[];
            basePermission: "VIEWER";
            description: string;
            followers: number;
            following: boolean;
            format: "format-shows-shuffle";
            images: {
                items: {
                    extractedColors: {
                        colorRaw: {
                            hex: string;
                            isFallback: boolean;
                        };
                    };
                    sources: { height: number; url: string; width: number }[];
                }[];
            };
            name: string;
            ownerV2: {
                data: {
                    __typename: "User";
                    avatar: {
                        sources: { height: number; url: string; width: number }[];
                    };
                    name: string;
                    uri: string;
                    username: string;
                };
            };
            revisionId: string;
            sharingInfo: {
                shareId: string;
                shareUrl: string;
            };
            uri: string;
        };
    };
    extensions: Record<string, unknown>;
}