# Restart and Test - Task Automation Agent

## Critical Issue Found & Fixed ✅

The agent system wasn't initializing because it required `OPENAI_API_KEY` to be set. This has been fixed - AI keys are now optional.

## What to Do Now

### 1. Restart Dev Server (Required!)

In your terminal where the dev server is running:

```bash
# Press Ctrl+C to stop the server

# Then start it again:
npm run dev
```

### 2. Watch for These Logs on Startup

✅ **You should see:**
```
[AgentSystem] Initializing agent system...
[AgentRegistry] Registering all agents...
[EventBus] Registered TaskAutomationAgent for stage_changed
[AgentRegistry] All agents registered successfully
[AgentSystem] Agent system initialized successfully
```

❌ **If you see this, something is wrong:**
```
[AgentSystem] Missing environment variables: REDIS_HOST, REDIS_PORT
[AgentSystem] Agent system will be disabled
```

### 3. Test Stage Change

After server restarts:

1. Go to `http://localhost:3014/pipeline`
2. Drag a lead from **CONTACTED** to **QUALIFIED**
3. Watch the server logs

✅ **You should see:**
```
[updateLeadStage] Emitted STAGE_CHANGED event for lead xxx: CONTACTED → QUALIFIED
[EventBus] Emitting stage_changed
[Agent] Task created automatically
```

### 4. Verify Task Created

**Option A: Check Lead Detail Page**
- Click on the lead you just moved
- Scroll to Tasks section
- Look for task: **"Prepare proposal"**
- Due date: 3 business days from now
- Priority: HIGH

**Option B: Check Agent Dashboard**
- Go to `http://localhost:3014/agents`
- Filter by: TASK_AUTOMATION
- Look for recent action with status: EXECUTED

**Option C: Check Database**
```bash
psql -U postgres -d vyntrize_crm

SELECT 
  title,
  description,
  priority,
  "dueDate",
  "createdAt"
FROM lead_tasks 
WHERE title = 'Prepare proposal'
ORDER BY "createdAt" DESC 
LIMIT 1;
```

## Quick Diagnostic (Optional)

If you want to check agent system status:

```bash
cd apps/vyntrize-crm
npx tsx scripts/check-agent-system.ts
```

This will show:
- Environment variables
- Registry initialization status
- Registered agents for each event

## What Changed

### Before Fix
- Agent system required `OPENAI_API_KEY` to initialize
- Without valid OpenAI key, **no agents registered**
- Events emitted but no agents listening
- No tasks created

### After Fix
- Agent system only requires `REDIS_HOST` and `REDIS_PORT`
- AI keys are optional (only needed for AI-powered agents)
- All agents register successfully
- Task Automation Agent works without AI keys

## Expected Results

### Server Startup
```
✅ [AgentSystem] Initializing agent system...
✅ [AgentRegistry] Registering all agents...
✅ [EventBus] Registered LeadScoringAgent for lead_created
✅ [EventBus] Registered LeadScoringAgent for lead_updated
✅ [EventBus] Registered TaskAutomationAgent for stage_changed
✅ [AgentRegistry] All agents registered successfully
✅ [AgentSystem] Agent system initialized successfully
```

### Stage Change (CONTACTED → QUALIFIED)
```
✅ [updateLeadStage] Emitted STAGE_CHANGED event for lead xxx: CONTACTED → QUALIFIED
✅ [EventBus] Emitting stage_changed
✅ [Agent] Task created automatically
```

### Database
```sql
-- New task record
title: "Prepare proposal"
description: "Create and send a detailed proposal based on lead requirements"
priority: "HIGH"
dueDate: 3 business days from now
status: "PENDING"
```

### Agent Dashboard
```
Agent Type: TASK_AUTOMATION
Action Type: TASK_CREATE
Status: EXECUTED
Reasoning: "Automatically created task 'Prepare proposal' for [Contact Name] (stage: QUALIFIED)..."
```

## Troubleshooting

### Still No Agent Logs After Restart?

**Check Redis:**
```bash
redis-cli ping
```
Should return: `PONG`

If not running:
```bash
redis-server
```

**Check Environment Variables:**
```bash
cd apps/vyntrize-crm
cat .env | grep -E "REDIS|AGENT"
```

Should show:
```
REDIS_HOST="localhost"
REDIS_PORT="6379"
AGENT_TASK_AUTOMATION_ENABLED="true"
```

**Run Diagnostic:**
```bash
npx tsx scripts/check-agent-system.ts
```

### Events Emitted But No Agent Execution?

This means agents aren't registered. Check:
1. Did you restart the server?
2. Are there any errors in startup logs?
3. Is Redis running?

### Task Created But Wrong Details?

Check `apps/vyntrize-crm/lib/agents/task-automation-agent.ts` for stage configurations.

---

## Summary

1. ✅ **Fix applied** - AI keys are now optional
2. 🔄 **Restart required** - Stop and start dev server
3. 🧪 **Test** - Change lead stage CONTACTED → QUALIFIED
4. ✅ **Verify** - Task "Prepare proposal" should be created

**Ready to test!** Just restart the server and try changing a lead stage.
