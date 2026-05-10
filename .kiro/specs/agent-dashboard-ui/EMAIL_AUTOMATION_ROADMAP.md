# Email Automation - Implementation Roadmap

## Quick Start: Minimal Viable Automation (1-2 days)

### Goal
Get basic email automation working for stage changes with simple throttling.

### Tasks

#### 1. Create Throttling Service (2-3 hours)
**File**: `apps/vyntrize-crm/lib/agents/email-throttling-service.ts`

```typescript
export class EmailThrottlingService {
  // Check if we can generate email for this lead
  async canGenerateEmail(leadId: string): Promise<{
    allowed: boolean;
    reason?: string;
    nextAvailableTime?: Date;
  }> {
    // Check: Has email been generated in last 24 hours?
    // Check: Has lead received 3+ emails this week?
    // Check: Is lead unsubscribed?
    return { allowed: true };
  }
  
  // Get recent email generation history
  async getRecentEmailActions(leadId: string, hours: number = 24) {
    // Query agent_actions for EMAIL_SEND actions
  }
}
```

#### 2. Update Email Generation Agent (2-3 hours)
**File**: `apps/vyntrize-crm/lib/agents/email-generation-agent.ts`

Add throttling check:
```typescript
async execute(context: AgentContext): Promise<AgentActionResult> {
  // NEW: Check if we should generate email
  const throttlingService = new EmailThrottlingService();
  const canGenerate = await throttlingService.canGenerateEmail(context.leadId);
  
  if (!canGenerate.allowed) {
    this.log('info', 'Email generation throttled', {
      leadId: context.leadId,
      reason: canGenerate.reason,
    });
    return {
      success: false,
      error: 'Throttled',
      reasoning: canGenerate.reason || 'Email generation rate limit reached',
    };
  }
  
  // ... rest of existing code
}
```

Add trigger context:
```typescript
private generateReasoning(lead: any, tone: string, trigger?: string): string {
  const contactName = `${lead.contact.firstName} ${lead.contact.lastName}`;
  const triggerText = trigger ? ` (Trigger: ${trigger})` : '';
  return `Generated AI-powered email draft for ${contactName} (${lead.stage} stage) with ${tone} tone${triggerText}. Email requires approval before sending.`;
}
```

#### 3. Register for Stage Change Events (1 hour)
**File**: `apps/vyntrize-crm/lib/agents/registry.ts`

```typescript
async registerAllAgents(): Promise<void> {
  // ... existing registrations
  
  // Email Generation - Stage Changes
  const emailAgent = new EmailGenerationAgent();
  eventBus.registerAgent(CRMEvent.STAGE_CHANGED, emailAgent);
  
  this.agents.set(AgentType.EMAIL_GENERATION, emailAgent);
}
```

#### 4. Add Stage Change Filter (1 hour)
**File**: `apps/vyntrize-crm/lib/agents/email-generation-agent.ts`

```typescript
// Add method to check if stage change should trigger email
private shouldTriggerForStageChange(
  previousStage: string,
  newStage: string
): boolean {
  // Only generate emails for specific stage transitions
  const triggerTransitions = [
    'CONTACTED->QUALIFIED',
    'QUALIFIED->PROPOSAL_SENT',
    'PROPOSAL_SENT->WON',
  ];
  
  const transition = `${previousStage}->${newStage}`;
  return triggerTransitions.includes(transition);
}

async execute(context: AgentContext): Promise<AgentActionResult> {
  // Check if this is a stage change event
  if (context.eventData?.previousValue && context.eventData?.newValue) {
    const shouldTrigger = this.shouldTriggerForStageChange(
      context.eventData.previousValue as string,
      context.eventData.newValue as string
    );
    
    if (!shouldTrigger) {
      return {
        success: false,
        error: 'Stage change does not trigger email',
        reasoning: 'This stage transition does not require an automated email',
      };
    }
  }
  
  // ... rest of code
}
```

#### 5. Update Dashboard to Show Auto-Generated Emails (1 hour)
**File**: `apps/vyntrize-crm/app/(crm)/agents/components/ActionList.tsx`

Add badge for auto-generated emails:
```typescript
{action.metadata?.auto_generated && (
  <span className="px-2 py-1 text-xs rounded-full" 
        style={{ 
          backgroundColor: 'var(--color-info-soft)', 
          color: 'var(--color-info)' 
        }}>
    Auto-Generated
  </span>
)}
```

Show trigger reason:
```typescript
{action.metadata?.trigger_reason && (
  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
    Trigger: {action.metadata.trigger_reason}
  </p>
)}
```

#### 6. Test End-to-End (1 hour)
1. Change a lead from CONTACTED → QUALIFIED
2. Verify email draft is auto-generated
3. Check throttling prevents duplicate emails
4. Approve email and verify it works

### Environment Variables
Add to `.env`:
```bash
# Email Automation
EMAIL_AUTOMATION_ENABLED=true
EMAIL_MAX_PER_DAY=1
EMAIL_MAX_PER_WEEK=3
EMAIL_MIN_HOURS_BETWEEN=24
```

---

## Phase 2: Engagement Triggers (2-3 days)

### Tasks

#### 1. Add Email Opened Event Handler (2 hours)
Register for `EMAIL_OPENED` event and generate follow-up emails.

#### 2. Add Email Clicked Event Handler (2 hours)
Register for `EMAIL_CLICKED` event and generate contextual follow-ups.

#### 3. Implement Engagement Rate Calculation (2 hours)
Calculate open/click rates to adjust throttling.

#### 4. Add Engagement-Based Throttling (2 hours)
Adjust email frequency based on engagement rates.

---

## Phase 3: Scheduled Jobs (3-4 days)

### Tasks

#### 1. Create Inactivity Checker Job (4 hours)
Daily job to find inactive leads and generate re-engagement emails.

#### 2. Create Engagement Checker Job (3 hours)
Hourly job to check for recent engagement and generate follow-ups.

#### 3. Add Job Scheduling Infrastructure (4 hours)
Use BullMQ or similar to schedule recurring jobs.

#### 4. Add Job Monitoring Dashboard (3 hours)
Show job status and history in admin dashboard.

---

## Phase 4: Advanced Features (1-2 weeks)

### Tasks

#### 1. Bulk Approval Actions (1 day)
Allow approving/rejecting multiple emails at once.

#### 2. Email Automation Metrics (2 days)
Track and display automation performance metrics.

#### 3. Admin Settings Page (2 days)
UI for configuring throttling rules and triggers.

#### 4. A/B Testing Framework (3 days)
Test different email templates and tones.

#### 5. Smart Templates (1 week)
Learn from approved/rejected emails to improve generation.

---

## Success Criteria

### Phase 1 (MVP)
- ✅ Email drafts auto-generate on stage changes
- ✅ Throttling prevents over-emailing (max 1/day)
- ✅ Dashboard shows auto-generated badge
- ✅ Approval workflow works correctly

### Phase 2 (Engagement)
- ✅ Email drafts generate on email opens/clicks
- ✅ Engagement rate affects throttling
- ✅ Contextual follow-ups based on engagement

### Phase 3 (Scheduled)
- ✅ Daily inactivity checks generate re-engagement emails
- ✅ Hourly engagement checks generate timely follow-ups
- ✅ Jobs run reliably and can be monitored

### Phase 4 (Advanced)
- ✅ Bulk actions save time for sales team
- ✅ Metrics show automation value
- ✅ Admin can configure rules without code changes
- ✅ A/B testing improves email performance

---

## Risk Mitigation

### Risk: Too Many Emails Generated
**Mitigation**: Start with conservative throttling (1/day), monitor metrics, adjust gradually

### Risk: Low Approval Rate
**Mitigation**: Track approval rate by trigger type, disable low-performing triggers

### Risk: AI Generates Poor Quality Emails
**Mitigation**: Improve prompts based on rejected emails, add quality checks

### Risk: Performance Impact
**Mitigation**: Use background jobs, implement rate limiting, monitor database load

### Risk: Compliance Issues
**Mitigation**: Always require approval, respect unsubscribes, include opt-out links

---

## Monitoring & Alerts

### Key Metrics to Track
1. **Email Generation Rate**: Emails generated per day/week
2. **Approval Rate**: % of generated emails that get approved
3. **Throttling Rate**: % of attempts that get throttled
4. **Trigger Breakdown**: Which triggers generate most emails
5. **Engagement Impact**: Open/click rates for auto-generated vs manual emails

### Alerts to Set Up
1. **Low Approval Rate**: Alert if approval rate < 50%
2. **High Throttling**: Alert if throttling rate > 30%
3. **Job Failures**: Alert if scheduled jobs fail
4. **AI Provider Errors**: Alert if AI generation fails repeatedly

---

## Documentation Needed

1. **User Guide**: How to use email automation
2. **Admin Guide**: How to configure throttling rules
3. **Developer Guide**: How to add new triggers
4. **Troubleshooting Guide**: Common issues and solutions

---

## Next Steps

### Immediate (This Week)
1. Review and approve this plan
2. Set up development environment
3. Implement Phase 1 (MVP)
4. Test with real data
5. Deploy to staging

### Short Term (Next 2 Weeks)
1. Gather feedback from sales team
2. Adjust throttling rules based on usage
3. Implement Phase 2 (Engagement triggers)
4. Monitor metrics and iterate

### Long Term (Next Month)
1. Implement Phase 3 (Scheduled jobs)
2. Add advanced features based on feedback
3. Optimize AI prompts for better quality
4. Scale to handle more leads

---

## Questions for Product/Sales Team

1. **Which stage transitions should trigger emails?**
   - Current plan: CONTACTED→QUALIFIED, QUALIFIED→PROPOSAL_SENT, PROPOSAL_SENT→WON
   - Should we add more?

2. **What's an acceptable email frequency?**
   - Current plan: Max 1/day, 3/week
   - Too conservative? Too aggressive?

3. **Should we notify sales reps immediately or batch notifications?**
   - Current plan: Immediate for urgent, daily digest for others
   - Preference?

4. **What email metrics matter most?**
   - Open rate? Click rate? Response rate? Meetings booked?

5. **Should we start with all leads or a subset?**
   - Current plan: All leads that meet throttling criteria
   - Or start with high-value leads only?
