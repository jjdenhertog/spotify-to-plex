# Spotify to Plex

This is the repository for a [Plex](https://plex.tv/) extension to import Spotify playlists. Currently Plex is moving away from Tidal, so the currently library will be updated alot for better support.

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)]([https://www.buymeacoffee.com/gbraad](https://buymeacoffee.com/jjdenhertog))

------------

## Docker installation

The easiest way to use this extension is by starting a docker container. Once up and running you will find the instance at http://[ipaddress]:9030. You can change the port number by setting the `PORT` environment variable.

### Spotify import

To use the Import Playlist option you need a Spotify API credentials to make the connection. You can get these credentials at the [Spotify Developer site](https://developer.spotify.com/). More information can also be found at the [Gettin started section](https://developer.spotify.com/documentation/web-api) of the documentation.

### Binding volume

Binding a volume to the `/app/config` folder enables persistant storage of the configuration files.

```sh
docker run -d \
    -e PORT=9030 \
    -e SPOTIFY_API_CLIENT_ID=PASTE_YOUR_SPOTIFY_CLIENT_ID_HERE \
    -e SPOTIFY_API_CLIENT_SECRET=PASTE_YOUR_SPOTIFY_CLIENT_SECRET_HERE \
    -v /local/directory/:/app/config:rw \
    --name=spotify-to-plex \
    --network=host \
    --restart on-failure:4 \
    jjdenhertog/spotify-to-plex
```

## Portainer installation

Create a new stack with the following configuration when using portainer.

```yaml
version: '3.3'
services:
    spotify-to-plex:
        container_name: spotify-to-plex
        restart: unless-stopped
        volumes:
            - '/local/directory:/app/config'
        environment:
            - PORT=9030
            - SPOTIFY_API_CLIENT_ID=PASTE_YOUR_SPOTIFY_CLIENT_ID_HERE
            - SPOTIFY_API_CLIENT_SECRET=PASTE_YOUR_SPOTIFY_CLIENT_SECRET_HERE
        network_mode: "host"
        image: 'jjdenhertog/spotify-to-plex:latest'
```

## Development

The extension is build using NextJS. So you can also checkout this repo and simply use the next commands like `npm run dev`, `npm run build` and `npm run start`.
