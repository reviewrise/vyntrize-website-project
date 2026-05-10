# Email Generation Agent - Automation Plan

## Overview
Transform the Email Generation Agent from manual-only triggering to intelligent automated email draft generation based on lead behavior, stage changes, and engagement patterns.

## Current State
- ✅ Email Generation Agent exists and works via manual trigger
- ✅ Generates AI-powered email drafts using Gemini/OpenAI
- ✅ Requires approval before sending (SUGGEST_APPROVE autonomy level)
- ❌ Only triggered manually from dashboard
- ❌ No automatic detection of email opportunities

## Goals
1. **Automatically detect when emails should be sent** based on lead behavior
2. **Generate contextual email drafts** that require approval
3. **Prevent email fatigue** with smart throttling and frequency limits
4. **Maintain human oversight** - all emails require approval before sending

## Automation Triggers

### 1. Stage Change Triggers (High Priority)
Generate email drafts when leads move to specific stages:

| Stage Transition | Email Purpose | Priority |
|-----------------|---------------|----------|
| NEW → CONTACTED | Initial outreach confirmation | HIGH |
| CONTACTED → QUALIFIED | Value proposition and discovery | HIGH |
| QUALIFIED → PROPOSAL_SENT | Proposal follow-up | URGENT |
| Any → WON | Celebration and onboarding | HIGH |
| Any → LOST | Door-open and feedback request | MEDIUM |

**Event**: `STAGE_CHANGED`

### 2. Inactivity Triggers (Medium Priority)
Generate re-engagement emails for stagnant leads:

| Scenario | Condition | Email Purpose |
|----------|-----------|---------------|
| No activity | 7+ days since last touch | Re-engagement |
| Email not opened | 3+ days after send | Follow-up with different angle |
| High score, no contact | Score > 70, no email in 5 days | Proactive outreach |

**Event**: Custom scheduled job (daily check)

### 3. Engagement Triggers (Medium Priority)
Generate emails based on positive engagement signals:

| Trigger | Condition | Email Purpose |
|---------|-----------|---------------|
| Email opened | Opened within 24 hours | Strike while hot - next step |
| Link clicked | Clicked link in email | Contextual follow-up |
| Website visit | Visited pricing/product pages | Address specific interest |

**Events**: `EMAIL_OPENED`, `EMAIL_CLICKED`, `LEAD_ACTIVITY`

### 4. Milestone Triggers (Low Priority)
Generate emails for specific milestones:

| Milestone | Condition | Email Purpose |
|-----------|-----------|---------------|
| High score achieved | Score crosses 70 threshold | Congratulate and advance |
| Deal value set | Deal value added/updated | Discuss timeline and next steps |
| Task completed | Important task marked done | Acknowledge and plan next action |

**Events**: `LEAD_UPDATED`, `TASK_COMPLETED`

## Smart Throttling Rules

### Email Frequency Limits
Prevent overwhelming leads with too many email drafts:

```typescript
interface ThrottlingRules {
  // Maximum emails per lead
  maxEmailsPerDay: 1;           // Max 1 email draft per day per lead
  maxEmailsPerWeek: 3;          // Max 3 email drafts per week per lead
  
  // Minimum time between emails
  minHoursBetweenEmails: 24;    // At least 24 hours between drafts
  
  // Stage-specific cooldowns
  stageCooldowns: {
    NEW: 48,                     // 48 hours after entering NEW
    CONTACTED: 72,               // 72 hours after entering CONTACTED
    QUALIFIED: 48,               // 48 hours after entering QUALIFIED
    PROPOSAL_SENT: 24,           // 24 hours after proposal sent
  };
  
  // Engagement-based adjustments
  highEngagement: {              // If open rate > 50%
    minHoursBetweenEmails: 12,   // Can email more frequently
  };
  lowEngagement: {               // If open rate < 20%
    minHoursBetweenEmails: 96,   // Wait longer between emails
  };
}
```

### Priority Queue
When multiple triggers fire, prioritize:

1. **URGENT**: Proposal follow-ups, hot leads (score > 80)
2. **HIGH**: Stage changes, high engagement responses
3. **MEDIUM**: Re-engagement, milestone emails
4. **LOW**: General nurture emails

## Implementation Architecture

### Phase 1: Event Registration (Week 1)
```typescript
// In email-generation-agent.ts
class EmailGenerationAgent extends Agent {
  // Add method to check if email should be generated
  async shouldGenerateEmail(context: AgentContext): Promise<boolean> {
    // Check throttling rules
    // Check recent email history
    // Check lead preferences
    return true/false;
  }
  
  // Add method to determine email trigger reason
  private determineEmailReason(context: AgentContext): string {
    // Analyze context to determine why email is being generated
    // Return reason for logging and reasoning
  }
}

// In init.ts - register for events
eventBus.registerAgent(CRMEvent.STAGE_CHANGED, emailGenerationAgent);
eventBus.registerAgent(CRMEvent.EMAIL_OPENED, emailGenerationAgent);
eventBus.registerAgent(CRMEvent.EMAIL_CLICKED, emailGenerationAgent);
```

### Phase 2: Throttling Service (Week 1)
```typescript
// New file: lib/agents/email-throttling-service.ts
class EmailThrottlingService {
  async canSendEmail(leadId: string): Promise<{
    allowed: boolean;
    reason?: string;
    nextAvailableTime?: Date;
  }>;
  
  async getEmailHistory(leadId: string, days: number): Promise<EmailHistory[]>;
  
  async calculateEngagementRate(leadId: string): Promise<number>;
  
  async recordEmailGeneration(leadId: string, actionId: string): Promise<void>;
}
```

### Phase 3: Scheduled Jobs (Week 2)
```typescript
// New file: lib/agents/email-scheduler.ts
class EmailScheduler {
  // Run daily to check for inactivity triggers
  async checkInactiveLeads(): Promise<void> {
    // Find leads with no activity in 7+ days
    // Check throttling rules
    // Generate email drafts for qualified leads
  }
  
  // Run hourly to check for engagement triggers
  async checkEngagementTriggers(): Promise<void> {
    // Find recent email opens/clicks
    // Generate contextual follow-ups
  }
}
```

### Phase 4: Enhanced Context (Week 2)
Update email generation to include trigger context:

```typescript
interface EmailGenerationContext extends AgentContext {
  trigger: {
    type: 'stage_change' | 'inactivity' | 'engagement' | 'milestone';
    reason: string;
    data: Record<string, unknown>;
  };
}
```

## Database Schema Updates

### Track Email Generation History
```sql
-- Add to agent_actions metadata
{
  "trigger_type": "stage_change",
  "trigger_reason": "Lead moved from CONTACTED to QUALIFIED",
  "auto_generated": true,
  "throttling_score": 0.85
}
```

### Lead Email Preferences (Future)
```sql
-- Optional: Allow leads to set email preferences
CREATE TABLE lead_email_preferences (
  lead_id TEXT PRIMARY KEY,
  max_emails_per_week INTEGER DEFAULT 3,
  preferred_days TEXT[], -- ['Monday', 'Wednesday', 'Friday']
  preferred_time_start TIME DEFAULT '09:00',
  preferred_time_end TIME DEFAULT '17:00',
  timezone TEXT DEFAULT 'UTC',
  unsubscribed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Configuration

### Environment Variables
```bash
# Email automation settings
EMAIL_AUTOMATION_ENABLED=true
EMAIL_MAX_PER_DAY=1
EMAIL_MAX_PER_WEEK=3
EMAIL_MIN_HOURS_BETWEEN=24

# Trigger thresholds
EMAIL_INACTIVITY_DAYS=7
EMAIL_HIGH_SCORE_THRESHOLD=70
EMAIL_ENGAGEMENT_THRESHOLD=0.5
```

### Agent Configuration
```typescript
// In email-generation-agent.ts
getConfig(): AgentConfig {
  return {
    agentType: this.agentType,
    enabled: process.env.EMAIL_AUTOMATION_ENABLED === 'true',
    autonomyLevel: AutonomyLevel.SUGGEST_APPROVE, // Still requires approval
    priority: 'MEDIUM',
    triggers: [
      CRMEvent.STAGE_CHANGED,
      CRMEvent.EMAIL_OPENED,
      CRMEvent.EMAIL_CLICKED,
    ],
    throttling: {
      maxPerDay: parseInt(process.env.EMAIL_MAX_PER_DAY || '1'),
      maxPerWeek: parseInt(process.env.EMAIL_MAX_PER_WEEK || '3'),
      minHoursBetween: parseInt(process.env.EMAIL_MIN_HOURS_BETWEEN || '24'),
    },
  };
}
```

## User Experience

### Dashboard Updates
1. **Action List**: Show auto-generated emails with badge "Auto-Generated"
2. **Trigger Reason**: Display why email was generated ("Lead moved to QUALIFIED stage")
3. **Bulk Actions**: Allow approving/rejecting multiple email drafts at once
4. **Email Queue**: Show upcoming scheduled email checks

### Notifications
1. **Slack/Email Notifications**: Alert sales team when high-priority email drafts are ready
2. **Daily Digest**: Summary of pending email approvals
3. **Weekly Report**: Email automation performance metrics

## Success Metrics

### Track Performance
```typescript
interface EmailAutomationMetrics {
  // Generation metrics
  emailsGenerated: number;
  emailsApproved: number;
  emailsRejected: number;
  approvalRate: number;
  
  // Trigger metrics
  triggerBreakdown: {
    stage_change: number;
    inactivity: number;
    engagement: number;
    milestone: number;
  };
  
  // Throttling metrics
  throttledAttempts: number;
  averageTimeBetweenEmails: number;
  
  // Engagement metrics
  openRate: number;
  clickRate: number;
  responseRate: number;
}
```

### Goals
- **Approval Rate**: > 70% (emails are relevant and well-timed)
- **Open Rate**: > 30% (better than manual emails)
- **Time Saved**: 2+ hours per week per sales rep
- **Lead Response**: 20% increase in lead engagement

## Rollout Plan

### Phase 1: Foundation (Week 1)
- [ ] Implement throttling service
- [ ] Add event registration for stage changes
- [ ] Update email generation to check throttling rules
- [ ] Add trigger context to email generation
- [ ] Test with stage change events only

### Phase 2: Engagement Triggers (Week 2)
- [ ] Register for email opened/clicked events
- [ ] Implement engagement-based email generation
- [ ] Add engagement rate calculation
- [ ] Test with real email tracking data

### Phase 3: Scheduled Jobs (Week 3)
- [ ] Implement inactivity checker (daily job)
- [ ] Implement engagement checker (hourly job)
- [ ] Add job scheduling infrastructure
- [ ] Test scheduled email generation

### Phase 4: Polish & Monitoring (Week 4)
- [ ] Add dashboard badges for auto-generated emails
- [ ] Implement bulk approval actions
- [ ] Add email automation metrics
- [ ] Create admin settings page for throttling rules
- [ ] Documentation and training

## Safety & Compliance

### Safeguards
1. **Always Require Approval**: Never send emails automatically
2. **Respect Unsubscribes**: Check email preferences before generating
3. **Rate Limiting**: Strict throttling to prevent spam
4. **Audit Trail**: Log all email generation decisions
5. **Kill Switch**: Easy way to disable automation if needed

### Compliance
- **CAN-SPAM**: Include unsubscribe links in all emails
- **GDPR**: Respect data privacy and consent
- **CASL**: Follow Canadian anti-spam legislation
- **Opt-out**: Honor unsubscribe requests immediately

## Testing Strategy

### Unit Tests
- Throttling service logic
- Email generation with different triggers
- Engagement rate calculations
- Priority queue ordering

### Integration Tests
- Event bus → Email generation flow
- Scheduled jobs execution
- Database queries for email history
- AI provider integration

### Manual Testing
- Create test leads in different stages
- Trigger stage changes and verify email generation
- Test throttling by generating multiple emails
- Verify approval workflow

## Future Enhancements

### V2 Features
1. **A/B Testing**: Test different email templates and tones
2. **Personalization**: Use more lead data for hyper-personalization
3. **Send Time Optimization**: ML-based optimal send time prediction
4. **Email Sequences**: Multi-touch email campaigns
5. **Smart Templates**: Learn from approved/rejected emails
6. **Sentiment Analysis**: Adjust tone based on lead sentiment

### V3 Features
1. **Auto-send for High Confidence**: Send without approval if confidence > 95%
2. **Email Response Parsing**: Automatically update lead based on email replies
3. **Calendar Integration**: Suggest meeting times in emails
4. **Multi-channel**: Coordinate with LinkedIn, SMS, phone calls

## Questions to Resolve

1. **Should we generate emails for ALL stage changes or only specific ones?**
   - Recommendation: Start with CONTACTED → QUALIFIED and QUALIFIED → PROPOSAL_SENT

2. **What's the right balance between automation and manual control?**
   - Recommendation: Start conservative (1 email/day max), adjust based on feedback

3. **Should we notify users immediately or batch notifications?**
   - Recommendation: Immediate for URGENT priority, daily digest for others

4. **How do we handle leads with multiple assignees?**
   - Recommendation: Generate one email, notify all assignees for approval

5. **What happens if an email draft is rejected?**
   - Recommendation: Learn from rejection, adjust throttling, don't retry same trigger

## Conclusion

This automation plan transforms the Email Generation Agent from a manual tool into an intelligent assistant that:
- **Saves time**: Automatically identifies email opportunities
- **Maintains quality**: AI generates contextual, personalized drafts
- **Preserves control**: All emails require human approval
- **Prevents fatigue**: Smart throttling prevents over-emailing
- **Drives results**: Timely, relevant emails increase engagement

The phased rollout allows us to validate each component before adding complexity, ensuring a stable and valuable feature for the sales team.
