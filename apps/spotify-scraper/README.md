# Spotify Scraper Service

A Python Flask API service for scraping Spotify playlist data with data transformation to match the GetSpotifyPlaylist interface.

## Features

- REST API endpoint for playlist scraping
- Data transformation to standardized format
- Docker support for easy deployment
- Health check endpoint
- CORS enabled
- Comprehensive error handling
- Logging and monitoring

## API Endpoints

### POST /playlist

Scrape Spotify playlist data.

**Request:**
```json
{
  "url": "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M"
}
```

**Response:**
```json
{
  "type": "spotify-playlist",
  "id": "37i9dQZF1DXcBWIGoYBM5M",
  "title": "Today's Top Hits",
  "owner": "Spotify",
  "image": "",
  "tracks": [
    {
      "id": "track_id",
      "name": "Song Name",
      "artists": ["Artist 1", "Artist 2"],
      "album": "Album Name",
      "duration": 180,
      "popularity": 85,
      "preview_url": "https://...",
      "external_urls": {...},
      "explicit": false
    }
  ],
  "total_tracks": 50,
  "public": true,
  "collaborative": false,
  "description": "Playlist description",
  "followers": 1000000,
  "external_urls": {...},
  "href": "...",
  "uri": "..."
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "spotify-scraper"
}
```

## Quick Start

### Using Docker Compose (Recommended)

1. **Clone and navigate to the service directory:**
   ```bash
   cd apps/spotify-scraper
   ```

2. **Start the service:**
   ```bash
   docker-compose up -d
   ```

3. **Test the service:**
   ```bash
   curl -X POST http://localhost:5000/playlist \
     -H "Content-Type: application/json" \
     -d '{"url": "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M"}'
   ```

### Local Development

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the service:**
   ```bash
   python app.py
   ```

3. **The service will be available at:**
   ```
   http://localhost:5000
   ```

## Configuration

Environment variables:

- `PORT`: Server port (default: 5000)
- `DEBUG`: Debug mode (default: false)
- `FLASK_APP`: Flask application entry point
- `FLASK_ENV`: Flask environment (development/production)

## Development

### Project Structure

```
apps/spotify-scraper/
├── app.py                      # Flask application and API endpoints
├── spotify_scraper_service.py  # Core scraping and transformation logic
├── requirements.txt            # Python dependencies
├── docker-compose.yml          # Docker Compose configuration
├── Dockerfile                  # Docker image configuration
└── README.md                   # This file
```

### Running Tests

```bash
# Install test dependencies
pip install pytest pytest-flask

# Run tests
pytest
```

### Code Quality

The service follows these principles:

- **Error Handling**: Comprehensive validation and error responses
- **Logging**: Structured logging for debugging and monitoring  
- **Security**: Input validation and sanitization
- **Performance**: Efficient data transformation
- **Standards**: REST API best practices

## Data Transformation

The service transforms raw Spotify API data to match the GetSpotifyPlaylist interface:

- `type`: Always set to "spotify-playlist"
- `id`: Extracted from the playlist URL
- `title`: Mapped from `name` field
- `owner`: Mapped from `owner.display_name`
- `image`: Set to empty string as required
- `tracks`: Array transformation with proper field mapping

## Error Handling

The API returns appropriate HTTP status codes:

- `200`: Success
- `400`: Bad request (invalid URL, missing fields)
- `404`: Endpoint not found
- `500`: Internal server error

## Logging

The service uses Python's logging module with INFO level by default. Logs include:

- Request processing
- Playlist scraping progress
- Error details
- Performance metrics

## Health Monitoring

The service includes:

- Health check endpoint (`/health`)
- Docker health checks
- Startup validation
- Error tracking

## Dependencies

- **Flask**: Web framework
- **flask-cors**: CORS support
- **SpotifyScraper**: Spotify playlist scraping
- **requests**: HTTP client
- **python-dotenv**: Environment configuration

## Docker Support

The service includes full Docker support:

- **Multi-stage builds** for optimized images
- **Health checks** for container monitoring
- **Non-root user** for security
- **Volume mounting** for development

## Production Deployment

For production deployment:

1. **Set environment variables:**
   ```bash
   export DEBUG=false
   export PORT=5000
   ```

2. **Use production WSGI server:**
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:5000 app:app
   ```

3. **Configure reverse proxy** (nginx, Apache, etc.)

4. **Set up monitoring** and logging aggregation

## License

This service is part of the larger project and follows the same licensing terms.