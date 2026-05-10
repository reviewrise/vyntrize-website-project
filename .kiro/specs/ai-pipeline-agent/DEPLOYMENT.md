# AI Pipeline Agent System - Deployment Guide

Complete deployment guide for production environments.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Local Development Setup](#local-development-setup)
3. [Staging Deployment](#staging-deployment)
4. [Production Deployment](#production-deployment)
5. [Docker Deployment](#docker-deployment)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Rollback Procedures](#rollback-procedures)
8. [Monitoring Setup](#monitoring-setup)

## Pre-Deployment Checklist

### Infrastructure Requirements

- [ ] PostgreSQL 14+ database accessible
- [ ] Redis 6+ server accessible
- [ ] OpenAI API account with valid API key
- [ ] Node.js 18+ runtime environment
- [ ] Sufficient memory (minimum 512MB for agent system)
- [ ] Network access to external services (OpenAI API)

### Configuration Requirements

- [ ] Environment variables documented
- [ ] Database migration tested
- [ ] Redis connection tested
- [ ] OpenAI API key validated
- [ ] Session secret generated (32+ characters)
- [ ] SSL certificates (production only)

### Code Requirements

- [ ] All TypeScript files compile without errors
- [ ] Dependencies installed (`pnpm install`)
- [ ] Build succeeds (`pnpm build`)
- [ ] No critical security vulnerabilities (`pnpm audit`)

## Local Development Setup

### 1. Install Redis

**macOS:**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

**Docker:**
```bash
docker run -d -p 6379:6379 --name redis redis:7-alpine
```

### 2. Configure Environment

Create or update `apps/vyntrize-crm/.env`:

```bash
# Database (already configured)
CRM_DATABASE_URL="postgresql://vyntrize_user:vyntrize_password@localhost:5432/vyntrize_db"

# Session
SESSION_SECRET="your-super-secret-session-key-min-32-chars-here"

# Redis
REDIS_HOST="localhost"
REDIS_PORT="6379"

# OpenAI
OPENAI_API_KEY="sk-your-openai-api-key-here"

# Agent Configuration (optional)
AGENT_LEAD_SCORING_ENABLED="true"
AGENT_TASK_AUTOMATION_ENABLED="true"
AGENT_STAGNATION_DETECTION_ENABLED="true"
AGENT_EMAIL_GENERATION_ENABLED="true"
AGENT_NEXT_BEST_ACTION_ENABLED="true"
AGENT_JOB_CONCURRENCY="5"

# Environment
NODE_ENV="development"
```

### 3. Apply Database Migration

```bash
cd packages/@platform/vyntrize-db
npx prisma migrate deploy
npx prisma generate
```

### 4. Start Development Server

```bash
cd apps/vyntrize-crm
pnpm dev
```

### 5. Verify Installation

Check logs for:
```
[AgentSystem] Initializing agent system...
[AgentRegistry] Registering all agents...
[AgentSystem] Agent system initialized successfully
```

Test health endpoint:
```bash
curl http://localhost:3014/api/agents/health
```

## Staging Deployment

### 1. Prepare Staging Environment

**Infrastructure:**
- Provision staging database (PostgreSQL)
- Provision staging Redis instance
- Set up staging domain/subdomain

**Environment Variables:**
```bash
# Staging environment file
NODE_ENV="production"
CRM_DATABASE_URL="postgresql://user:pass@staging-db:5432/vyntrize_db"
REDIS_HOST="staging-redis.example.com"
REDIS_PORT="6379"
OPENAI_API_KEY="sk-staging-key"
SESSION_SECRET="staging-secret-min-32-chars"

# Agent Configuration
AGENT_LEAD_SCORING_ENABLED="true"
AGENT_TASK_AUTOMATION_ENABLED="true"
AGENT_STAGNATION_DETECTION_ENABLED="true"
AGENT_EMAIL_GENERATION_ENABLED="true"
AGENT_NEXT_BEST_ACTION_ENABLED="true"
AGENT_JOB_CONCURRENCY="3"
```

### 2. Deploy Application

**Build:**
```bash
cd apps/vyntrize-crm
pnpm install --frozen-lockfile
pnpm build
```

**Apply Migration:**
```bash
cd packages/@platform/vyntrize-db
npx prisma migrate deploy
```

**Start Application:**
```bash
cd apps/vyntrize-crm
pnpm start
```

### 3. Smoke Tests

Run basic smoke tests:

```bash
# Health check
curl https://staging.example.com/api/agents/health

# Trigger test
curl -X POST https://staging.example.com/api/agents/trigger \
  -H "Content-Type: application/json" \
  -H "Cookie: crm_session=..." \
  -d '{"agentType":"LEAD_SCORING","leadId":"test-lead-id"}'

# Check metrics
curl https://staging.example.com/api/agents/metrics?days=1
```

### 4. Integration Testing

- Create test lead → Verify scoring
- Change lead stage → Verify task creation
- Wait 24 hours → Verify scheduled jobs run
- Test email generation → Verify AI response
- Test next best action → Verify recommendations

## Production Deployment

### 1. Pre-Production Checklist

- [ ] Staging tests passed
- [ ] Database backup created
- [ ] Rollback plan documented
- [ ] Monitoring configured
- [ ] Alerts configured
- [ ] Team notified
- [ ] Maintenance window scheduled (if needed)

### 2. Production Environment Variables

```bash
# Production environment file
NODE_ENV="production"
CRM_DATABASE_URL="postgresql://user:pass@prod-db:5432/vyntrize_db"
REDIS_HOST="prod-redis.example.com"
REDIS_PORT="6379"
OPENAI_API_KEY="sk-production-key"
SESSION_SECRET="production-secret-min-32-chars-CHANGE-THIS"

# Agent Configuration
AGENT_LEAD_SCORING_ENABLED="true"
AGENT_TASK_AUTOMATION_ENABLED="true"
AGENT_STAGNATION_DETECTION_ENABLED="true"
AGENT_EMAIL_GENERATION_ENABLED="true"
AGENT_NEXT_BEST_ACTION_ENABLED="true"
AGENT_JOB_CONCURRENCY="5"

# Optional: Disable specific agents if needed
# AGENT_EMAIL_GENERATION_ENABLED="false"
```

### 3. Deployment Steps

**Step 1: Backup Database**
```bash
pg_dump -h prod-db -U user -d vyntrize_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

**Step 2: Apply Migration**
```bash
cd packages/@platform/vyntrize-db
npx prisma migrate deploy
```

**Step 3: Build Application**
```bash
cd apps/vyntrize-crm
pnpm install --frozen-lockfile --production
pnpm build
```

**Step 4: Deploy (Zero-Downtime)**

Using PM2:
```bash
pm2 reload vyntrize-crm
```

Using Docker:
```bash
docker-compose up -d --no-deps --build vyntrize-crm
```

Using Kubernetes:
```bash
kubectl rollout restart deployment/vyntrize-crm
```

**Step 5: Verify Deployment**
```bash
# Health check
curl https://app.example.com/api/agents/health

# Check logs
pm2 logs vyntrize-crm --lines 100
# or
docker-compose logs -f vyntrize-crm
# or
kubectl logs -f deployment/vyntrize-crm
```

### 4. Post-Deployment Monitoring

Monitor for 1-2 hours:
- Application logs for errors
- Health endpoint status
- Agent action creation rate
- OpenAI API usage
- Redis connection status
- Database query performance

## Docker Deployment

### 1. Update docker-compose.yml

The docker-compose.yml has been updated with Redis service:

```yaml
services:
  vyntrize-redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - vyntrize-redis-data:/data
    networks:
      - vyntrize-net
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  vyntrize-crm:
    # ... existing config ...
    environment:
      - REDIS_HOST=vyntrize-redis
      - REDIS_PORT=6379
    depends_on:
      vyntrize-postgres:
        condition: service_healthy
      vyntrize-redis:
        condition: service_healthy
```

### 2. Configure Environment

Update `deploy/.env`:

```bash
# Copy example and edit
cd deploy
cp .env.example .env
nano .env

# Add required variables
REDIS_HOST=vyntrize-redis
REDIS_PORT=6379
OPENAI_API_KEY=sk-your-key-here
```

### 3. Deploy with Docker Compose

```bash
cd deploy

# Pull latest images
docker-compose pull

# Start services
docker-compose up -d

# Apply migration
docker-compose exec vyntrize-crm npx prisma migrate deploy

# Check logs
docker-compose logs -f vyntrize-crm

# Verify health
curl http://localhost:9080/api/agents/health
```

### 4. Docker Compose Commands

```bash
# View logs
docker-compose logs -f vyntrize-crm

# Restart service
docker-compose restart vyntrize-crm

# Stop all services
docker-compose down

# Stop and remove volumes (CAUTION: data loss)
docker-compose down -v

# View running containers
docker-compose ps

# Execute command in container
docker-compose exec vyntrize-crm sh
```

## Post-Deployment Verification

### Automated Checks

Create a verification script `verify-deployment.sh`:

```bash
#!/bin/bash

BASE_URL="${1:-http://localhost:3014}"
COOKIE="${2:-}"

echo "Verifying AI Pipeline Agent System deployment..."
echo "Base URL: $BASE_URL"
echo ""

# Health check
echo "1. Checking health endpoint..."
HEALTH=$(curl -s "$BASE_URL/api/agents/health")
STATUS=$(echo $HEALTH | jq -r '.status')

if [ "$STATUS" = "healthy" ]; then
  echo "✅ Health check passed"
else
  echo "❌ Health check failed: $STATUS"
  exit 1
fi

# Check components
echo ""
echo "2. Checking components..."
REGISTRY=$(echo $HEALTH | jq -r '.components.agentRegistry.status')
OPENAI=$(echo $HEALTH | jq -r '.components.openAI.status')

echo "   Registry: $REGISTRY"
echo "   OpenAI: $OPENAI"

# Metrics check
echo ""
echo "3. Checking metrics endpoint..."
METRICS=$(curl -s "$BASE_URL/api/agents/metrics?days=1")
TOTAL=$(echo $METRICS | jq -r '.summary.totalActions')

echo "   Total actions (last 24h): $TOTAL"

echo ""
echo "✅ Deployment verification complete!"
```

Usage:
```bash
chmod +x verify-deployment.sh
./verify-deployment.sh https://app.example.com "crm_session=..."
```

### Manual Verification Checklist

- [ ] Health endpoint returns "healthy"
- [ ] Agent registry initialized
- [ ] OpenAI provider not in circuit breaker state
- [ ] Job queue metrics available
- [ ] Can list agent actions
- [ ] Can trigger agent manually (test lead)
- [ ] Scheduled jobs appear in queue
- [ ] Application logs show no errors
- [ ] Redis connection stable
- [ ] Database queries performing well

### Performance Verification

```bash
# Check response times
time curl http://localhost:3014/api/agents/health
time curl http://localhost:3014/api/agents/metrics

# Check Redis
redis-cli ping
redis-cli info stats

# Check database connections
psql -h localhost -U user -d vyntrize_db -c "SELECT count(*) FROM agent_actions;"
```

## Rollback Procedures

### Scenario 1: Application Issues

**Rollback Application:**
```bash
# PM2
pm2 reload vyntrize-crm --update-env

# Docker
docker-compose down
docker-compose up -d

# Kubernetes
kubectl rollout undo deployment/vyntrize-crm
```

### Scenario 2: Database Migration Issues

**Rollback Migration:**
```bash
cd packages/@platform/vyntrize-db

# View migration history
npx prisma migrate status

# Rollback to previous migration (manual)
psql -h localhost -U user -d vyntrize_db < backup_YYYYMMDD_HHMMSS.sql
```

### Scenario 3: Agent System Issues

**Disable Agent System:**
```bash
# Set environment variables
AGENT_LEAD_SCORING_ENABLED=false
AGENT_TASK_AUTOMATION_ENABLED=false
AGENT_STAGNATION_DETECTION_ENABLED=false
AGENT_EMAIL_GENERATION_ENABLED=false
AGENT_NEXT_BEST_ACTION_ENABLED=false

# Restart application
pm2 reload vyntrize-crm
```

## Monitoring Setup

### Health Monitoring

Set up automated health checks:

```bash
# Cron job (every 5 minutes)
*/5 * * * * curl -f http://localhost:3014/api/agents/health || echo "Health check failed" | mail -s "Agent System Alert" admin@example.com
```

### Metrics Collection

Set up metrics collection:

```bash
# Collect metrics every hour
0 * * * * curl http://localhost:3014/api/agents/metrics?days=1 > /var/log/agent-metrics/$(date +\%Y\%m\%d_\%H).json
```

### Log Monitoring

Monitor application logs for errors:

```bash
# Watch for errors
tail -f /var/log/vyntrize-crm/error.log | grep -i "agent"

# Docker
docker-compose logs -f vyntrize-crm | grep -i "agent"
```

### Alerting

Set up alerts for:
- Health endpoint returning "unhealthy"
- OpenAI circuit breaker opening
- Job queue depth exceeding threshold
- High error rate in agent actions
- Redis connection failures

Example alert script:

```bash
#!/bin/bash
HEALTH=$(curl -s http://localhost:3014/api/agents/health)
STATUS=$(echo $HEALTH | jq -r '.status')

if [ "$STATUS" != "healthy" ]; then
  # Send alert (email, Slack, PagerDuty, etc.)
  echo "Agent system unhealthy: $STATUS" | mail -s "ALERT: Agent System" admin@example.com
fi
```

## Troubleshooting

### Common Issues

**Issue: Agents not initializing**
```bash
# Check environment variables
env | grep -E "(REDIS|OPENAI|AGENT)"

# Check Redis connection
redis-cli -h $REDIS_HOST -p $REDIS_PORT ping

# Check logs
tail -f /var/log/vyntrize-crm/app.log | grep "AgentSystem"
```

**Issue: High OpenAI costs**
```bash
# Check usage
curl http://localhost:3014/api/agents/metrics?days=7

# Disable AI agents temporarily
export AGENT_EMAIL_GENERATION_ENABLED=false
export AGENT_NEXT_BEST_ACTION_ENABLED=false
pm2 reload vyntrize-crm
```

**Issue: Job queue backing up**
```bash
# Check queue metrics
curl http://localhost:3014/api/agents/health | jq '.components.jobQueue'

# Increase concurrency
export AGENT_JOB_CONCURRENCY=10
pm2 reload vyntrize-crm

# Clear failed jobs (if needed)
redis-cli -h $REDIS_HOST -p $REDIS_PORT
> DEL bull:agent-jobs:failed
```

## Security Considerations

### Production Hardening

1. **Environment Variables**
   - Never commit .env files
   - Use secrets management (AWS Secrets Manager, HashiCorp Vault)
   - Rotate API keys regularly

2. **Network Security**
   - Restrict Redis access to application servers only
   - Use TLS for Redis connections in production
   - Firewall rules for database access

3. **API Security**
   - Rate limiting on API endpoints
   - Input validation on all endpoints
   - CORS configuration
   - CSP headers

4. **Monitoring**
   - Log all agent actions
   - Monitor for unusual patterns
   - Alert on high error rates
   - Track API usage and costs

## Maintenance

### Regular Tasks

**Daily:**
- Check health endpoint
- Review error logs
- Monitor OpenAI costs

**Weekly:**
- Review agent metrics
- Check job queue performance
- Analyze approval rates

**Monthly:**
- Review and optimize agent rules
- Update dependencies
- Review and rotate secrets
- Analyze cost trends

### Updates

**Updating Agent System:**
```bash
# Pull latest code
git pull origin main

# Install dependencies
pnpm install

# Build
cd apps/vyntrize-crm
pnpm build

# Apply migrations (if any)
cd packages/@platform/vyntrize-db
npx prisma migrate deploy

# Restart
pm2 reload vyntrize-crm
```

## Support

For deployment issues:
1. Check application logs
2. Verify environment variables
3. Test Redis and database connections
4. Review health endpoint output
5. Check OpenAI API status
6. Consult troubleshooting section

---

**Deployment Checklist Summary:**
- [ ] Infrastructure provisioned
- [ ] Environment variables configured
- [ ] Database migration applied
- [ ] Application deployed
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] Alerts set up
- [ ] Team trained
- [ ] Documentation updated
- [ ] Rollback plan tested
