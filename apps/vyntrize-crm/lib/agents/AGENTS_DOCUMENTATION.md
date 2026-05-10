# AI Pipeline Agents Documentation

## Overview

The Vyntrize CRM includes 5 intelligent AI agents that automate sales workflows, provide insights, and assist sales teams. Each agent operates with different levels of autonomy and serves specific purposes in the sales pipeline.

---

## 🤖 Available Agents

### 1. Lead Scoring Agent
**Type:** `LEAD_SCORING`  
**Autonomy Level:** Fully Autonomous  
**Execution:** Event-driven + Daily batch (midnight)

#### What It Does
Automatically calculates and updates lead scores based on engagement and activity patterns. Scores range from 0-100 and determine lead qualification status.

#### Scoring Factors
- **Email Engagement** (+5 per open, +10 per click, +15 per reply)
- **Website Activity** (+8 per page visit)
- **Task Completion** (+12 per completed task)
- **Inactivity Penalty** (-2 per day, max -40)

#### Qualification Levels
- **Hot** (80-100): Highly engaged, ready for immediate action
- **Qualified** (60-79): Strong engagement, good prospect
- **Warm** (40-59): Moderate engagement, needs nurturing
- **Cold** (20-39): Low engagement, requires re-engagement
- **Unqualified** (0-19): Minimal engagement

#### Triggers
- Lead created
- Lead updated
- Email opened
- Email clicked
- Daily batch scoring (midnight)

#### Example Output
```
Lead score increased from 45 to 72/100 (qualified). 
Engagement: 3 email opens, 2 email clicks, 5 website visits. 
⚠️ 12 days since last activity.
```

---

### 2. Task Automation Agent
**Type:** `TASK_AUTOMATION`  
**Autonomy Level:** Fully Autonomous  
**Execution:** Event-driven (stage changes)

#### What It Does
Automatically creates follow-up tasks when leads move to specific pipeline stages. Ensures no lead falls through the cracks by creating timely reminders.

#### Stage-Based Tasks

| Stage | Task | Due In | Priority |
|-------|------|--------|----------|
| **CONTACTED** | Follow up with lead | 2 business days | Medium |
| **QUALIFIED** | Prepare proposal | 3 business days | High |
| **PROPOSAL_SENT** | Follow up on proposal | 5 business days | High |

#### Features
- **Business Day Calculation**: Skips weekends
- **Duplicate Prevention**: Won't create duplicate tasks
- **Auto-Assignment**: Assigns to lead owner
- **Smart Scheduling**: Sets due dates to end of business day (5 PM)

#### Triggers
- Lead stage changes

#### Example Output
```
Automatically created task "Prepare proposal" for John Smith (stage: QUALIFIED). 
Task assigned to Sarah Johnson, due in 3 business days.
```

---

### 3. Stagnation Detection Agent
**Type:** `STAGNATION_DETECTION`  
**Autonomy Level:** Fully Autonomous  
**Execution:** Daily batch (9 AM)

#### What It Does
Monitors leads for lack of progress and alerts sales teams when leads become stagnant. Creates urgent tasks for critical cases.

#### Stagnation Thresholds

| Stage | Warning | Critical |
|-------|---------|----------|
| **NEW** | 3 days | 7 days |
| **CONTACTED** | 7 days | 14 days |
| **QUALIFIED** | 10 days | 21 days |
| **PROPOSAL_SENT** | 7 days | 14 days |

#### Stagnation Levels
- **None**: Lead is active
- **Warning** ⚠️: Approaching threshold, needs attention
- **Critical** 🚨: Exceeded threshold, creates urgent task

#### Features
- **Automatic Task Creation**: Creates urgent follow-up tasks for critical cases
- **Batch Scanning**: Checks all active leads daily
- **Smart Filtering**: Skips closed leads (WON/LOST)

#### Triggers
- Daily scan at 9 AM
- Can be triggered for specific leads

#### Example Output
```
🚨 Lead "John Smith" is stagnant (critical). 
No activity for 15 days in QUALIFIED stage. 
Assigned to: Sarah Johnson.
```

---

### 4. Email Generation Agent
**Type:** `EMAIL_GENERATION`  
**Autonomy Level:** Suggest & Approve (requires approval)  
**Execution:** On-demand

#### What It Does
Uses AI to generate personalized email drafts based on lead context, engagement history, and current pipeline stage. Emails are tailored to the lead's situation and require human approval before sending.

#### AI-Powered Features
- **Context-Aware**: Analyzes lead data, activities, and engagement
- **Stage-Appropriate Tone**: Adjusts tone based on pipeline stage
- **Personalization**: References specific lead activities and interests
- **Engagement Insights**: Considers email open/click rates

#### Email Tones by Stage

| Stage | Tone |
|-------|------|
| **NEW** | Friendly and introductory |
| **CONTACTED** | Professional and engaging |
| **QUALIFIED** | Consultative and value-focused |
| **PROPOSAL_SENT** | Confident and action-oriented |
| **WON** | Celebratory and onboarding-focused |
| **LOST** | Gracious and door-open |

#### Context Analyzed
- Lead basic info (name, title, company)
- Recent activities and interactions
- Email engagement history (opens, clicks)
- Website activity and page views
- Lead score and qualification status
- Deal value and stage

#### Triggers
- Manual trigger from dashboard
- Can be triggered by other agents

#### Example Output
```
Generated AI-powered email draft for John Smith (QUALIFIED stage) 
with consultative and value-focused tone. 
Email requires approval before sending.
```

**Sample Generated Email:**
```
Subject: Following up on our conversation about [specific topic]

Hi John,

I noticed you've been exploring our [specific pages] on our website. 
Based on your interest in [topic], I wanted to share how we've helped 
companies like [company] achieve [specific result].

Would you be available for a 15-minute call this week to discuss 
how we can help [company name] with [specific pain point]?

Best regards,
[Your name]
```

---

### 5. Next Best Action Agent
**Type:** `NEXT_BEST_ACTION`  
**Autonomy Level:** Copilot (suggestions only)  
**Execution:** On-demand

#### What It Does
Analyzes lead data and provides AI-powered recommendations for the next best actions to take. Acts as a sales copilot, suggesting strategic moves based on engagement patterns, timing, and sales best practices.

#### Analysis Factors
- **Lead Overview**: Stage, score, deal value
- **Email Engagement**: Open rates, click rates
- **Website Activity**: Page visits, unique pages viewed
- **Recent Activities**: Last 10 interactions
- **Pending Tasks**: Current workload
- **Time Metrics**: Days since last activity

#### Recommendation Types
- **Follow-up Actions**: When and how to re-engage
- **Stage Progression**: When to move lead forward
- **Qualification Steps**: What information to gather
- **Engagement Strategies**: How to increase interaction

#### Priority Levels
- **URGENT**: Immediate action required
- **HIGH**: Important, should be done soon
- **MEDIUM**: Standard priority
- **LOW**: Nice to have, not time-sensitive

#### Features
- **AI-Powered**: Uses OpenAI/Gemini for intelligent analysis
- **Rule-Based Fallback**: Works even if AI is unavailable
- **Caching**: 1-hour cache to improve performance
- **Multiple Recommendations**: Provides 1-3 actionable suggestions

#### Triggers
- Manual trigger from dashboard
- Can be triggered for specific leads

#### Example Output
```
Generated 3 recommendation(s) for John Smith. 
Top recommendation: Schedule discovery call
```

**Sample Recommendations:**
```json
[
  {
    "action": "Schedule discovery call",
    "reasoning": "Lead has high engagement score (78/100) and has visited pricing page 3 times. Time to move to next stage.",
    "priority": "HIGH"
  },
  {
    "action": "Send case study",
    "reasoning": "Lead works in healthcare industry. Share relevant success story to build credibility.",
    "priority": "MEDIUM"
  },
  {
    "action": "Follow up on proposal",
    "reasoning": "Proposal sent 4 days ago with no response. Send friendly check-in email.",
    "priority": "HIGH"
  }
]
```

---

## 🎯 Autonomy Levels Explained

### Fully Autonomous
- **Executes immediately** without human approval
- Used for: Lead scoring, task creation, stagnation detection
- Actions are logged and can be reviewed
- Safe for routine, low-risk operations

### Suggest & Approve
- **Requires human approval** before execution
- Used for: Email generation
- Draft is created but not sent
- User reviews and approves/rejects

### Copilot
- **Suggestions only**, no execution
- Used for: Next best action recommendations
- Provides guidance and insights
- User decides whether to act

---

## 🔧 Configuration

### Environment Variables

```env
# AI Provider (required for Email Generation and Next Best Action)
AI_PROVIDER="auto"  # auto, openai, or gemini
OPENAI_API_KEY="sk-..."
GEMINI_API_KEY="AIza..."

# Redis (required for job scheduling)
REDIS_HOST="localhost"
REDIS_PORT="6379"

# Agent Feature Flags (optional, defaults to true)
AGENT_LEAD_SCORING_ENABLED="true"
AGENT_TASK_AUTOMATION_ENABLED="true"
AGENT_STAGNATION_DETECTION_ENABLED="true"
AGENT_EMAIL_GENERATION_ENABLED="true"
AGENT_NEXT_BEST_ACTION_ENABLED="true"

# Job Queue Configuration
AGENT_JOB_CONCURRENCY="5"
```

### Disabling Agents

To disable a specific agent, set its feature flag to `false`:

```env
AGENT_EMAIL_GENERATION_ENABLED="false"
```

---

## 📊 Agent Dashboard

Access the agent dashboard at `/agents` to:

- **Monitor System Health**: Check agent registry, job queue, and AI providers
- **View Agent Actions**: See all agent activities with filtering
- **Review Pending Actions**: Approve/reject actions that require approval
- **Trigger Manual Actions**: Generate emails or get recommendations on-demand
- **Track Metrics**: View agent performance and success rates

### Dashboard Features

1. **Health Status Widget**
   - Agent Registry status
   - Job Queue metrics (waiting, active, completed, failed)
   - AI Provider availability

2. **Action List**
   - Filterable by agent type, status, date range
   - Pagination support
   - Detailed action view with reasoning

3. **Manual Triggers**
   - Search for leads
   - Select agents to run
   - Trigger multiple agents at once

4. **Metrics Dashboard**
   - Actions by agent type
   - Actions by status
   - Success rates over time

---

## 🔄 Event-Driven Architecture

### Event Bus
Agents can subscribe to CRM events:

- `lead_created` - New lead added
- `lead_updated` - Lead information changed
- `stage_changed` - Lead moved to new stage
- `email_opened` - Lead opened an email
- `email_clicked` - Lead clicked link in email

### Job Scheduler
Agents can be scheduled for recurring execution:

- **Lead Scoring**: Daily at midnight (`0 0 * * *`)
- **Stagnation Detection**: Daily at 9 AM (`0 9 * * *`)

---

## 🛠️ Technical Architecture

### Base Agent Class
All agents extend the `Agent` base class which provides:

- **Action Recording**: Logs all agent actions to database
- **Feature Flags**: Respects enable/disable settings
- **Logging**: Structured logging for debugging
- **Error Handling**: Graceful error handling and reporting

### AI Provider System
- **Multi-Provider Support**: OpenAI, Google Gemini
- **Automatic Fallback**: Switches providers if one fails
- **Rate Limiting**: Prevents API quota exhaustion
- **Caching**: Reduces API calls and costs
- **Circuit Breaker**: Disables failing providers temporarily

### Job Queue (BullMQ + Redis)
- **Reliable Execution**: Jobs are persisted and retried on failure
- **Concurrency Control**: Limits parallel job execution
- **Priority Queues**: High-priority jobs execute first
- **Job Metrics**: Tracks success/failure rates

---

## 📈 Best Practices

### For Sales Teams

1. **Review Pending Actions Daily**: Check the dashboard for actions requiring approval
2. **Trust the Scores**: Lead scores are data-driven and updated automatically
3. **Act on Stagnation Alerts**: Critical stagnation alerts need immediate attention
4. **Customize Email Drafts**: AI-generated emails are starting points, personalize them
5. **Follow Recommendations**: Next best action suggestions are based on proven patterns

### For Administrators

1. **Monitor System Health**: Check the dashboard regularly for issues
2. **Configure AI Providers**: Ensure at least one AI provider is configured
3. **Review Agent Metrics**: Track which agents are most effective
4. **Adjust Thresholds**: Customize stagnation thresholds based on your sales cycle
5. **Enable/Disable Agents**: Use feature flags to control which agents run

---

## 🚀 Future Agents (Planned)

- **Predictive Analytics Agent**: Forecast deal closure probability
- **Stage Progression Agent**: Automatically move leads through pipeline
- **Drip Campaign Agent**: Automated email sequences
- **Revenue Forecasting Agent**: Predict monthly/quarterly revenue

---

## 📝 Action Types

| Action Type | Description | Used By |
|-------------|-------------|---------|
| `SCORE_UPDATE` | Lead score changed | Lead Scoring Agent |
| `TASK_CREATE` | Task created automatically | Task Automation, Stagnation Detection |
| `EMAIL_SEND` | Email draft generated | Email Generation Agent |
| `ALERT` | Alert or notification | Stagnation Detection, Next Best Action |

---

## 🔍 Troubleshooting

### Agent Not Running
1. Check feature flag: `AGENT_[TYPE]_ENABLED`
2. Verify Redis is running: `redis-cli ping`
3. Check agent dashboard for errors

### AI Features Not Working
1. Verify AI provider is configured (OpenAI or Gemini)
2. Check API key is valid (not a placeholder)
3. Review AI provider status in dashboard
4. Check API quota/billing

### Actions Not Executing
1. Check autonomy level (some require approval)
2. Review action status in dashboard
3. Check for error messages in action details

---

## 📚 Related Documentation

- [AI Provider Setup](./README.md)
- [Event Bus Documentation](./event-bus.ts)
- [Job Scheduler Documentation](./job-scheduler.ts)
- [Agent Dashboard UI](../../app/(crm)/agents/README.md)

---

## 💡 Tips

- **Start with Fully Autonomous Agents**: Lead Scoring and Task Automation provide immediate value
- **Use AI Agents Strategically**: Email Generation and Next Best Action are powerful but require AI provider setup
- **Monitor and Adjust**: Review agent actions regularly and adjust configurations as needed
- **Combine Agents**: Agents work together (e.g., Stagnation Detection can trigger Email Generation)
- **Trust the System**: Agents learn from your CRM data and improve over time
