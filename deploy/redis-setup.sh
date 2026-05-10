#!/bin/bash
# Redis Setup Script for AI Pipeline Agent System

echo "🚀 Setting up Redis for AI Pipeline Agent System..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Check if Redis container already exists
if docker ps -a --format '{{.Names}}' | grep -q "^vyntrize-redis$"; then
    echo "📦 Redis container 'vyntrize-redis' already exists"
    
    # Check if it's running
    if docker ps --format '{{.Names}}' | grep -q "^vyntrize-redis$"; then
        echo "✅ Redis is already running"
    else
        echo "🔄 Starting existing Redis container..."
        docker start vyntrize-redis
        echo "✅ Redis started"
    fi
else
    echo "📦 Creating new Redis container..."
    docker run -d \
        --name vyntrize-redis \
        -p 6379:6379 \
        -v vyntrize-redis-data:/data \
        --restart unless-stopped \
        redis:7-alpine redis-server --appendonly yes
    
    echo "✅ Redis container created and started"
fi

echo ""
echo "🔍 Testing Redis connection..."
sleep 2

# Test Redis connection
if docker exec vyntrize-redis redis-cli ping | grep -q "PONG"; then
    echo "✅ Redis is responding correctly"
else
    echo "❌ Redis is not responding. Please check the container logs:"
    echo "   docker logs vyntrize-redis"
    exit 1
fi

echo ""
echo "📊 Redis Info:"
docker exec vyntrize-redis redis-cli INFO server | grep -E "redis_version|os|arch"

echo ""
echo "✅ Redis setup complete!"
echo ""
echo "📝 Connection details:"
echo "   Host: localhost"
echo "   Port: 6379"
echo "   Container: vyntrize-redis"
echo ""
echo "🔧 Useful commands:"
echo "   Check status:  docker ps | grep vyntrize-redis"
echo "   View logs:     docker logs vyntrize-redis"
echo "   Stop Redis:    docker stop vyntrize-redis"
echo "   Start Redis:   docker start vyntrize-redis"
echo "   Redis CLI:     docker exec -it vyntrize-redis redis-cli"
echo "   Test ping:     docker exec vyntrize-redis redis-cli ping"
echo ""
