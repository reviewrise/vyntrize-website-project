# Redis Setup - COMPLETE ✅

**Date:** May 7, 2026  
**Status:** ✅ Redis Successfully Configured

## Setup Summary

Redis has been successfully set up for the AI Pipeline Agent System!

### Container Details

- **Container Name:** vyntrize-redis
- **Image:** redis:7-alpine
- **Redis Version:** 7.4.9
- **Status:** Running
- **Port:** 6379 (mapped to localhost:6379)
- **Persistence:** AOF (Append Only File) enabled
- **Restart Policy:** unless-stopped
- **Volume:** vyntrize-redis-data

### Connection Details

```
Host: localhost
Port: 6379
Container: vyntrize-redis
```

### Verification Tests ✅

All tests passed:

1. ✅ **Container Running**
   ```
   docker ps | grep vyntrize-redis
   Status: Up and running
   ```

2. ✅ **Redis Responding**
   ```
   docker exec vyntrize-redis redis-cli ping
   Response: PONG
   ```

3. ✅ **Read/Write Operations**
   ```
   SET test "Hello from AI Pipeline Agent System"
   GET test
   Response: "Hello from AI Pipeline Agent System"
   ```

4. ✅ **Server Information**
   ```
   Redis Version: 7.4.9
   OS: Linux (WSL2)
   Architecture: 64-bit
   ```

### Environment Configuration ✅

Your `.env` files have been updated with Redis configuration:

**Root `.env`:**
```bash
REDIS_HOST="localhost"
REDIS_PORT="6379"
OPENAI_API_KEY="sk-your-openai-api-key-here"  # ⚠️ NEEDS CONFIGURATION
```

**`apps/vyntrize-crm/.env`:**
```bash
REDIS_HOST="localhost"
REDIS_PORT="6379"
OPENAI_API_KEY="sk-your-openai-api-key-here"  # ⚠️ NEEDS CONFIGURATION
```

## Next Steps

### 1. Configure OpenAI API Key ⏳

Get your API key from: https://platform.openai.com/api-keys

Then update both `.env` files:
```bash
OPENAI_API_KEY="sk-your-actual-api-key-here"
```

### 2. Apply Database Migration ⏳

```bash
cd packages/@platform/vyntrize-db
npx prisma migrate deploy
npx prisma generate
```

### 3. Start the CRM Application ⏳

```bash
cd apps/vyntrize-crm
pnpm dev
```

Look for these log messages:
```
[AgentSystem] Initializing agent system...
[AgentRegistry] Registering all agents...
[EventBus] Registered LeadScoringAgent for lead_created
[JobScheduler] Registered agent: LeadScoringAgent
[AgentSystem] Agent system initialized successfully
```

### 4. Verify Agent System ⏳

Test the health endpoint:
```bash
curl http://localhost:3014/api/agents/health
```

Expected response:
```json
{
  "status": "healthy",
  "components": {
    "agentRegistry": { "status": "healthy", "initialized": true },
    "jobQueue": { "status": "healthy", "metrics": {...} },
    "openAI": { "status": "healthy", "circuitOpen": false }
  }
}
```

## Redis Management Commands

### Daily Operations

```bash
# Check status
docker ps | grep vyntrize-redis

# View logs
docker logs vyntrize-redis
docker logs -f vyntrize-redis  # Follow logs

# Restart Redis
docker restart vyntrize-redis

# Stop Redis
docker stop vyntrize-redis

# Start Redis
docker start vyntrize-redis
```

### Redis CLI

```bash
# Open Redis CLI
docker exec -it vyntrize-redis redis-cli

# Inside CLI:
PING                    # Test connection
INFO                    # Server info
KEYS *                  # List all keys
DBSIZE                  # Count keys
GET key                 # Get value
SET key value           # Set value
DEL key                 # Delete key
MONITOR                 # Watch commands in real-time
EXIT                    # Exit CLI
```

### Monitoring

```bash
# Memory usage
docker exec vyntrize-redis redis-cli INFO memory

# Stats
docker exec vyntrize-redis redis-cli INFO stats

# Connected clients
docker exec vyntrize-redis redis-cli CLIENT LIST

# Monitor commands in real-time
docker exec -it vyntrize-redis redis-cli MONITOR
```

### Backup

```bash
# Create backup
docker exec vyntrize-redis redis-cli BGSAVE

# Copy backup file
docker cp vyntrize-redis:/data/dump.rdb ./redis-backup-$(date +%Y%m%d-%H%M%S).rdb
```

## Troubleshooting

### If Redis stops responding

```bash
# Check container status
docker ps -a | grep vyntrize-redis

# View logs for errors
docker logs vyntrize-redis

# Restart container
docker restart vyntrize-redis

# Test connection
docker exec vyntrize-redis redis-cli ping
```

### If you need to reset Redis

```bash
# Clear all data (CAUTION!)
docker exec vyntrize-redis redis-cli FLUSHALL

# Or recreate container
docker stop vyntrize-redis
docker rm vyntrize-redis
docker run -d --name vyntrize-redis -p 6379:6379 -v vyntrize-redis-data:/data --restart unless-stopped redis:7-alpine redis-server --appendonly yes
```

### If port 6379 is in use

```bash
# Check what's using the port
netstat -ano | findstr :6379

# Use a different port
docker run -d --name vyntrize-redis -p 6380:6379 -v vyntrize-redis-data:/data --restart unless-stopped redis:7-alpine redis-server --appendonly yes

# Update .env files:
REDIS_PORT="6380"
```

## What Redis is Used For

The AI Pipeline Agent System uses Redis for:

1. **Job Queue (BullMQ)**
   - Scheduled agent jobs (daily scoring, stagnation detection)
   - Job retry logic
   - Job metrics and monitoring

2. **Future Use Cases**
   - Caching agent recommendations
   - Rate limiting
   - Session storage
   - Real-time analytics

## Performance

### Current Configuration

- **Memory:** Unlimited (will use available memory)
- **Persistence:** AOF (every write is logged)
- **Eviction Policy:** None (no automatic key eviction)

### Expected Usage

For 100 leads with normal agent activity:
- Memory usage: ~10-50 MB
- Disk usage: ~5-20 MB
- CPU usage: < 1%

### Monitoring Recommendations

Monitor these metrics:
- Memory usage: `docker exec vyntrize-redis redis-cli INFO memory | grep used_memory_human`
- Connected clients: `docker exec vyntrize-redis redis-cli CLIENT LIST | wc -l`
- Operations per second: `docker exec vyntrize-redis redis-cli INFO stats | grep instantaneous_ops_per_sec`

## Security Notes

### Current Setup (Development)

- ✅ Running in Docker container
- ✅ Persistent storage
- ✅ Auto-restart enabled
- ⚠️ No password (localhost only)
- ⚠️ Port exposed to localhost

### Production Recommendations

For production deployment:

1. **Add Password Protection:**
   ```bash
   docker run -d --name vyntrize-redis -p 6379:6379 -v vyntrize-redis-data:/data --restart unless-stopped redis:7-alpine redis-server --appendonly yes --requirepass "your-secure-password"
   ```

2. **Use Docker Networks:**
   - Don't expose port to host
   - Use container-to-container communication

3. **Enable TLS:**
   - Use Redis with TLS/SSL
   - Or use stunnel for encryption

4. **Firewall Rules:**
   - Block external access to port 6379
   - Allow only application servers

## Deployment Status

### Completed ✅

- [x] Redis container created
- [x] Redis running and tested
- [x] Connection verified
- [x] Read/write operations tested
- [x] Environment variables configured
- [x] Documentation created

### Remaining ⏳

- [ ] OpenAI API key configured
- [ ] Database migration applied
- [ ] CRM application started
- [ ] Agent system verified
- [ ] Integration testing

## Support

For Redis issues:
1. Check container logs: `docker logs vyntrize-redis`
2. Test connection: `docker exec vyntrize-redis redis-cli ping`
3. Verify port: `netstat -ano | findstr :6379`
4. Restart container: `docker restart vyntrize-redis`
5. Check Docker Desktop is running

For more help, see:
- `REDIS_SETUP.md` - Detailed setup guide
- `QUICKSTART.md` - Complete system setup
- `TROUBLESHOOTING.md` - Common issues

---

**Redis Setup Status:** ✅ COMPLETE

**Next:** Configure OpenAI API Key → Apply Database Migration → Start Application
