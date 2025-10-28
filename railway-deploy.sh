#!/bin/bash
# Railway deployment script

echo "🚀 Deploying to Railway..."

# Login to Railway (if not already logged in)
railway login

# Create new project (if doesn't exist)
railway new bullet-chess-realtime

# Set environment variables
railway variables set NODE_ENV=production
railway variables set WS_PORT=8080
railway variables set HEALTH_PORT=8081

# Deploy
railway up

echo "✅ Deployment complete!"
echo "Check your Railway dashboard for the live URL"