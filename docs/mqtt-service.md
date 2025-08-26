# MQTT Background Service Documentation

## Overview

The MQTT service provides real-time synchronization between Spotify-to-Plex and Home Assistant through MQTT discovery protocol. It runs as a persistent background service with automatic updates when data changes.

## Architecture

### Service Components

1. **MQTT Service** (`apps/sync-worker/src/services/mqttService.ts`)
   - Persistent background service with EventEmitter-based architecture
   - File watching for automatic updates
   - Configurable update intervals
   - Retry logic with exponential backoff

2. **MQTT Job** (`apps/sync-worker/src/jobs/mqtt.ts`)
   - Core MQTT publishing logic
   - Home Assistant discovery protocol support
   - Handles saved items, playlists, and track links

3. **CLI Entry Point** (`apps/sync-worker/src/index-mqtt.ts`)
   - Command-line interface for the service
   - Multiple operation modes (continuous/one-shot)
   - Debug logging support

## Deployment

### Docker Integration

The service runs inside Docker containers managed by supervisord:

```ini
[program:mqtt-service]
command=node apps/sync-worker/dist/index-mqtt.js
directory=/app
autostart=true
autorestart=true
environment=NODE_ENV="production",MQTT_BROKER_URL="%(ENV_MQTT_BROKER_URL)s"
```

### Startup Order

1. **Spotify Scraper** (priority 100)
2. **MQTT Service** (priority 120)
3. **Main Application** (priority 200)

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MQTT_BROKER_URL` | MQTT broker connection URL | Yes |
| `MQTT_USERNAME` | MQTT authentication username | Yes |
| `MQTT_PASSWORD` | MQTT authentication password | Yes |
| `DEBUG` | Enable debug logging (`mqtt` or `*`) | No |

### Command Line Options

```bash
# Run with file watching (default)
pnpm mqtt:service

# Run once and exit
pnpm mqtt:service -- --one-shot

# Custom update interval (seconds)
pnpm mqtt:service -- --interval 600

# Disable file watching
pnpm mqtt:service -- --no-watch

# Enable debug logging
pnpm mqtt:service -- --debug
```

## Features

### Auto-Update Mechanism

The service monitors these files for changes:
- `playlists.json` - Spotify playlists
- `track_links.json` - Track link mappings
- `saved_items.json` - Saved Spotify items

When changes are detected:
1. Debounced for 2 seconds to batch rapid changes
2. Rate-limited to prevent excessive updates
3. Automatic MQTT republish with updated data

### Home Assistant Integration

Publishes to MQTT topics:
- `spotify-to-plex/categories` - Available categories
- `spotify-to-plex/items/{id}` - Individual items
- `homeassistant/sensor/{entity}/config` - Discovery configuration

### Error Handling

- **Connection Retry**: Exponential backoff with configurable attempts
- **Graceful Degradation**: Missing files don't crash the service
- **Health Monitoring**: Event-based status reporting
- **Signal Handling**: Proper cleanup on SIGTERM/SIGINT

## Development

### Running Locally

```bash
# Development with auto-reload
pnpm dev:mqtt:service

# Debug mode
pnpm dev:mqtt:service:debug

# Build and run
pnpm build && pnpm mqtt:service:build
```

### Testing

The service can be tested in isolation:

```bash
# One-shot test
pnpm sync:mqtt

# Continuous mode test
MQTT_BROKER_URL=mqtt://localhost:1883 \
MQTT_USERNAME=test \
MQTT_PASSWORD=test \
node apps/sync-worker/dist/index-mqtt.js --debug
```

## Monitoring

### Logs

Supervisord logs are available at:
- `/var/log/supervisor/mqtt-service-stdout.log`
- `/var/log/supervisor/mqtt-service-stderr.log`

### Status Check

```bash
# Inside container
supervisorctl status mqtt-service

# View logs
supervisorctl tail -f mqtt-service
```

## Troubleshooting

### Service Won't Start

1. Check environment variables are set
2. Verify MQTT broker is accessible
3. Check supervisord logs for errors

### No Updates Detected

1. Verify file permissions in settings directory
2. Check if file watching is enabled
3. Review debug logs for file system events

### Connection Issues

1. Verify MQTT broker URL format
2. Check authentication credentials
3. Test network connectivity to broker

## Migration from One-Shot to Service

The previous implementation ran `npm run sync:mqtt` once at startup. The new service:

1. **Runs continuously** instead of exiting after one sync
2. **Watches for changes** instead of requiring manual triggers
3. **Handles errors gracefully** with retry logic
4. **Integrates with supervisord** for proper process management

## Future Enhancements

Potential improvements for consideration:

1. **WebSocket Support**: Real-time updates to UI
2. **Metrics Collection**: Performance monitoring
3. **Clustering**: Multi-worker support for scale
4. **Queue Integration**: Message queue for reliability
5. **API Endpoints**: REST API for manual triggers