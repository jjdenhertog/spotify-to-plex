FROM node:20-alpine AS base
USER root

# Install Python and supervisor for multi-service management
RUN apk add --no-cache python3 py3-pip python3-dev build-base supervisor curl wget

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
# RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV development

# Install dependencies based on the preferred package manager
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/web/package.json ./apps/web/
COPY apps/spotify-scraper/requirements.txt ./apps/spotify-scraper/

RUN npm install -g pnpm@10.15.0
RUN pnpm install

# Install Python dependencies for SpotifyScraper
RUN cd apps/spotify-scraper && pip3 install -r requirements.txt

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps ./apps
COPY . .

ENV NEXT_DOCKER 1

# If using npm comment out above and use below instead
RUN NEXT_DOCKER=1 pnpm build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./public

# Needed for cronjobs
COPY --from=builder /app/cronjob ./cronjob
COPY --from=builder /app/apps/web/src ./src
COPY --from=builder /app/apps/web/tsconfig.json ./tsconfig.json
COPY --from=builder /app/packages ./packages

# Copy SpotifyScraper service
COPY --from=builder /app/apps/spotify-scraper ./apps/spotify-scraper

# Set the correct permission for prerender cache
RUN mkdir -p apps/web/dist
RUN mkdir config

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder /app/apps/web/dist/standalone ./
COPY --from=builder /app/apps/web/dist/static ./apps/web/dist/static

RUN rm -rf pages/
RUN npm install -g pnpm@10.15.0
RUN pnpm install --prod --frozen-lockfile

# Install Python dependencies for SpotifyScraper in production
RUN cd apps/spotify-scraper && pip3 install -r requirements.txt

# EXPOSE both ports
EXPOSE 9030 3020
ENV PORT 9030
ENV SPOTIFY_SCRAPER_URL http://localhost:3020
ENV PLEX_APP_ID eXf+f9ktw3CZ8i45OY468WxriOCtoFxuNPzVeDcAwfw=
# set hostname to localhost
ENV HOSTNAME "0.0.0.0"

# Create supervisord configuration
RUN mkdir -p /etc/supervisor/conf.d
COPY supervisord.conf /etc/supervisor/supervisord.conf

# Create startup script
RUN echo '#!/bin/sh\n\n# Start SpotifyScraper service first\ncd /app/apps/spotify-scraper && python3 main.py &\nSPOTIFY_PID=$!\n\n# Wait for SpotifyScraper to be ready\necho "Waiting for SpotifyScraper service..."\nwhile ! curl -f http://localhost:3020/health > /dev/null 2>&1; do\n  sleep 1\ndone\necho "SpotifyScraper service is ready"\n\n# Start main application\ncd /app\nnpm run sync:mqtt && node server.js\n' > /app/start.sh && chmod +x /app/start.sh

# Use supervisord to manage both services
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/supervisord.conf"]
