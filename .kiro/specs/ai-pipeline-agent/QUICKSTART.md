# AI Pipeline Agent System - Quick Start Guide

Get the AI Pipeline Agent System up and running in 10 minutes.

## Prerequisites

- PostgreSQL database running
- Redis server (will be set up)
- OpenAI API key
- Node.js 18+ and pnpm installed

## Step 1: Install Redis

### macOS (Homebrew)
```bash
brew install redis
brew services start redis
```

### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### Windows
Download from: https://redis.io/download
Or use Docker:
```bash
docker run -d -p 6379:6379 --name redis redis:7-alpine
```

### Verify Redis
```bash
redis-cli ping
# Should return: PONG
```

## Step 2: Configure Environment Variables

### Development (.env or apps/vyntrize-crm/.env)
```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# OpenAI API Key (get from https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-your-actual-api-key-here

# Optional: Agent Feature Flags (defaults to true)
AGENT_LEAD_SCORING_ENABLED=true
AGENT_TASK_AUTOMATION_ENABLED=true
AGENT_STAGNATION_DETECTION_ENABLED=true
AGENT_EMAIL_GENERATION_ENABLED=true
AGENT_NEXT_BEST_ACTION_ENABLED=true

# Optional: Job Queue Configuration
AGENT_JOB_CONCURRENCY=5
```

### Production (deploy/.env)
```bash
# Redis Configuration (use service name in Docker)
REDIS_HOST=vyntrize-redis
REDIS_PORT=6379

# OpenAI API Key
OPENAI_API_KEY=sk-your-actual-api-key-here

# Agent Configuration
AGENT_LEAD_SCORING_ENABLED=true
AGENT_TASK_AUTOMATION_ENABLED=true
AGENT_STAGNATION_DETECTION_ENABLED=true
AGENT_EMAIL_GENERATION_ENABLED=true
AGENT_NEXT_BEST_ACTION_ENABLED=true
AGENT_JOB_CONCURRENCY=5
```

## Step 3: Apply Database Migration

```bash
cd packages/@platform/vyntrize-db
npx prisma migrate deploy
npx prisma generate
```

Expected output:
```
✔ Applied migration: 20260506113948_add_agent_system
✔ Generated Prisma Client
```

## Step 4: Install Dependencies (if needed)

```bash
# From project root
pnpm install
```

## Step 5: Start the Application

### Development
```bash
cd apps/vyntrize-crm
pnpm dev
```

### Production
```bash
cd apps/vyntrize-crm
pnpm build
pnpm start
```

### Docker Compose
```bash
cd deploy
docker-compose up -d
```

## Step 6: Verify Installation

### Check Server Logs
Look for these messages:
```
[AgentSystem] Initializing agent system...
[AgentRegistry] Registering all agents...
[EventBus] Registered LeadScoringAgent for lead_created
[JobScheduler] Registered agent: LeadScoringAgent
[AgentSystem] Agent system initialized successfully
```

### Test Health Endpoint
```bash
curl http://localhost:3014/api/agents/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-05-07T...",
  "components": {
    "agentRegistry": {
      "status": "healthy",
      "initialized": true
    },
    "jobQueue": {
      "status": "healthy",
      "metrics": { ... }
    },
    "openAI": {
      "status": "healthy",
      "circuitOpen": false,
      ...
    }
  }
}
```

### Test Manual Trigger (Optional)
```bash
# First, get a lead ID from your database
curl -X POST http://localhost:3014/api/agents/trigger \
  -H "Content-Type: application/json" \
  -H "Cookie: crm_session=your-session-cookie" \
  -d '{
    "agentType": "LEAD_SCORING",
    "leadId": "your-lead-id-here"
  }'
```

Expected response:
```json
{
  "success": true,
  "agentType": "LEAD_SCORING",
  "leadId": "...",
  "result": {
    "actionId": "...",
    "reasoning": "Lead score increased from 50 to 75/100 (qualified). ...",
    "metadata": { ... }
  }
}
```

## Step 7: Integrate with Your CRM Code

Add event emitters to your existing CRM code:

```typescript
// In your lead creation API
import { emitLeadCreated } from '@/lib/agents';

export async function POST(request: Request) {
  const lead = await prisma.lead.create({ ... });
  
  // Emit event to trigger agents
  await emitLeadCreated(lead.id, session.userId);
  
  return NextResponse.json(lead);
}
```

```typescript
// In your lead update API
import { emitStageChanged } from '@/lib/agents';

export async function PATCH(request: Request) {
  const { leadId, stage } = await request.json();
  
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  const oldStage = lead.stage;
  
  await prisma.lead.update({
    where: { id: leadId },
    data: { stage }
  });
  
  // Emit event to trigger agents
  await emitStageChanged(leadId, oldStage, stage, session.userId);
  
  return NextResponse.json({ success: true });
}
```

## Common Issues & Solutions

### Issue: "OPENAI_API_KEY environment variable not set"
**Solution:** Add your OpenAI API key to .env file
```bash
OPENAI_API_KEY=sk-your-key-here
```

### Issue: "Redis connection failed"
**Solution:** Verify Redis is running
```bash
redis-cli ping  # Should return PONG
```

### Issue: "Agent system will be disabled"
**Solution:** Check that all required environment variables are set:
- REDIS_HOST
- REDIS_PORT
- OPENAI_API_KEY

### Issue: "Migration not found"
**Solution:** Make sure you're in the correct directory
```bash
cd packages/@platform/vyntrize-db
npx prisma migrate deploy
```

### Issue: "Unauthorized" on API calls
**Solution:** You need to be logged in. The API endpoints require authentication.

## Next Steps

1. **Monitor Agent Actions**
   ```bash
   curl http://localhost:3014/api/agents/actions?limit=10
   ```

2. **Check Metrics**
   ```bash
   curl http://localhost:3014/api/agents/metrics?days=7
   ```

3. **Review Documentation**
   - Read `apps/vyntrize-crm/lib/agents/README.md` for detailed documentation
   - Review `.kiro/specs/ai-pipeline-agent/PROJECT_COMPLETE.md` for full project details

4. **Test Each Agent**
   - Create a lead → Lead Scoring Agent scores it
   - Change lead stage → Task Automation Agent creates task
   - Wait for scheduled jobs → Stagnation Detection Agent runs daily at 9 AM
   - Trigger Email Generation → Get AI-powered email draft
   - Trigger Next Best Action → Get AI recommendations

## Production Deployment

For production deployment with Docker:

1. **Update deploy/.env**
   ```bash
   cd deploy
   cp .env.example .env
   # Edit .env with production values
   ```

2. **Start Services**
   ```bash
   docker-compose up -d
   ```

3. **Apply Migration**
   ```bash
   docker-compose exec vyntrize-crm npx prisma migrate deploy
   ```

4. **Verify Health**
   ```bash
   curl http://your-domain.com/api/agents/health
   ```

## Support

For issues or questions:
1. Check server logs for error messages
2. Review troubleshooting section in README.md
3. Verify all environment variables are set correctly
4. Ensure Redis and PostgreSQL are running and accessible

## Success Checklist

- [ ] Redis installed and running
- [ ] OpenAI API key configured
- [ ] Database migration applied
- [ ] Application started successfully
- [ ] Health endpoint returns "healthy"
- [ ] Agent initialization logs visible
- [ ] Test trigger works (optional)
- [ ] Event emitters integrated (optional)

Once all items are checked, your AI Pipeline Agent System is ready to use! 🎉
