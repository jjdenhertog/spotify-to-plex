# ===== NODE.JS BUILDER STAGE =====
# Stage 1: Build Node.js/pnpm monorepo with Next.js standalone output
FROM node:20-alpine AS node-builder

# Don't set NODE_ENV=production during build, only set Docker-specific env vars
ENV NEXT_DOCKER=1 \
    PNPM_HOME=/pnpm \
    PATH=$PNPM_HOME:$PATH

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate

WORKDIR /build

# Copy ALL monorepo configuration files (important for TypeScript resolution)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY tsconfig*.json ./
COPY config/ ./config/
COPY packages/ ./packages/
COPY apps/ ./apps/

# Install dependencies (without production mode to ensure proper workspace linking)
RUN pnpm install

# Clean any previous builds
RUN pnpm -r run clean || true

# Build all packages first
RUN pnpm run build:packages

# Build sync-worker with explicit path mappings for Docker environment
RUN cd /build/apps/sync-worker && npx tsc --project tsconfig.build.json

# Build web application with Next.js standalone output (type checking disabled via next.config.js)
RUN cd /build && NEXT_DOCKER=1 pnpm --filter @spotify-to-plex/web run build

# ===== PRODUCTION STAGE =====
# Stage 2: Production runtime with Node.js 20, Python 3.11, Chromium, and Supervisor
FROM ubuntu:22.04 AS production

LABEL maintainer="Spotify-to-Plex Contributors"
LABEL version="1.0.66"
LABEL description="Multi-service Spotify-to-Plex synchronization platform"

ENV DEBIAN_FRONTEND=noninteractive \
    TZ=UTC \
    LANG=C.UTF-8 \
    LC_ALL=C.UTF-8 \
    NODE_VERSION=20 \
    NODE_ENV=production \
    PYTHONPATH=/app/apps/spotify-scraper \
    PORT=9030 \
    HOSTNAME=0.0.0.0 \
    SPOTIFY_SCRAPER_URL=http://localhost:3020 \
    STORAGE_DIR=/app/storage

# Install all production runtime dependencies in one layer
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Basic tools
    curl wget git ca-certificates gnupg \
    # Supervisor for process management
    supervisor \
    # Python 3.11 and pip
    python3.11 python3-pip \
    # Build tools for Python packages
    build-essential \
    # Node.js dependencies
    libatomic1 \
    # Database
    sqlite3 libsqlite3-dev \
    # Chromium browser and driver (using snap-free version)
    chromium-browser chromium-chromedriver \
    # Additional runtime libraries that might be needed
    libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libdbus-1-3 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 \
    libxrandr2 libgbm1 libasound2 libatspi2.0-0 libxss1 fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20 LTS
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Create application directories
RUN mkdir -p /app/config /app/apps/spotify-scraper /app/apps/sync-worker \
    /var/log/supervisor \
    && chmod 755 /app/config

# Copy spotify-scraper application and install Python dependencies
COPY apps/spotify-scraper/requirements.txt /app/apps/spotify-scraper/
WORKDIR /app/apps/spotify-scraper
# Upgrade pip and setuptools first, then install dependencies
RUN git config --global url."https://github.com/".insteadOf "git@github.com:" \
    && pip install --upgrade pip setuptools wheel \
    && pip install --no-cache-dir -r requirements.txt \
    && python3 -c "from spotify_scraper import SpotifyClient; print('SpotifyScraper installed successfully')"

# Copy spotify-scraper application code
COPY apps/spotify-scraper/ /app/apps/spotify-scraper/

# Copy sync-worker built artifacts from node-builder
COPY --from=node-builder /build/apps/sync-worker/dist/ /app/apps/sync-worker/dist/
COPY --from=node-builder /build/apps/sync-worker/package.json /app/apps/sync-worker/
COPY --from=node-builder /build/node_modules/ /app/node_modules/
COPY --from=node-builder /build/packages/ /app/packages/

# Copy Next.js standalone app (Next.js with distDir: "dist" creates dist/standalone/)
COPY --from=node-builder /build/apps/web/dist/standalone/ /app/web/
# Copy static files to correct relative path for standalone
COPY --from=node-builder /build/apps/web/dist/static/ /app/web/apps/web/dist/static/
# Copy public files relative to server.js location
COPY --from=node-builder /build/apps/web/public/ /app/web/apps/web/public/

# Copy supervisor configuration and entrypoint script
COPY supervisor/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Set working directory
WORKDIR /app

# Expose ports
# 9030: Web application (Next.js)
# 3020: Spotify-scraper (internal service)
EXPOSE 9030 3020

# Volume mount for configuration
VOLUME ["/app/config"]

# Health check for web application
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:9030/ || exit 1

# Set entrypoint for initialization
ENTRYPOINT ["/docker-entrypoint.sh"]

# Start supervisor to orchestrate all services
CMD ["supervisord", "-n", "-c", "/etc/supervisor/conf.d/supervisord.conf"]