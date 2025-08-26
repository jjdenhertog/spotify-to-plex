# Docker Integration Documentation

## Overview

This document describes the Docker configuration for the Vibe Kanban application with integrated SpotifyScraper service. The setup uses a multi-service architecture managed by supervisord within a single container.

## Architecture

```
┌─────────────────────────────────────────────────┐
│                Docker Container                 │
├─────────────────────────────────────────────────┤
│  Supervisord (Process Manager)                  │
│  ├─ SpotifyScraper Service (Port 3020)          │
│  └─ Main Application (Port 9030)                │
├─────────────────────────────────────────────────┤
│  Services Communication                         │
│  └─ HTTP: http://localhost:3020                 │
└─────────────────────────────────────────────────┘
```

## Files Created/Modified

### Core Docker Files
- `/Dockerfile` - Main application container with multi-service support
- `/supervisord.conf` - Process management configuration
- `/docker-compose.yml` - Container orchestration
- `/.dockerignore` - Build exclusions

### SpotifyScraper Service
- `/apps/spotify-scraper/Dockerfile` - Standalone service container
- `/apps/spotify-scraper/main.py` - FastAPI service implementation
- `/apps/spotify-scraper/requirements.txt` - Python dependencies
- `/apps/spotify-scraper/docker-entrypoint.sh` - Service startup script
- `/apps/spotify-scraper/.env.example` - Environment template

### Utilities
- `/scripts/test-docker-setup.sh` - Configuration validation script

## Environment Variables

### Main Application
- `PORT=9030` - Main application port
- `SPOTIFY_SCRAPER_URL=http://localhost:3020` - SpotifyScraper service endpoint
- `HOSTNAME=0.0.0.0` - Bind address
- `NODE_ENV=production` - Runtime environment

### SpotifyScraper Service
- `PORT=3020` - Service port
- `HOST=0.0.0.0` - Bind address
- `PYTHONPATH=/app/apps/spotify-scraper` - Python module path

## Service Startup Sequence

1. **Supervisord** starts as the main process
2. **SpotifyScraper Service** starts first (priority 100)
3. **Health Check** - Wait for SpotifyScraper to be ready
4. **Main Application** starts after SpotifyScraper is healthy (priority 200)

## Port Configuration

- **Port 9030**: Main Vibe Kanban application
- **Port 3020**: SpotifyScraper service API

Both ports are exposed and mapped in the Docker configuration.

## Service Communication

The main application communicates with SpotifyScraper via HTTP requests to:
```
http://localhost:3020/health        - Health check
http://localhost:3020/search/tracks - Track search API
http://localhost:3020/scrape/playlist/{id} - Playlist scraping
http://localhost:3020/metrics       - Service metrics
```

## Build and Deployment

### Build the Container
```bash
docker build -t vibe-kanban .
```

### Run the Container
```bash
docker run -p 9030:9030 -p 3020:3020 vibe-kanban
```

### Using Docker Compose
```bash
docker-compose up --build
```

### Test Configuration
```bash
./scripts/test-docker-setup.sh
```

## Health Monitoring

### Container Health Check
The main container includes a health check that verifies the main application is responding:
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:9030/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 60s
```

### SpotifyScraper Health Check
The SpotifyScraper service provides a health endpoint:
```
GET http://localhost:3020/health
```

Response:
```json
{
  "status": "healthy",
  "service": "spotify-scraper",
  "version": "1.0.0"
}
```

## Logging

Supervisord manages logging for both services:
- **Main App Logs**: `/var/log/supervisor/main-app-stdout.log`
- **SpotifyScraper Logs**: `/var/log/supervisor/spotify-scraper-stdout.log`
- **Error Logs**: Corresponding `-stderr.log` files

## Development vs Production

### Development
- Use individual Dockerfiles for each service
- Enable hot reloading
- Mount volumes for code changes

### Production
- Single container with supervisord
- Optimized for deployment
- Health checks and restart policies

## Troubleshooting

### Common Issues

1. **Service Not Starting**
   - Check supervisord logs: `supervisorctl status`
   - Verify port availability
   - Check environment variables

2. **Communication Issues**
   - Verify SPOTIFY_SCRAPER_URL is set correctly
   - Test service health: `curl http://localhost:3020/health`
   - Check network configuration

3. **Build Issues**
   - Ensure all requirements.txt files are present
   - Check Python dependencies compatibility
   - Verify Dockerfile syntax

### Debug Commands
```bash
# Check service status
docker exec -it <container> supervisorctl status

# View service logs
docker exec -it <container> supervisorctl tail -f spotify-scraper
docker exec -it <container> supervisorctl tail -f main-app

# Test service connectivity
docker exec -it <container> curl http://localhost:3020/health
```

## Security Considerations

- Services run in isolated processes
- Non-root user for SpotifyScraper
- Environment variable management
- Port exposure limited to necessary services

## Future Enhancements

- Container orchestration with Kubernetes
- Service mesh integration
- Enhanced monitoring and observability
- Automated scaling based on load