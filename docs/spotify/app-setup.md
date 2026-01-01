---
title: App Configuration
parent: Spotify Setup
nav_order: 1
---

# Spotify App Configuration

To import playlists you need Spotify API credentials. Visit the [Spotify Developer site](https://developer.spotify.com/) to create an app and get your Client ID and Client Secret.

---

## Creating Your App

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click "Create App"
4. Fill in the required fields:
   - **App Name**: Choose any name (e.g., "Spotify to Plex")
   - **App Description**: A brief description (can be anything)
   - **Redirect URI**: See [Authentication](authentication) for options

---

## Configuration Settings

Once you have created your Spotify app, note these values:

| Setting | Description |
|---------|-------------|
| Client ID | Your app's unique identifier |
| Client Secret | Your app's secret key (keep this private!) |

Add these to your Docker environment:

```sh
-e SPOTIFY_API_CLIENT_ID=your_client_id_here
-e SPOTIFY_API_CLIENT_SECRET=your_client_secret_here
```

---

## Next Steps

After creating your Spotify app, proceed to [Authentication](authentication) to configure the redirect URI and complete the OAuth setup.
