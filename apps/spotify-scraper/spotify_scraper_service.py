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
    
    def scrape_playlist(self, url: str) -> Dict[str, Any]:
        """
        Scrape Spotify playlist - returns raw data from SpotifyScraper
        
        Args:
            url: Spotify playlist URL
            
        Returns:
            Raw JSON data from SpotifyScraper.get_playlist_info()
        """
        try:
            # Call SpotifyScraper directly and return raw result
            raw_data = self.scraper.get_playlist_info(url)
            
            if not raw_data:
                raise ValueError("Failed to scrape playlist data")
            
            logger.info(f"Successfully scraped playlist data")
            
            # Return raw data without transformation
            return raw_data
            
        except Exception as e:
            logger.error(f"Error scraping playlist: {str(e)}")
            raise ValueError(f"Failed to scrape playlist: {str(e)}")