<h1 align="center" style="color: orange;">🚀 New Release Coming Soon! 🚀</h1>

<!--
<h1 align="center" style="color: orange;">Spotify to Plex</h1>
[SCREENSHOTS]

A beautiful web application that you can use to sync your Spotify playlists with [Plex](https://plex.tv/). This application uses the data from Spotify (playlists or albums) and tries to find all the matching songs in Plex. With every playlists it gives you an overview of the songs that have been matched and how they have been matched. 

This project started because I'm using Home Assistant together with Plex and Sonos. During the week I'm listing to Spotify but in the evening and weekends Plex is more often used. Using this application I can automatically synchronise my Spotify songs with my Plex setup. 

Features
* Matching Spotify songs with Plex
* Imported automated personal playlists (e.g. Daylist)
* Export your missing songs (which could be used in [Tidal Media Downloader](https://github.com/yaronzz/Tidal-Media-Downloader))

Coming soon
* Automatically synchronise playlists or recent songs
* API route for dashboarding

Coming later
* Add albums / playlist by searching

------------

## Installation

Install the Spotify-to-Plex app using a docker container. Once up and running you will find the instance at http://[ipaddress]:9030. You can change the port number by setting the `PORT` environment variable.

### Spotify credentials

To import playlists you need Spotify API credentials to make the connection. You can get these credentials at the [Spotify Developer site](https://developer.spotify.com/). More information can also be found at the [Gettin started section](https://developer.spotify.com/documentation/web-api) of the documentation.

### Tidal credentials

If you want to match missing songs with Tidal you also need to use Tidal Credentials. To obtain your Tidal API client ID and client secret, you need to register for access to the Tidal API. Visit the [Tidal Developer Portal](https://developer.tidal.com/) to apply for API access and retrieve your credentials.

### Binding volume

All the data is stored in the `/app/config` folder, you need to add it as a volume for persistant storage.

```sh
docker run -d \
    -e PORT=9030 \
    -e TIDAL_API_CLIENT_ID=PASTE_YOUR_TIDAL_CLIENT_ID_HERE \
    -e SPOTIFY_API_CLIENT_SECRET=PASTE_YOUR_SPOTIFY_CLIENT_SECRET_HERE \
    -e SPOTIFY_API_REDIRECT_URI=http://[ipaddress]:9030/api/spotify/token \
    -e TIDAL_API_CLIENT_ID=PASTE_YOUR_TIDAL_CLIENT_ID_HERE \
    -e TIDAL_API_CLIENT_SECRET=PASTE_YOUR_TIDAL_CLIENT_SECRET_HERE \
    -e TIDAL_API_REDIRECT_URI=http://[ipaddress]:3000/api/tidal/token \
    -v /local/directory/:/app/config:rw \
    --name=spotify-to-plex \
    --network=host \
    --restart on-failure:4 \
    jjdenhertog/spotify-to-plex
```

### Portainer installation

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
            - SPOTIFY_API_REDIRECT_URI=http://[ipaddress]:9030/api/spotify/token
            - TIDAL_API_CLIENT_ID=PASTE_YOUR_TIDAL_CLIENT_ID_HERE
            - TIDAL_API_CLIENT_SECRET=PASTE_YOUR_TIDAL_CLIENT_SECRET_HERE
            - TIDAL_API_REDIRECT_URI=http://[ipaddress]:9030/api/tidal/token
        network_mode: "host"
        image: 'jjdenhertog/spotify-to-plex:latest'
```
------------

## Matching songs

To match songs with Plex I'm using [plex-music-searcher](https://github.com/jjdenhertog/plex-music-searcher). This tries to match songs as best as possible and taking different approaches. When a song can&apos;t be matched even though you have it, it&apos;s best to raise an issue so I can dive into it. When a song is found but it&apos;t not a perfect match you will see a warning.

When the matched song is indeed totally wrong, you can find more info by clicking on the warning. This tells you why the song was matched. You can use this information to raise an issue so I can look into it.

[INSERT IMAGE HERE]

## Creating Plex Playlists

With any imported playlist you have the option to create a playlist or update the existing playlist. In both options the playlists is completely rebuild, so any changes that you manually made to a playlist will also be removed.

### Changing the playlist name

To modify the name of the playlist you can click on the pen icon behind the playlist title and rename it to something else. 

## Speeding things up

Most API requests to Plex and Tidal take quite a while, that is why alot of data is cached. So when a song is matched once, it will not try to match it again. This means that when you reload an existing playlist it will only try to search for the missing song. 

Most requests are made in sets of 5 tracks at-a-time and also cached in that way. So you don't need to wait untill al tracks are searched for. When interrupting the process it will have stored any matches that were succesfully made.

### Removing cache

All cached data is stored in `track_links.json` in the data folder. When removing this file all previously matched tracks will be removed. The other option is to click on the refresh icon on the playlist screen. This will reload the current playlist but ignore any previously matched songs. 

[Screenshot]

## Large playlists

If you are syncing extremely large playlists (200+ songs) than you are prompted to use the `fast` search option. This will scan your library only with one search approach instead of multie. Find more information about this in [plex-music-searcher](https://github.com/jjdenhertog/plex-music-search).

For large playlists it's good to know that any matched songs are cached. So there is little harm to interrupting the proces. Any songs that were matched will be skipped the next time the synchronisation runs.

------------

## Synchronisation

You can use Spotify-to-Plex to automatically syncrhonise your playlists with Plex. While managing your playlists you have the option to enable automatic syncing and to set the interval in hours of how often the synchronisation should occur.

[Screenshot]

### Setup

You need to setup your own task to start the automatic synchronisation. To do this, you have two options: 
* Run the cornjob via commandline `npx ts-node --r tsconfig/paths/register cronjob/sync.ts`
* Call an API route `http://[ipaddress]:9030/api/sync`

### Logs

In the application you can find log entries for each time the synchronizaton took place - including the duration of each task. 

### Missing songs

The cronjob will automatically update all missing songs in two text files `spotify_missing_songs.txt` and `tidal_missing_songs.txt`. You can do this to easily see which songs are not in your Plex environment. The Tidal songs are also structured in such a way that it could be used in [Tidal Media Downloader](https://github.com/yaronzz/Tidal-Media-Downloader). [Disclaimer](https://github.com/yaronzz/Tidal-Media-Downloader?tab=readme-ov-file#-disclaimer).

------------

## Support This Open-Source Project ❤️

If you appreciate my work, consider starring this repository or making a donation to support ongoing development. Your support means the world to me—thank you!

[![Buy Me a Coffee](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/jjdenhertog)

Are you a developer and have some free time on your hand? It would be great if you can help me maintain and improve this library.


-->
