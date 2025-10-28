#!/bin/bash

# Bullet Chess Production Deployment Script
set -e

echo "🚀 Deploying Bullet Chess to production..."

# Configuration
WEB_DEPLOY=${WEB_DEPLOY:-true}
REALTIME_DEPLOY=${REALTIME_DEPLOY:-true}
BUILD_PACKAGES=${BUILD_PACKAGES:-true}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check dependencies
check_dependency() {
    if ! command -v $1 &> /dev/null; then
        log_error "$1 is required but not installed"
        exit 1
    fi
}

log_info "Checking dependencies..."
check_dependency "pnpm"
check_dependency "docker"

if [ "$WEB_DEPLOY" = true ]; then
    check_dependency "vercel"
fi

if [ "$REALTIME_DEPLOY" = true ]; then
    check_dependency "flyctl"
fi

# Build packages
if [ "$BUILD_PACKAGES" = true ]; then
    log_info "Building packages..."
    pnpm install --frozen-lockfile
    pnpm build
fi

# Deploy web app to Vercel
if [ "$WEB_DEPLOY" = true ]; then
    log_info "Deploying web app to Vercel..."
    
    # Check if logged in
    if ! vercel whoami > /dev/null 2>&1; then
        log_error "Please login to Vercel first: vercel login"
        exit 1
    fi
    
    # Deploy
    cd apps/web
    vercel --prod --yes
    cd ../..
    
    log_info "✅ Web app deployed to Vercel"
fi

# Deploy realtime server to Fly.io
if [ "$REALTIME_DEPLOY" = true ]; then
    log_info "Deploying realtime server to Fly.io..."
    
    # Check if logged in
    if ! flyctl auth whoami > /dev/null 2>&1; then
        log_error "Please login to Fly.io first: flyctl auth login"
        exit 1
    fi
    
    # Deploy
    cd apps/realtime
    
    # Create app if it doesn't exist
    if ! flyctl status > /dev/null 2>&1; then
        log_info "Creating Fly.io app..."
        flyctl apps create bullet-chess-realtime --generate-name
    fi
    
    # Set secrets
    log_info "Setting environment secrets..."
    if [ ! -z "$DATABASE_URL" ]; then
        flyctl secrets set DATABASE_URL="$DATABASE_URL"
    fi
    if [ ! -z "$REDIS_URL" ]; then
        flyctl secrets set REDIS_URL="$REDIS_URL"
    fi
    if [ ! -z "$JWT_SECRET" ]; then
        flyctl secrets set JWT_SECRET="$JWT_SECRET"
    fi
    
    # Deploy
    flyctl deploy --remote-only
    cd ../..
    
    log_info "✅ Realtime server deployed to Fly.io"
fi

# Post-deployment tasks
log_info "Running post-deployment tasks..."

# Run database migrations (if DATABASE_URL is available)
if [ ! -z "$DATABASE_URL" ]; then
    log_info "Running database migrations..."
    pnpm db:migrate --skip-generate
else
    log_warn "DATABASE_URL not set, skipping migrations"
fi

# Health checks
if [ "$WEB_DEPLOY" = true ]; then
    log_info "Checking web app health..."
    WEB_URL=$(vercel ls bullet-chess-web --token=$VERCEL_TOKEN 2>/dev/null | grep "https://" | head -1 | awk '{print $2}' || echo "")
    if [ ! -z "$WEB_URL" ]; then
        if curl -s -o /dev/null -w "%{http_code}" "$WEB_URL" | grep -q "200"; then
            log_info "✅ Web app is healthy: $WEB_URL"
        else
            log_warn "⚠️ Web app health check failed"
        fi
    fi
fi

if [ "$REALTIME_DEPLOY" = true ]; then
    log_info "Checking realtime server health..."
    cd apps/realtime
    REALTIME_URL=$(flyctl info --json | jq -r '.hostname' 2>/dev/null || echo "")
    if [ ! -z "$REALTIME_URL" ]; then
        if curl -s -o /dev/null -w "%{http_code}" "https://$REALTIME_URL:8081/health" | grep -q "200"; then
            log_info "✅ Realtime server is healthy: wss://$REALTIME_URL"
        else
            log_warn "⚠️ Realtime server health check failed"
        fi
    fi
    cd ../..
fi

echo ""
log_info "🎉 Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Update DNS records if needed"
echo "  2. Set up monitoring and alerts" 
echo "  3. Test the application end-to-end"
echo "  4. Monitor logs for any issues"
echo ""
if [ "$WEB_DEPLOY" = true ] && [ "$REALTIME_DEPLOY" = true ]; then
    echo "🔗 Don't forget to update NEXT_PUBLIC_WS_URL in Vercel to point to your Fly.io WebSocket server"
fi