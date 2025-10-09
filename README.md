<p align="center"><img src="misc/logo.png" width="90"></p>
<p align="center" color="red">Spotify to Plex</p>

------------

A beautiful web application that you can use to sync your Spotify playlists with [Plex](https://plex.tv/). This application uses the data from Spotify (playlists or albums) and tries to find all the matching songs in Plex. With every playlists it gives you an overview of the songs that have been matched and how they have been matched.

<img src="misc/app_overview.jpg">

This project started because I'm using Home Assistant together with Plex and Sonos. During the week I'm listing to Spotify but in the evening and weekends Plex is more often used. Using this application I can automatically synchronize my Spotify songs with my Plex setup. 


#### Features
* Matching Spotify songs with Plex
* Imported automated personal playlists (e.g. Daylist)
* Update thumbnail in Plex to the Spotify Thumbnail

#### Working on:
* Filtering songs based on Quality
* MQTT Connection
* Connection with [Lidarr](https://github.com/Lidarr/Lidarr) and [Tidal Media Downloader](https://github.com/yaronzz/Tidal-Media-Downloader))

------------

## Installation

Install the Spotify-to-Plex app using a docker container. Once up and running you will find the instance at http://[ipaddress]:9030. You can change the port number by setting the `PORT` environment variable.

### Encryption key

When you are using the [Spotify users](#spotify) option it's important to also setup an encryption key. This should be a random string. It is used to encrypt any sensitive data that we receive from Spotify. To get a random key you could use the following command line

```bash
openssl rand -hex 32
```

### Spotify credentials

To import playlists you need Spotify API credentials to make the connection. You can get these credentials at the [Spotify Developer site](https://developer.spotify.com/). More information can also be found at the [Getting started section](https://developer.spotify.com/documentation/web-api) of the documentation.

#### Insecure redirect URI
Spotify has required to use *secure* redirect URLs. This means that every redirect URL needs to start with `https`, even IP addresses. As a result during the authentication process you will at some point redirect to a not working url. In that case you need to replace `https` for `http` in order to contiue.

#### Creating a new app

The screenshot below shows how you should create the app. 

<img src="misc/spotify_app_1.jpg" width="450"/>

#### Invalid redirect URL

If you get the message that you have set an invalid redirect URL there are two things to check:

**1. Environment variable**
`SPOTIFY_API_REDIRECT_URI` should be set correctly, for example: `https://192.168.100.130:9030/api/spotify/token`. Note that this has to start with **https**.

**2. Redirect URL in the Spotify App**
It should be exactly the same as the environment variable. So in this case: `https://192.168.100.130:9030/api/spotify/token`

<img src="misc/spotify_app_2.jpg" width="450"/>

### Tidal credentials

If you want to match missing songs with Tidal you also need to use Tidal Credentials. To obtain your Tidal API client ID and client secret, you need to register for access to the Tidal API. Visit the [Tidal Developer Portal](https://developer.tidal.com/) to apply for API access and retrieve your credentials.

### Binding volume

All the data is stored in the `/app/config` folder, you need to add it as a volume for persistent storage.

### Docker installation

```sh
docker run -d \
    -e PORT=9030 \
    -e SPOTIFY_API_CLIENT_ID=PASTE_YOUR_SPOTIFY_CLIENT_ID_HERE \
    -e SPOTIFY_API_CLIENT_SECRET=PASTE_YOUR_SPOTIFY_CLIENT_SECRET_HERE \
    -e SPOTIFY_API_REDIRECT_URI=http://[IP_OF_SPOTIFY_TO_PLEX]:9030/api/spotify/token \
    -e TIDAL_API_CLIENT_ID=PASTE_YOUR_TIDAL_CLIENT_ID_HERE \
    -e TIDAL_API_CLIENT_SECRET=PASTE_YOUR_TIDAL_CLIENT_SECRET_HERE \
    -e TIDAL_API_REDIRECT_URI=http://[IP_OF_SPOTIFY_TO_PLEX]:9030/api/tidal/token \
    -e ENCRYPTION_KEY=PASTE_YOUR_ENCRYPTION_KEY \
    -e PLEX_APP_ID=eXf+f9ktw3CZ8i45OY468WxriOCtoFxuNPzVeDcAwfw= \
    -v /local/directory/:/app/storage:rw \
    --name=spotify-to-plex \
    --network=host \
    --restart on-failure:4 \
    jjdenhertog/spotify-to-plex
```

### Portainer installation

Create a new stack with the following configuration when using portainer.

```yaml
services:
    spotify-to-plex:
        container_name: spotify-to-plex
        restart: unless-stopped
        volumes:
            - '/local/directory:/app/storage'
        environment:
            - PORT=9030
            - SPOTIFY_API_CLIENT_ID=PASTE_YOUR_SPOTIFY_CLIENT_ID_HERE
            - SPOTIFY_API_CLIENT_SECRET=PASTE_YOUR_SPOTIFY_CLIENT_SECRET_HERE
            - SPOTIFY_API_REDIRECT_URI=http://[IP_OF_SPOTIFY_TO_PLEX]:9030/api/spotify/token
            - TIDAL_API_CLIENT_ID=PASTE_YOUR_TIDAL_CLIENT_ID_HERE
            - TIDAL_API_CLIENT_SECRET=PASTE_YOUR_TIDAL_CLIENT_SECRET_HERE
            - TIDAL_API_REDIRECT_URI=http://[IP_OF_SPOTIFY_TO_PLEX]:9030/api/tidal/token
            - ENCRYPTION_KEY=PASTE_YOUR_ENCRYPTION_KEY
            - PLEX_APP_ID=eXf+f9ktw3CZ8i45OY468WxriOCtoFxuNPzVeDcAwfw=
        network_mode: "host"
        image: 'jjdenhertog/spotify-to-plex:latest'
```
------------

## Matching songs

This app tries to match songs as best as possible and taking different approaches. When a song can&apos;t be matched even though you have it, it&apos;s best to raise an issue so I can dive into it. When a song is found but it&apos;t not a perfect match you will see a warning.

For Spotify playlist data extraction, this project uses [SpotifyScraper](https://github.com/AliAkhtari78/SpotifyScraper) to fetch playlist information without requiring official API credentials.

When a song is not getting match you can analyse the track in the Music Search Configuration (in the Advanced tab). This shows you exactly what is going on. 

### Missing songs

You can view all songs that cannot be matched and download it as a text file containing all song links. It is also possible to match it up with Tidal, for this you need to setup [Tidal credentials](#tidal-credentials) as well.

### Spotify API Limitations

Due to recent changes to Spotify's Web API (November 2024), many public Spotify-owned playlists can no longer be accessed through the official API. To work around these limitations, this project leverages [SpotifyScraper](https://github.com/AliAkhtari78/SpotifyScraper) for extracting playlist data without requiring API authentication.

While SpotifyScraper provides reliable access to playlist information, it does have some limitations:
* **Track limit**: Playlists scraped through SpotifyScraper are limited to 100 tracks
* **Rate limiting**: Large numbers of requests may be throttled by Spotify's servers

For Spotify-owned playlists with more than 100 tracks, you can copy that entire playlist to a private playlist and use that URL instead.

------------

## Creating Plex Playlists

With any imported playlist you have the option to create a playlist or update the existing playlist. In both options the playlists is completely rebuild, so any changes that you manually made to a playlist will also be removed.

### Changing the playlist name

To modify the name of the playlist you can click on the pen icon behind the playlist title and rename it to something else. 

------------

## Speeding things up

Most API requests to Plex and Tidal take quite a while, that is why a lot of data is cached. So when a song is matched once, it will not try to match it again. This means that when you reload an existing playlist it will only try to search for the missing song. 

Most requests are made in sets of 5 tracks at-a-time and also cached in that way. So you don't need to wait until al tracks are searched for. When interrupting the process it will have stored any matches that were successfully made.

### Removing cache

All cached data is stored in `track_links.json` in the storage folder. When removing this file all previously matched tracks will be removed. The other option is to click on the refresh icon on the playlist screen. This will reload the current playlist but ignore any previously matched songs. 

<img src="misc/clear_cache.jpg" width="200">

### Large playlists

If you are syncing extremely large playlists (200+ songs) than you are prompted to use the `fast` search option. This will scan your library only the first search approach. For large playlists it's good to know that any matched songs are cached. So there is little harm to interrupting the process. Any songs that were matched will be skipped the next time the synchronization runs.

------------

## Spotify

In the Users section you have the option to add Spotify users. You do not need this for any manually imports, you only need it when you want to do a bit more with the Spotify accounts. When you have a connected user you can:

* Easily add albums or playlist saved by that user
* Import user specific or private playlists
* Automatically sync most recent listened songs

<img src="misc/spotify_users.jpg" width="450">

### Multiple users

You can also add multiple users. In order to add multiple users you need to sign out of Spotify before attempting to add the extra user. Alternatively you can also perform this step in an incognito window.

### Security

When you login to your Spotify account the tokens will be stored in `spotify.json` in your storage folder (`/app/config`). Make sure to properly protect the folder that you are mounting to this app. Sensitive data is encrypted using an [encryption key](#encryption-key) that you can add.

------------

## Synchronization

You can use `Spotify to Plex` to automatically synchronize your playlists with Plex. While managing your playlists you have the option to enable automatic syncing and to set the interval in days of how often the synchronization should occur.

<img src="misc/sync_playlist.jpg" width="450">

> Synchronization can take a very very long time (60 minutes +) depending on the setup. Keep this in mind when using it. 

### How it works

The application includes a built-in automatic synchronization scheduler that runs every two hours. You simply need to enable automatic syncing for your playlists and set the sync interval in days. For example, if you set a playlist to sync every 7 days, the scheduler will check hourly, but only sync that specific playlist once a week.

### What happens during synchronization

During synchronization it does exactly the same as you would do in the app. Which means:
- Open the Plex importer for a playlist
- Try to match all tracks with Plex
- Log any missing tracks
- Update the existing playlist (or create a new one)

It <u>does not</u> remember any selection that you made during the process of matching of a playlist. So if you have chose alternative songs during the first setup it will not apply that same selection.

### Configuration

The synchronization scheduler is automatically enabled when you start the container. No additional setup is required.

**Manual synchronization:**

If you want to manually trigger a sync it is best to use the API calls for this:
- `http://[IP-ADDRESS]:9030/api/sync/albums`
- `http://[IP-ADDRESS]:9030/api/sync/playlists`
- `http://[IP-ADDRESS]:9030/api/sync/users`


### Logs

In the application you can find log entries for each time the synchronization took place - including the duration of each playlist and any error messages.

### Syncing albums

Album synchronization is included in the automatic scheduler. The syncing service for albums creates `missing_albums_spotify.txt` and `missing_albums_tidal.txt` files in your storage folder. It does not create or update any Plex playlists.

### Missing songs

The automatic scheduler will update all missing songs in two text files `missing_tracks_spotify.txt` and `missing_tracks_tidal.txt` in your storage folder. You can use these files to easily see which songs are not in your Plex environment. 

------------

## Support This Open-Source Project ❤️

If you appreciate my work, consider starring this repository or making a donation to support ongoing development. Your support means the world to me—thank you!

[![Buy Me a Coffee](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/jjdenhertog)

Are you a developer and have some free time on your hand? It would be great if you can help me maintain and improve this library.
