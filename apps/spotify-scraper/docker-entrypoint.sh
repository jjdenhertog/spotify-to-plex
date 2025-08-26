#!/bin/bash
set -e

# Wait for any dependencies if needed
echo "Starting Spotify Scraper Service..."

# Run database migrations or setup if needed
# python3 setup.py || true

# Start the FastAPI application
exec python3 main.py