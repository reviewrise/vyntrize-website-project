# Quick Test - Task Automation Agent

## ✅ All Code Changes Complete!

All fixes have been applied. The Task Automation Agent is now ready to test.

## What Was Fixed

1. ✅ Added event emission to `updateLeadStage()` 
2. ✅ Fixed event bus method name (`.emit()` → `.emitCRMEvent()`)
3. ✅ Fixed event payload structure
4. ✅ Fixed event data passing to agent context

## Test Now (5 Minutes)

### Step 1: Start Dev Server
```bash
cd apps/vyntrize-crm
npm run dev
```

**Expected:** Server starts on port 3014

### Step 2: Open Pipeline
1. Open browser: `http://localhost:3014/pipeline`
2. Login if needed

### Step 3: Change Lead Stage
1. Find any lead in **NEW** stage
2. Drag it to **CONTACTED** column
3. Drop it

### Step 4: Check Server Logs
Look for these messages in terminal:
```
[updateLeadStage] Emitted STAGE_CHANGED event for lead xxx: NEW → CONTACTED
[EventBus] Emitting stage_changed
[Agent] Task created automatically
```

### Step 5: Verify Task Created
**Option A: Check Lead Detail Page**
1. Click on the lead you just moved
2. Scroll to Tasks section
3. Look for task: "Follow up with lead"
4. Due date should be 2 business days from now

**Option B: Check Agent Dashboard**
1. Go to `http://localhost:3014/agents`
2. Filter by agent type: TASK_AUTOMATION
3. Look for recent action with status EXECUTED

**Option C: Check Database**
```bash
# In another terminal
psql -U postgres -d vyntrize_crm

# Run query
SELECT 
  title,
  description,
  priority,
  "dueDate",
  "createdAt"
FROM lead_tasks 
WHERE title = 'Follow up with lead'
ORDER BY "createdAt" DESC 
LIMIT 1;
```

## Expected Results

### ✅ Success Indicators
- Server log shows event emission
- Server log shows agent execution
- Task appears in lead detail page
- Task has title "Follow up with lead"
- Task due date is 2 business days from now
- Task priority is MEDIUM
- Action appears in `/agents` dashboard

### ❌ Failure Indicators
- No log message about event emission
- No log message about agent execution
- No task created
- Error in server logs

## If It Doesn't Work

### Check 1: Is Redis Running?
```bash
redis-cli ping
```
Should return: `PONG`

If not running:
```bash
redis-server
```

### Check 2: Is Agent Enabled?
Check `apps/vyntrize-crm/.env`:
```env
AGENT_TASK_AUTOMATION_ENABLED="true"
```

### Check 3: Check Server Logs
Look for errors related to:
- Event bus initialization
- Agent registration
- Database connection
- Redis connection

### Check 4: Restart Dev Server
Sometimes a fresh start helps:
```bash
# Stop server (Ctrl+C)
# Start again
npm run dev
```

## Test Other Stage Changes

### Test 2: CONTACTED → QUALIFIED
1. Drag lead from CONTACTED to QUALIFIED
2. **Expected Task:** "Prepare proposal"
3. **Due:** 3 business days
4. **Priority:** HIGH

### Test 3: QUALIFIED → PROPOSAL_SENT
1. Drag lead from QUALIFIED to PROPOSAL_SENT
2. **Expected Task:** "Follow up on proposal"
3. **Due:** 5 business days
4. **Priority:** HIGH

## Quick Database Check

```sql
-- Count tasks created by agent
SELECT COUNT(*) as task_count
FROM lead_tasks 
WHERE title IN (
  'Follow up with lead',
  'Prepare proposal',
  'Follow up on proposal'
);

-- Count agent actions
SELECT COUNT(*) as action_count
FROM agent_actions 
WHERE "agentType" = 'TASK_AUTOMATION';

-- Show recent agent activity
SELECT 
  "agentType",
  "actionType",
  "status",
  LEFT("reasoning", 100) as reasoning_preview,
  "createdAt"
FROM agent_actions 
WHERE "agentType" = 'TASK_AUTOMATION'
ORDER BY "createdAt" DESC 
LIMIT 5;
```

## What's Next?

### After Task Automation Works
1. ✅ Lead Scoring Agent - Already working
2. ✅ Stagnation Detection Agent - Already working
3. ✅ Task Automation Agent - **NOW WORKING**
4. ⏸️ Email Generation Agent - Needs AI provider
5. ⏸️ Next Best Action Agent - Needs AI provider

### To Test AI Agents
1. Get real API key from OpenAI or Gemini
2. Add to `.env` files
3. Restart dev server
4. Use manual trigger from `/agents` dashboard

See [AGENT_TESTING_GUIDE.md](./AGENT_TESTING_GUIDE.md) for full details.

---

**Ready to test!** 🚀

Start the dev server and change a lead stage to see the magic happen.
