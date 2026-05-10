# Redis Setup Guide - AI Pipeline Agent System

Complete guide for setting up Redis on Windows for the AI Pipeline Agent System.

## Quick Setup (Recommended)

### Option 1: Automated Setup with PowerShell

```powershell
# Run the setup script
cd deploy
.\redis-setup.ps1
```

This will:
- ✅ Check if Docker is running
- ✅ Create Redis container (if not exists)
- ✅ Start Redis
- ✅ Test connection
- ✅ Display connection details

### Option 2: Manual Docker Setup

```powershell
# Create and start Redis container
docker run -d `
  --name vyntrize-redis `
  -p 6379:6379 `
  -v vyntrize-redis-data:/data `
  --restart unless-stopped `
  redis:7-alpine redis-server --appendonly yes

# Test connection
docker exec vyntrize-redis redis-cli ping
# Should return: PONG
```

## Verification

### 1. Check Redis is Running

```powershell
# Check container status
docker ps | Select-String vyntrize-redis

# Should show:
# vyntrize-redis   redis:7-alpine   Up X minutes   0.0.0.0:6379->6379/tcp
```

### 2. Test Redis Connection

```powershell
# Test ping
docker exec vyntrize-redis redis-cli ping
# Expected: PONG

# Check Redis info
docker exec vyntrize-redis redis-cli INFO server

# Test set/get
docker exec vyntrize-redis redis-cli SET test "Hello Redis"
docker exec vyntrize-redis redis-cli GET test
# Expected: "Hello Redis"
```

### 3. Verify Environment Variables

Check that your `.env` files have been updated:

**Root `.env`:**
```bash
REDIS_HOST="localhost"
REDIS_PORT="6379"
OPENAI_API_KEY="sk-your-openai-api-key-here"
```

**`apps/vyntrize-crm/.env`:**
```bash
REDIS_HOST="localhost"
REDIS_PORT="6379"
OPENAI_API_KEY="sk-your-openai-api-key-here"
```

## Redis Management

### Start/Stop Redis

```powershell
# Stop Redis
docker stop vyntrize-redis

# Start Redis
docker start vyntrize-redis

# Restart Redis
docker restart vyntrize-redis
```

### View Logs

```powershell
# View all logs
docker logs vyntrize-redis

# Follow logs in real-time
docker logs -f vyntrize-redis

# View last 50 lines
docker logs --tail 50 vyntrize-redis
```

### Redis CLI

```powershell
# Open Redis CLI
docker exec -it vyntrize-redis redis-cli

# Inside Redis CLI:
> PING                    # Test connection
> INFO                    # View server info
> KEYS *                  # List all keys
> DBSIZE                  # Number of keys
> FLUSHALL                # Clear all data (CAUTION!)
> EXIT                    # Exit CLI
```

### Monitor Redis Activity

```powershell
# Monitor commands in real-time
docker exec -it vyntrize-redis redis-cli MONITOR

# Press Ctrl+C to stop monitoring
```

## Troubleshooting

### Issue: Docker not running

**Error:** `error during connect: This error may indicate that the docker daemon is not running`

**Solution:**
1. Open Docker Desktop
2. Wait for Docker to start (whale icon in system tray)
3. Run setup script again

### Issue: Port 6379 already in use

**Error:** `Bind for 0.0.0.0:6379 failed: port is already allocated`

**Solution:**
```powershell
# Check what's using port 6379
netstat -ano | Select-String ":6379"

# If another Redis is running, stop it
docker ps | Select-String redis
docker stop <container-name>

# Or use a different port
docker run -d `
  --name vyntrize-redis `
  -p 6380:6379 `
  redis:7-alpine

# Update .env files:
REDIS_PORT="6380"
```

### Issue: Container already exists

**Error:** `The container name "/vyntrize-redis" is already in use`

**Solution:**
```powershell
# Start existing container
docker start vyntrize-redis

# Or remove and recreate
docker rm vyntrize-redis
.\redis-setup.ps1
```

### Issue: Redis not responding

**Error:** `Could not connect to Redis at localhost:6379: Connection refused`

**Solution:**
```powershell
# Check if container is running
docker ps | Select-String vyntrize-redis

# Check container logs
docker logs vyntrize-redis

# Restart container
docker restart vyntrize-redis

# Test connection
docker exec vyntrize-redis redis-cli ping
```

### Issue: Permission denied

**Error:** `Permission denied while trying to connect to the Docker daemon socket`

**Solution:**
1. Run PowerShell as Administrator
2. Or restart Docker Desktop
3. Check Docker Desktop settings → General → "Use the WSL 2 based engine"

## Redis Configuration

### Current Configuration

The Redis container is configured with:
- **Version:** Redis 7 (Alpine Linux)
- **Port:** 6379 (mapped to host)
- **Persistence:** AOF (Append Only File) enabled
- **Restart Policy:** unless-stopped
- **Volume:** vyntrize-redis-data (persistent storage)

### Persistence

Data is persisted using AOF (Append Only File):
- Every write operation is logged
- Data survives container restarts
- Located in Docker volume: `vyntrize-redis-data`

### Memory Management

Redis will use available memory. To limit:

```powershell
# Stop container
docker stop vyntrize-redis

# Remove container
docker rm vyntrize-redis

# Create with memory limit (e.g., 512MB)
docker run -d `
  --name vyntrize-redis `
  -p 6379:6379 `
  -v vyntrize-redis-data:/data `
  --memory="512m" `
  --restart unless-stopped `
  redis:7-alpine redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru
```

## Testing with Agent System

### 1. Start Redis

```powershell
docker start vyntrize-redis
```

### 2. Start CRM Application

```powershell
cd apps/vyntrize-crm
pnpm dev
```

### 3. Check Logs

Look for these messages:
```
[AgentSystem] Initializing agent system...
[JobScheduler] Registered agent: LeadScoringAgent
[AgentSystem] Agent system initialized successfully
```

### 4. Test Health Endpoint

```powershell
# In a new terminal
curl http://localhost:3014/api/agents/health
```

Expected response:
```json
{
  "status": "healthy",
  "components": {
    "agentRegistry": {
      "status": "healthy",
      "initialized": true
    },
    "jobQueue": {
      "status": "healthy",
      "metrics": {
        "waiting": 0,
        "active": 0,
        "completed": 0,
        "failed": 0
      }
    },
    "openAI": {
      "status": "healthy",
      "circuitOpen": false
    }
  }
}
```

### 5. Monitor Redis Activity

```powershell
# In a new terminal
docker exec -it vyntrize-redis redis-cli MONITOR

# You should see BullMQ operations:
# "ZADD" "bull:agent-jobs:..."
# "HSET" "bull:agent-jobs:..."
```

## Production Considerations

### Security

For production, consider:

1. **Password Protection:**
```powershell
docker run -d `
  --name vyntrize-redis `
  -p 6379:6379 `
  -v vyntrize-redis-data:/data `
  --restart unless-stopped `
  redis:7-alpine redis-server --appendonly yes --requirepass "your-secure-password"

# Update .env:
REDIS_PASSWORD="your-secure-password"
```

2. **Network Isolation:**
- Don't expose port 6379 to public internet
- Use Docker networks for container-to-container communication
- Use firewall rules to restrict access

3. **TLS/SSL:**
- Use Redis with TLS for encrypted connections
- Configure stunnel or use Redis Enterprise

### Monitoring

Monitor Redis health:

```powershell
# Memory usage
docker exec vyntrize-redis redis-cli INFO memory

# Stats
docker exec vyntrize-redis redis-cli INFO stats

# Clients
docker exec vyntrize-redis redis-cli CLIENT LIST
```

### Backup

Backup Redis data:

```powershell
# Create backup
docker exec vyntrize-redis redis-cli BGSAVE

# Copy RDB file
docker cp vyntrize-redis:/data/dump.rdb ./redis-backup-$(Get-Date -Format "yyyyMMdd-HHmmss").rdb

# Or backup entire volume
docker run --rm -v vyntrize-redis-data:/data -v ${PWD}:/backup alpine tar czf /backup/redis-backup.tar.gz /data
```

## Useful Commands Reference

```powershell
# Container Management
docker ps                                    # List running containers
docker ps -a                                 # List all containers
docker start vyntrize-redis                  # Start Redis
docker stop vyntrize-redis                   # Stop Redis
docker restart vyntrize-redis                # Restart Redis
docker logs vyntrize-redis                   # View logs
docker logs -f vyntrize-redis                # Follow logs
docker exec -it vyntrize-redis sh            # Shell access

# Redis Commands
docker exec vyntrize-redis redis-cli PING                    # Test connection
docker exec vyntrize-redis redis-cli INFO                    # Server info
docker exec vyntrize-redis redis-cli KEYS *                  # List keys
docker exec vyntrize-redis redis-cli DBSIZE                  # Count keys
docker exec vyntrize-redis redis-cli GET key                 # Get value
docker exec vyntrize-redis redis-cli SET key value           # Set value
docker exec vyntrize-redis redis-cli DEL key                 # Delete key
docker exec vyntrize-redis redis-cli FLUSHALL                # Clear all (CAUTION!)
docker exec -it vyntrize-redis redis-cli MONITOR             # Monitor commands

# Volume Management
docker volume ls                             # List volumes
docker volume inspect vyntrize-redis-data    # Inspect volume
docker volume rm vyntrize-redis-data         # Remove volume (CAUTION!)

# Cleanup
docker stop vyntrize-redis                   # Stop container
docker rm vyntrize-redis                     # Remove container
docker volume rm vyntrize-redis-data         # Remove data (CAUTION!)
```

## Next Steps

After Redis is set up:

1. ✅ Redis running and tested
2. ⏳ Configure OpenAI API key
3. ⏳ Apply database migration
4. ⏳ Start CRM application
5. ⏳ Test agent system

See `QUICKSTART.md` for complete setup guide.

---

**Redis Setup Status:**
- [x] Setup scripts created
- [x] Environment variables configured
- [ ] Redis container running
- [ ] Connection tested
- [ ] Agent system verified
