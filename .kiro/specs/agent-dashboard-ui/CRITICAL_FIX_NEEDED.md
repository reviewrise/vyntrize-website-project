# CRITICAL FIX - Agent System Not Initializing

## Problem Identified

The agent system is **NOT initializing** because of a check in `apps/vyntrize-crm/lib/agents/init.ts` that requires `OPENAI_API_KEY` to be set.

### Evidence from Your Logs

✅ **Event emission is working:**
```
[EventBus] Emitting stage_changed {
  leadId: 'cmon4iwon00063wbmv95zilp6',
  userId: 'cmojq6lqe0001wobmn88ye34w',
  previousValue: 'CONTACTED',
  newValue: 'QUALIFIED',
  metadata: { closingNote: null }
}
```

❌ **But no agent execution:**
- No log message: `[EventBus] Registered TaskAutomationAgent for stage_changed`
- No log message: `[Agent] Task created automatically`
- No log message: `[AgentRegistry] All agents registered successfully`

### Root Cause

The initialization code was checking for `OPENAI_API_KEY` as a **required** environment variable:

```typescript
// OLD CODE (WRONG)
const requiredEnvVars = ['REDIS_HOST', 'REDIS_PORT', 'OPENAI_API_KEY'];
```

Since you only have a placeholder OpenAI key, the agent system never initialized, so no agents were registered!

## Fix Applied

Changed `OPENAI_API_KEY` and `GEMINI_API_KEY` to be **optional**:

```typescript
// NEW CODE (CORRECT)
const requiredEnvVars = ['REDIS_HOST', 'REDIS_PORT'];
// AI provider keys are optional - agents will work without them
```

Now the agent system will:
- ✅ Initialize even without AI provider keys
- ✅ Register all agents (Lead Scoring, Task Automation, Stagnation Detection)
- ✅ Warn about missing AI keys (but not block initialization)
- ✅ AI-powered agents (Email Generation, Next Best Action) will show as unavailable

## What You Need to Do

### Step 1: Restart Dev Server

The fix is in the code, but you need to restart the server to pick it up:

```bash
# Stop the current server (Ctrl+C in terminal)
# Then start again:
cd apps/vyntrize-crm
npm run dev
```

### Step 2: Check Server Startup Logs

Look for these messages when server starts:

✅ **Success indicators:**
```
[AgentSystem] Initializing agent system...
[AgentSystem] No AI provider keys configured. AI-powered agents will not be available.
[AgentRegistry] Registering all agents...
[EventBus] Registered LeadScoringAgent for lead_created
[EventBus] Registered LeadScoringAgent for lead_updated
[EventBus] Registered LeadScoringAgent for email_opened
[EventBus] Registered LeadScoringAgent for email_clicked
[EventBus] Registered TaskAutomationAgent for stage_changed
[AgentRegistry] All agents registered successfully
[AgentSystem] Agent system initialized successfully
```

❌ **Failure indicators:**
```
[AgentSystem] Missing environment variables: REDIS_HOST, REDIS_PORT. Agent system will be disabled.
```

### Step 3: Test Stage Change Again

After restart:
1. Go to `/pipeline`
2. Drag a lead from CONTACTED to QUALIFIED
3. Check server logs for:
   ```
   [EventBus] Emitting stage_changed
   [Agent] Task created automatically
   ```

### Step 4: Verify Task Created

Check the lead detail page or run this query:

```sql
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

## Diagnostic Script

If you want to check the agent system status without restarting:

```bash
cd apps/vyntrize-crm
npx tsx scripts/check-agent-system.ts
```

This will show:
- Environment variables
- Registry initialization status
- Registered agents for each event
- Attempt to initialize if not initialized

## Expected Behavior After Fix

### On Server Startup
```
[AgentSystem] Initializing agent system...
[AgentSystem] No AI provider keys configured. AI-powered agents (Email Generation, Next Best Action) will not be available.
[AgentRegistry] Registering all agents...
[EventBus] Registered TaskAutomationAgent for stage_changed
[AgentRegistry] All agents registered successfully
[AgentSystem] Agent system initialized successfully
```

### On Stage Change
```
[updateLeadStage] Emitted STAGE_CHANGED event for lead xxx: CONTACTED → QUALIFIED
[EventBus] Emitting stage_changed { leadId: 'xxx', ... }
[Agent] Task created automatically { leadId: 'xxx', taskId: 'yyy', stage: 'QUALIFIED' }
```

### On Agent Dashboard
- Task Automation Agent shows as enabled
- Recent actions show TASK_AUTOMATION with status EXECUTED
- Tasks appear in lead detail pages

## Why This Happened

The original code assumed that AI provider keys were **required** for the agent system to work. This was incorrect because:

1. **Not all agents need AI providers:**
   - Lead Scoring Agent - Uses rule-based scoring
   - Task Automation Agent - Uses predefined task templates
   - Stagnation Detection Agent - Uses date-based logic

2. **Only 2 agents need AI providers:**
   - Email Generation Agent - Needs OpenAI/Gemini for email drafts
   - Next Best Action Agent - Needs OpenAI/Gemini for recommendations

3. **The check was too strict:**
   - Blocked entire agent system if OpenAI key was missing
   - Should have only warned about AI-powered agents being unavailable

## Files Modified

1. ✅ `apps/vyntrize-crm/lib/agents/init.ts` - Made AI keys optional
2. ✅ `apps/vyntrize-crm/lib/actions/leads.ts` - Added event emission (already done)
3. ✅ `apps/vyntrize-crm/lib/agents/event-bus.ts` - Fixed event data passing (already done)

## Next Steps

1. **Restart dev server** (most important!)
2. Check startup logs for agent registration
3. Test stage change (CONTACTED → QUALIFIED)
4. Verify task "Prepare proposal" is created
5. Check `/agents` dashboard for TASK_AUTOMATION action

## If Still Not Working After Restart

### Check 1: Redis Running?
```bash
redis-cli ping
```
Should return: `PONG`

### Check 2: Environment Variables
Check `apps/vyntrize-crm/.env`:
```env
REDIS_HOST="localhost"
REDIS_PORT="6379"
AGENT_TASK_AUTOMATION_ENABLED="true"
```

### Check 3: Run Diagnostic Script
```bash
cd apps/vyntrize-crm
npx tsx scripts/check-agent-system.ts
```

### Check 4: Check Server Logs
Look for initialization errors or warnings

---

**Status:** ✅ FIX APPLIED - RESTART REQUIRED

**Action Required:** Restart dev server and test again

**Expected Result:** Task Automation Agent will work after restart
