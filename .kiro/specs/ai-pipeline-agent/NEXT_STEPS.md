# AI Pipeline Agent System - Next Steps

**Current Status:** ✅ Code Complete | ⏳ Configuration Needed

---

## 🎯 Immediate Next Steps (30 minutes)

### Step 1: Get AI Provider API Key (5 minutes)

Choose ONE of these options:

**Option A: OpenAI (Best Quality)**
1. Go to: https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-`)
4. Add to `apps/vyntrize-crm/.env`:
   ```bash
   OPENAI_API_KEY="sk-your-actual-key-here"
   OPENAI_MODEL="gpt-4"
   AI_PROVIDER="openai"
   ```

**Option B: Google Gemini (Free Tier)**
1. Go to: https://makersuite.google.com/app/apikey
2. Click "Create API key"
3. Copy the key
4. Add to `apps/vyntrize-crm/.env`:
   ```bash
   GEMINI_API_KEY="your-actual-key-here"
   GEMINI_MODEL="gemini-pro"
   AI_PROVIDER="gemini"
   ```

**Option C: Both (High Availability)**
```bash
# Add both keys for automatic fallback
OPENAI_API_KEY="sk-your-key-here"
GEMINI_API_KEY="your-key-here"
AI_PROVIDER="auto"
```

---

### Step 2: Apply Database Migration (5 minutes)

```bash
# Navigate to database package
cd packages/@platform/vyntrize-db

# Generate Prisma client
pnpm prisma generate

# Apply migration
pnpm prisma migrate deploy
```

**What this does:**
- Creates `AgentAction` table
- Creates `AgentRule` table
- Creates `AgentMetric` table
- Adds necessary enums and indexes

---

### Step 3: Start the Application (2 minutes)

```bash
# Make sure Redis is running
docker ps | grep vyntrize-redis

# If not running, start it
docker start vyntrize-redis

# Start CRM application
cd apps/vyntrize-crm
pnpm dev
```

**Expected output:**
```
[AgentSystem] Initializing...
[AIProviderFactory] OpenAI provider available
[AgentSystem] Registered 5 agents
[JobScheduler] Connected to Redis
[AgentSystem] Initialization complete
```

---

### Step 4: Verify System Health (2 minutes)

```bash
# Check health endpoint
curl http://localhost:3014/api/agents/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "components": {
    "redis": { "status": "healthy" },
    "aiProviders": { 
      "status": "healthy",
      "availableProviders": ["openai"]
    },
    "jobQueue": { "status": "healthy" }
  }
}
```

---

### Step 5: Test Agent Functionality (5 minutes)

**Test 1: Check available agents**
```bash
curl http://localhost:3014/api/agents/health
```

**Test 2: Manually trigger lead scoring**
```bash
# First, get a lead ID from your database
# Then trigger the agent
curl -X POST http://localhost:3014/api/agents/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "agentType": "LEAD_SCORING",
    "leadId": "your-lead-id-here"
  }'
```

**Test 3: View pending actions**
```bash
curl http://localhost:3014/api/agents/actions?status=PENDING
```

**Test 4: View metrics**
```bash
curl http://localhost:3014/api/agents/metrics
```

---

## 🎉 Success Indicators

You'll know everything is working when:

✅ Application starts without errors  
✅ Health endpoint returns `"status": "healthy"`  
✅ AI provider shows as available  
✅ Redis connection is established  
✅ Can trigger agents manually  
✅ Actions appear in database  
✅ Metrics are being tracked  

---

## 🚨 Troubleshooting

### Issue: "No AI providers available"

**Cause:** No API key configured

**Solution:**
```bash
# Add at least one API key to apps/vyntrize-crm/.env
OPENAI_API_KEY="sk-..."
# or
GEMINI_API_KEY="..."
```

---

### Issue: "Cannot connect to Redis"

**Cause:** Redis not running

**Solution:**
```bash
# Check if Redis is running
docker ps | grep vyntrize-redis

# If not running, start it
docker start vyntrize-redis

# If container doesn't exist, create it
docker run -d \
  --name vyntrize-redis \
  -p 6379:6379 \
  redis:7-alpine
```

---

### Issue: "Prisma Client not found"

**Cause:** Prisma client not generated

**Solution:**
```bash
cd packages/@platform/vyntrize-db
pnpm prisma generate
```

---

### Issue: "Migration not applied"

**Cause:** Database schema not updated

**Solution:**
```bash
cd packages/@platform/vyntrize-db
pnpm prisma migrate deploy
```

---

## 📚 Quick Reference

### Environment Variables (apps/vyntrize-crm/.env)

```bash
# Required
REDIS_HOST="localhost"
REDIS_PORT="6379"
AI_PROVIDER="auto"  # or "openai" or "gemini"

# At least one of these
OPENAI_API_KEY="sk-..."
GEMINI_API_KEY="..."

# Optional
OPENAI_MODEL="gpt-4"  # or "gpt-3.5-turbo"
GEMINI_MODEL="gemini-pro"
AGENT_JOB_CONCURRENCY="5"
```

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/agents/health` | GET | System health check |
| `/api/agents/actions` | GET | List agent actions |
| `/api/agents/actions/:id/approve` | POST | Approve action |
| `/api/agents/actions/:id/reject` | POST | Reject action |
| `/api/agents/metrics` | GET | Performance metrics |
| `/api/agents/trigger` | POST | Manual trigger |

### Agent Types

| Type | Purpose | Trigger |
|------|---------|---------|
| `LEAD_SCORING` | Score leads 0-100 | Lead created/updated |
| `TASK_AUTOMATION` | Create tasks | Stage changed |
| `STAGNATION_DETECTION` | Alert on inactivity | Daily check |
| `EMAIL_GENERATION` | Draft emails | Manual/API |
| `NEXT_BEST_ACTION` | Suggest actions | Manual/API |

---

## 🎯 After Setup

Once the system is running, you can:

1. **View the dashboard** (coming soon)
2. **Configure automation rules** via API
3. **Integrate event emitters** into CRM code
4. **Monitor metrics** and performance
5. **Adjust autonomy levels** per agent type

---

## 📖 Full Documentation

For detailed information, see:

- **Quick Start Guide:** `.kiro/specs/ai-pipeline-agent/QUICKSTART.md`
- **Multi-Provider Setup:** `.kiro/specs/ai-pipeline-agent/MULTI_PROVIDER_SETUP.md`
- **System README:** `apps/vyntrize-crm/lib/agents/README.md`
- **Deployment Guide:** `.kiro/specs/ai-pipeline-agent/DEPLOYMENT.md`
- **Setup Status:** `.kiro/specs/ai-pipeline-agent/SETUP_STATUS.md`

---

## 💡 Pro Tips

1. **Start with Gemini** for development (free tier)
2. **Use GPT-3.5-turbo** for production (cost-effective)
3. **Upgrade to GPT-4** for premium quality
4. **Configure both** for high availability
5. **Monitor metrics** to optimize costs

---

## ⏱️ Time Estimate

- **Configuration:** 10 minutes
- **Database migration:** 5 minutes
- **Testing:** 15 minutes
- **Total:** ~30 minutes

---

**Ready to start?** Follow Step 1 above! 🚀
