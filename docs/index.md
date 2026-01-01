---
title: Home
layout: home
nav_order: 1
---

# Spotify to Plex

A web application to sync your Spotify playlists with [Plex](https://plex.tv/). Automatically match songs, download missing tracks, and keep your music library in perfect sync.

![Spotify to Plex Overview](assets/images/app_overview.jpg)

---

## Key Features

### Comprehensive Spotify Sync
Synchronize **any** Spotify playlist with Plex, including:
- Spotify-owned playlists (Spotify Song mixes)
- Liked songs and albums
- Personal, private, and collaborative playlists
- Recently played tracks and Daylist

### Extensive Track Matching
Advanced matching algorithms that find your songs across different formats:
- Multiple search strategies with customizable approaches
- Fuzzy matching for remixes, live versions, and alternative recordings
- Real-time match quality indicators

### Automatic Missing Track Downloads
Never miss a song from your playlists:
- [Lidarr](https://github.com/Lidarr/Lidarr) integration for complete albums
- [SLSKD](https://github.com/slskd/slskd) integration for P2P downloads
- [Tidal](https://tidal.com/) matching for finding alternatives

### Smart Synchronization
Set it and forget it with automatic playlist syncing:
- Scheduled synchronization with customizable intervals
- Multiple Spotify user support
- Smart caching for faster subsequent syncs

---

## Getting Started

1. [Install](installation) the application using Docker
2. Follow the [Quick Start](quick-start) guide
3. [Configure Spotify](spotify/) authentication


---

## Why Spotify to Plex?

This project started because I'm using Home Assistant together with Plex and Sonos. During the week I'm listening to Spotify but in the evenings and weekends Plex is more often used. Using this application I can automatically synchronize my Spotify songs with my Plex setup.

**What makes this different:**
- Web interface with detailed match information
- Works with Spotify-owned playlists that other tools can't access
- Multiple download integrations (Lidarr, SLSKD, Tidal)
- Multiple Spotify user support
- Complete transparency in how songs are matched
