# Agent Testing Guide

## Current Status

### ✅ Working Agents (You've Seen These)
1. **Lead Scoring Agent** - Running automatically
2. **Stagnation Detection Agent** - Running automatically

### ⏸️ Not Seeing These (Need Specific Triggers)
3. **Task Automation Agent** - Needs stage change event
4. **Email Generation Agent** - Needs manual trigger + AI provider
5. **Next Best Action Agent** - Needs manual trigger + AI provider

---

## Why You're Not Seeing Some Agents

### Task Automation Agent
**Trigger:** `STAGE_CHANGED` event

**Problem:** The event might not be emitted when leads change stages in the UI.

**Solution:** We need to ensure stage changes emit the event.

### Email Generation & Next Best Action Agents
**Trigger:** Manual trigger from dashboard

**Problem:** 
1. No AI provider configured (OpenAI/Gemini keys are placeholders)
2. Manual trigger UI might not be fully implemented

**Solution:** Configure a real AI provider and use the manual trigger feature.

---

## How to Test Each Agent

### 1. Lead Scoring Agent ✅ (Already Working)

**How to trigger:**
- Create a new lead
- Update a lead
- Open an email (if email tracking is set up)
- Click a link in an email

**What to expect:**
- Lead score updated (0-100)
- Qualification status assigned (hot, qualified, warm, cold, unqualified)
- Action recorded in agent dashboard

**Check:**
```sql
SELECT * FROM agent_actions 
WHERE "agentType" = 'LEAD_SCORING' 
ORDER BY "createdAt" DESC 
LIMIT 10;
```

---

### 2. Stagnation Detection Agent ✅ (Already Working)

**How to trigger:**
- Runs automatically daily at 9 AM
- Or wait for leads to become inactive

**What to expect:**
- Alerts for leads with no activity
- Urgent tasks created for critical cases
- Actions recorded in dashboard

**Check:**
```sql
SELECT * FROM agent_actions 
WHERE "agentType" = 'STAGNATION_DETECTION' 
ORDER BY "createdAt" DESC 
LIMIT 10;
```

---

### 3. Task Automation Agent ⏸️ (Needs Stage Change)

**How to trigger:**
- Move a lead from NEW → CONTACTED
- Move a lead from CONTACTED → QUALIFIED
- Move a lead from QUALIFIED → PROPOSAL_SENT

**What to expect:**
- Task automatically created
- Task assigned to lead owner
- Due date set (2-5 business days depending on stage)
- Action recorded in dashboard

**Current Issue:** Stage change events might not be emitted.

**To fix:** We need to add event emission to the lead update API.

**Check:**
```sql
SELECT * FROM agent_actions 
WHERE "agentType" = 'TASK_AUTOMATION' 
ORDER BY "createdAt" DESC 
LIMIT 10;
```

---

### 4. Email Generation Agent ⏸️ (Needs AI Provider + Manual Trigger)

**Prerequisites:**
1. Configure real AI provider:
   ```env
   OPENAI_API_KEY="sk-proj-xxxxx"  # Real key
   # OR
   GEMINI_API_KEY="AIzaSyxxxxx"    # Real key
   ```
2. Restart dev server

**How to trigger:**
1. Go to `/agents` dashboard
2. Click "Trigger Agent" button
3. Search for a lead
4. Select "Email Generation" agent
5. Click "Trigger"

**What to expect:**
- Email draft generated with subject and body
- Action status: PENDING (requires approval)
- Email appears in pending actions list
- You can approve/reject the draft

**Check:**
```sql
SELECT * FROM agent_actions 
WHERE "agentType" = 'EMAIL_GENERATION' 
ORDER BY "createdAt" DESC 
LIMIT 10;
```

---

### 5. Next Best Action Agent ⏸️ (Needs AI Provider + Manual Trigger)

**Prerequisites:**
1. Configure real AI provider (same as Email Generation)
2. Restart dev server

**How to trigger:**
1. Go to `/agents` dashboard
2. Click "Trigger Agent" button
3. Search for a lead
4. Select "Next Best Action" agent
5. Click "Trigger"

**What to expect:**
- 1-3 recommendations generated
- Each with action, reasoning, and priority
- Action status: EXECUTED (copilot mode, no approval needed)
- Recommendations visible in action details

**Check:**
```sql
SELECT * FROM agent_actions 
WHERE "agentType" = 'NEXT_BEST_ACTION' 
ORDER BY "createdAt" DESC 
LIMIT 10;
```

---

## Quick Test Plan

### Phase 1: Verify Working Agents (5 minutes)
1. Check agent dashboard at `/agents`
2. Verify Lead Scoring actions exist
3. Verify Stagnation Detection actions exist
4. ✅ These should already be working

### Phase 2: Test Task Automation (10 minutes)
1. Go to a lead detail page
2. Change the lead stage (NEW → CONTACTED)
3. Check if a task was created
4. Check agent dashboard for TASK_AUTOMATION action
5. ❌ If no action appears, stage change events aren't being emitted

### Phase 3: Test AI Agents (15 minutes)
1. Add real OpenAI or Gemini API key to `.env`
2. Restart dev server
3. Check dashboard shows AI provider as "Available"
4. Use manual trigger to generate email
5. Use manual trigger to get recommendations
6. ✅ Should work if AI provider is configured

---

## Troubleshooting

### Task Automation Not Working

**Symptom:** No tasks created when changing lead stages

**Possible Causes:**
1. Stage change event not emitted
2. Event bus not receiving events
3. Agent not registered for STAGE_CHANGED event

**Solution:** Add event emission to lead update API

**Quick Fix:** Manually trigger the agent via API:
```bash
curl -X POST http://localhost:3014/api/agents/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "agentType": "TASK_AUTOMATION",
    "leadId": "your-lead-id",
    "eventData": {
      "newValue": "CONTACTED"
    }
  }'
```

### AI Agents Not Working

**Symptom:** "No AI providers available" error

**Possible Causes:**
1. API key is placeholder
2. API key is invalid
3. Dev server not restarted after adding key

**Solution:**
1. Get real API key from OpenAI or Gemini
2. Replace placeholder in `.env` files
3. Restart dev server
4. Check dashboard shows provider as "Available"

### Manual Trigger Not Working

**Symptom:** Can't find manual trigger button

**Possible Causes:**
1. Manual trigger UI not implemented
2. Looking in wrong place

**Solution:**
1. Check `/agents` dashboard
2. Look for "Trigger Agent" or "Manual Trigger" button
3. If not found, trigger via API (see Quick Fix above)

---

## Expected Agent Actions Count

After 24 hours of running:

| Agent | Expected Actions | Frequency |
|-------|------------------|-----------|
| Lead Scoring | 10-100+ | Per lead interaction |
| Stagnation Detection | 1-10 | Daily batch |
| Task Automation | 0-20 | Per stage change |
| Email Generation | 0 | Manual only |
| Next Best Action | 0 | Manual only |

---

## Database Queries for Verification

### Check All Agent Actions
```sql
SELECT 
  "agentType",
  COUNT(*) as count,
  MAX("createdAt") as last_run
FROM agent_actions
GROUP BY "agentType"
ORDER BY count DESC;
```

### Check Recent Actions
```sql
SELECT 
  "agentType",
  "actionType",
  "status",
  "reasoning",
  "createdAt"
FROM agent_actions
ORDER BY "createdAt" DESC
LIMIT 20;
```

### Check Pending Approvals
```sql
SELECT 
  "agentType",
  "actionType",
  "reasoning",
  "createdAt"
FROM agent_actions
WHERE "status" = 'PENDING'
ORDER BY "createdAt" DESC;
```

### Check Agent Performance
```sql
SELECT 
  "agentType",
  "status",
  COUNT(*) as count
FROM agent_actions
GROUP BY "agentType", "status"
ORDER BY "agentType", "status";
```

---

## Next Steps

### To Enable Task Automation Agent
1. **Add event emission to lead update API**
2. Emit `STAGE_CHANGED` event when lead stage changes
3. Test by changing a lead stage
4. Verify task is created automatically

### To Enable AI Agents
1. **Get real API key** from OpenAI or Gemini
2. Update `.env` files (both root and `apps/vyntrize-crm/.env`)
3. Restart dev server
4. Verify provider shows as "Available" in dashboard
5. Use manual trigger to test

### To Verify Everything Works
1. Run all tests in Quick Test Plan
2. Check database for agent actions
3. Review agent dashboard for errors
4. Monitor server logs for issues

---

## Success Criteria

✅ **All agents working when:**
- Lead Scoring: Actions appear on lead interactions
- Stagnation Detection: Daily batch runs at 9 AM
- Task Automation: Tasks created on stage changes
- Email Generation: Drafts generated on manual trigger
- Next Best Action: Recommendations provided on manual trigger

---

## Support

If agents still aren't working after following this guide:

1. Check server logs for errors
2. Verify Redis is running: `redis-cli ping`
3. Check agent dashboard for error messages
4. Review database for agent actions
5. Verify environment variables are set correctly
