FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy built application
COPY dist ./dist
COPY package.json ./

# Install only production dependencies
RUN npm install --production

# Expose ports
EXPOSE 8080 8081 9090

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8081/health || exit 1

# Start the service
CMD ["node", "dist/index.js"]
