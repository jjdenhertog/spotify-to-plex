---
title: Integrations
nav_order: 7
has_children: true
---

# Integrations

Spotify to Plex supports several integrations to help you download missing tracks and find alternatives.

---

## Available Integrations

| Integration | Purpose |
|-------------|---------|
| [Lidarr](lidarr) | Automatically download complete albums |
| [SLSKD](slskd) | P2P downloads from Soulseek network |
| [Tidal](tidal) | Find and match tracks on Tidal |

---

## Overview

### Lidarr

[Lidarr](https://github.com/Lidarr/Lidarr) is a music collection manager. When integrated, you can automatically send missing albums to Lidarr for download.

{: .note }
Lidarr downloads complete albums, not individual tracks. A playlist with songs from 50+ albums will trigger many album downloads.

### SLSKD

[SLSKD](https://github.com/slskd/slskd) is a modern Soulseek client. When integrated, you can search for and download individual missing tracks.

{: .note }
Real-time P2P searches take longer than other lookups - approximately 40 seconds per song.

### Tidal

With Tidal credentials configured, you can match missing songs with Tidal to find alternatives or verify track availability.
