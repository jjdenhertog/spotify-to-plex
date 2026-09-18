#!/usr/bin/env python3
"""
Spotify Scraper Flask API Service
Provides REST endpoint for scraping Spotify playlist data
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import os
from spotify_scraper_service import SpotifyScraperService

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Initialize the scraper service
scraper_service = SpotifyScraperService()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "spotify-scraper"}), 200

@app.route('/playlist', methods=['POST'])
def scrape_playlist():
    """
    Scrape Spotify playlist data
    
    Expected payload:
    {
        "url": "spotify_playlist_url",
        "include_album_data": true,  # Optional, defaults to true
        "max_tracks": null  # Optional, null (default) fetches all tracks
    }
    
    Returns raw JSON data from SpotifyScraper with optional album enrichment
    """
    try:
        # Validate request
        if not request.is_json:
            return jsonify({"error": "Content-Type must be application/json"}), 400
        
        data = request.get_json()
        
        if not data or 'url' not in data:
            return jsonify({"error": "Missing required field: url"}), 400
        
        playlist_url = data['url'].strip()
        
        if not playlist_url:
            return jsonify({"error": "URL cannot be empty"}), 400
        
        # Validate Spotify URL format
        if not scraper_service.is_valid_spotify_url(playlist_url):
            return jsonify({"error": "Invalid Spotify playlist URL format"}), 400
        
        # Get optional include_album_data parameter (defaults to True for backwards compatibility)
        include_album_data = data.get('include_album_data', True)

        # Optional max_tracks: null/omitted fetches the full playlist,
        # a positive int caps it (keeps the add-validation call fast).
        max_tracks = data.get('max_tracks', data.get('maxTracks', None))
        if max_tracks is not None:
            try:
                max_tracks = int(max_tracks)
            except (TypeError, ValueError):
                return jsonify({"error": "max_tracks must be a positive integer or null"}), 400
            if max_tracks <= 0:
                return jsonify({"error": "max_tracks must be a positive integer or null"}), 400

        logger.info(f"Scraping playlist: {playlist_url} (include_album_data={include_album_data}, max_tracks={max_tracks})")

        # Scrape playlist data with optional album enrichment
        playlist_data = scraper_service.scrape_playlist(playlist_url, include_album_data=include_album_data, max_tracks=max_tracks)
        
        logger.info(f"Successfully scraped playlist: {playlist_data.get('name', 'Unknown')}")
        
        return jsonify(playlist_data), 200
        
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return jsonify({"error": str(e)}), 400
    
    except Exception as e:
        logger.error(f"Error scraping playlist: {str(e)}")
        return jsonify({"error": "Failed to scrape playlist"}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3020))
    debug = os.environ.get('DEBUG', 'false').lower() == 'true'
    
    logger.info(f"Starting Spotify Scraper API on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)