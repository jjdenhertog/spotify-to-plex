# Sync Worker

A dedicated background sync worker for the Spotify-to-Plex synchronization tasks. This application has been migrated from the legacy cronjob scripts to a proper monorepo workspace structure.

## Migration Summary

The sync worker consolidates all background synchronization tasks that were previously scattered across cronjob files:

- **Playlists sync**: Synchronizes Spotify playlists to Plex
- **Albums sync**: Synchronizes Spotify albums to Plex  
- **Users sync**: Tracks user activity and recent plays
- **MQTT sync**: Publishes metadata for Home Assistant integration

### What was migrated:

- `cronjob/playlists.ts` → `apps/sync-worker/src/jobs/playlists.ts`
- `cronjob/albums.ts` → `apps/sync-worker/src/jobs/albums.ts`
- `cronjob/users.ts` → `apps/sync-worker/src/jobs/users.ts`
- `cronjob/mqtt.ts` → `apps/sync-worker/src/jobs/mqtt.ts`
- `cronjob/helpers/` → `apps/sync-worker/src/helpers/`
- `cronjob/utils/` → `apps/sync-worker/src/utils/`

## Usage

### From Root Workspace

Run sync jobs from the project root:

```bash
# Individual sync jobs
npm run sync:playlists
npm run sync:albums
npm run sync:users
npm run sync:mqtt

# Development mode (with force flag)
npm run dev:sync:playlists
npm run dev:sync:albums
npm run dev:sync:users
npm run dev:sync:mqtt
```

### From Sync Worker Directory

Navigate to the sync-worker directory for direct execution:

```bash
cd apps/sync-worker

# Using npm scripts
npm run sync:playlists
npm run sync:albums
npm run sync:users
npm run sync:mqtt

# Development execution with .env.local
npm run dev:sync:playlists
npm run dev:sync:albums
npm run dev:sync:users
npm run dev:sync:mqtt

# Direct execution
npx ts-node --transpile-only -r tsconfig-paths/register src/jobs/playlists.ts
npx ts-node --transpile-only -r tsconfig-paths/register src/jobs/albums.ts -- force
```

### CLI Interface

The sync worker also provides a CLI interface:

```bash
# Show help
npx ts-node --transpile-only -r tsconfig-paths/register src/index.ts --help

# Run specific jobs
npx ts-node --transpile-only -r tsconfig-paths/register src/index.ts playlists
npx ts-node --transpile-only -r tsconfig-paths/register src/index.ts albums --force
npx ts-node --transpile-only -r tsconfig-paths/register src/index.ts users
npx ts-node --transpile-only -r tsconfig-paths/register src/index.ts mqtt
```

## Architecture

### Dependencies

The sync worker depends on shared code from the web app:

- **Helpers**: Authentication, API calls, encryption utilities
- **Types**: TypeScript interfaces for Spotify/Plex/Tidal APIs
- **Libraries**: Plex connection, settings management
- **Packages**: Workspace packages like `plex-music-search`

### Job Structure

Each sync job is a self-contained module that:

1. Validates required environment variables
2. Loads configuration and user data
3. Performs the synchronization task
4. Logs results and handles errors
5. Stores missing tracks/albums for manual review

### Configuration

Jobs require these environment variables:

- **Spotify API**: `SPOTIFY_API_CLIENT_ID`, `SPOTIFY_API_CLIENT_SECRET`
- **MQTT (optional)**: `MQTT_BROKER_URL`, `MQTT_USERNAME`, `MQTT_PASSWORD`
- **Development**: Use `.env.local` file in the project root

### Error Handling

- Jobs log errors to console and sync logs
- Missing tracks/albums are saved to files in the settings directory
- Failed syncs can be retried with the `--force` flag

## Development

### Building

```bash
npm run build
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
npm run lint:fix
```

## Migration Notes

- All import paths have been updated to use the `@/web/*` prefix to access shared web app code
- The TypeScript configuration allows cross-references between the sync-worker and web app
- Package scripts in the root `package.json` have been updated to delegate to the sync-worker workspace
- The legacy cronjob scripts should be removed once the migration is verified complete

## Future Improvements

- Add scheduling/cron functionality within the sync worker
- Implement proper logging with structured output
- Add metrics and monitoring endpoints  
- Create Docker container for deployment
- Add configuration validation and better error messages