FROM node:20-alpine AS base
USER root

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
# RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV development

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./

RUN npm install

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_DOCKER 1

# If using npm comment out above and use below instead
RUN NEXT_DOCKER=1 npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Needed for cronjobs
COPY --from=builder /app/cronjob ./cronjob
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Set the correct permission for prerender cache
RUN mkdir dist
RUN mkdir config

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder /app/dist/standalone ./
COPY --from=builder /app/dist/static ./dist/static

RUN rm -rf pages/
RUN npm install --omit=dev

# EXPOSE 9030
ENV PORT 9030
ENV PLEX_APP_ID eXf+f9ktw3CZ8i45OY468WxriOCtoFxuNPzVeDcAwfw=
# set hostname to localhost
ENV HOSTNAME "0.0.0.0"

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["sh", "-c", "npm run sync:mqtt && node server.js"]
