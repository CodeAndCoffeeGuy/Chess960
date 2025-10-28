#!/bin/bash

# Bullet Chess Production Deployment Script
# Deploys the complete microservices architecture for 100K+ players

set -e

echo "🚀 Starting Bullet Chess Production Deployment..."

# Check prerequisites
echo "Checking prerequisites..."
command -v kubectl >/dev/null 2>&1 || { echo "kubectl is required but not installed. Aborting." >&2; exit 1; }
command -v helm >/dev/null 2>&1 || { echo "helm is required but not installed. Aborting." >&2; exit 1; }

# Create namespaces
echo "Creating namespaces..."
kubectl create namespace bullet-chess --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -

# Deploy Redis Cluster
echo "Deploying Redis cluster..."
kubectl apply -f redis-cluster.yaml

# Wait for Redis to be ready
echo "Waiting for Redis cluster to be ready..."
kubectl wait --for=condition=ready pod -l app=redis-cluster -n bullet-chess --timeout=300s

# Deploy PostgreSQL
echo "Deploying PostgreSQL..."
kubectl apply -f postgres-cluster.yaml

# Deploy MongoDB
echo "Deploying MongoDB..."
kubectl apply -f mongodb-cluster.yaml

# Deploy RabbitMQ
echo "Deploying RabbitMQ..."
kubectl apply -f rabbitmq-cluster.yaml

# Wait for databases to be ready
echo "Waiting for databases to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres-cluster -n bullet-chess --timeout=300s
kubectl wait --for=condition=ready pod -l app=mongodb-cluster -n bullet-chess --timeout=300s
kubectl wait --for=condition=ready pod -l app=rabbitmq-cluster -n bullet-chess --timeout=300s

# Deploy monitoring stack
echo "Deploying monitoring stack..."
kubectl apply -f monitoring-stack.yaml

# Deploy Istio gateway and services
echo "Deploying Istio configuration..."
kubectl apply -f istio-gateway.yaml

# Deploy microservices
echo "Deploying WebSocket gateway..."
kubectl apply -f websocket-gateway.yaml

echo "Deploying game engine..."
kubectl apply -f game-engine.yaml

echo "Deploying user service..."
kubectl apply -f user-service.yaml

echo "Deploying matchmaking service..."
kubectl apply -f matchmaking-service.yaml

echo "Deploying web frontend..."
kubectl apply -f web-frontend.yaml

# Deploy autoscaling configuration
echo "Deploying auto-scaling configuration..."
kubectl apply -f cluster-autoscaler.yaml

# Wait for all deployments to be ready
echo "Waiting for all services to be ready..."
kubectl wait --for=condition=available deployment --all -n bullet-chess --timeout=600s

# Deploy HTTPS certificates
echo "Setting up HTTPS certificates..."
kubectl apply -f https-certificates.yaml

# Configure DNS (placeholder - replace with your DNS provider)
echo "⚠️  Configure DNS to point to your load balancer:"
kubectl get svc istio-ingressgateway -n istio-system -o jsonpath='{.status.loadBalancer.ingress[0].ip}'

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Access your services:"
echo "   - Game: https://bulletchess.org"
echo "   - WebSocket: wss://ws.bulletchess.org"
echo "   - Grafana: kubectl port-forward svc/grafana -n monitoring 3000:3000"
echo "   - Prometheus: kubectl port-forward svc/prometheus -n monitoring 9090:9090"
echo ""
echo "🔍 Monitor deployment:"
echo "   kubectl get pods -n bullet-chess"
echo "   kubectl logs -f deployment/websocket-gateway -n bullet-chess"