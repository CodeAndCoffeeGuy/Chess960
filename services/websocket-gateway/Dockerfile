# Multi-stage Docker build for WebSocket Gateway
# Optimized for 100K+ concurrent connections

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S websocket -u 1001 -G nodejs

WORKDIR /app

# Copy built application
COPY --from=builder --chown=websocket:nodejs /app/dist ./dist
COPY --from=builder --chown=websocket:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=websocket:nodejs /app/package.json ./package.json

# Set environment variables for production
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=8192"
ENV UV_THREADPOOL_SIZE=128

# Expose ports
EXPOSE 8080 8081 9090

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8081/health', (res) => { \
        if (res.statusCode === 200) process.exit(0); else process.exit(1); \
    }).on('error', () => process.exit(1));"

# Switch to non-root user
USER websocket

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]