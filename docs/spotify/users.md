---
title: User Integration
parent: Spotify Setup
nav_order: 3
---

# Spotify User Integration

In the Users section you have the option to add Spotify users. You do not need this for any manual imports, you only need it when you want to do a bit more with Spotify accounts.

---

## Features

When you have a connected user you can:

- Easily add albums or playlists saved by that user
- Import user-specific or private playlists
- Automatically sync most recently listened songs
- Sync liked songs automatically

![Spotify Users](../assets/images/spotify_users.jpg)

---

## Adding Users

1. Navigate to the Users section in the app
2. Click "Connect Spotify Account"
3. Log in to your Spotify account when prompted
4. Authorize the app to access your data

---

## Multiple Users

You can add multiple Spotify users to sync playlists from different accounts.

{: .important }
To add multiple users, you need to sign out of Spotify before attempting to add the extra user. Alternatively, perform this step in an incognito/private browser window.

---

## Security

When you login to your Spotify account, the tokens are stored in `spotify.json` in your storage folder (`/app/config`).

### Encryption

Sensitive data is encrypted using an encryption key that you provide:

```sh
-e ENCRYPTION_KEY=your_encryption_key_here
```

Generate a secure key using:

```bash
openssl rand -hex 32
```

### Best Practices

- Properly protect the folder that you are mounting to this app
- Use a strong, unique encryption key
- Keep your encryption key secret and backed up
