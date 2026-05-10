# Task Automation Agent Fix

## Problem
The Task Automation Agent wasn't running when leads changed stages because stage change events weren't being emitted.

## Root Cause
The `updateLeadStage` action in `apps/vyntrize-crm/lib/actions/leads.ts` was updating the database but not emitting the `STAGE_CHANGED` event that the Task Automation Agent listens for.

## Solution
Added event emission to the lead actions:

### 1. Stage Change Event
When a lead's stage changes (e.g., NEW → CONTACTED), the system now emits a `STAGE_CHANGED` event:

```typescript
// Emit stage change event for agents
try {
  const { eventBus, CRMEvent } = await import('@/lib/agents/event-bus');
  await eventBus.emitCRMEvent(CRMEvent.STAGE_CHANGED, {
    leadId: id,
    userId: session.userId,
    previousValue: prevStage,
    newValue: stage,
    metadata: {
      closingNote,
    },
  });
  console.log(`[updateLeadStage] Emitted STAGE_CHANGED event for lead ${id}: ${prevStage} → ${stage}`);
} catch (error) {
  console.error('[updateLeadStage] Failed to emit stage change event:', error);
  // Don't fail the stage update if event emission fails
}
```

### 2. Lead Created Event
When a new lead is created, the system now emits a `LEAD_CREATED` event:

```typescript
// Emit lead created event for agents
try {
  const { eventBus, CRMEvent } = await import('@/lib/agents/event-bus');
  await eventBus.emitCRMEvent(CRMEvent.LEAD_CREATED, {
    leadId: lead.id,
    userId: session.userId,
    metadata: {
      title,
      contactId,
      companyId,
      assigneeId,
    },
  });
  console.log(`[createLead] Emitted LEAD_CREATED event for lead ${lead.id}`);
} catch (error) {
  console.error('[createLead] Failed to emit lead created event:', error);
  // Don't fail the lead creation if event emission fails
}
```

## How It Works Now

### Stage Change Flow
1. User drags lead to new stage in Kanban board
2. `updateLeadStage` action is called
3. Database is updated (lead stage, audit log, activity)
4. `STAGE_CHANGED` event is emitted
5. Task Automation Agent receives event
6. Agent checks if stage requires a task (CONTACTED, QUALIFIED, PROPOSAL_SENT)
7. Agent creates task automatically
8. Task appears in the lead's task list

### Task Creation by Stage

| Stage Change | Task Created | Due In | Priority |
|--------------|--------------|--------|----------|
| → CONTACTED | "Follow up with lead" | 2 business days | Medium |
| → QUALIFIED | "Prepare proposal" | 3 business days | High |
| → PROPOSAL_SENT | "Follow up on proposal" | 5 business days | High |

## Testing

### Test the Fix
1. Go to `/pipeline` in the CRM
2. Drag a lead from NEW to CONTACTED
3. Check the server logs for:
   ```
   [updateLeadStage] Emitted STAGE_CHANGED event for lead xxx: NEW → CONTACTED
   [Agent] Task created automatically
   ```
4. Go to the lead detail page
5. Verify a task "Follow up with lead" was created
6. Check `/agents` dashboard for TASK_AUTOMATION action

### Expected Server Logs
```
[updateLeadStage] Emitted STAGE_CHANGED event for lead abc123: NEW → CONTACTED
[EventBus] Emitting event: stage_changed
[EventBus] Executing agent: TaskAutomationAgent
[Agent] Task created automatically { leadId: 'abc123', taskId: 'task123', stage: 'CONTACTED' }
```

### Expected Database Records
```sql
-- Check agent action was recorded
SELECT * FROM agent_actions 
WHERE "agentType" = 'TASK_AUTOMATION' 
ORDER BY "createdAt" DESC 
LIMIT 1;

-- Check task was created
SELECT * FROM lead_tasks 
WHERE "leadId" = 'your-lead-id' 
AND title LIKE '%Follow up%'
ORDER BY "createdAt" DESC 
LIMIT 1;
```

## Files Modified
1. `apps/vyntrize-crm/lib/actions/leads.ts` - Added event emission to `createLead` and `updateLeadStage`

## Benefits

### Before Fix
- ❌ Stage changes didn't trigger agents
- ❌ No automatic task creation
- ❌ Manual task creation required
- ❌ Easy to forget follow-ups

### After Fix
- ✅ Stage changes trigger Task Automation Agent
- ✅ Tasks created automatically
- ✅ Consistent follow-up process
- ✅ Never miss a follow-up

## Error Handling
The event emission is wrapped in try-catch to ensure:
- Stage updates succeed even if event emission fails
- Errors are logged but don't break the user flow
- System remains resilient

## Future Enhancements

### Additional Events to Emit
Consider adding event emission for:
- Lead updates (deal value, assignee changes)
- Email opens/clicks (if not already implemented)
- Task completions
- Note additions

### Example: Lead Update Event
```typescript
// In updateLeadDeal function
try {
  const { eventBus, CRMEvent } = await import('@/lib/agents/event-bus');
  await eventBus.emit(CRMEvent.LEAD_UPDATED, {
    leadId: id,
    userId: session.userId,
    eventData: updates,
  });
} catch (error) {
  console.error('[updateLeadDeal] Failed to emit lead updated event:', error);
}
```

## Verification Checklist

After deploying this fix:

- [ ] Restart dev server
- [ ] Change a lead stage from NEW to CONTACTED
- [ ] Check server logs for event emission
- [ ] Verify task was created
- [ ] Check agent dashboard for TASK_AUTOMATION action
- [ ] Verify task has correct due date (2 business days)
- [ ] Verify task is assigned to lead owner
- [ ] Test other stage changes (QUALIFIED, PROPOSAL_SENT)

## Troubleshooting

### Event Emitted But No Task Created

**Check:**
1. Is Task Automation Agent enabled?
   ```env
   AGENT_TASK_AUTOMATION_ENABLED="true"
   ```
2. Is the agent registered?
   - Check server startup logs for "TaskAutomationAgent registered"
3. Does a similar task already exist?
   - Agent prevents duplicate tasks

### No Event in Logs

**Check:**
1. Is the import working?
   - Event bus should be imported dynamically
2. Are there any import errors?
   - Check server logs for import failures
3. Is the code path being executed?
   - Add console.log before event emission

### Task Created But Wrong Details

**Check:**
1. Stage configuration in `task-automation-agent.ts`
2. Due date calculation (business days)
3. Task priority settings

## Related Documentation
- [Agent Testing Guide](./AGENT_TESTING_GUIDE.md)
- [Agents Documentation](../../apps/vyntrize-crm/lib/agents/AGENTS_DOCUMENTATION.md)
- [Event Bus Documentation](../../apps/vyntrize-crm/lib/agents/event-bus.ts)
