import { GetSpotifyPlaylist } from "@spotify-to-plex/shared-types";
// MIGRATED: Updated to use shared types package
import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import axios from "axios";


export default async function getSpotifyPlaylist(api: SpotifyApi, id: string, simplified: boolean): Promise<GetSpotifyPlaylist | undefined> {

    // const result: GetSpotifyPlaylist = {}
    // let allTracks: GetSpotifyPlaylist["tracks"] = []

    try {
        const result = await api.playlists.getPlaylist(id)
        const playlist: GetSpotifyPlaylist = {
            type: "spotify-playlist",
            id: result.id,
            title: result.name,
            owner: result.owner?.display_name || '',
            image: result.images?.[0]?.url || '',
            tracks: []
        }
        playlist.tracks = playlist.tracks.concat(result.tracks.items.map(item => {
            return {
                id: item.track.id,
                title: item.track.name,
                artist: item.track.artists?.[0]?.name || '',
                album: item.track.album?.name || '',
                artists: item.track.artists.map(item => item.name),
            }
        }));

        if (simplified)
            return playlist;

        let offset = 50;
        let hasMoreResults = result.tracks.offset + result.tracks.limit < result.tracks.total;
        const nextUrl = result.tracks.next

        if (nextUrl) {
            while (hasMoreResults) {
                const loadMore = await api.playlists.getPlaylistItems(id, undefined, undefined, 50, offset)
                playlist.tracks = playlist.tracks.concat(loadMore.items.map(item => {
                    return {
                        id: item.track.id,
                        title: item.track.name,
                        artist: item.track.artists?.[0]?.name || '',
                        album: item.track.album?.name || '',
                        artists: item.track.artists.map(item => item.name),
                    }
                }));

                hasMoreResults = loadMore.offset + loadMore.limit < loadMore.total;
                offset = loadMore.offset + loadMore.limit;
            }
        }

        return playlist;

    } catch (error) {
        console.warn('Spotify API failed, attempting SpotifyScraper fallback:', error);
        
        try {
            return await getSpotifyPlaylistFallback(id, simplified);
        } catch (fallbackError) {
            console.error('SpotifyScraper fallback also failed:', fallbackError);
            return undefined;
        }
    }
}

/**
 * Fallback function to get playlist data from SpotifyScraper service
 * when Spotify API fails
 */
async function getSpotifyPlaylistFallback(id: string, simplified: boolean): Promise<GetSpotifyPlaylist | undefined> {
    const spotifyScraperUrl = process.env.SPOTIFY_SCRAPER_URL;
    
    if (!spotifyScraperUrl) {
        console.warn('SPOTIFY_SCRAPER_URL not configured, skipping fallback');
        throw new Error('SpotifyScraper URL not configured');
    }

    // Convert playlist ID to full Spotify URL
    const spotifyUrl = `https://open.spotify.com/playlist/${id}`;
    
    try {
        console.log(`Attempting SpotifyScraper fallback for playlist: ${id}`);
        
        const response = await axios.post(`${spotifyScraperUrl}/api/scrape/playlist`, {
            url: spotifyUrl,
            simplified
        }, {
            timeout: 30000, // 30 second timeout for scraping
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.data || !response.data.success) {
            throw new Error('SpotifyScraper returned unsuccessful response');
        }

        const scraperData = response.data.data;
        
        // Transform SpotifyScraper response to match GetSpotifyPlaylist interface
        const playlist: GetSpotifyPlaylist = {
            type: "spotify-playlist",
            id: scraperData.id || id,
            title: scraperData.name || scraperData.title || 'Unknown Playlist',
            owner: scraperData.owner?.display_name || scraperData.owner || 'Unknown Owner',
            image: scraperData.images?.[0]?.url || scraperData.image || '',
            tracks: (scraperData.tracks?.items || scraperData.tracks || []).map((item: any) => {
                const track = item.track || item;
                return {
                    id: track.id || '',
                    title: track.name || track.title || 'Unknown Track',
                    artist: track.artists?.[0]?.name || track.artist || 'Unknown Artist',
                    album: track.album?.name || track.album || 'Unknown Album',
                    artists: track.artists?.map((artist: any) => artist.name || artist) || [track.artist || 'Unknown Artist'],
                };
            })
        };

        console.log(`SpotifyScraper fallback successful for playlist: ${id}, found ${playlist.tracks.length} tracks`);
        return playlist;
        
    } catch (error) {
        console.error('SpotifyScraper request failed:', error);
        throw error;
    }
}