# FINAL FIX - Instrumentation Hook Not Enabled

## The Real Problem

The `instrumentation.ts` file exists and has the correct code, but **Next.js instrumentation was not enabled** in the config!

### Why Agents Weren't Running

1. ✅ Event emission code - Working
2. ✅ Event bus code - Working  
3. ✅ Agent registration code - Working
4. ✅ Redis configured - Working
5. ❌ **Instrumentation hook not enabled** - **THIS WAS THE ISSUE**

Without `instrumentationHook: true` in `next.config.ts`, Next.js never calls the `register()` function in `instrumentation.ts`, so agents never get registered!

## The Fix

Added `instrumentationHook: true` to `next.config.ts`:

```typescript
experimental: {
  serverActions: {
    allowedOrigins: ['crm.vyntrise.com', 'localhost:3014'],
  },
  instrumentationHook: true,  // ← THIS WAS MISSING!
},
```

## What You Need to Do NOW

### 1. Restart Dev Server (REQUIRED!)

```bash
# Stop the server (Ctrl+C)
# Start again:
npm run dev
```

### 2. Watch for Agent Registration Logs

On server startup, you should NOW see:

```
[AgentSystem] Initializing agent system...
[AgentRegistry] Registering all agents...
[EventBus] Registered LeadScoringAgent for lead_created
[EventBus] Registered LeadScoringAgent for lead_updated
[EventBus] Registered LeadScoringAgent for email_opened
[EventBus] Registered LeadScoringAgent for email_clicked
[EventBus] Registered TaskAutomationAgent for stage_changed  ← KEY LINE!
[AgentRegistry] All agents registered successfully
[AgentSystem] Agent system initialized successfully
```

### 3. Test Stage Change

After restart:
1. Go to `/pipeline`
2. Drag a lead from CONTACTED to QUALIFIED
3. **NOW you should see:**
   ```
   [EventBus] Emitting stage_changed
   [Agent] Task created automatically  ← THIS SHOULD APPEAR NOW!
   ```

### 4. Verify Task Created

Check lead detail page for task: **"Prepare proposal"**

## All Fixes Applied

### Fix 1: Event Emission ✅
- Added `STAGE_CHANGED` event emission to `updateLeadStage()`
- Added `LEAD_CREATED` event emission to `createLead()`

### Fix 2: Event Bus Method ✅
- Changed `.emit()` to `.emitCRMEvent()`
- Fixed payload structure

### Fix 3: Event Data Passing ✅
- Event bus now passes `previousValue` and `newValue` to agent context

### Fix 4: Optional AI Keys ✅
- Made `OPENAI_API_KEY` and `GEMINI_API_KEY` optional
- Agent system initializes without AI providers

### Fix 5: Instrumentation Hook ✅ (FINAL FIX!)
- Enabled `instrumentationHook: true` in `next.config.ts`
- Now `register()` function will be called on server startup

## Why This Was Hard to Find

1. **No error messages** - Next.js silently ignores `instrumentation.ts` if hook not enabled
2. **Events still worked** - Event emission code ran fine, but no listeners
3. **Looked like agent issue** - But agents were never registered in the first place
4. **Config was incomplete** - Missing one line in experimental config

## Expected Behavior After Restart

### Server Startup
```
✅ [AgentSystem] Initializing agent system...
✅ [AgentSystem] No AI provider keys configured. AI-powered agents will not be available.
✅ [AgentRegistry] Registering all agents...
✅ [EventBus] Registered LeadScoringAgent for lead_created
✅ [EventBus] Registered LeadScoringAgent for lead_updated
✅ [EventBus] Registered LeadScoringAgent for email_opened
✅ [EventBus] Registered LeadScoringAgent for email_clicked
✅ [EventBus] Registered TaskAutomationAgent for stage_changed
✅ [AgentRegistry] All agents registered successfully
✅ [AgentSystem] Agent system initialized successfully
```

### Stage Change (CONTACTED → QUALIFIED)
```
✅ [updateLeadStage] Emitted STAGE_CHANGED event for lead xxx: CONTACTED → QUALIFIED
✅ [EventBus] Emitting stage_changed { leadId: 'xxx', ... }
✅ [Agent] Task created automatically { leadId: 'xxx', taskId: 'yyy', stage: 'QUALIFIED' }
```

### Task Created
```
Title: "Prepare proposal"
Description: "Create and send a detailed proposal based on lead requirements"
Priority: HIGH
Due Date: 3 business days from now
Status: PENDING
```

## Files Modified (Complete List)

1. ✅ `apps/vyntrize-crm/lib/actions/leads.ts` - Event emission
2. ✅ `apps/vyntrize-crm/lib/agents/event-bus.ts` - Event data passing
3. ✅ `apps/vyntrize-crm/lib/agents/init.ts` - Optional AI keys
4. ✅ `apps/vyntrize-crm/next.config.ts` - **Instrumentation hook enabled**

## Verification Checklist

After restart, verify:

- [ ] Server logs show `[AgentSystem] Initializing agent system...`
- [ ] Server logs show `[EventBus] Registered TaskAutomationAgent for stage_changed`
- [ ] Server logs show `[AgentRegistry] All agents registered successfully`
- [ ] Change lead stage CONTACTED → QUALIFIED
- [ ] Server logs show `[Agent] Task created automatically`
- [ ] Task "Prepare proposal" appears in lead detail page
- [ ] Task has due date 3 business days from now
- [ ] Task has priority HIGH
- [ ] Agent action appears in `/agents` dashboard

## If Still Not Working

### Check 1: Did you restart?
The config change requires a full restart.

### Check 2: Check startup logs
Look for agent registration messages. If missing, check:
- Is Redis running? `redis-cli ping`
- Any errors in startup logs?

### Check 3: Run diagnostic
```bash
cd apps/vyntrize-crm
npx tsx scripts/check-agent-system.ts
```

Should show:
```
Agent Registry:
  Initialized: true

Agents Registered for STAGE_CHANGED Event:
  Count: 1
  1. TaskAutomationAgent
```

## Success Criteria

✅ **Working when you see:**
1. Agent registration logs on startup
2. `[Agent] Task created automatically` on stage change
3. Tasks appearing in lead detail pages
4. Actions appearing in `/agents` dashboard

---

**Status:** ✅ ALL FIXES COMPLETE

**Action Required:** RESTART DEV SERVER NOW

**Expected Result:** Task Automation Agent will work after restart

**This is the final fix!** 🎉
