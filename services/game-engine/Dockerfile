# Multi-stage build for Go-based Game Engine
# Optimized for high-performance chess move validation

# Build stage
FROM golang:1.21-alpine AS builder

# Install git and ca-certificates
RUN apk add --no-cache git ca-certificates tzdata

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the binary with optimizations
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags='-w -s -extldflags "-static"' \
    -a -installsuffix cgo \
    -o game-engine ./cmd/main.go

# Production stage - distroless for security
FROM gcr.io/distroless/static:nonroot

# Copy the binary from builder
COPY --from=builder /app/game-engine /game-engine

# Copy timezone data
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo

# Copy CA certificates
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# Expose port
EXPOSE 8080 9090

# Health check using the built-in health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD ["/game-engine", "health"]

# Run as non-root user
USER nonroot:nonroot

# Start the service
ENTRYPOINT ["/game-engine"]