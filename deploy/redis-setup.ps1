# Redis Setup Script for AI Pipeline Agent System (PowerShell)

Write-Host "🚀 Setting up Redis for AI Pipeline Agent System..." -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop and try again." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Check if Redis container already exists
$existingContainer = docker ps -a --format "{{.Names}}" | Select-String -Pattern "^vyntrize-redis$"

if ($existingContainer) {
    Write-Host "📦 Redis container 'vyntrize-redis' already exists" -ForegroundColor Yellow
    
    # Check if it's running
    $runningContainer = docker ps --format "{{.Names}}" | Select-String -Pattern "^vyntrize-redis$"
    
    if ($runningContainer) {
        Write-Host "✅ Redis is already running" -ForegroundColor Green
    } else {
        Write-Host "🔄 Starting existing Redis container..." -ForegroundColor Yellow
        docker start vyntrize-redis
        Write-Host "✅ Redis started" -ForegroundColor Green
    }
} else {
    Write-Host "📦 Creating new Redis container..." -ForegroundColor Yellow
    docker run -d `
        --name vyntrize-redis `
        -p 6379:6379 `
        -v vyntrize-redis-data:/data `
        --restart unless-stopped `
        redis:7-alpine redis-server --appendonly yes
    
    Write-Host "✅ Redis container created and started" -ForegroundColor Green
}

Write-Host ""
Write-Host "🔍 Testing Redis connection..." -ForegroundColor Cyan
Start-Sleep -Seconds 2

# Test Redis connection
$pingResult = docker exec vyntrize-redis redis-cli ping 2>&1

if ($pingResult -match "PONG") {
    Write-Host "✅ Redis is responding correctly" -ForegroundColor Green
} else {
    Write-Host "❌ Redis is not responding. Please check the container logs:" -ForegroundColor Red
    Write-Host "   docker logs vyntrize-redis" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📊 Redis Info:" -ForegroundColor Cyan
docker exec vyntrize-redis redis-cli INFO server | Select-String -Pattern "redis_version|os|arch"

Write-Host ""
Write-Host "✅ Redis setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Connection details:" -ForegroundColor Cyan
Write-Host "   Host: localhost" -ForegroundColor White
Write-Host "   Port: 6379" -ForegroundColor White
Write-Host "   Container: vyntrize-redis" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Useful commands:" -ForegroundColor Cyan
Write-Host "   Check status:  docker ps | Select-String vyntrize-redis" -ForegroundColor White
Write-Host "   View logs:     docker logs vyntrize-redis" -ForegroundColor White
Write-Host "   Stop Redis:    docker stop vyntrize-redis" -ForegroundColor White
Write-Host "   Start Redis:   docker start vyntrize-redis" -ForegroundColor White
Write-Host "   Redis CLI:     docker exec -it vyntrize-redis redis-cli" -ForegroundColor White
Write-Host "   Test ping:     docker exec vyntrize-redis redis-cli ping" -ForegroundColor White
Write-Host ""
