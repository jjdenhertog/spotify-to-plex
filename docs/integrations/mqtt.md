---
title: MQTT / Home Assistant
parent: Integrations
nav_order: 4
---

# MQTT / Home Assistant Integration

This integration publishes your categorized playlists and albums to Home Assistant via MQTT. It's designed for smart home scenarios where you want to control music playback based on categories.

{: .note }
This is a specialized feature originally built for home automation use cases. It works together with the **categories/labels** system to expose your music library to Home Assistant.

---

## Use Case Example

Imagine you want to ask your smart home: *"Play a jazz playlist"*

With this integration you can:

1. Label several playlists with the category "Jazz" in Spotify to Plex
2. These playlists are published to Home Assistant as sensors
3. A "Music Categories" sensor lists all your categories (Jazz, Rock, Classical, etc.)
4. Your Home Assistant automation can pick a random playlist from the Jazz category and start playback

---

## Prerequisites

1. A running MQTT broker (e.g., Mosquitto)
2. Home Assistant with MQTT integration configured
3. Playlists/albums with assigned labels (categories) in Spotify to Plex

---

## Configuration

### Step 1: Add Environment Variables

Add these to your Docker configuration:

```sh
-e MQTT_BROKER_URL=mqtt://192.168.1.100:1883
-e MQTT_USERNAME=your_mqtt_username
-e MQTT_PASSWORD=your_mqtt_password
```

Or in Docker Compose:

```yaml
environment:
  - MQTT_BROKER_URL=mqtt://192.168.1.100:1883
  - MQTT_USERNAME=your_mqtt_username
  - MQTT_PASSWORD=your_mqtt_password
```

### Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MQTT_BROKER_URL` | Yes | - | MQTT broker URL (e.g., `mqtt://192.168.1.100:1883`) |
| `MQTT_USERNAME` | No | - | MQTT authentication username |
| `MQTT_PASSWORD` | No | - | MQTT authentication password |
| `MQTT_TOPIC_PREFIX` | No | `spotify_to_plex` | Prefix for all MQTT topics |
| `MQTT_DRY_RUN` | No | `false` | Set to `true` to test without publishing |

### Step 2: Assign Categories to Your Items

In the Spotify to Plex web interface:

1. Go to **Saved Items**
2. Select one or more playlists/albums
3. Assign a **label** (this becomes the category)

{: .important }
Only items with a label are published to MQTT. Items without a label are ignored.

---

## How It Works

### Automatic Publishing

The MQTT sync runs **every hour** automatically. It:

1. Reads all saved items that have a label assigned
2. Looks up the corresponding Plex metadata (ID, artwork)
3. Publishes each item as a Home Assistant sensor
4. Publishes a "Music Categories" sensor with all unique categories

### What Gets Published

For each labeled item, a sensor is created with these attributes:

| Attribute | Description |
|-----------|-------------|
| `name` | The playlist/album name |
| `category` | The assigned label |
| `category_id` | Lowercase version of the category |
| `media_content_id` | Plex library path (e.g., `/library/metadata/12345`) |
| `thumb` | Artwork URL |
| `icon` | MDI icon based on type |

### Categories Sensor

A special "Music Categories" sensor is published containing a comma-separated list of all categories:

```
Jazz,Rock,Classical,Electronic
```

This allows your automations to enumerate available categories.

---

## MQTT Topics

With the default topic prefix, messages are published to:

| Topic | Purpose |
|-------|---------|
| `homeassistant/sensor/{entity_id}/config` | Home Assistant discovery config |
| `spotify_to_plex/items/{item_id}/state` | Entity state and attributes |
| `homeassistant/sensor/spotify_to_plex_categories/config` | Categories discovery config |
| `spotify_to_plex/categories/state` | Categories list |

---

## Manual Sync

To manually trigger an MQTT publish:

```
http://[IP-ADDRESS]:9030/api/sync/mqtt
```

---

## Dry Run Mode

To test the integration without actually publishing to MQTT, set:

```sh
-e MQTT_DRY_RUN=true
```

This creates a manifest file at `/app/config/mqtt_dry_run_manifest.json` showing what would be published, including:

- All entities that would be created
- The discovery and state topics
- Categories that would be published
- Any stale entities that would be removed

---

## Home Assistant Example

Here's a simple automation example that plays a random playlist from a category:

```yaml
# Example: Play random Jazz playlist
automation:
  - alias: "Play Jazz Music"
    trigger:
      - platform: event
        event_type: custom_play_jazz
    action:
      - service: media_player.play_media
        target:
          entity_id: media_player.plex
        data:
          media_content_type: playlist
          media_content_id: >
            {% set jazz_playlists = states.sensor
               | selectattr('attributes.category', 'eq', 'Jazz')
               | list %}
            {{ (jazz_playlists | random).attributes.media_content_id }}
```

{: .note }
The exact implementation depends on your Home Assistant setup, Plex integration, and media player configuration.

---

## Cleanup

The sync automatically removes entities that are no longer present:

- If you remove a label from an item, its MQTT entity is deleted
- If you delete a saved item, its MQTT entity is deleted

This keeps your Home Assistant clean and in sync with your Spotify to Plex configuration.
