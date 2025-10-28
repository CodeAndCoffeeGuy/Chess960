#!/bin/bash

# Bullet Chess Development Setup Script
set -e

echo "🚀 Setting up Bullet Chess development environment..."

# Check dependencies
check_dependency() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is not installed. Please install it first."
        echo "   Visit: $2"
        exit 1
    else
        echo "✅ $1 found"
    fi
}

echo "🔍 Checking dependencies..."
check_dependency "node" "https://nodejs.org/"
check_dependency "pnpm" "https://pnpm.io/installation"
check_dependency "docker" "https://docs.docker.com/get-docker/"

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ $NODE_VERSION -lt 18 ]; then
    echo "❌ Node.js version must be 18 or higher (current: $NODE_VERSION)"
    exit 1
fi
echo "✅ Node.js version: $(node -v)"

# Check pnpm version
PNPM_VERSION=$(pnpm -v | cut -d'.' -f1)
if [ $PNPM_VERSION -lt 8 ]; then
    echo "❌ pnpm version must be 8 or higher (current: $(pnpm -v))"
    exit 1
fi
echo "✅ pnpm version: $(pnpm -v)"

# Setup environment
echo "📝 Setting up environment..."
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo "✅ Created .env.local from template"
else
    echo "✅ .env.local already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Start databases
echo "🐳 Starting databases with Docker..."
docker compose -f docker-compose.dev.yml up -d

# Wait for databases to be ready
echo "⏳ Waiting for databases to be ready..."
echo "   Postgres..."
until docker exec bullet-chess-db pg_isready -U postgres > /dev/null 2>&1; do
    sleep 1
done
echo "   Redis..."
until docker exec bullet-chess-redis redis-cli ping > /dev/null 2>&1; do
    sleep 1
done
echo "✅ Databases are ready"

# Setup database
echo "🗄️  Setting up database..."
pnpm db:generate
pnpm db:migrate

echo "✅ Database setup complete"

# Print success message
echo ""
echo "🎉 Setup complete! You can now:"
echo ""
echo "   Start development servers:"
echo "   $ pnpm dev"
echo ""
echo "   Or start services individually:"
echo "   $ pnpm --filter @bullet-chess/web dev          # Web app (http://localhost:3000)"
echo "   $ pnpm --filter @bullet-chess/realtime dev     # WebSocket server (ws://localhost:8080)"
echo ""
echo "   Database tools:"
echo "   $ pnpm db:studio                              # Open Prisma Studio"
echo "   $ docker compose -f docker-compose.dev.yml up pgadmin -d   # PostgreSQL GUI"
echo "   $ docker compose -f docker-compose.dev.yml up redis-commander -d # Redis GUI"
echo ""
echo "   Useful URLs:"
echo "   - Web app: http://localhost:3000"
echo "   - Health check: http://localhost:8081/health"
echo "   - Prisma Studio: http://localhost:5555"
echo "   - PgAdmin (optional): http://localhost:8083 (admin@bullet-chess.com / admin)"
echo "   - Redis Commander (optional): http://localhost:8082"
echo ""
echo "🏁 Happy coding! ♟️"