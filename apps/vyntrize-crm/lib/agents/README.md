# AI Pipeline Agent System

Autonomous, intelligent automation layer for the VyntRise CRM that provides 24/7 monitoring and automation of the sales pipeline.

## Overview

The AI Pipeline Agent System combines event-driven real-time processing with periodic background analysis to deliver:

- **Lead Scoring** - Automatic scoring based on engagement (0-100)
- **Task Automation** - Auto-create tasks on stage changes
- **Stagnation Detection** - Alert on inactive leads
- **Email Generation** - AI-powered email drafts (GPT-4)
- **Next Best Action** - AI recommendations for next steps

## Architecture

### Components

- **Event Bus** - Real-time event dispatch using Node.js EventEmitter
- **Job Scheduler** - Periodic tasks using BullMQ + Redis
- **OpenAI Provider** - GPT-4 integration with rate limiting and caching
- **Agent Registry** - Central management for all agents
- **Base Agent** - Abstract class all agents extend

### Execution Models

**Event-Driven (Real-time)**
- Lead Scoring → `lead_created`, `lead_updated`, `email_opened`, `email_clicked`
- Task Automation → `stage_changed`

**Scheduled (Batch)**
- Lead Scoring → Daily at midnight (all leads)
- Stagnation Detection → Daily at 9 AM (all active leads)

**On-Demand (Manual)**
- Email Generation → Triggered by user or API
- Next Best Action → Triggered by user or API

## Setup

### Environment Variables

```bash
# Required
REDIS_HOST=localhost
REDIS_PORT=6379
OPENAI_API_KEY=sk-...

# Optional (defaults shown)
AGENT_LEAD_SCORING_ENABLED=true
AGENT_TASK_AUTOMATION_ENABLED=true
AGENT_STAGNATION_DETECTION_ENABLED=true
AGENT_EMAIL_GENERATION_ENABLED=true
AGENT_NEXT_BEST_ACTION_ENABLED=true
AGENT_JOB_CONCURRENCY=5
```

### Database Migration

```bash
cd packages/@platform/vyntrize-db
npx prisma migrate deploy
```

### Initialization

The agent system initializes automatically on server startup via `instrumentation.ts`.

## Usage

### Emitting Events

```typescript
import { emitLeadCreated, emitStageChanged } from '@/lib/agents';

// When a lead is created
await emitLeadCreated(leadId, userId);

// When a lead stage changes
await emitStageChanged(leadId, 'CONTACTED', 'QUALIFIED', userId);
```

### Manual Agent Triggering

```typescript
import { LeadScoringAgent } from '@/lib/agents';

const agent = new LeadScoringAgent();
const result = await agent.execute({ leadId: 'lead_123' });

if (result.success) {
  console.log(result.reasoning);
  console.log(result.metadata);
}
```

### API Endpoints

**List Actions**
```
GET /api/agents/actions?leadId=xxx&status=PENDING&page=1&limit=20
```

**Approve Action**
```
POST /api/agents/actions/:actionId/approve
```

**Reject Action**
```
POST /api/agents/actions/:actionId/reject
Body: { "reason": "Not appropriate" }
```

**Get Metrics**
```
GET /api/agents/metrics?agentType=LEAD_SCORING&days=30
```

**Health Check**
```
GET /api/agents/health
```

**Trigger Agent**
```
POST /api/agents/trigger
Body: { "agentType": "LEAD_SCORING", "leadId": "lead_123" }
```

## Agent Details

### Lead Scoring Agent

**Scoring Factors:**
- Email opens: +5 per open
- Email clicks: +10 per click
- Email replies: +15 per reply
- Website visits: +8 per visit
- Completed tasks: +12 per task
- Inactivity: -2 per day (max -40)

**Qualification Levels:**
- Hot: 80-100
- Qualified: 60-79
- Warm: 40-59
- Cold: 20-39
- Unqualified: 0-19

**Autonomy:** FULLY_AUTONOMOUS

### Task Automation Agent

**Stage-Specific Tasks:**
- CONTACTED → "Follow up with lead" (2 business days)
- QUALIFIED → "Prepare proposal" (3 business days)
- PROPOSAL_SENT → "Follow up on proposal" (5 business days)

**Features:**
- Calculates due dates in business days (skips weekends)
- Prevents duplicate tasks
- Auto-assigns to lead owner

**Autonomy:** FULLY_AUTONOMOUS

### Stagnation Detection Agent

**Thresholds:**
- NEW: 3 days warning, 7 days critical
- CONTACTED: 7 days warning, 14 days critical
- QUALIFIED: 10 days warning, 21 days critical
- PROPOSAL_SENT: 7 days warning, 14 days critical

**Actions:**
- Creates urgent task for critical stagnation
- Alerts assigned user

**Autonomy:** FULLY_AUTONOMOUS

### Email Generation Agent

**Features:**
- AI-powered personalization using GPT-4
- Context includes: lead info, activities, email history, website visits
- Stage-appropriate tone selection
- Generates subject and body

**Autonomy:** SUGGEST_APPROVE (requires approval)

### Next Best Action Agent

**Features:**
- Generates 1-3 specific recommendations
- Analyzes engagement patterns, timing, stage
- Calculates email and website engagement metrics
- Rule-based fallback if AI fails
- 1-hour caching

**Autonomy:** COPILOT (suggestions only)

## Autonomy Levels

- **FULLY_AUTONOMOUS** - Executes immediately without approval
- **SUGGEST_APPROVE** - Requires user approval before execution
- **COPILOT** - Suggestions only, no execution

## Monitoring

### Health Check

```bash
curl http://localhost:3000/api/agents/health
```

Returns:
- Agent registry status
- Job queue metrics
- OpenAI provider status (circuit breaker, rate limits)

### Metrics

```bash
curl http://localhost:3000/api/agents/metrics?days=30
```

Returns:
- Total actions by status
- Actions by type
- Approval rate
- Average execution time
- Agent-specific metrics

## Error Handling

All agents include:
- Comprehensive error logging
- Retry logic with exponential backoff
- Circuit breaker for external services
- Graceful degradation

## Testing

```bash
# Run all tests
pnpm test

# Run agent tests only
pnpm test agents
```

## Development

### Creating a New Agent

1. Extend the `Agent` base class
2. Implement `execute()` method
3. Implement `getConfig()` method
4. Register in `registry.ts`

Example:

```typescript
import { Agent, AgentType, AgentContext, AgentActionResult } from './base-agent';

export class MyCustomAgent extends Agent {
  constructor() {
    super(AgentType.MY_CUSTOM);
  }

  async execute(context: AgentContext): Promise<AgentActionResult> {
    // Your logic here
    return {
      success: true,
      reasoning: 'Action completed',
    };
  }

  getConfig() {
    return {
      agentType: this.agentType,
      enabled: this.enabled,
      autonomyLevel: AutonomyLevel.FULLY_AUTONOMOUS,
      priority: 'MEDIUM',
    };
  }
}
```

## Troubleshooting

### Agents Not Initializing

Check:
1. Environment variables are set (REDIS_HOST, REDIS_PORT, OPENAI_API_KEY)
2. Redis is running and accessible
3. Database migration has been applied
4. Check server logs for initialization errors

### Events Not Triggering Agents

Check:
1. Events are being emitted using `emitCRMEvent()` helpers
2. Agents are registered for the event in `registry.ts`
3. Agent feature flags are enabled

### OpenAI Errors

Check:
1. OPENAI_API_KEY is valid
2. Rate limits not exceeded
3. Circuit breaker status in `/api/agents/health`

### Job Queue Issues

Check:
1. Redis connection is healthy
2. Job queue metrics in `/api/agents/health`
3. BullMQ worker is running

## License

Proprietary - VyntRise CRM
