# Bullet Chess - 100K+ Player Architecture

## Overview

This document outlines the complete architecture design for handling 100,000+ concurrent chess players, based on proven patterns from Chess960 but with modern cloud-native tooling.

## System Capacity Targets

- **100,000+ concurrent players**
- **10,000+ simultaneous games**
- **1,000,000+ registered users**
- **Sub-50ms move latency globally**
- **99.9% uptime SLA**
- **1 billion+ games stored**

## Architecture Principles

1. **Microservices First** - Each service handles one concern
2. **Event-Driven** - Async communication via message queues
3. **Horizontally Scalable** - Auto-scaling based on demand
4. **Geographic Distribution** - Multi-region deployment
5. **Fault Tolerant** - Circuit breakers, retries, failover
6. **Observable** - Comprehensive monitoring and tracing

## Service Architecture

### Core Game Services

```
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer                             │
│              (Cloudflare + NGINX)                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┼───────────────────────────────────────┐
│                API Gateway                                  │
│           (Kong/Istio Service Mesh)                         │
│  • Rate Limiting  • Authentication  • Routing              │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
   ┌────▼───┐   ┌────▼───┐    ┌────▼───┐
   │WebSocket│   │  Game  │    │  User  │
   │Gateway  │   │ Engine │    │Service │
   │        │   │        │    │        │
   │10K conn │   │Chess   │    │Profile │
   │per pod  │   │Logic   │    │Rating  │
   └────────┘   └────────┘    └────────┘
```

### WebSocket Gateway (Node.js)
- **Purpose**: Handle 100K+ WebSocket connections
- **Scaling**: 10K connections per pod, auto-scale to 50 pods
- **Technology**: Node.js cluster mode + Redis pub/sub
- **Features**:
  - Connection pooling and management
  - Real-time message routing
  - Rate limiting per connection
  - Health checks and metrics

### Game Engine Service (Go/Rust)
- **Purpose**: Chess move validation, game state management
- **Scaling**: Stateless, CPU-intensive operations
- **Technology**: Go for performance, Chess.js for validation
- **Features**:
  - Move validation and game rules
  - Position analysis integration
  - Game state persistence
  - Real-time broadcasting

### User Service (TypeScript)
- **Purpose**: User management, authentication, ratings
- **Scaling**: Horizontal scaling with caching
- **Technology**: Node.js + TypeScript
- **Features**:
  - JWT-based authentication
  - Glicko-2 rating system
  - User profiles and preferences
  - OAuth integration

### Matchmaking Service (Go)
- **Purpose**: Player pairing and queue management
- **Scaling**: High-throughput queue processing
- **Technology**: Go with Redis-based queues
- **Features**:
  - ELO-based matching
  - Time control preferences
  - Geographic proximity matching
  - Anti-cheat integration

## Data Architecture

### Real-time Data (Redis Cluster)
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Redis Master  │  │   Redis Master  │  │   Redis Master  │
│   Shard 1       │  │   Shard 2       │  │   Shard 3       │
│                 │  │                 │  │                 │
│ • Game States   │  │ • User Sessions │  │ • Matchmaking   │
│ • Move History  │  │ • Player Status │  │ • Pub/Sub       │
│ • Live Games    │  │ • Rate Limits   │  │ • Cache         │
└─────────────────┘  └─────────────────┘  └─────────────────┘
        │                       │                       │
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Redis Replica  │  │  Redis Replica  │  │  Redis Replica  │
│   Shard 1       │  │   Shard 2       │  │   Shard 3       │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

**Sharding Strategy:**
- **Shard 1**: Active game states (game_id % 3 == 0)
- **Shard 2**: User sessions and status (user_id % 3 == 1)
- **Shard 3**: Matchmaking queues and cache (user_id % 3 == 2)

### Persistent Data (PostgreSQL + MongoDB)

#### PostgreSQL Cluster (User Data)
```sql
-- Users table (sharded by user_id)
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    rating_bullet INTEGER DEFAULT 1500,
    rating_blitz INTEGER DEFAULT 1500,
    rating_rapid INTEGER DEFAULT 1500,
    games_played INTEGER DEFAULT 0,
    shard_id INTEGER GENERATED ALWAYS AS (id % 16) STORED
);

-- Sharding by user_id for even distribution
CREATE INDEX idx_users_shard ON users(shard_id, id);
```

#### MongoDB Cluster (Game Data)
```javascript
// Games collection (sharded by game_id)
{
  _id: ObjectId,
  gameId: "uuid",
  players: {
    white: { userId: "uuid", rating: 1600, result: "win" },
    black: { userId: "uuid", rating: 1580, result: "loss" }
  },
  moves: ["e4", "e5", "Nf3", ...],
  timeControl: "1+0",
  startTime: ISODate,
  endTime: ISODate,
  result: "1-0",
  termination: "normal",
  shard: "shard01" // Calculated from gameId
}

// Sharding strategy
sh.shardCollection("chess960.games", { "gameId": 1 })
sh.shardCollection("chess960.moves", { "gameId": 1, "moveNumber": 1 })
```

### Analytics Data (ClickHouse)
```sql
-- High-volume game events for analytics
CREATE TABLE game_events (
    timestamp DateTime64(3),
    game_id String,
    user_id String,
    event_type String, -- 'move', 'game_start', 'game_end', 'connection'
    data String, -- JSON payload
    processing_time_ms UInt32
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (timestamp, game_id)
TTL timestamp + INTERVAL 1 YEAR;
```

## Geographic Distribution

### Multi-Region Deployment
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   US-EAST-1     │  │    EU-WEST-1    │  │   ASIA-PACIFIC  │
│   (Primary)     │  │   (Secondary)   │  │   (Secondary)   │
│                 │  │                 │  │                 │
│ Full Stack      │  │ Full Stack      │  │ Full Stack      │
│ All Services    │  │ All Services    │  │ All Services    │
│ Master DBs      │  │ Read Replicas   │  │ Read Replicas   │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

**Cross-Region Strategy:**
- **Primary Region**: US-East-1 (all writes)
- **Secondary Regions**: Read replicas, local caching
- **Game Routing**: Players matched within region when possible
- **Failover**: Automatic failover to secondary regions

## Scaling Strategy

### Auto-Scaling Configuration

#### WebSocket Gateway
```yaml
# Horizontal Pod Autoscaler
minReplicas: 10    # Always 10 pods minimum
maxReplicas: 100   # Scale up to 100 pods (1M connections)
targetCPU: 70%     # Scale at 70% CPU
targetMemory: 80%  # Scale at 80% memory

# Custom Metrics
- type: External
  external:
    metric:
      name: websocket_connections_per_pod
      selector:
        matchLabels:
          app: websocket-gateway
    target:
      type: AverageValue
      averageValue: "8000"  # Scale at 8K connections per pod
```

#### Game Engine Service
```yaml
minReplicas: 5
maxReplicas: 50
targetCPU: 60%     # CPU-intensive chess calculations

# Custom Metrics
- type: External
  external:
    metric:
      name: active_games_per_pod
      selector:
        matchLabels:
          app: game-engine
    target:
      type: AverageValue
      averageValue: "500"  # Scale at 500 games per pod
```

### Database Scaling

#### Redis Cluster Scaling
- **Horizontal**: Add shards when memory > 80%
- **Vertical**: Scale individual nodes to 32GB RAM
- **Read Replicas**: 2 replicas per shard for read scaling

#### PostgreSQL Scaling
- **Read Replicas**: 5 read replicas per region
- **Connection Pooling**: PgBouncer with 1000 max connections
- **Partitioning**: Monthly partitions for game history

#### MongoDB Scaling
- **Sharding**: Auto-balancing across 16 shards
- **Replica Sets**: 3 members per shard (1 primary + 2 secondaries)
- **Indexes**: Optimized for game queries and leaderboards

## Performance Targets

### Latency Requirements
- **Move Processing**: < 10ms (game engine)
- **WebSocket Message**: < 5ms (gateway to Redis)
- **Database Query**: < 50ms (user operations)
- **Analytics Query**: < 500ms (complex aggregations)

### Throughput Requirements
- **Messages/sec**: 1,000,000 (peak load)
- **Games/sec**: 1,000 new games started
- **Database Ops/sec**: 100,000 (mixed read/write)
- **Cache Hit Rate**: > 95% (Redis)

## Monitoring & Observability

### Metrics Stack
- **Prometheus**: Metrics collection and alerting
- **Grafana**: Dashboards and visualization
- **Jaeger**: Distributed tracing
- **ELK Stack**: Centralized logging

### Key Metrics
- Connection count per WebSocket pod
- Active games per game engine pod
- Database query performance
- Cache hit rates
- Error rates by service
- Geographic distribution of players

### Alerting Rules
```yaml
# High-level alerts
- alert: HighWebSocketConnections
  expr: websocket_connections > 90000
  for: 2m
  labels:
    severity: warning

- alert: GameEngineHighLatency
  expr: game_engine_move_latency_p99 > 100ms
  for: 1m
  labels:
    severity: critical

- alert: DatabaseConnectionsHigh
  expr: postgresql_connections > 800
  for: 1m
  labels:
    severity: warning
```

## Deployment Strategy

### CI/CD Pipeline
1. **Code Push** → GitHub Actions
2. **Build** → Docker images with optimizations
3. **Test** → Integration tests + load tests
4. **Deploy** → Blue-green deployment to staging
5. **Validate** → Automated testing + manual QA
6. **Production** → Rolling deployment with health checks

### Disaster Recovery
- **RTO**: 15 minutes (Recovery Time Objective)
- **RPO**: 5 minutes (Recovery Point Objective)
- **Backups**: Continuous replication + daily snapshots
- **Testing**: Monthly disaster recovery drills

## Cost Optimization

### Resource Efficiency
- **Spot Instances**: 70% of non-critical workloads
- **Reserved Instances**: Database and core services
- **Auto-scaling**: Scale down during off-peak hours
- **Regional Optimization**: Route to cheapest available region

### Estimated Monthly Costs (AWS)
- **Compute**: $15,000 (100 nodes, mixed instance types)
- **Storage**: $5,000 (Databases + Redis + backups)
- **Network**: $2,000 (Inter-region + CDN)
- **Monitoring**: $1,000 (CloudWatch + third-party tools)
- **Total**: ~$23,000/month for 100K concurrent players

## Security Architecture

### Network Security
- **VPC**: Isolated network with private subnets
- **Network Policies**: Kubernetes network segmentation
- **WAF**: Cloudflare Web Application Firewall
- **DDoS Protection**: Cloudflare Pro + rate limiting

### Application Security
- **JWT Tokens**: Signed authentication tokens
- **RBAC**: Role-based access control
- **Secrets Management**: Kubernetes secrets + HashiCorp Vault
- **Container Security**: Distroless images + vulnerability scanning

### Data Security
- **Encryption**: TLS 1.3 in transit, AES-256 at rest
- **Database Security**: Row-level security + audit logging
- **Backup Encryption**: Encrypted backups with key rotation
- **Compliance**: GDPR + CCPA compliance measures

## Migration Strategy

### Phase 1: Infrastructure Setup (Month 1-2)
- Deploy Kubernetes clusters in 3 regions
- Set up Redis + PostgreSQL + MongoDB clusters
- Configure monitoring and logging
- Set up CI/CD pipelines

### Phase 2: Core Services (Month 3-4)
- Deploy WebSocket Gateway
- Deploy Game Engine Service
- Deploy User Service
- Implement basic matchmaking

### Phase 3: Advanced Features (Month 5-6)
- Add analytics service
- Implement advanced matchmaking
- Add anti-cheat systems
- Performance optimization

### Phase 4: Scale Testing (Month 7-8)
- Load testing with 100K simulated players
- Performance tuning and optimization
- Security audits and penetration testing
- Production deployment preparation

This architecture is designed to handle massive scale from day one while maintaining the simplicity and performance that made Chess960 successful.