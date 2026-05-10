# Phase 2: Engagement Triggers - Implementation Complete! 🎉

## Overview
Phase 2 adds intelligent engagement-based email generation. The system now automatically generates follow-up emails when leads open or click emails, with smart throttling based on engagement rates.

## What Was Implemented

### 1. **Engagement Trigger Detection** ✅
**File**: `apps/vyntrize-crm/lib/agents/email-generation-agent.ts`

**Features**:
- ✅ Detects EMAIL_OPENED events
- ✅ Detects EMAIL_CLICKED events
- ✅ Enhanced trigger context with engagement type
- ✅ Engagement-specific email generation prompts
- ✅ Smart filtering based on engagement timing and quality

**Logic**:
```typescript
// Email clicks always trigger (high intent)
if (engagementType === 'email_clicked') {
  return true;
}

// Email opens only trigger for engaged leads (>30% engagement rate)
if (engagementType === 'email_opened') {
  const engagementRate = await calculateEngagementRate(leadId);
  return engagementRate >= 30; // Configurable via EMAIL_ENGAGEMENT_THRESHOLD
}
```

### 2. **Engagement-Based Throttling** ✅
**File**: `apps/vyntrize-crm/lib/agents/email-throttling-service.ts`

**Features**:
- ✅ Dynamic cooldown periods based on engagement rate
- ✅ High engagement leads (>50%): 12-hour cooldown
- ✅ Medium engagement leads (30-50%): 18-hour cooldown
- ✅ Low engagement leads (<30%): 24-hour cooldown (default)

**Benefits**:
- More frequent follow-ups for engaged leads
- Prevents over-emailing disengaged leads
- Automatically adapts to lead behavior

### 3. **Enhanced Email Generation** ✅
**File**: `apps/vyntrize-crm/lib/agents/email-generation-agent.ts`

**Features**:
- ✅ Context-aware prompts for engagement triggers
- ✅ Different messaging for opens vs clicks
- ✅ Urgency-based language for high-intent actions

**Email Click Follow-up**:
```
"The lead just clicked a link in your email, showing high interest. 
Strike while the iron is hot with a timely follow-up."
```

**Email Open Follow-up**:
```
"The lead recently opened your email. They are showing interest. 
Your follow-up should build on the previous message."
```

### 4. **Email Tracking Endpoints** ✅
**Files**: 
- `apps/vyntrize-crm/app/api/email/track/open/[trackingId]/route.ts`
- `apps/vyntrize-crm/app/api/email/track/click/[trackingId]/route.ts`

**Features**:
- ✅ Tracking pixel for email opens (1x1 transparent GIF)
- ✅ Click tracking with redirect
- ✅ Automatic event emission to agent system
- ✅ Open/click count tracking
- ✅ First open/click detection

**How It Works**:
1. Email sent with tracking pixel: `<img src="/api/email/track/open/{trackingId}" />`
2. Lead opens email → pixel loads → tracking endpoint called
3. Endpoint updates database and emits `EMAIL_OPENED` event
4. Email Generation Agent receives event and evaluates if follow-up needed

### 5. **Event Registration** ✅
**File**: `apps/vyntrize-crm/lib/agents/registry.ts`

```typescript
// Email Generation Agent now listens to:
eventBus.registerAgent(CRMEvent.STAGE_CHANGED, emailGenerationAgent);
eventBus.registerAgent(CRMEvent.EMAIL_OPENED, emailGenerationAgent);   // NEW
eventBus.registerAgent(CRMEvent.EMAIL_CLICKED, emailGenerationAgent);  // NEW
```

## Trigger Logic Flow

### Email Opened Flow
```
1. Lead opens email
2. Tracking pixel loads → /api/email/track/open/{trackingId}
3. Endpoint emits EMAIL_OPENED event
4. Email Generation Agent receives event
5. Check: Was email opened within 24 hours? ✓
6. Check: Does lead have >30% engagement rate? ✓
7. Check: Throttling rules (with reduced cooldown for engaged leads)? ✓
8. Generate contextual follow-up email draft
9. Email requires approval before sending
```

### Email Clicked Flow
```
1. Lead clicks link in email
2. Click tracking → /api/email/track/click/{trackingId}?url={target}
3. Endpoint emits EMAIL_CLICKED event
4. Email Generation Agent receives event
5. Check: Was link clicked within 24 hours? ✓
6. Check: Throttling rules (with reduced cooldown)? ✓
7. Generate urgent follow-up email draft (high intent!)
8. Email requires approval before sending
9. Redirect lead to target URL
```

## Configuration

### Environment Variables
```bash
# Engagement threshold for email opens (percentage)
EMAIL_ENGAGEMENT_THRESHOLD="30"  # Only trigger for leads with >30% engagement

# Throttling still applies
EMAIL_MAX_PER_DAY="1"
EMAIL_MAX_PER_WEEK="3"
EMAIL_MIN_HOURS_BETWEEN="24"  # Reduced for high-engagement leads
```

### Engagement Rate Calculation
```typescript
// Formula: (opens + clicks * 2) / (sent emails * 3) * 100
// Example: 5 emails sent, 3 opened, 2 clicked
// Score: (3 + 2*2) / (5*3) * 100 = 46.7%
```

## Testing Guide

### Test 1: Email Open Triggers Follow-up (High Engagement Lead)
**Prerequisites**: Lead must have >30% engagement rate

1. Send an email to a lead (manually or via stage change)
2. Approve and send the email
3. Simulate email open:
   ```bash
   curl http://localhost:3014/api/email/track/open/{trackingId}
   ```
4. Check `/agents` dashboard
5. Should see new PENDING email with:
   - "Auto" badge
   - Trigger: "Lead opened recent email - follow up while engaged"

### Test 2: Email Click Triggers Urgent Follow-up
1. Send an email to a lead
2. Approve and send the email
3. Simulate email click:
   ```bash
   curl "http://localhost:3014/api/email/track/click/{trackingId}?url=https://example.com"
   ```
4. Check `/agents` dashboard
5. Should see new PENDING email with:
   - "Auto" badge
   - Trigger: "Lead clicked link in email - high interest detected"
   - More urgent tone in email content

### Test 3: Low Engagement Lead Doesn't Trigger on Open
**Prerequisites**: Lead must have <30% engagement rate

1. Send email to low-engagement lead
2. Simulate email open
3. Check logs - should see:
   ```
   [EmailGenerationAgent] Engagement does not trigger email
   Reason: Engagement rate below threshold
   ```
4. No email draft generated

### Test 4: Engagement-Based Throttling
**Prerequisites**: Lead with >50% engagement rate

1. Generate email via engagement trigger
2. Try to generate another email immediately
3. Should be throttled, but with reduced cooldown:
   - High engagement: 12 hours instead of 24
   - Medium engagement: 18 hours instead of 24

### Test 5: Email Content Reflects Engagement
1. Generate email via click trigger
2. Review email draft
3. Should mention the lead's recent action
4. Should have urgent, action-oriented tone
5. Should reference "striking while iron is hot"

## Expected Behavior

### Automatic Email Generation
- ✅ Email clicks ALWAYS trigger follow-ups (high intent)
- ✅ Email opens trigger follow-ups for engaged leads (>30% rate)
- ✅ Engagement within 24 hours (fresh engagement)
- ✅ Subject to throttling rules (with reduced cooldowns)

### Throttling Adjustments
- ✅ High engagement (>50%): 12-hour cooldown
- ✅ Medium engagement (30-50%): 18-hour cooldown
- ✅ Low engagement (<30%): 24-hour cooldown
- ✅ Still respects daily (1) and weekly (3) limits

### Email Quality
- ✅ Context-aware: mentions recent engagement
- ✅ Urgency-based: different tone for opens vs clicks
- ✅ Personalized: includes lead history and context
- ✅ Actionable: clear next steps

## Monitoring

### Key Metrics to Track
1. **Engagement Trigger Rate**: % of opens/clicks that trigger emails
2. **Engagement-Based Approval Rate**: Do engagement emails get approved more?
3. **Response Rate**: Do engagement follow-ups get better responses?
4. **Throttling Impact**: How often are engagement triggers throttled?

### Log Messages to Watch
```
[EmailGenerationAgent] Email draft generated (trigger: engagement)
[EmailTracking] Email opened: {trackingId} for lead {leadId}
[EmailTracking] Email link clicked: {trackingId} for lead {leadId}
[EmailThrottling] Reduced cooldown for high-engagement lead
```

## Success Criteria

### Phase 2 Goals Met
- ✅ Email drafts auto-generate on email opens (for engaged leads)
- ✅ Email drafts auto-generate on email clicks (always)
- ✅ Engagement rate affects throttling
- ✅ Contextual follow-ups based on engagement type
- ✅ Tracking endpoints emit events correctly

### Performance Targets
- **Engagement Trigger Rate**: >20% of opens/clicks trigger emails
- **Approval Rate**: >75% for engagement-triggered emails
- **Response Rate**: >15% for engagement follow-ups
- **Time to Follow-up**: <1 hour from engagement to email draft

## What's Next: Phase 3

### Scheduled Jobs (Week 3)
1. **Inactivity Checker** (Daily)
   - Find leads with no activity for 7+ days
   - Generate re-engagement emails
   - Prioritize by lead score

2. **Engagement Checker** (Hourly)
   - Check for recent engagement (last hour)
   - Generate timely follow-ups
   - Batch process for efficiency

3. **Job Monitoring Dashboard**
   - Show job status and history
   - Track job performance metrics
   - Alert on job failures

### Implementation Timeline
- Week 3, Day 1-2: Inactivity checker
- Week 3, Day 3-4: Engagement checker
- Week 3, Day 5: Job monitoring dashboard

## Troubleshooting

### Issue: Engagement emails not generating
**Check**:
1. Is EMAIL_AUTOMATION_ENABLED=true?
2. Is lead's engagement rate >30%?
3. Was engagement within last 24 hours?
4. Are throttling limits reached?
5. Check logs for throttling/filtering messages

### Issue: Too many engagement emails
**Solution**:
1. Increase EMAIL_ENGAGEMENT_THRESHOLD (e.g., 50%)
2. Increase EMAIL_MIN_HOURS_BETWEEN (e.g., 36)
3. Reduce EMAIL_MAX_PER_WEEK (e.g., 2)

### Issue: Tracking endpoints not working
**Check**:
1. Are tracking IDs being generated correctly?
2. Are emails including tracking pixel/links?
3. Check email template renderer
4. Verify EMAIL_TRACKING_ENABLED=true

## Summary

Phase 2 successfully adds intelligent engagement-based email automation:

- **Smart Triggers**: Only engaged leads get follow-ups on opens
- **High-Intent Actions**: Clicks always trigger (high conversion potential)
- **Dynamic Throttling**: More frequent emails for engaged leads
- **Context-Aware**: Email content reflects engagement type
- **Quality Control**: All emails still require approval

The system now responds to lead behavior in real-time, generating timely follow-ups when leads show interest, while preventing email fatigue for disengaged leads.

**Next**: Phase 3 will add scheduled jobs for proactive outreach (inactivity detection, batch engagement checks).
