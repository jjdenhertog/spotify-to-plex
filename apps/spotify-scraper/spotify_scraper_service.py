#!/usr/bin/env python3
"""
Spotify Scraper Service - Simplified Pass-through
"""

import logging
from typing import Dict, Any
from urllib.parse import urlparse
from spotify_scraper import SpotifyClient

logger = logging.getLogger(__name__)

class SpotifyScraperService:
    """Minimal service for Spotify playlist scraping"""
    
    def __init__(self):
        self.scraper = SpotifyClient()
        logger.info("SpotifyScraperService initialized")
    
    def is_valid_spotify_url(self, url: str) -> bool:
        """Validate Spotify playlist URL"""
        try:
            parsed = urlparse(url)
            if parsed.netloc not in ['open.spotify.com', 'spotify.com']:
                return False
            path_parts = parsed.path.strip('/').split('/')
            return len(path_parts) >= 2 and path_parts[0] == 'playlist'
        except Exception:
            return False
    
    def scrape_playlist(self, url: str, include_album_data: bool = True) -> Dict[str, Any]:
        """
        Scrape Spotify playlist with optional complete album data
        
        Args:
            url: Spotify playlist URL
            include_album_data: If True, fetches complete album data for each track
                              If False, returns basic playlist data (faster)
            
        Returns:
            Dict containing playlist data with complete track and album information
        """
        try:
            # Get basic playlist data first (fast, 1 request)
            raw_data = self.scraper.get_playlist_info(url)
            
            if not raw_data:
                raise ValueError("Failed to scrape playlist data")
            
            logger.info(f"Successfully scraped playlist: {raw_data.get('name', 'Unknown')}")
            
            # If album data not needed, return basic data
            if not include_album_data:
                logger.info("Returning basic playlist data (no album info)")
                return raw_data
            
            # Check if tracks exist in the playlist
            tracks = raw_data.get('tracks', [])
            if not tracks:
                logger.warning("No tracks found in playlist")
                return raw_data
            
            logger.info(f"Enriching {len(tracks)} tracks with complete album data...")
            
            # Counter for successfully enriched tracks
            enriched_count = 0
            failed_count = 0
            
            # Process each track individually to avoid rate limiting
            for i, track in enumerate(tracks):
                try:
                    # Extract track URI from basic track data
                    track_uri = track.get('uri')
                    if not track_uri:
                        logger.debug(f"Track {i} missing URI, skipping enrichment")
                        continue
                    
                    # Get complete track information with album data
                    complete_track = self.scraper.get_track_info(track_uri)
                    
                    if complete_track:
                        # Merge complete track data into the existing track object
                        # Preserve original fields and add new album information
                        
                        # Update basic fields if available in complete data
                        if 'name' in complete_track:
                            track['name'] = complete_track['name']
                        if 'duration_ms' in complete_track:
                            track['duration_ms'] = complete_track['duration_ms']
                        
                        # Add artist information if more detailed
                        if 'artists' in complete_track:
                            track['artists'] = complete_track['artists']
                        
                        # Add complete album information
                        if 'album' in complete_track:
                            track['album'] = complete_track['album']
                        
                        # Add any additional fields from complete track data
                        if 'preview_url' in complete_track:
                            track['preview_url'] = complete_track['preview_url']
                        if 'id' in complete_track:
                            track['id'] = complete_track['id']
                        if 'popularity' in complete_track:
                            track['popularity'] = complete_track['popularity']
                        if 'explicit' in complete_track:
                            track['explicit'] = complete_track['explicit']
                        
                        enriched_count += 1
                        logger.debug(f"Successfully enriched track {i+1}/{len(tracks)}: {track.get('name', 'Unknown')}")
                    else:
                        # Keep original basic track data if enrichment fails
                        failed_count += 1
                        logger.warning(f"Failed to get complete data for track {i+1}, keeping basic data")
                        
                except Exception as track_error:
                    # Log error but continue with basic track data
                    failed_count += 1
                    logger.warning(f"Error enriching track {i+1}: {str(track_error)}, keeping basic data")
                    continue
            
            # Log enrichment summary
            logger.info(f"Track enrichment complete - Success: {enriched_count}, Failed: {failed_count}, Total: {len(tracks)}")
            
            # Return the enhanced playlist data
            return raw_data
            
        except Exception as e:
            logger.error(f"Error scraping playlist: {str(e)}")
            raise ValueError(f"Failed to scrape playlist: {str(e)}")