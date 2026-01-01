---
title: SLSKD
parent: Integrations
nav_order: 2
---

# SLSKD Integration

SLSKD integration allows you to automatically download missing tracks using the Soulseek peer-to-peer network.

---

## Prerequisites

1. A running [SLSKD](https://github.com/slskd/slskd) instance
2. SLSKD API Key for authentication

---

## Setup in SLSKD

### Generate API Key

```bash
openssl rand -base64 48
```

### Configure SLSKD

Add the API key to your SLSKD configuration (`slskd.yml`):

```yaml
web:
  authentication:
    api_keys:
      spotify_to_plex:
        key: "YOUR_GENERATED_API_KEY"
        role: readwrite
        cidr: "0.0.0.0/0"
```

{: .warning }
For better security, restrict the `cidr` field to your specific network range (e.g., `192.168.1.0/24`) instead of allowing all IPs.

---

## Setup in Spotify to Plex

### Step 1: Add Environment Variable

**Docker:**
```sh
-e SLSKD_API_KEY=YOUR_GENERATED_API_KEY
```

**Docker Compose / Portainer:**
```yaml
environment:
    - SLSKD_API_KEY=YOUR_GENERATED_API_KEY
```

### Step 2: Configure in App

Navigate to **Advanced → SLSKD Integration** and configure:

| Setting | Description |
|---------|-------------|
| SLSKD URL | Base URL of your SLSKD instance (e.g., `http://192.168.1.100:5030`) |
| Enable SLSKD Integration | Toggle to enable the feature |
| Enable Automatic Sync | Automatically search and download during daily sync |

---

## Usage

### Manual Search

Once configured, you can manually search for SLSKD songs via the Missing Tracks dialog.

### Automatic Sync

Enable automatic synchronization to search and download missing tracks during the daily sync.

---

## Performance Note

{: .important }
Real-time P2P searches take longer than other lookups. It takes approximately **40 seconds per song** to find a version to download.

This is due to the nature of the Soulseek network, where search requests must be distributed across peers.
