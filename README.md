<p align="center"><img src="docs/assets/images/logo.png" width="90"></p>
<h1 align="center">Spotify to Plex</h1>

<p align="center">
  <a href="https://hub.docker.com/r/jjdenhertog/spotify-to-plex"><img src="https://img.shields.io/docker/pulls/jjdenhertog/spotify-to-plex?style=flat-square&logo=docker" alt="Docker Pulls"></a>
  <a href="https://github.com/jjdenhertog/spotify-to-plex/stargazers"><img src="https://img.shields.io/github/stars/jjdenhertog/spotify-to-plex?style=flat-square&logo=github" alt="GitHub Stars"></a>
  <a href="https://github.com/jjdenhertog/spotify-to-plex/blob/main/LICENSE"><img src="https://img.shields.io/github/license/jjdenhertog/spotify-to-plex?style=flat-square" alt="License"></a>
  <a href="https://github.com/jjdenhertog/spotify-to-plex/issues"><img src="https://img.shields.io/github/issues/jjdenhertog/spotify-to-plex?style=flat-square" alt="Issues"></a>
</p>

<p align="center">
  A web application to sync your Spotify playlists with <a href="https://plex.tv/">Plex</a>. Automatically match songs, download missing tracks, and keep your music library in perfect sync.
</p>

<p align="center">
  <img src="docs/assets/images/app_overview.jpg" alt="Spotify to Plex Overview">
</p>

---

## Features

- Sync any Spotify playlist with Plex (including Spotify-owned playlists)
- Advanced track matching with multiple search strategies
- Download missing tracks via Lidarr, SLSKD, or Tidal
- Multiple Spotify user support
- Scheduled automatic synchronization
- Smart caching for faster syncs

---

## Quick Start

```sh
docker run -d \
    -e SPOTIFY_API_CLIENT_ID=YOUR_CLIENT_ID \
    -e SPOTIFY_API_CLIENT_SECRET=YOUR_CLIENT_SECRET \
    -e SPOTIFY_API_REDIRECT_URI=https://jjdenhertog.github.io/spotify-to-plex/callback.html \
    -e ENCRYPTION_KEY=YOUR_ENCRYPTION_KEY \
    -e PLEX_APP_ID=eXf+f9ktw3CZ8i45OY468WxriOCtoFxuNPzVeDcAwfw= \
    -v /your/config/path:/app/config:rw \
    --network=host \
    jjdenhertog/spotify-to-plex
```

Access the web interface at `http://[your-ip]:9030`

---

## Documentation

For detailed setup instructions, configuration options, and integration guides:

**[Read the full documentation](https://jjdenhertog.github.io/spotify-to-plex/)**

---

## Support This Open-Source Project

If you appreciate my work, consider starring this repository or making a donation to support ongoing development. Your support means the world to me—thank you!

[![Buy Me a Coffee](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/jjdenhertog)

Are you a developer with some free time on your hands? It would be great if you can help me maintain and improve this project.

---

## License

This project is open source and available under the [MIT License](LICENSE).
