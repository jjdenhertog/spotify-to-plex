from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Spotify Scraper Service",
    description="A microservice for Spotify data scraping and processing",
    version="1.0.0"
)

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str

class SpotifyTrackRequest(BaseModel):
    query: str
    limit: Optional[int] = 10

class SpotifyTrackResponse(BaseModel):
    tracks: List[Dict[str, Any]]
    total: int

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        service="spotify-scraper",
        version="1.0.0"
    )

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Spotify Scraper Service", "version": "1.0.0"}

@app.post("/search/tracks", response_model=SpotifyTrackResponse)
async def search_tracks(request: SpotifyTrackRequest):
    """
    Search for Spotify tracks
    This is a placeholder implementation - replace with actual Spotify API integration
    """
    try:
        # Placeholder response - implement actual Spotify search logic
        mock_tracks = [
            {
                "id": f"track_{i}",
                "name": f"Track {i}",
                "artist": f"Artist {i}",
                "album": f"Album {i}",
                "duration_ms": 180000,
                "popularity": 75
            }
            for i in range(min(request.limit, 5))
        ]
        
        return SpotifyTrackResponse(
            tracks=mock_tracks,
            total=len(mock_tracks)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@app.get("/scrape/playlist/{playlist_id}")
async def scrape_playlist(playlist_id: str):
    """
    Scrape playlist data
    Placeholder for actual playlist scraping implementation
    """
    try:
        # Placeholder implementation
        return {
            "playlist_id": playlist_id,
            "name": f"Playlist {playlist_id}",
            "tracks_count": 25,
            "status": "scraped"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scraping failed: {str(e)}")

@app.get("/metrics")
async def get_metrics():
    """Service metrics endpoint"""
    return {
        "service": "spotify-scraper",
        "uptime": "active",
        "requests_processed": 0,
        "memory_usage": "low"
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 3020))
    host = os.getenv("HOST", "0.0.0.0")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True
    )