---
title: Installation
nav_order: 2
---

# Installation

Install the Spotify-to-Plex app using a Docker container. Once up and running you will find the instance at `http://[ipaddress]:9030`. You can change the port number by setting the `PORT` environment variable.

---

## Prerequisites

Before you begin, you'll need:

### 1. Encryption Key (required for Spotify user integration)

```bash
openssl rand -hex 32
```

### 2. Spotify API Credentials

Get them from the [Spotify Developer site](https://developer.spotify.com/). See the [Spotify App Configuration](spotify/app-setup) guide for detailed instructions.

### 3. Tidal API Credentials (optional)

For matching missing songs with Tidal:
- Register at the [Tidal Developer Portal](https://developer.tidal.com/)
- Only client credentials (Client ID and Secret) are needed - no OAuth flow required

### 4. Lidarr API Key (optional)

For automatic album downloads:
- Find it in Lidarr under Settings → General → Security → API Key

### 5. SLSKD API Key (optional)

For P2P downloads from Soulseek:
- Generate using: `openssl rand -base64 48`
- Configure in your SLSKD instance's `slskd.yml` file

---

## Docker Installation

```sh
docker run -d \
    -e PORT=9030 \
    -e SPOTIFY_API_CLIENT_ID=YOUR_CLIENT_ID \
    -e SPOTIFY_API_CLIENT_SECRET=YOUR_CLIENT_SECRET \
    -e SPOTIFY_API_REDIRECT_URI=https://jjdenhertog.github.io/spotify-to-plex/callback.html \
    -e ENCRYPTION_KEY=YOUR_ENCRYPTION_KEY \
    -e PLEX_APP_ID=eXf+f9ktw3CZ8i45OY468WxriOCtoFxuNPzVeDcAwfw= \
    -v /local/directory/:/app/config:rw \
    --name=spotify-to-plex \
    --network=host \
    --restart on-failure:4 \
    jjdenhertog/spotify-to-plex
```

{: .note }
All data is stored in `/app/config` - make sure to mount this as a volume for persistent storage.

### Optional Environment Variables

```sh
    -e TIDAL_API_CLIENT_ID=YOUR_TIDAL_CLIENT_ID \
    -e TIDAL_API_CLIENT_SECRET=YOUR_TIDAL_CLIENT_SECRET \
    -e LIDARR_API_KEY=YOUR_LIDARR_API_KEY \
    -e SLSKD_API_KEY=YOUR_SLSKD_API_KEY \
```

---

## Portainer Installation

Create a new stack with the following configuration:

```yaml
services:
    spotify-to-plex:
        container_name: spotify-to-plex
        restart: unless-stopped
        volumes:
            - '/local/directory:/app/config'
        environment:
            - PORT=9030
            - SPOTIFY_API_CLIENT_ID=YOUR_CLIENT_ID
            - SPOTIFY_API_CLIENT_SECRET=YOUR_CLIENT_SECRET
            - SPOTIFY_API_REDIRECT_URI=https://jjdenhertog.github.io/spotify-to-plex/callback.html
            - ENCRYPTION_KEY=YOUR_ENCRYPTION_KEY
            - PLEX_APP_ID=eXf+f9ktw3CZ8i45OY468WxriOCtoFxuNPzVeDcAwfw=
        network_mode: "host"
        image: 'jjdenhertog/spotify-to-plex:latest'
```

Add optional integrations as needed:

```yaml
            - TIDAL_API_CLIENT_ID=YOUR_TIDAL_CLIENT_ID
            - TIDAL_API_CLIENT_SECRET=YOUR_TIDAL_CLIENT_SECRET
            - LIDARR_API_KEY=YOUR_LIDARR_API_KEY
            - SLSKD_API_KEY=YOUR_SLSKD_API_KEY
```

---

## Unraid Installation

Install from the Community Applications (CA) store by searching for "spotify-to-plex".

{: .important }
The Unraid template from CA does **not** include the Lidarr and SLSKD environment variables by default. You must add these manually if you want to use those integrations.

### Adding Environment Variables in Unraid

1. Go to the Docker tab in Unraid
2. Click on the Spotify-to-Plex container
3. Select **Edit**
4. Click **+ Add another Path, Port, Variable, Label or Device**
5. Configure as follows:
   - **Config Type:** Variable
   - **Name:** SLSKD API Key (or any descriptive name)
   - **Key:** `SLSKD_API_KEY`
   - **Value:** Your generated API key
6. Repeat for `LIDARR_API_KEY` if needed
7. Click **Apply**

See the [Lidarr Integration](integrations/lidarr) and [SLSKD Integration](integrations/slskd) pages for details on generating API keys and configuring these integrations.
