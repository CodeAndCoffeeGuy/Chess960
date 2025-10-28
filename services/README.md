# Bullet Chess Microservices Architecture

## Overview

This directory contains the microservices architecture designed to handle 100K+ concurrent players, based on proven patterns from Chess960 but with modern tooling.

## Services

### Core Services
- **api-gateway** - Kong/Istio API Gateway with rate limiting and routing
- **auth-service** - JWT authentication, OAuth, session management
- **websocket-gateway** - High-performance WebSocket connections (Node.js)
- **game-engine** - Chess logic, move validation, game state (Go/Rust)
- **user-service** - User management, profiles, ratings (TypeScript)
- **matchmaking-service** - Player pairing, queue management (Go)

### Supporting Services
- **analytics-service** - Real-time analytics and statistics (Python)
- **notification-service** - Push notifications, emails (Node.js)
- **file-service** - PGN exports, image handling (Go)
- **search-service** - Game and user search (Elasticsearch wrapper)

### Infrastructure
- **Redis Cluster** - Real-time state, pub/sub, caching
- **PostgreSQL Cluster** - User data, ratings, persistent storage
- **MongoDB Cluster** - Game data, moves, analysis
- **ClickHouse** - Analytics data warehouse
- **Message Queue** - RabbitMQ/Kafka for async processing

## Scaling Targets

- **100K+ concurrent players**
- **10K+ concurrent games**
- **1M+ registered users**
- **Sub-50ms move latency**
- **99.9% uptime**

## Deployment

Each service is containerized and deployed on Kubernetes with:
- Auto-scaling (HPA)
- Health checks
- Circuit breakers
- Distributed tracing
- Prometheus metrics

## Development

```bash
# Start all services locally
docker-compose up

# Start individual service
cd services/websocket-gateway
npm run dev

# Run tests
npm run test:all
```