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

## Tidal fallback for missing tracks

`POST /api/plex/tracks` searches your Plex library for a list of tracks. Add `"tidal": true` to the body and every track Plex can't find is looked up on Tidal in the same request, so a caller can show what is missing and what would be downloaded. Without the flag the endpoint responds exactly as before.

**Request:**
```json
{
    "tidal": true,
    "items": [
        { "id": "spotify-id-or-any-string", "artists": ["Faithless", "Sister Bliss"], "title": "Insomnia", "album": "Reverence", "duration_ms": 522000 }
    ]
}
```

Each item needs an `id` (any unique string, it doesn't have to be a Spotify id), `artists` and `title`. `album` and `duration_ms` improve the match.

**Response:** the usual search rows, each with a `status`:

```json
[
    { "id": "a", "artist": "Plex Artist", "title": "In Plex", "album": "", "result": [{ "id": "1234", "title": "In Plex" }], "status": "plex" },
    {
        "id": "b", "artist": "Faithless", "title": "Insomnia", "album": "Reverence", "duration_ms": 522000, "result": [],
        "status": "tidal",
        "tidal_ids": ["77", "78"],
        "tidal_album_id": "123",
        "tidal_match": { "artist": "Faithless, Sister Bliss", "title": "Insomnia", "album": "Reverence", "duration_ms": 522000 }
    },
    { "id": "c", "artist": "Nobody", "title": "Nowhere", "album": "", "result": [], "status": "none", "tidal_ids": [] },
    { "id": "d", "artist": "Someone", "title": "Something", "album": "", "result": [], "status": "none", "tidal_ids": [], "tidal_error": "unconfigured" }
]
```

| Field | Meaning |
|-------|---------|
| `status` | `plex` (found in Plex), `tidal` (missing in Plex, found on Tidal) or `none` |
| `tidal_ids` | Tidal track ids, best match first |
| `tidal_album_id` | Album of the best Tidal match |
| `tidal_match` | Artist, title, album and duration of the best Tidal match, to show what would be downloaded |
| `tidal_error` | `unconfigured` when the Tidal credentials are missing, `failed` when the Tidal lookup failed. Plex results are returned either way |

How it works:

- It uses the same lookup as the synchronization: cached Tidal links first, a Tidal search for the rest. Matches are cached under the item `id`, misses are not, so they are searched again next time.
- Tidal uses the same search approaches as the Plex search (only the first one with `"fast": true`), every artist on its own and all artists joined, the title after text processing, and the album to rank and filter the results (the album is not part of the search query). The duration isn't used for Tidal matching.
- A track that comes from the cache only has its ids stored, so its `tidal_match` and `tidal_album_id` are fetched from Tidal and left out if that fails.
- Only for the track search: with `"type": "spotify-album"` the flag is ignored.

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
