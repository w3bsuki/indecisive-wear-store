# Production Dockerfile for Medusa Backend
FROM node:20-alpine AS base

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++ curl

WORKDIR /app

# Copy package files
COPY package*.json yarn.lock ./

# Install production dependencies
FROM base AS deps
RUN yarn install --frozen-lockfile --production

# Install all dependencies for building
FROM base AS build-deps
RUN yarn install --frozen-lockfile

# Build the application
FROM build-deps AS build
COPY . .

# Apply critical fixes during build
RUN echo '{"overrides":{"@swc/core":"1.3.96"}}' > override.json && \
    yarn add -W @swc/core@1.3.96

# Build Medusa
RUN yarn build

# Production image
FROM node:20-alpine AS runtime

# Install curl for health checks
RUN apk add --no-cache curl

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built application
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nodejs:nodejs /app/dist ./dist
COPY --from=build --chown=nodejs:nodejs /app/.medusa ./.medusa
COPY --from=build --chown=nodejs:nodejs /app/package.json ./
COPY --from=build --chown=nodejs:nodejs /app/medusa-config.js ./medusa-config.js 2>/dev/null || :
COPY --from=build --chown=nodejs:nodejs /app/medusa-config.ts ./medusa-config.ts 2>/dev/null || :

# Create necessary directories
RUN mkdir -p uploads .medusa/server/files && \
    chown -R nodejs:nodejs uploads .medusa

# Switch to non-root user
USER nodejs

# Environment
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Expose port
EXPOSE 9000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:9000/health || exit 1

# Start command
CMD ["yarn", "start"]