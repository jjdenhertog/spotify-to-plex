---
title: Tidal
parent: Integrations
nav_order: 3
---

# Tidal Integration

With Tidal credentials configured, you can match missing songs with Tidal to find alternatives or verify track availability.

---

## Prerequisites

Register at the [Tidal Developer Portal](https://developer.tidal.com/) to get your credentials.

{: .note }
Only client credentials (Client ID and Secret) are needed - no OAuth flow required.

---

## Configuration

Add the environment variables to your Docker configuration:

**Docker:**
```sh
-e TIDAL_API_CLIENT_ID=YOUR_TIDAL_CLIENT_ID
-e TIDAL_API_CLIENT_SECRET=YOUR_TIDAL_CLIENT_SECRET
```

**Docker Compose / Portainer:**
```yaml
environment:
    - TIDAL_API_CLIENT_ID=YOUR_TIDAL_CLIENT_ID
    - TIDAL_API_CLIENT_SECRET=YOUR_TIDAL_CLIENT_SECRET
```

---

## Usage

Once configured, you can:

1. **Match with Tidal** - View missing tracks and match them with Tidal equivalents
2. **Export Tidal links** - Generate `missing_tracks_tidal.txt` with Tidal links for missing songs
3. **Verify availability** - Check if tracks are available on Tidal before downloading

---

## How It Works

When you view missing tracks, the app can search Tidal for matching songs. This helps you:

- Find the correct track on Tidal for manual download
- Verify the song exists and is available
- Get Tidal links for use with other tools

---

## Missing Tracks Files

The synchronization process generates:

| File | Contents |
|------|----------|
| `missing_tracks_spotify.txt` | Spotify links for missing tracks |
| `missing_tracks_tidal.txt` | Tidal links for missing tracks |
| `missing_albums_tidal.txt` | Tidal links for missing albums |

These files are saved in your storage folder (`/app/config`).

---

## Tidal Downloader (Companion Project)

To automatically download missing tracks from Tidal, you can use the companion project:

**[spotify-to-plex-tidal-downloader](https://github.com/jjdenhertog/spotify-to-plex-tidal-downloader)**

This Docker container:
- Reads `missing_tracks_tidal.txt` and `missing_albums_tidal.txt` from your config folder
- Automatically downloads tracks using [Tiddl](https://github.com/oskvr37/tiddl)
- Runs on a configurable schedule (default: daily at 15:00)

### Quick Setup

```yaml
services:
    spotify-to-plex-tidal-downloader:
        container_name: spotify-to-plex-tidal-downloader
        restart: unless-stopped
        volumes:
            - '/path/to/spotify-to-plex/config:/app/config'
            - '/path/to/music/library:/app/download'
            - '/path/to/tiddl-config:/root/.tiddl'
        environment:
            - TZ=UTC
            - CRON_SCHEDULE=0 15 * * *
        image: 'jjdenhertog/spotify-to-plex-tidal-downloader:latest'
```

{: .important }
Bind `/app/config` to the **same volume** as Spotify to Plex for seamless integration.

{: .warning }
**Disclaimer**: Requires a Tidal HiFi subscription. For private use only. See the [full disclaimer](https://github.com/jjdenhertog/spotify-to-plex-tidal-downloader#disclaimer).
