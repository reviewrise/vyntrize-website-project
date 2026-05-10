# Agent System - Quick Test Guide

**5-Minute Test to Verify Everything Works**

---

## Option 1: Automated Test (Easiest) ⭐

Run this single command to test everything:

```bash
cd apps/vyntrize-crm
tsx scripts/test-agents.ts
```

**What it tests:**
- ✅ Database connection
- ✅ AI providers (Gemini/OpenAI)
- ✅ Agent registry
- ✅ Lead scoring
- ✅ Email generation
- ✅ Actions & metrics

**Expected result:**
```
7/7 tests passed
🎉 All tests passed! Agent system is working correctly.
```

---

## Option 2: Browser Test (Visual)

### Step 1: Log in
1. Open: `http://localhost:3014`
2. Login:
   - Email: `admin@vyntrise.com`
   - Password: `ChangeMe123!`

### Step 2: Check Health
Open new tab: `http://localhost:3014/api/agents/health`

**Should see:**
```json
{
  "status": "healthy",
  "components": {
    "agentRegistry": { "status": "healthy" },
    "aiProviders": { "status": "healthy" }
  }
}
```

---

## Option 3: Quick Database Check

```bash
# Connect to database
psql -U vyntrize_user -d vyntrize_db -h localhost

# Check tables exist
\dt

# Should see:
# - AgentAction
# - AgentRule
# - AgentMetric
```

---

## Troubleshooting

### Test fails with "No AI providers"
```bash
# Add API key to .env
echo 'GEMINI_API_KEY="your-key"' >> apps/vyntrize-crm/.env
```

### Test fails with "Cannot connect to Redis"
```bash
# Start Redis
docker start vyntrize-redis
```

### Test fails with "Database connection failed"
```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432
```

---

## What's Next?

If tests pass:
1. ✅ System is working!
2. 📖 Read full testing guide: `TESTING_GUIDE.md`
3. 🚀 Start using agents in your CRM

If tests fail:
1. Check error messages
2. Review troubleshooting section
3. Check `.env` configuration
4. Verify services are running

---

**That's it! Run the test script and you're done.** 🎉
