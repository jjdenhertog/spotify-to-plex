#!/usr/bin/env python3
"""
Spotify Scraper Service
Handles Spotify playlist scraping and data transformation
"""

import re
import logging
from typing import Dict, List, Any, Optional
from urllib.parse import urlparse, parse_qs
from spotifyscraper import SpotifyScraper

logger = logging.getLogger(__name__)

class SpotifyScraperService:
    """Service for scraping Spotify playlists and transforming data"""
    
    def __init__(self):
        """Initialize the scraper service"""
        self.scraper = SpotifyScraper()
        logger.info("SpotifyScraperService initialized")
    
    def is_valid_spotify_url(self, url: str) -> bool:
        """
        Validate if the URL is a valid Spotify playlist URL
        
        Args:
            url: The URL to validate
            
        Returns:
            True if valid Spotify playlist URL, False otherwise
        """
        try:
            parsed = urlparse(url)
            
            # Check if it's a Spotify domain
            if parsed.netloc not in ['open.spotify.com', 'spotify.com']:
                return False
            
            # Check if it's a playlist URL
            path_parts = parsed.path.strip('/').split('/')
            if len(path_parts) >= 2 and path_parts[0] == 'playlist':
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error validating URL: {str(e)}")
            return False
    
    def extract_playlist_id(self, url: str) -> str:
        """
        Extract playlist ID from Spotify URL
        
        Args:
            url: Spotify playlist URL
            
        Returns:
            Playlist ID
            
        Raises:
            ValueError: If unable to extract playlist ID
        """
        try:
            parsed = urlparse(url)
            path_parts = parsed.path.strip('/').split('/')
            
            if len(path_parts) >= 2 and path_parts[0] == 'playlist':
                playlist_id = path_parts[1]
                # Remove any query parameters from the ID
                playlist_id = playlist_id.split('?')[0]
                return playlist_id
            
            raise ValueError("Unable to extract playlist ID from URL")
            
        except Exception as e:
            logger.error(f"Error extracting playlist ID: {str(e)}")
            raise ValueError(f"Invalid playlist URL format: {str(e)}")
    
    def transform_track_data(self, track: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transform raw track data to match required interface
        
        Args:
            track: Raw track data from SpotifyScraper
            
        Returns:
            Transformed track data
        """
        try:
            # Extract artists
            artists = []
            if 'artists' in track and isinstance(track['artists'], list):
                artists = [artist.get('name', '') for artist in track['artists'] if artist.get('name')]
            
            # Get album info
            album = track.get('album', {})
            album_name = album.get('name', '') if album else ''
            
            # Get duration (convert from ms to seconds if needed)
            duration = track.get('duration_ms', 0)
            if duration > 0:
                duration = duration // 1000  # Convert to seconds
            
            return {
                "id": track.get('id', ''),
                "name": track.get('name', ''),
                "artists": artists,
                "album": album_name,
                "duration": duration,
                "popularity": track.get('popularity', 0),
                "preview_url": track.get('preview_url', ''),
                "external_urls": track.get('external_urls', {}),
                "explicit": track.get('explicit', False)
            }
            
        except Exception as e:
            logger.error(f"Error transforming track data: {str(e)}")
            return {
                "id": track.get('id', ''),
                "name": track.get('name', 'Unknown'),
                "artists": [],
                "album": '',
                "duration": 0,
                "popularity": 0,
                "preview_url": '',
                "external_urls": {},
                "explicit": False
            }
    
    def scrape_playlist(self, url: str) -> Dict[str, Any]:
        """
        Scrape Spotify playlist and transform data
        
        Args:
            url: Spotify playlist URL
            
        Returns:
            Transformed playlist data matching GetSpotifyPlaylist interface
            
        Raises:
            ValueError: If scraping fails or data is invalid
        """
        try:
            # Extract playlist ID
            playlist_id = self.extract_playlist_id(url)
            logger.info(f"Extracted playlist ID: {playlist_id}")
            
            # Scrape playlist data
            raw_data = self.scraper.get_playlist(playlist_id)
            
            if not raw_data:
                raise ValueError("Failed to scrape playlist data")
            
            logger.info(f"Raw playlist data keys: {list(raw_data.keys())}")
            
            # Transform tracks
            tracks = []
            raw_tracks = raw_data.get('tracks', {})
            
            if isinstance(raw_tracks, dict) and 'items' in raw_tracks:
                track_items = raw_tracks['items']
            elif isinstance(raw_tracks, list):
                track_items = raw_tracks
            else:
                track_items = []
            
            for item in track_items:
                # Handle case where track might be nested under 'track' key
                track_data = item.get('track', item) if 'track' in item else item
                if track_data:
                    transformed_track = self.transform_track_data(track_data)
                    tracks.append(transformed_track)
            
            # Get owner information
            owner_info = raw_data.get('owner', {})
            owner_name = owner_info.get('display_name', '') if owner_info else ''
            
            # Transform playlist data to match interface
            transformed_data = {
                "type": "spotify-playlist",
                "id": playlist_id,
                "title": raw_data.get('name', ''),
                "owner": owner_name,
                "image": "",  # Set to empty string as required
                "tracks": tracks,
                "total_tracks": len(tracks),
                "public": raw_data.get('public', True),
                "collaborative": raw_data.get('collaborative', False),
                "description": raw_data.get('description', ''),
                "followers": raw_data.get('followers', {}).get('total', 0),
                "external_urls": raw_data.get('external_urls', {}),
                "href": raw_data.get('href', ''),
                "uri": raw_data.get('uri', '')
            }
            
            logger.info(f"Successfully transformed playlist data: {transformed_data['title']} ({len(tracks)} tracks)")
            
            return transformed_data
            
        except Exception as e:
            logger.error(f"Error scraping playlist: {str(e)}")
            raise ValueError(f"Failed to scrape playlist: {str(e)}")