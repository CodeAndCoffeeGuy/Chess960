#!/bin/bash

# Load testing script for Bullet Chess
# Tests scaling capabilities up to 100K+ concurrent connections

set -e

echo "🧪 Starting Bullet Chess scale test..."

# Configuration
WEBSOCKET_ENDPOINT="wss://ws.bulletchess.org"
MAX_CONNECTIONS=100000
RAMP_UP_DURATION=600  # 10 minutes
TEST_DURATION=1800    # 30 minutes

# Check prerequisites
command -v artillery >/dev/null 2>&1 || {
    echo "Installing artillery..."
    npm install -g artillery@latest
}

# Create artillery configuration
cat > artillery-config.yml << EOF
config:
  target: '${WEBSOCKET_ENDPOINT}'
  phases:
    # Warm-up phase
    - duration: 60
      arrivalRate: 100
      name: "Warm-up"

    # Gradual ramp-up to 10K users
    - duration: 300
      arrivalRate: 100
      rampTo: 1000
      name: "Ramp to 10K"

    # Sustained 10K users
    - duration: 300
      arrivalRate: 1000
      name: "Sustain 10K"

    # Ramp to 50K users
    - duration: 600
      arrivalRate: 1000
      rampTo: 5000
      name: "Ramp to 50K"

    # Sustained 50K users
    - duration: 600
      arrivalRate: 5000
      name: "Sustain 50K"

    # Final push to 100K users
    - duration: 600
      arrivalRate: 5000
      rampTo: 10000
      name: "Push to 100K"

    # Sustained 100K users
    - duration: 1800
      arrivalRate: 10000
      name: "Sustain 100K"

scenarios:
  - name: "WebSocket Chess Player"
    weight: 100
    engine: ws
    beforeScenario: "authenticateUser"
    afterScenario: "cleanupUser"

beforeScenario:
  - authenticateUser

afterScenario:
  - cleanupUser
EOF

# Create artillery scenario
cat > artillery-scenario.js << 'EOF'
module.exports = {
  authenticateUser: function(context, events, done) {
    // Generate random user credentials
    context.vars.userId = Math.random().toString(36).substring(7);
    context.vars.gameId = null;
    return done();
  },

  cleanupUser: function(context, events, done) {
    // Cleanup logic
    return done();
  },

  // WebSocket scenario
  wsConnect: function(ws, done) {
    ws.on('open', function() {
      // Send hello message
      ws.send(JSON.stringify({
        type: 'hello',
        data: { version: '1.0' }
      }));
    });

    ws.on('message', function(data) {
      const message = JSON.parse(data);

      switch(message.type) {
        case 'auth_required':
          // Send auth message
          ws.send(JSON.stringify({
            type: 'auth',
            data: {
              token: 'test-token-' + Math.random().toString(36),
              userId: this.userId
            }
          }));
          break;

        case 'auth_success':
          // Request to join matchmaking
          ws.send(JSON.stringify({
            type: 'find_game',
            data: {
              timeControl: '1+0',
              rating: Math.floor(Math.random() * 2000) + 1000
            }
          }));
          break;

        case 'game_found':
          this.gameId = message.data.gameId;
          // Simulate game moves
          setTimeout(() => {
            ws.send(JSON.stringify({
              type: 'move',
              data: {
                gameId: this.gameId,
                move: 'e2e4'
              }
            }));
          }, Math.random() * 5000);
          break;

        case 'move_made':
          // Random response move
          setTimeout(() => {
            const moves = ['e7e5', 'd7d6', 'g8f6', 'b8c6'];
            ws.send(JSON.stringify({
              type: 'move',
              data: {
                gameId: this.gameId,
                move: moves[Math.floor(Math.random() * moves.length)]
              }
            }));
          }, Math.random() * 10000);
          break;
      }
    });

    ws.on('close', function() {
      // Connection closed
    });

    return done();
  }
};
EOF

# Create monitoring script
cat > monitor-scale-test.sh << 'EOF'
#!/bin/bash

echo "📊 Monitoring scale test metrics..."

while true; do
    echo "=== $(date) ==="
    echo "Pod status:"
    kubectl get pods -n bullet-chess -o wide | grep websocket-gateway

    echo "Scaling status:"
    kubectl get hpa -n bullet-chess

    echo "Resource usage:"
    kubectl top pods -n bullet-chess --sort-by=cpu

    echo "WebSocket connections (if metrics available):"
    kubectl exec -n bullet-chess deployment/websocket-gateway -- curl -s localhost:9090/metrics | grep websocket_connections_total || echo "Metrics not available"

    echo "Cluster nodes:"
    kubectl get nodes --no-headers | wc -l

    echo "========================="
    sleep 30
done
EOF

chmod +x monitor-scale-test.sh

echo "🚀 Starting load test..."
echo "Monitor in another terminal with: ./monitor-scale-test.sh"
echo ""

# Start monitoring in background
./monitor-scale-test.sh &
MONITOR_PID=$!

# Run the actual load test
artillery run artillery-config.yml --scenario artillery-scenario.js

# Stop monitoring
kill $MONITOR_PID

echo "✅ Scale test completed!"
echo ""
echo "📊 Check results:"
echo "   - Grafana dashboards: kubectl port-forward svc/grafana -n monitoring 3000:3000"
echo "   - Prometheus metrics: kubectl port-forward svc/prometheus -n monitoring 9090:9090"
echo "   - Pod logs: kubectl logs -f deployment/websocket-gateway -n bullet-chess"