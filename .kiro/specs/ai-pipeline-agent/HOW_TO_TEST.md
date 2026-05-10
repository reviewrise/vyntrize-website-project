# How to Test the AI Pipeline Agent System

**Three simple ways to test your agent system**

---

## 🚀 Method 1: Run the Test Script (Recommended)

**One command to test everything:**

```bash
cd apps/vyntrize-crm
tsx scripts/test-agents.ts
```

**This will:**
- ✅ Check database connection
- ✅ Verify AI providers are configured
- ✅ Test agent registry
- ✅ Run lead scoring agent
- ✅ Run email generation agent
- ✅ Check actions in database
- ✅ Verify metrics tracking

**Takes:** ~30 seconds  
**Output:** Color-coded test results with pass/fail for each component

---

## 🌐 Method 2: Test via Browser

**Step 1:** Open your CRM
```
http://localhost:3014
```

**Step 2:** Log in
- Email: `admin@vyntrise.com`
- Password: `ChangeMe123!`

**Step 3:** Check health endpoint
```
http://localhost:3014/api/agents/health
```

**Should see:** JSON response with `"status": "healthy"`

---

## 💻 Method 3: Test via Command Line

**Check health endpoint:**
```bash
# First, log in via browser and get your session cookie
# Then use it in curl:

curl http://localhost:3014/api/agents/health \
  -H "Cookie: iron-session=<your-cookie>"
```

**Trigger an agent:**
```bash
curl -X POST http://localhost:3014/api/agents/trigger \
  -H "Content-Type: application/json" \
  -H "Cookie: iron-session=<your-cookie>" \
  -d '{
    "agentType": "LEAD_SCORING",
    "leadId": "<your-lead-id>"
  }'
```

**View actions:**
```bash
curl http://localhost:3014/api/agents/actions \
  -H "Cookie: iron-session=<your-cookie>"
```

---

## 📊 What Each Test Checks

| Test | What It Verifies |
|------|------------------|
| Database | Agent tables exist and are accessible |
| AI Providers | Gemini/OpenAI is configured and working |
| Agent Registry | All 5 agents are registered |
| Lead Scoring | Can score leads with AI |
| Email Generation | Can generate emails with AI |
| Actions | Actions are saved to database |
| Metrics | Performance metrics are tracked |

---

## ✅ Success Indicators

Your system is working if you see:

- ✅ "7/7 tests passed" in test script
- ✅ `"status": "healthy"` in health endpoint
- ✅ AI provider shows as available
- ✅ Agents can be triggered
- ✅ Actions appear in database
- ✅ No errors in console

---

## 🐛 Common Issues

### "No AI providers available"
**Fix:** Add API key to `.env`
```bash
GEMINI_API_KEY="your-key-here"
```

### "Cannot connect to Redis"
**Fix:** Start Redis
```bash
docker start vyntrize-redis
```

### "Database connection failed"
**Fix:** Check PostgreSQL is running
```bash
pg_isready -h localhost -p 5432
```

### "Agent tables not found"
**Fix:** Apply migration
```bash
cd packages/@platform/vyntrize-db
pnpm prisma migrate deploy
```

---

## 📚 More Information

- **Quick Start:** `TEST_QUICK_START.md`
- **Full Testing Guide:** `TESTING_GUIDE.md`
- **Setup Status:** `CURRENT_STATUS.md`
- **System README:** `apps/vyntrize-crm/lib/agents/README.md`

---

## 🎯 Recommended Testing Flow

1. **Run automated test script** (30 seconds)
2. **Check health endpoint** via browser (1 minute)
3. **Trigger an agent manually** (2 minutes)
4. **View the results** in database or API (2 minutes)

**Total time:** ~5 minutes

---

**Ready to test? Run this command:**

```bash
cd apps/vyntrize-crm && tsx scripts/test-agents.ts
```

🎉 **That's it!**
