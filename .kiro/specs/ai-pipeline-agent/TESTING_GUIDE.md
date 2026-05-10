# AI Pipeline Agent System - Testing Guide

Complete guide to testing the AI Pipeline Agent System functionality.

---

## 🚀 Quick Test (5 minutes)

### Method 1: Automated Test Script (Easiest)

Run the automated test script that checks all components:

```bash
cd apps/vyntrize-crm
tsx scripts/test-agents.ts
```

**What it tests:**
- ✅ Database connection and agent tables
- ✅ AI provider configuration (OpenAI/Gemini)
- ✅ Agent registry initialization
- ✅ Lead scoring agent execution
- ✅ Email generation agent execution
- ✅ Agent actions in database
- ✅ Metrics tracking

**Expected output:**
```
╔════════════════════════════════════════════════════════════╗
║        AI Pipeline Agent System - Test Suite              ║
╚════════════════════════════════════════════════════════════╝

============================================================
Test 1: Database Connection
============================================================

✓ Database connection successful
✓ AgentAction table exists (0 records)
✓ AgentRule table exists (0 records)
✓ AgentMetric table exists (0 records)

...

============================================================
Test Summary
============================================================

✓ PASS     Database Connection
✓ PASS     AI Providers
✓ PASS     Agent Registry
✓ PASS     Lead Scoring
✓ PASS     Email Generation
✓ PASS     Agent Actions
✓ PASS     Metrics

7/7 tests passed

🎉 All tests passed! Agent system is working correctly.
```

---

## 🧪 Manual Testing (15 minutes)

### Step 1: Check System Health

**Via Browser (Requires Login):**

1. Open browser: `http://localhost:3014`
2. Log in with:
   - Email: `admin@vyntrise.com`
   - Password: `ChangeMe123!`
3. Open new tab: `http://localhost:3014/api/agents/health`

**Expected Response:**
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
      "metrics": {
        "activeJobs": 0,
        "waitingJobs": 0
      }
    },
    "aiProviders": {
      "status": "healthy",
      "defaultProvider": "auto",
      "availableProviders": ["gemini"],
      "providers": {
        "gemini": {
          "provider": "Google Gemini",
          "model": "gemini-pro",
          "circuitOpen": false,
          "failureCount": 0,
          "tokenUsageThisMinute": 0,
          "cacheSize": 0
        }
      }
    }
  }
}
```

---

### Step 2: Test Lead Scoring Agent

**Create a test lead first (if you don't have one):**

```bash
# Connect to database
psql -U vyntrize_user -d vyntrize_db -h localhost

# Create a test contact and lead
INSERT INTO "Contact" (id, "firstName", "lastName", email, "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'John', 'Doe', 'john.doe@example.com', NOW(), NOW())
RETURNING id;

# Use the returned ID in the next query
INSERT INTO "Lead" (id, "contactId", status, source, "createdAt", "updatedAt")
VALUES (gen_random_uuid(), '<contact-id-from-above>', 'NEW', 'WEBSITE', NOW(), NOW())
RETURNING id;
```

**Trigger lead scoring via API:**

1. Get your session cookie from browser DevTools (Application > Cookies)
2. Use curl or Postman:

```bash
curl -X POST http://localhost:3014/api/agents/trigger \
  -H "Content-Type: application/json" \
  -H "Cookie: iron-session=<your-session-cookie>" \
  -d '{
    "agentType": "LEAD_SCORING",
    "leadId": "<your-lead-id>"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Agent triggered successfully",
  "jobId": "job-123..."
}
```

**Check the result:**

```bash
# View agent actions
curl http://localhost:3014/api/agents/actions \
  -H "Cookie: iron-session=<your-session-cookie>"
```

---

### Step 3: Test Email Generation Agent

**Trigger email generation:**

```bash
curl -X POST http://localhost:3014/api/agents/trigger \
  -H "Content-Type: application/json" \
  -H "Cookie: iron-session=<your-session-cookie>" \
  -d '{
    "agentType": "EMAIL_GENERATION",
    "leadId": "<your-lead-id>",
    "context": {
      "purpose": "follow_up",
      "tone": "professional"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Agent triggered successfully",
  "jobId": "job-456..."
}
```

---

### Step 4: View Agent Actions

**List all actions:**

```bash
curl http://localhost:3014/api/agents/actions \
  -H "Cookie: iron-session=<your-session-cookie>"
```

**Filter by status:**

```bash
# Pending actions
curl "http://localhost:3014/api/agents/actions?status=PENDING" \
  -H "Cookie: iron-session=<your-session-cookie>"

# Approved actions
curl "http://localhost:3014/api/agents/actions?status=APPROVED" \
  -H "Cookie: iron-session=<your-session-cookie>"
```

**Filter by agent type:**

```bash
curl "http://localhost:3014/api/agents/actions?agentType=LEAD_SCORING" \
  -H "Cookie: iron-session=<your-session-cookie>"
```

---

### Step 5: Approve/Reject Actions

**Approve an action:**

```bash
curl -X POST http://localhost:3014/api/agents/actions/<action-id>/approve \
  -H "Cookie: iron-session=<your-session-cookie>"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Action approved and executed successfully",
  "action": {
    "id": "...",
    "status": "APPROVED",
    "executedAt": "2026-05-07T..."
  }
}
```

**Reject an action:**

```bash
curl -X POST http://localhost:3014/api/agents/actions/<action-id>/reject \
  -H "Content-Type: application/json" \
  -H "Cookie: iron-session=<your-session-cookie>" \
  -d '{
    "reason": "Not appropriate at this time"
  }'
```

---

### Step 6: View Metrics

**Get agent performance metrics:**

```bash
curl http://localhost:3014/api/agents/metrics \
  -H "Cookie: iron-session=<your-session-cookie>"
```

**Expected Response:**
```json
{
  "metrics": [
    {
      "agentType": "LEAD_SCORING",
      "metricName": "leads_scored",
      "metricValue": 5,
      "calculatedAt": "2026-05-07T..."
    },
    {
      "agentType": "EMAIL_GENERATION",
      "metricName": "emails_generated",
      "metricValue": 3,
      "calculatedAt": "2026-05-07T..."
    }
  ]
}
```

---

## 🔍 Database Testing

### Check Agent Tables Directly

```bash
# Connect to database
psql -U vyntrize_user -d vyntrize_db -h localhost
```

**Check agent actions:**
```sql
-- View all agent actions
SELECT 
  id, 
  "agentType", 
  status, 
  "entityId", 
  "createdAt"
FROM "AgentAction"
ORDER BY "createdAt" DESC
LIMIT 10;

-- Count by status
SELECT status, COUNT(*) 
FROM "AgentAction" 
GROUP BY status;

-- Count by agent type
SELECT "agentType", COUNT(*) 
FROM "AgentAction" 
GROUP BY "agentType";
```

**Check agent metrics:**
```sql
-- View recent metrics
SELECT 
  "agentType",
  "metricName",
  "metricValue",
  "calculatedAt"
FROM "AgentMetric"
ORDER BY "calculatedAt" DESC
LIMIT 20;

-- Sum metrics by agent type
SELECT 
  "agentType",
  "metricName",
  SUM("metricValue") as total
FROM "AgentMetric"
GROUP BY "agentType", "metricName";
```

**Check agent rules:**
```sql
-- View all rules
SELECT 
  id,
  name,
  "agentType",
  enabled,
  "createdAt"
FROM "AgentRule"
ORDER BY "createdAt" DESC;
```

---

## 🧩 Component Testing

### Test 1: Redis Connection

```bash
# Test Redis is running
docker exec -it vyntrize-redis redis-cli ping
# Expected: PONG

# Check Redis keys
docker exec -it vyntrize-redis redis-cli keys "*"

# Monitor Redis in real-time
docker exec -it vyntrize-redis redis-cli monitor
```

### Test 2: AI Provider

**Test Gemini API directly:**

```bash
# Create a test file
cat > test-gemini.ts << 'EOF'
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

async function test() {
  const result = await model.generateContent('Say hello!');
  const response = await result.response;
  console.log('Response:', response.text());
}

test().catch(console.error);
EOF

# Run test
cd apps/vyntrize-crm
tsx test-gemini.ts
```

### Test 3: Job Queue

**Check BullMQ jobs:**

```bash
# Create a test script
cat > test-queue.ts << 'EOF'
import { jobScheduler } from '@/lib/agents/job-scheduler';

async function test() {
  console.log('Testing job queue...');
  
  // Add a test job
  const job = await jobScheduler.scheduleJob(
    'test-job',
    { message: 'Hello from test!' },
    { delay: 1000 }
  );
  
  console.log('Job added:', job.id);
  
  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('Test complete');
  process.exit(0);
}

test().catch(console.error);
EOF

# Run test
tsx test-queue.ts
```

---

## 📊 Performance Testing

### Test Agent Response Time

```bash
# Create performance test script
cat > test-performance.ts << 'EOF'
import { leadScoringAgent } from '@/lib/agents/lead-scoring-agent';
import { prisma } from '@/lib/prisma';

async function test() {
  const lead = await prisma.lead.findFirst();
  if (!lead) {
    console.log('No leads found');
    return;
  }
  
  console.log('Testing lead scoring performance...');
  
  const iterations = 5;
  const times: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    await leadScoringAgent.execute({ leadId: lead.id });
    const duration = Date.now() - start;
    times.push(duration);
    console.log(`Iteration ${i + 1}: ${duration}ms`);
  }
  
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  console.log(`\nAverage: ${avg.toFixed(2)}ms`);
  console.log(`Min: ${Math.min(...times)}ms`);
  console.log(`Max: ${Math.max(...times)}ms`);
  
  await prisma.$disconnect();
}

test().catch(console.error);
EOF

# Run test
cd apps/vyntrize-crm
tsx test-performance.ts
```

---

## 🐛 Troubleshooting Tests

### Issue: "No AI providers available"

**Cause:** API key not configured

**Solution:**
```bash
# Check .env file
cat apps/vyntrize-crm/.env | grep -E "(OPENAI|GEMINI)_API_KEY"

# Add API key if missing
echo 'GEMINI_API_KEY="your-key-here"' >> apps/vyntrize-crm/.env
```

### Issue: "Cannot connect to Redis"

**Cause:** Redis not running

**Solution:**
```bash
# Check Redis status
docker ps | grep redis

# Start Redis if not running
docker start vyntrize-redis

# Or create new container
docker run -d --name vyntrize-redis -p 6379:6379 redis:7-alpine
```

### Issue: "Database connection failed"

**Cause:** PostgreSQL not running or wrong credentials

**Solution:**
```bash
# Check PostgreSQL status
pg_isready -h localhost -p 5432

# Test connection
psql -U vyntrize_user -d vyntrize_db -h localhost -c "SELECT 1"

# Check .env file
cat apps/vyntrize-crm/.env | grep DATABASE_URL
```

### Issue: "Agent tables not found"

**Cause:** Migration not applied

**Solution:**
```bash
cd packages/@platform/vyntrize-db
pnpm prisma migrate deploy
pnpm prisma generate
```

### Issue: "Session cookie not working"

**Cause:** Cookie expired or invalid

**Solution:**
1. Log out and log back in
2. Get fresh cookie from browser DevTools
3. Or use the test script which doesn't need authentication

---

## ✅ Test Checklist

Use this checklist to verify all functionality:

### Infrastructure
- [ ] Redis is running and accessible
- [ ] PostgreSQL is running and accessible
- [ ] CRM application is running on port 3014
- [ ] Can access application in browser

### Database
- [ ] AgentAction table exists
- [ ] AgentRule table exists
- [ ] AgentMetric table exists
- [ ] Can query tables without errors

### AI Providers
- [ ] At least one AI provider configured
- [ ] API key is valid
- [ ] Provider shows as available in health check
- [ ] Circuit breaker is closed (not open)

### Agents
- [ ] Agent registry is initialized
- [ ] 5 agents are registered
- [ ] Can trigger lead scoring agent
- [ ] Can trigger email generation agent
- [ ] Can trigger task automation agent
- [ ] Can trigger stagnation detection agent
- [ ] Can trigger next best action agent

### Actions
- [ ] Agent actions are created in database
- [ ] Can list actions via API
- [ ] Can filter actions by status
- [ ] Can filter actions by agent type
- [ ] Can approve actions
- [ ] Can reject actions
- [ ] Approved actions execute successfully

### Metrics
- [ ] Metrics are tracked in database
- [ ] Can view metrics via API
- [ ] Token usage is tracked
- [ ] Agent execution time is tracked

### Integration
- [ ] Health endpoint returns healthy status
- [ ] All API endpoints are accessible
- [ ] Authentication works correctly
- [ ] Job queue processes jobs

---

## 🎯 Success Criteria

Your agent system is working correctly if:

✅ **Automated test script passes all 7 tests**  
✅ **Health endpoint returns "healthy" status**  
✅ **Can trigger agents manually via API**  
✅ **Agent actions appear in database**  
✅ **Can approve/reject actions**  
✅ **Metrics are being tracked**  
✅ **AI provider is responding**  
✅ **No errors in server logs**  

---

## 📚 Next Steps After Testing

Once all tests pass:

1. **Integrate event emitters** into your CRM code for automatic triggering
2. **Configure automation rules** for different scenarios
3. **Adjust autonomy levels** based on your needs
4. **Monitor metrics** to optimize performance
5. **Set up production deployment** when ready

---

## 🆘 Getting Help

If tests fail:

1. Check the error messages in the test output
2. Review server logs for detailed errors
3. Verify all environment variables are set
4. Ensure all services (Redis, PostgreSQL) are running
5. Check the troubleshooting section above
6. Review the documentation in `.kiro/specs/ai-pipeline-agent/`

---

**Happy Testing! 🚀**
