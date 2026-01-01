---
title: Authentication
parent: Spotify Setup
nav_order: 2
---

# Spotify Authentication

This guide explains how to configure Spotify OAuth authentication for Spotify to Plex.

---

## Understanding the Redirect URI

Spotify requires HTTPS for redirect URIs, with one exception: loopback addresses (`127.0.0.1`). This creates a challenge for users running on local IP addresses like `192.168.x.x`.

### The Solution: Public Redirect Page

I have provided a public redirect page that solves this problem:

```
https://jjdenhertog.github.io/spotify-to-plex/callback.html
```

**How it works:**

1. Your local app redirects to Spotify for authorization
2. Spotify redirects to the public HTTPS page with the auth code
3. The public page redirects back to your local instance with the code
4. Your local app completes the authentication

---

## Configuration

### Step 1: Set Environment Variable

```sh
SPOTIFY_API_REDIRECT_URI=https://jjdenhertog.github.io/spotify-to-plex/callback.html
```

### Step 2: Configure Spotify Developer App

In your [Spotify Developer Dashboard](https://developer.spotify.com/dashboard):

1. Open your app settings
2. Add the redirect URI:
   ```
   https://jjdenhertog.github.io/spotify-to-plex/callback.html
   ```
3. Save changes

{: .important }
The redirect URI in your Spotify app **must exactly match** the `SPOTIFY_API_REDIRECT_URI` environment variable.

---

## Alternative: Direct Redirect

If you prefer not to use the public redirect page, you can configure a direct redirect to your local instance.

### For Loopback Address (127.0.0.1)

HTTP is allowed for loopback addresses, so this works directly:

```sh
SPOTIFY_API_REDIRECT_URI=http://127.0.0.1:9030/api/spotify/token
```

Add this same URI to your Spotify Developer app settings.

{: .note }
This only works with `127.0.0.1`, not with `localhost` or other IP addresses.

### For Local Network IPs (192.168.x.x, 10.x.x.x, etc.)

Spotify requires HTTPS for non-loopback addresses. You must register the URI with `https`:

```sh
SPOTIFY_API_REDIRECT_URI=https://192.168.1.100:9030/api/spotify/token
```

{: .warning }
**Manual workaround required**: After Spotify authorization, you'll be redirected to an `https://` URL that your local server cannot handle. Simply change `https` to `http` in your browser's address bar to complete the authentication. This step is required each time you authenticate, which is why we recommend the public redirect page for most users.

---

## Troubleshooting

### Invalid Redirect URL

- Ensure `SPOTIFY_API_REDIRECT_URI` exactly matches what's in your Spotify app
- Check for trailing slashes - they must match exactly

### ERR_SSL_PROTOCOL_ERROR

This occurs when Spotify redirects to HTTPS but your local server uses HTTP. Use the public redirect page to solve this.

### Authentication Not Completing

1. Check that your Spotify app has the correct redirect URI
2. Verify the environment variable is set correctly
3. Ensure you're accessing your instance from a local network IP

---

## Security Notes

- The public redirect page only handles the authorization code, not your credentials
- Your Spotify tokens are stored locally and encrypted
- The code exchange happens directly between your server and Spotify
