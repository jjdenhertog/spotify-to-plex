#!/usr/bin/env python3
"""
Spotify Scraper Service Validation Tests
Tests the fallback implementation and data transformation
"""

import sys
import json
import traceback
from typing import Dict, Any, List
from urllib.parse import urlparse

# Mock SpotifyScraper class since we can't install external packages
class MockSpotifyScraper:
    """Mock implementation of SpotifyScraper for testing"""
    
    def get_playlist(self, playlist_id: str) -> Dict[str, Any]:
        """Mock playlist data that matches Spotify API structure"""
        return {
            "id": playlist_id,
            "name": "Test Playlist",
            "description": "Mock playlist for testing",
            "public": True,
            "collaborative": False,
            "owner": {
                "display_name": "Test User"
            },
            "followers": {"total": 100},
            "external_urls": {"spotify": f"https://open.spotify.com/playlist/{playlist_id}"},
            "href": f"https://api.spotify.com/v1/playlists/{playlist_id}",
            "uri": f"spotify:playlist:{playlist_id}",
            "tracks": {
                "items": [
                    {
                        "track": {
                            "id": "track123",
                            "name": "Test Song",
                            "duration_ms": 180000,
                            "popularity": 75,
                            "preview_url": "https://p.scdn.co/preview/track123",
                            "explicit": False,
                            "external_urls": {"spotify": "https://open.spotify.com/track/track123"},
                            "artists": [{"name": "Test Artist"}],
                            "album": {"name": "Test Album"}
                        }
                    },
                    {
                        "track": {
                            "id": "track456",
                            "name": "Another Song",
                            "duration_ms": 210000,
                            "popularity": 80,
                            "preview_url": None,
                            "explicit": True,
                            "external_urls": {"spotify": "https://open.spotify.com/track/track456"},
                            "artists": [{"name": "Another Artist"}, {"name": "Feat. Artist"}],
                            "album": {"name": "Another Album"}
                        }
                    }
                ]
            }
        }

# Mock the spotifyscraper module
class MockSpotifyScraperModule:
    SpotifyScraper = MockSpotifyScraper

sys.modules['spotifyscraper'] = MockSpotifyScraperModule()

# Now import our service
try:
    from spotify_scraper_service import SpotifyScraperService
except ImportError as e:
    print(f"❌ Failed to import SpotifyScraperService: {e}")
    sys.exit(1)

class SpotifyScraperValidator:
    """Validator for SpotifyScraper service functionality"""
    
    def __init__(self):
        self.service = SpotifyScraperService()
        self.test_results = []
    
    def run_test(self, test_name: str, test_func):
        """Run a test and record results"""
        try:
            print(f"🧪 Running test: {test_name}")
            result = test_func()
            self.test_results.append({"name": test_name, "status": "PASS", "details": result})
            print(f"✅ {test_name}: PASSED")
            return True
        except Exception as e:
            error_details = {
                "error": str(e),
                "traceback": traceback.format_exc()
            }
            self.test_results.append({"name": test_name, "status": "FAIL", "details": error_details})
            print(f"❌ {test_name}: FAILED - {e}")
            return False
    
    def test_service_initialization(self) -> Dict[str, Any]:
        """Test service initialization"""
        assert self.service is not None
        assert hasattr(self.service, 'scraper')
        return {"message": "Service initialized successfully"}
    
    def test_url_validation(self) -> Dict[str, Any]:
        """Test URL validation logic"""
        test_cases = [
            ("https://open.spotify.com/playlist/4uVxy6Q8dYH2lRRXzA1nLt", True),
            ("https://spotify.com/playlist/4uVxy6Q8dYH2lRRXzA1nLt", True),
            ("https://open.spotify.com/album/4uVxy6Q8dYH2lRRXzA1nLt", False),
            ("https://youtube.com/playlist/123", False),
            ("invalid-url", False),
            ("", False)
        ]
        
        results = []
        for url, expected in test_cases:
            actual = self.service.is_valid_spotify_url(url)
            assert actual == expected, f"URL validation failed for {url}: expected {expected}, got {actual}"
            results.append({"url": url, "expected": expected, "actual": actual})
        
        return {"test_cases": len(test_cases), "results": results}
    
    def test_playlist_id_extraction(self) -> Dict[str, Any]:
        """Test playlist ID extraction"""
        test_cases = [
            ("https://open.spotify.com/playlist/4uVxy6Q8dYH2lRRXzA1nLt", "4uVxy6Q8dYH2lRRXzA1nLt"),
            ("https://open.spotify.com/playlist/4uVxy6Q8dYH2lRRXzA1nLt?si=123", "4uVxy6Q8dYH2lRRXzA1nLt"),
            ("https://spotify.com/playlist/xyz123", "xyz123")
        ]
        
        results = []
        for url, expected in test_cases:
            actual = self.service.extract_playlist_id(url)
            assert actual == expected, f"ID extraction failed for {url}: expected {expected}, got {actual}"
            results.append({"url": url, "expected": expected, "actual": actual})
        
        return {"test_cases": len(test_cases), "results": results}
    
    def test_track_data_transformation(self) -> Dict[str, Any]:
        """Test track data transformation"""
        mock_track = {
            "id": "track123",
            "name": "Test Song",
            "duration_ms": 180000,
            "popularity": 75,
            "preview_url": "https://preview.url",
            "explicit": False,
            "external_urls": {"spotify": "https://open.spotify.com/track/track123"},
            "artists": [{"name": "Artist 1"}, {"name": "Artist 2"}],
            "album": {"name": "Test Album"}
        }
        
        transformed = self.service.transform_track_data(mock_track)
        
        # Validate transformation
        assert transformed["id"] == "track123"
        assert transformed["name"] == "Test Song"
        assert transformed["duration"] == 180  # Should be converted from ms to seconds
        assert transformed["artists"] == ["Artist 1", "Artist 2"]
        assert transformed["album"] == "Test Album"
        assert transformed["popularity"] == 75
        assert transformed["explicit"] == False
        
        return {"original": mock_track, "transformed": transformed}
    
    def test_playlist_scraping(self) -> Dict[str, Any]:
        """Test complete playlist scraping and transformation"""
        test_url = "https://open.spotify.com/playlist/test123"
        
        result = self.service.scrape_playlist(test_url)
        
        # Validate result structure
        required_fields = ["type", "id", "title", "owner", "image", "tracks", "total_tracks"]
        for field in required_fields:
            assert field in result, f"Missing required field: {field}"
        
        # Validate specific values
        assert result["type"] == "spotify-playlist"
        assert result["id"] == "test123"
        assert result["title"] == "Test Playlist"
        assert result["owner"] == "Test User"
        assert result["image"] == ""  # Should be empty string as required
        assert len(result["tracks"]) == 2
        assert result["total_tracks"] == 2
        
        # Validate track transformation
        track1 = result["tracks"][0]
        assert track1["id"] == "track123"
        assert track1["name"] == "Test Song"
        assert track1["duration"] == 180  # Converted from ms
        assert track1["artists"] == ["Test Artist"]
        
        return {"playlist_data": result, "tracks_count": len(result["tracks"])}
    
    def test_error_handling(self) -> Dict[str, Any]:
        """Test error handling scenarios"""
        test_cases = []
        
        # Test invalid URL format
        try:
            self.service.extract_playlist_id("invalid-url")
            assert False, "Should have raised ValueError"
        except ValueError:
            test_cases.append({"scenario": "invalid_url", "status": "handled"})
        
        # Test empty track data transformation
        empty_track = {}
        transformed_empty = self.service.transform_track_data(empty_track)
        assert transformed_empty["name"] == "Unknown"
        assert transformed_empty["artists"] == []
        test_cases.append({"scenario": "empty_track", "status": "handled"})
        
        return {"error_cases": test_cases}
    
    def run_all_tests(self):
        """Run all validation tests"""
        print("🚀 Starting SpotifyScraper Service Validation")
        print("=" * 50)
        
        tests = [
            ("Service Initialization", self.test_service_initialization),
            ("URL Validation", self.test_url_validation),
            ("Playlist ID Extraction", self.test_playlist_id_extraction),
            ("Track Data Transformation", self.test_track_data_transformation),
            ("Playlist Scraping", self.test_playlist_scraping),
            ("Error Handling", self.test_error_handling)
        ]
        
        passed = 0
        failed = 0
        
        for test_name, test_func in tests:
            if self.run_test(test_name, test_func):
                passed += 1
            else:
                failed += 1
        
        print("=" * 50)
        print(f"📊 Test Summary: {passed} passed, {failed} failed")
        
        if failed > 0:
            print("\n❌ Some tests failed. Details:")
            for result in self.test_results:
                if result["status"] == "FAIL":
                    print(f"  - {result['name']}: {result['details']['error']}")
        else:
            print("\n✅ All tests passed!")
        
        return {"passed": passed, "failed": failed, "results": self.test_results}

if __name__ == "__main__":
    validator = SpotifyScraperValidator()
    results = validator.run_all_tests()
    
    # Save detailed results
    with open("/var/tmp/vibe-kanban/worktrees/vk-d41b-implement/tests/validation-results.json", "w") as f:
        json.dump(results, f, indent=2)
    
    print(f"\n📄 Detailed results saved to validation-results.json")
    
    sys.exit(0 if results["failed"] == 0 else 1)