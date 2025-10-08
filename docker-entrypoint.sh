#!/bin/bash
set -e

echo "🎵 Spotify-to-Plex Starting..."
echo "=============================="

# Ensure config directory has correct permissions
if [ ! -w /app/config ]; then
    echo "⚠️  Warning: /app/config is not writable. Trying to fix permissions..."
    chmod 755 /app/config || true
fi

# Set default PORT if not provided
export PORT="${PORT:-9030}"

# Display configuration
echo "✅ Web UI Port: $PORT"
echo "✅ Config Directory: /app/config"
if [ -n "$SPOTIFY_API_CLIENT_ID" ]; then
    echo "✅ Spotify API configured"
fi
if [ -n "$TIDAL_API_CLIENT_ID" ]; then
    echo "✅ Tidal API configured"
fi

# Start supervisor
echo "🚀 Starting services..."
exec "$@"